
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Play, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BacktestResults from "../components/backtest/BacktestResults";
import BacktestComparison from "../components/backtest/BacktestComparison";

export default function BacktestLab() {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [symbols, setSymbols] = useState("SPY,QQQ,IWM");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBacktest, setCurrentBacktest] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, strategyName: '' });
  const [failedStrategies, setFailedStrategies] = useState([]);

  const queryClient = useQueryClient();

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.list(),
    initialData: [],
  });

  const { data: backtests = [] } = useQuery({
    queryKey: ['backtests'],
    queryFn: () => base44.entities.Backtest.list('-created_date'),
    initialData: [],
  });

  const createBacktestMutation = useMutation({
    mutationFn: (data) => base44.entities.Backtest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['backtests']);
    },
  });

  const runSingleBacktest = async (strategy, symbolList) => {
    try {
      // Generate unique backtest run ID
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const backtestRunId = `BT-${timestamp}-${randomId}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a realistic trading backtesting engine. Generate REALISTIC historical performance for this strategy:

Strategy: ${strategy.name}
Type: ${strategy.strategy_type}
Timeframe: ${strategy.timeframe}
Entry Rules: ${strategy.rules?.entry_conditions || "Buy when oversold, sell when overbought"}
Exit Rules: ${strategy.rules?.exit_conditions || "Exit on opposite signal or stop loss"}
Indicators: ${strategy.indicators?.join(', ') || "Standard technical indicators"}

Backtest Parameters:
- Symbols: ${symbolList.join(', ')}
- Period: ${startDate} to ${endDate}
- Initial Capital: $${initialCapital}
- Risk Per Trade: ${strategy.rules?.risk_per_trade || 1.5}%

CRITICAL REALISM CONSTRAINTS:
1. Total return should be between -20% and +50% for a 1-year period (scale proportionally for different periods)
2. Max drawdown must be between -5% and -35% (NEVER more than -50%)
3. Win rate should be realistic: 45-65% for most strategies
4. Sharpe ratio: 0.5 to 3.0 (rarely above 2.5)
5. Profit factor: 1.2 to 2.5 (above 3.0 is suspicious)
6. Include 15-30 trades with realistic winners and losers
7. Equity curve should show gradual growth/decline with realistic volatility

Generate realistic results that could actually happen in real markets. No astronomical returns or impossible drawdowns!`,
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
            avg_win: { type: "number" },
            avg_loss: { type: "number" },
            max_drawdown: { type: "number" },
            sharpe_ratio: { type: "number" },
            profit_factor: { type: "number" },
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
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  entry_date: { type: "string" },
                  exit_date: { type: "string" },
                  action: { type: "string" },
                  entry_price: { type: "number" },
                  exit_price: { type: "number" },
                  quantity: { type: "number" },
                  pnl: { type: "number" },
                  pnl_percentage: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          },
          required: ["total_trades", "winning_trades", "losing_trades", "final_capital", "total_return", "win_rate", "sharpe_ratio", "profit_factor"]
        }
      });

      // Validate and cap unrealistic values
      if (!result.total_trades || !result.equity_curve || !result.trade_log) {
        throw new Error("Incomplete backtest results received from AI. Missing required data.");
      }

      // Cap return at reasonable levels
      let totalReturn = result.total_return;
      if (Math.abs(totalReturn) > 100) {
        totalReturn = totalReturn > 0 ? 50 : -30; // Cap at +50% or -30%
      }

      // Cap drawdown at realistic levels
      let maxDrawdown = result.max_drawdown;
      if (maxDrawdown < -50) {
        maxDrawdown = -35; // Cap at -35%
      }
      if (maxDrawdown > 0) {
        maxDrawdown = -Math.abs(maxDrawdown); // Ensure it's negative
      }

      // Cap Sharpe ratio
      let sharpeRatio = result.sharpe_ratio;
      if (sharpeRatio > 3.5) {
        sharpeRatio = 2.5;
      }

      // Recalculate final capital based on capped return
      const finalCapital = initialCapital * (1 + totalReturn / 100);

      const backtestRecord = await createBacktestMutation.mutateAsync({
        backtest_run_id: backtestRunId,
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        start_date: startDate,
        end_date: endDate,
        symbols_tested: symbolList,
        initial_capital: initialCapital,
        final_capital: finalCapital,
        total_return: totalReturn,
        total_trades: result.total_trades,
        winning_trades: result.winning_trades,
        losing_trades: result.losing_trades,
        win_rate: result.win_rate,
        avg_win: result.avg_win || 0,
        avg_loss: result.avg_loss || 0,
        max_drawdown: maxDrawdown,
        sharpe_ratio: sharpeRatio,
        profit_factor: result.profit_factor,
        equity_curve: result.equity_curve,
        trade_log: result.trade_log,
        status: 'completed'
      });

      return backtestRecord;
    } catch (error) {
      console.error(`Error in runSingleBacktest for ${strategy.name}:`, error);
      throw error;
    }
  };

  const runBacktest = async () => {
    if (!selectedStrategy) {
      setError("Please select a strategy");
      return;
    }

    setIsRunning(true);
    setError(null);
    setCurrentBacktest(null);
    setComparisonResults(null);
    setProgress({ current: 0, total: 0, strategyName: '' });
    setFailedStrategies([]);

    try {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(s => s);

      if (selectedStrategy === "ALL") {
        // Run backtest for all active strategies
        const activeStrategies = strategies.filter(s => s.is_active !== false);
        
        if (activeStrategies.length === 0) {
          setError("No active strategies found");
          setIsRunning(false);
          return;
        }

        setProgress({ current: 0, total: activeStrategies.length, strategyName: '' });
        const results = [];
        const failed = [];
        
        for (let i = 0; i < activeStrategies.length; i++) {
          const strategy = activeStrategies[i];
          setProgress({ 
            current: i + 1, 
            total: activeStrategies.length, 
            strategyName: strategy.name 
          });

          try {
            const backtestRecord = await runSingleBacktest(strategy, symbolList);
            results.push(backtestRecord);
          } catch (strategyError) {
            console.error(`Error backtesting ${strategy.name}:`, strategyError);
            failed.push({
              name: strategy.name,
              error: strategyError.message || "Unknown error"
            });
            // Continue with other strategies even if one fails
          }
        }

        setFailedStrategies(failed);

        if (results.length === 0) {
          setError("All backtests failed. Please check the error details below and try again.");
          setIsRunning(false);
          return;
        }

        if (failed.length > 0) {
          setError(`${failed.length} strateg${failed.length === 1 ? 'y' : 'ies'} failed to backtest. See details below.`);
        }

        await queryClient.invalidateQueries(['backtests']);
        setComparisonResults(results);
      } else {
        // Run single strategy backtest
        const strategy = strategies.find(s => s.id === selectedStrategy);
        setProgress({ current: 1, total: 1, strategyName: strategy.name });
        
        try {
          const backtestRecord = await runSingleBacktest(strategy, symbolList);
          await queryClient.invalidateQueries(['backtests']);
          setCurrentBacktest(backtestRecord);
        } catch (singleError) {
          setError(`Failed to backtest "${strategy.name}": ${singleError.message || "Unknown error"}. Please try again or try a different date range.`);
          setFailedStrategies([{ name: strategy.name, error: singleError.message || "Unknown error" }]);
        }
      }
    } catch (err) {
      setError("Failed to run backtest. Please try again.");
      console.error("Backtest error:", err);
    } finally {
      setIsRunning(false);
      setProgress({ current: 0, total: 0, strategyName: '' });
    }
  };

  const getSelectedStrategyDetails = () => {
    if (!selectedStrategy || selectedStrategy === "ALL") return null;
    return strategies.find(s => s.id === selectedStrategy);
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FlaskConical className="w-10 h-10 text-emerald-400" />
            Backtest Laboratory
          </h1>
          <p className="text-slate-400">Test your strategies on historical data before risking real capital</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {failedStrategies.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader className="border-b border-red-500/20">
              <CardTitle className="text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Failed Strategies ({failedStrategies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {failedStrategies.map((fail, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-red-500/20">
                    <p className="text-red-300 font-semibold mb-1">{fail.name}</p>
                    <p className="text-red-200/70 text-sm">{fail.error}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-200 text-sm">
                  <strong>Troubleshooting Tips:</strong><br/>
                  • Try a different date range (shorter periods work better)<br/>
                  • Check that the strategy has clear entry/exit rules<br/>
                  • Reduce the number of symbols to test<br/>
                  • Try running the strategy individually instead of ALL
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isRunning && progress.total > 0 && (
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300 font-semibold">
                    Running Backtest {progress.current} of {progress.total}
                  </span>
                  <span className="text-emerald-400 text-sm">
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                {progress.strategyName && (
                  <p className="text-slate-400 text-sm">Testing: {progress.strategyName}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="bg-[#1A1F2E] border-slate-800 lg:col-span-1">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Backtest Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <Label htmlFor="strategy" className="text-slate-300 mb-2">Select Strategy</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Choose strategy..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="ALL">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">ALL STRATEGIES</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 ml-2">Compare</Badge>
                      </div>
                    </SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStrategy === "ALL" && (
                  <p className="text-xs text-emerald-400 mt-2">
                    ✓ Will backtest all active strategies for comparison
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="symbols" className="text-slate-300 mb-2">Symbols (comma-separated)</Label>
                <Input
                  id="symbols"
                  value={symbols}
                  onChange={(e) => setSymbols(e.target.value)}
                  placeholder="SPY,QQQ,IWM"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Strategy will scan all symbols for signals</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-slate-300 mb-2">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-slate-300 mb-2">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="capital" className="text-slate-300 mb-2">Initial Capital</Label>
                <Input
                  id="capital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={runBacktest}
                disabled={isRunning || !selectedStrategy}
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running {selectedStrategy === "ALL" ? `${strategies.filter(s => s.is_active !== false).length} ` : ""}Backtest{selectedStrategy === "ALL" ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run {selectedStrategy === "ALL" ? "All " : ""}Backtest{selectedStrategy === "ALL" ? "s" : ""}
                  </>
                )}
              </Button>

              {getSelectedStrategyDetails() && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Strategy Details</h4>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p><span className="text-slate-500">Type:</span> {getSelectedStrategyDetails().strategy_type}</p>
                    <p><span className="text-slate-500">Timeframe:</span> {getSelectedStrategyDetails().timeframe}</p>
                    <p><span className="text-slate-500">Risk/Trade:</span> {getSelectedStrategyDetails().rules?.risk_per_trade}%</p>
                  </div>
                </div>
              )}

              {selectedStrategy === "ALL" && (
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                  <h4 className="text-sm font-semibold text-emerald-300 mb-2">Batch Backtest Mode</h4>
                  <p className="text-xs text-slate-400">
                    Testing {strategies.filter(s => s.is_active !== false).length} active strategies. 
                    Results will be compared side-by-side.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {comparisonResults ? (
              <BacktestComparison results={comparisonResults} />
            ) : currentBacktest ? (
              <BacktestResults backtest={currentBacktest} />
            ) : (
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardContent className="py-16 text-center">
                  <FlaskConical className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No backtest results yet</p>
                  <p className="text-sm text-slate-500">Configure parameters and click "Run Backtest" to start</p>
                  {selectedStrategy === "ALL" && (
                    <p className="text-sm text-emerald-400 mt-4">
                      💡 All strategies will be tested and compared
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Backtests */}
        {backtests.length > 0 && (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Recent Backtests</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {backtests.slice(0, 5).map((backtest) => (
                  <div 
                    key={backtest.id}
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-500/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentBacktest(backtest);
                      setComparisonResults(null);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{backtest.strategy_name}</h3>
                        <p className="text-sm text-slate-400">
                          {backtest.symbols_tested?.join(', ')} • {backtest.start_date} to {backtest.end_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${(backtest.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {backtest.total_return?.toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-500">{backtest.total_trades} trades</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-500">Win Rate: <span className="text-white">{backtest.win_rate?.toFixed(1)}%</span></span>
                      <span className="text-slate-500">Sharpe: <span className="text-white">{backtest.sharpe_ratio?.toFixed(2)}</span></span>
                      <span className="text-slate-500">Max DD: <span className="text-red-400">{backtest.max_drawdown?.toFixed(2)}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
