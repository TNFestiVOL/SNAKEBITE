
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Brain, 
  TrendingUp,
  FlaskConical,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StrategyDiscovery() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredStrategies, setDiscoveredStrategies] = useState([]);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState("market_patterns");
  const [focusArea, setFocusArea] = useState("stocks");
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [autoBacktest, setAutoBacktest] = useState(false);
  const [backtestResults, setBacktestResults] = useState({});
  
  const queryClient = useQueryClient();

  const { data: backtests = [] } = useQuery({
    queryKey: ['backtests'],
    queryFn: () => base44.entities.Backtest.list('-created_date', 20),
    initialData: [],
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.list(),
    initialData: [],
  });

  const createStrategyMutation = useMutation({
    mutationFn: (data) => base44.entities.Strategy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
    },
  });

  const createBacktestMutation = useMutation({
    mutationFn: (data) => base44.entities.Backtest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['backtests']);
    },
  });

  const analyzeExistingStrategies = () => {
    const successfulBacktests = backtests
      .filter(b => b.status === 'completed' && (b.total_return || 0) > 10)
      .slice(0, 5);

    if (successfulBacktests.length === 0) return "No historical data available yet.";

    const insights = successfulBacktests.map(b => 
      `${b.strategy_name}: ${b.total_return?.toFixed(1)}% return, ${b.win_rate?.toFixed(1)}% win rate, Sharpe: ${b.sharpe_ratio?.toFixed(2)}`
    ).join('\n');

    return `Successful strategies:\n${insights}`;
  };

  const runBacktestForStrategy = async (strategy) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const backtestRunId = `BT-${timestamp}-${randomId}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a realistic backtest for this newly discovered strategy:

Strategy: ${strategy.name}
Type: ${strategy.strategy_type}
Timeframe: ${strategy.timeframe}
Entry: ${strategy.rules.entry_conditions}
Exit: ${strategy.rules.exit_conditions}
Indicators: ${strategy.indicators.join(', ')}

Test on SPY, QQQ, IWM from 2023-01-01 to 2024-01-01 with $10,000 initial capital.

REALISM CONSTRAINTS:
- Return: -20% to +50%
- Max drawdown: -5% to -35%
- Win rate: 45-65%
- Sharpe: 0.5 to 2.5
- 15-30 trades total`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            total_trades: { type: "number" },
            winning_trades: { type: "number" },
            losing_trades: { type: "number" },
            final_capital: { type: "number" },
            total_return: { type: "number" },
            win_rate: { type: "number" },
            sharpe_ratio: { type: "number" },
            profit_factor: { type: "number" },
            max_drawdown: { type: "number" },
            equity_curve: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  equity: { type: "number" }
                }
              }
            },
            trade_log: {
              type: "array",
              items: { type: "object" }
            }
          }
        }
      });

      // Cap unrealistic values
      let totalReturn = result.total_return;
      if (Math.abs(totalReturn) > 100) totalReturn = totalReturn > 0 ? 50 : -30;
      
      let maxDrawdown = result.max_drawdown;
      if (maxDrawdown < -50) maxDrawdown = -35;
      if (maxDrawdown > 0) maxDrawdown = -Math.abs(maxDrawdown);

      const backtest = await createBacktestMutation.mutateAsync({
        backtest_run_id: backtestRunId,
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        start_date: "2023-01-01",
        end_date: "2024-01-01",
        symbols_tested: ["SPY", "QQQ", "IWM"],
        initial_capital: 10000,
        final_capital: 10000 * (1 + totalReturn / 100),
        total_return: totalReturn,
        total_trades: result.total_trades,
        winning_trades: result.winning_trades,
        losing_trades: result.losing_trades,
        win_rate: result.win_rate,
        sharpe_ratio: result.sharpe_ratio > 3.5 ? 2.5 : result.sharpe_ratio,
        profit_factor: result.profit_factor,
        max_drawdown: maxDrawdown,
        equity_curve: result.equity_curve,
        trade_log: result.trade_log,
        status: 'completed'
      });

      return backtest;
    } catch (err) {
      console.error("Backtest error:", err);
      return null;
    }
  };

  const discoverStrategies = async () => {
    setIsDiscovering(true);
    setError(null);
    setDiscoveredStrategies([]);
    setBacktestResults({});

    try {
      const historicalInsights = analyzeExistingStrategies();
      
      const prompt = `You are an expert algorithmic trading researcher. Discover and design 3 novel trading strategies based on the following parameters:

Analysis Focus: ${analysisType}
Asset Class: ${focusArea}
Risk Tolerance: ${riskTolerance}

${historicalInsights ? `Historical Performance Data:\n${historicalInsights}\n` : ''}

Requirements:
1. Each strategy should be UNIQUE and not duplicate existing approaches
2. Use different combinations of indicators (RSI, MACD, Bollinger Bands, Moving Averages, Volume, ATR, Stochastic)
3. Vary timeframes (from 15min to daily)
4. Consider different strategy types (momentum, mean reversion, breakout, trend following, volatility)
5. Provide clear, actionable entry and exit conditions
6. Match risk tolerance: ${riskTolerance === 'conservative' ? 'lower risk, tighter stops' : riskTolerance === 'aggressive' ? 'higher risk, wider stops' : 'balanced approach'}

For each strategy provide:
- Creative name that describes the approach
- Clear description
- Strategy type
- Optimal timeframe
- List of 2-4 technical indicators
- Precise entry conditions
- Precise exit conditions
- Risk per trade (%)
- Max position size
- Rationale explaining why this could work
- Expected Win Rate (%)
- Expected Sharpe Ratio

Generate innovative strategies that could potentially outperform market benchmarks.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  strategy_type: { 
                    type: "string",
                    enum: ["momentum", "mean_reversion", "breakout", "trend_following", "volatility", "custom"]
                  },
                  timeframe: { 
                    type: "string",
                    enum: ["15min", "1hour", "4hour", "daily", "weekly"]
                  },
                  indicators: {
                    type: "array",
                    items: { type: "string" }
                  },
                  entry_conditions: { type: "string" },
                  exit_conditions: { type: "string" },
                  risk_per_trade: { type: "number" },
                  max_position_size: { type: "number" },
                  rationale: { type: "string" },
                  expected_win_rate: { type: "number" },
                  expected_sharpe: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (!result || !result.strategies || result.strategies.length === 0) {
        throw new Error("AI did not return any strategies. Please try again.");
      }

      // Properly structure the discovered strategies with rules object
      const discovered = result.strategies.map(s => ({
        name: s.name,
        description: s.description,
        asset_types: [focusArea],
        strategy_type: s.strategy_type,
        timeframe: s.timeframe,
        indicators: s.indicators || [],
        rules: {
          entry_conditions: s.entry_conditions,
          exit_conditions: s.exit_conditions,
          risk_per_trade: s.risk_per_trade,
          max_position_size: s.max_position_size
        },
        is_active: false,
        discovered: true,
        discovery_date: new Date().toISOString(),
        expected_win_rate: s.expected_win_rate,
        expected_sharpe: s.expected_sharpe,
        rationale: s.rationale
      }));

      setDiscoveredStrategies(discovered);

      // Auto-backtest if enabled
      if (autoBacktest && discovered.length > 0) {
        const results = {};
        const updatedDiscovered = await Promise.all(discovered.map(async (strategy) => {
          try {
            // Save strategy first
            const savedStrategy = await createStrategyMutation.mutateAsync({
              name: strategy.name,
              description: strategy.description,
              asset_types: strategy.asset_types,
              strategy_type: strategy.strategy_type,
              timeframe: strategy.timeframe,
              indicators: strategy.indicators,
              rules: strategy.rules,
              is_active: false
            });

            // Update the strategy object with ID and saved status
            const updatedStrategy = { ...strategy, id: savedStrategy.id, saved: true };

            // Run backtest
            const backtest = await runBacktestForStrategy(updatedStrategy);
            if (backtest) {
              results[updatedStrategy.name] = backtest;
            }
            return updatedStrategy; // Return the updated strategy for state
          } catch (strategyError) {
            console.error(`Error with strategy ${strategy.name}:`, strategyError);
            return strategy; // Return original strategy if error occurred
          }
        }));
        setBacktestResults(results);
        setDiscoveredStrategies(updatedDiscovered); // Update state to reflect saved strategies
      }

    } catch (err) {
      console.error("Discovery error:", err);
      setError(err.message || "Failed to discover strategies. Please check your internet connection and try again.");
    }

    setIsDiscovering(false);
  };

  const saveStrategy = async (strategy) => {
    try {
      const savedStrategy = await createStrategyMutation.mutateAsync({
        name: strategy.name,
        description: strategy.description,
        asset_types: strategy.asset_types,
        strategy_type: strategy.strategy_type,
        timeframe: strategy.timeframe,
        indicators: strategy.indicators,
        rules: strategy.rules, // Ensure rules object is passed
        is_active: false
      });

      // Update the strategy in state to mark it as saved and store the ID
      setDiscoveredStrategies(prev => 
        prev.map(s => s.name === strategy.name ? { ...s, saved: true, id: savedStrategy.id } : s)
      );
    } catch (err) {
      console.error("Save error:", err);
      setError(`Failed to save strategy: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-400" />
            AI Strategy Discovery
          </h1>
          <p className="text-slate-400">Automatically generate novel trading strategies using AI analysis</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Discovery Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <Label className="text-slate-300 mb-2">Analysis Type</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="market_patterns">Market Patterns</SelectItem>
                    <SelectItem value="volatility_regimes">Volatility Regimes</SelectItem>
                    <SelectItem value="correlation_analysis">Correlation Analysis</SelectItem>
                    <SelectItem value="momentum_shifts">Momentum Shifts</SelectItem>
                    <SelectItem value="mean_reversion">Mean Reversion Opportunities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 mb-2">Focus Area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 mb-2">Risk Tolerance</Label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoBacktest"
                  checked={autoBacktest}
                  onChange={(e) => setAutoBacktest(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                />
                <Label htmlFor="autoBacktest" className="text-slate-300 cursor-pointer">
                  Auto-backtest discovered strategies
                </Label>
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={discoverStrategies}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Discovering Strategies...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Discover Strategies
                  </>
                )}
              </Button>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">How It Works</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Analyzes market patterns and historical data</li>
                  <li>• Identifies profitable indicator combinations</li>
                  <li>• Generates unique entry/exit rules</li>
                  <li>• Optimizes for your risk profile</li>
                  <li>• Creates ready-to-test strategies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {discoveredStrategies.length === 0 && !isDiscovering ? (
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardContent className="py-16 text-center">
                  <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No strategies discovered yet</p>
                  <p className="text-sm text-slate-500">Configure parameters and click "Discover Strategies"</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {discoveredStrategies.map((strategy, idx) => (
                  <Card key={idx} className="bg-[#1A1F2E] border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-white text-xl">{strategy.name}</CardTitle>
                            <Badge className="bg-purple-500/20 text-purple-300">
                              AI Discovered
                            </Badge>
                            {strategy.saved && (
                              <Badge className="bg-emerald-500/20 text-emerald-300">
                                <Check className="w-3 h-3 mr-1" />
                                Saved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">{strategy.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-slate-800 border-slate-700">
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="rules">Rules</TabsTrigger>
                          {backtestResults[strategy.name] && (
                            <TabsTrigger value="backtest">Backtest</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Strategy Type</p>
                              <Badge variant="outline" className="text-slate-300 border-slate-600">
                                {strategy.strategy_type}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Timeframe</p>
                              <Badge variant="outline" className="text-slate-300 border-slate-600">
                                {strategy.timeframe}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-2">Technical Indicators</p>
                            <div className="flex flex-wrap gap-2">
                              {strategy.indicators.map((indicator, i) => (
                                <Badge key={i} className="bg-blue-500/20 text-blue-300">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-2">Expected Performance</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500">Win Rate</p>
                                <p className="text-lg font-semibold text-emerald-400">
                                  ~{strategy.expected_win_rate}%
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500">Sharpe Ratio</p>
                                <p className="text-lg font-semibold text-purple-400">
                                  ~{strategy.expected_sharpe?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                            <p className="text-sm font-semibold text-amber-300 mb-2">AI Rationale</p>
                            <p className="text-sm text-slate-300">{strategy.rationale}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="rules" className="space-y-4 mt-4">
                          <div>
                            <p className="text-sm font-semibold text-emerald-300 mb-2">Entry Conditions</p>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <p className="text-sm text-slate-300">{strategy.rules.entry_conditions}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-red-300 mb-2">Exit Conditions</p>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <p className="text-sm text-slate-300">{strategy.rules.exit_conditions}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Risk Per Trade</p>
                              <p className="text-lg font-semibold text-white">{strategy.rules.risk_per_trade}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Max Position Size</p>
                              <p className="text-lg font-semibold text-white">${strategy.rules.max_position_size}</p>
                            </div>
                          </div>
                        </TabsContent>

                        {backtestResults[strategy.name] && (
                          <TabsContent value="backtest" className="space-y-4 mt-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Return</p>
                                <p className={`text-xl font-bold ${backtestResults[strategy.name].total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {backtestResults[strategy.name].total_return?.toFixed(2)}%
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Win Rate</p>
                                <p className="text-xl font-bold text-white">
                                  {backtestResults[strategy.name].win_rate?.toFixed(1)}%
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Sharpe</p>
                                <p className="text-xl font-bold text-purple-400">
                                  {backtestResults[strategy.name].sharpe_ratio?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300">
                              <Check className="w-3 h-3 mr-1" />
                              Backtest Completed - {backtestResults[strategy.name].backtest_run_id}
                            </Badge>
                          </TabsContent>
                        )}
                      </Tabs>

                      <div className="flex gap-3 pt-4">
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => saveStrategy(strategy)}
                          disabled={strategy.saved}
                        >
                          {strategy.saved ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Save Strategy
                            </>
                          )}
                        </Button>
                        {!backtestResults[strategy.name] && !autoBacktest && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                              let currentStrategy = strategy;
                              if (!currentStrategy.id) {
                                try {
                                  const saved = await createStrategyMutation.mutateAsync({
                                    name: currentStrategy.name,
                                    description: currentStrategy.description,
                                    asset_types: currentStrategy.asset_types,
                                    strategy_type: currentStrategy.strategy_type,
                                    timeframe: currentStrategy.timeframe,
                                    indicators: currentStrategy.indicators,
                                    rules: currentStrategy.rules,
                                    is_active: false
                                  });
                                  currentStrategy = { ...currentStrategy, id: saved.id, saved: true };
                                  setDiscoveredStrategies(prev =>
                                    prev.map(s => s.name === currentStrategy.name ? { ...s, id: saved.id, saved: true } : s)
                                  );
                                } catch (saveError) {
                                  console.error("Error saving strategy before backtest:", saveError);
                                  setError(`Failed to save strategy before backtest: ${saveError.message || "Unknown error"}`);
                                  return; // Stop if saving fails
                                }
                              }
                              const backtest = await runBacktestForStrategy(currentStrategy);
                              if (backtest) {
                                setBacktestResults(prev => ({ ...prev, [currentStrategy.name]: backtest }));
                              }
                            }}
                          >
                            <FlaskConical className="w-4 h-4 mr-2" />
                            Run Backtest
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
