import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Shield,
  Clock,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Signals() {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: signals = [] } = useQuery({
    queryKey: ['signals'],
    queryFn: () => base44.entities.Signal.list('-created_date'),
    initialData: [],
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.list(),
    initialData: [],
  });

  const createTradeMutation = useMutation({
    mutationFn: (data) => base44.entities.Trade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trades']);
      setIsExecuteDialogOpen(false);
      setSelectedSignal(null);
    },
  });

  const updateSignalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Signal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['signals']);
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateSignals = async () => {
    setIsGenerating(true);
    try {
      const activeStrategies = strategies.filter(s => s.is_active !== false);
      
      for (const strategy of activeStrategies.slice(0, 2)) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a trading algorithm. Generate a realistic trading signal based on this strategy:
          
Strategy: ${strategy.name}
Type: ${strategy.strategy_type}
Timeframe: ${strategy.timeframe}
Asset Types: ${strategy.asset_types?.join(', ')}
Indicators: ${strategy.indicators?.join(', ')}
Entry Rules: ${strategy.rules?.entry_conditions}

Generate a signal for a specific stock/option/future. Include:
- Symbol (realistic ticker)
- Current market price
- Entry price recommendation
- Stop loss
- Take profit
- Confidence level (0-100)
- Detailed rationale explaining why this signal was generated based on the strategy rules

Make it realistic with actual market conditions.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              asset_type: { type: "string", enum: ["stock", "option", "future"] },
              action: { type: "string", enum: ["buy", "sell", "buy_to_open", "sell_to_close"] },
              current_price: { type: "number" },
              entry_price: { type: "number" },
              stop_loss: { type: "number" },
              take_profit: { type: "number" },
              quantity: { type: "number" },
              confidence: { type: "number" },
              rationale: { type: "string" }
            }
          }
        });

        await base44.entities.Signal.create({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          symbol: result.symbol,
          asset_type: result.asset_type,
          action: result.action,
          signal_type: "entry",
          confidence: result.confidence,
          entry_price: result.entry_price,
          stop_loss: result.stop_loss,
          take_profit: result.take_profit,
          quantity: result.quantity,
          rationale: result.rationale,
          status: "active",
          signal_timestamp: new Date().toISOString(),
          market_data: {
            current_price: result.current_price
          }
        });
      }

      queryClient.invalidateQueries(['signals']);
    } catch (error) {
      console.error("Error generating signals:", error);
    }
    setIsGenerating(false);
  };

  const executeSignal = (signal) => {
    setSelectedSignal(signal);
    setIsExecuteDialogOpen(true);
  };

  const handleExecuteTrade = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    createTradeMutation.mutate({
      signal_id: selectedSignal.id,
      strategy_id: selectedSignal.strategy_id,
      symbol: selectedSignal.symbol,
      asset_type: selectedSignal.asset_type,
      action: selectedSignal.action,
      entry_price: parseFloat(formData.get('entry_price')),
      quantity: parseFloat(formData.get('quantity')),
      entry_date: new Date().toISOString(),
      status: 'open',
      stop_loss_price: selectedSignal.stop_loss,
      take_profit_price: selectedSignal.take_profit,
      notes: formData.get('notes')
    });

    updateSignalMutation.mutate({
      id: selectedSignal.id,
      data: { ...selectedSignal, status: 'executed' }
    });
  };

  const activeSignals = signals.filter(s => s.status === 'active');
  const executedSignals = signals.filter(s => s.status === 'executed');

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Live Trading Signals</h1>
            <p className="text-slate-400">AI-generated signals based on your strategies</p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={generateSignals}
            disabled={isGenerating || strategies.filter(s => s.is_active !== false).length === 0}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Signals'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Active Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{activeSignals.length}</div>
              <p className="text-sm text-slate-500 mt-1">Ready to execute</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Executed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{executedSignals.length}</div>
              <p className="text-sm text-slate-500 mt-1">Signals acted on</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {activeSignals.length > 0 
                  ? Math.round(activeSignals.reduce((sum, s) => sum + s.confidence, 0) / activeSignals.length)
                  : 0}%
              </div>
              <p className="text-sm text-slate-500 mt-1">Signal quality</p>
            </CardContent>
          </Card>
        </div>

        {activeSignals.length === 0 ? (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardContent className="py-16 text-center">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No active signals</p>
              <p className="text-sm text-slate-500 mb-6">
                {strategies.filter(s => s.is_active !== false).length === 0 
                  ? 'Create and activate strategies first'
                  : 'Click "Generate Signals" to get AI-powered trade recommendations'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeSignals.map((signal) => (
              <Card key={signal.id} className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-xl ${signal.action.includes('buy') ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                            {signal.action.includes('buy') ? 
                              <TrendingUp className="w-8 h-8 text-emerald-400" /> : 
                              <TrendingDown className="w-8 h-8 text-red-400" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-2xl font-bold text-white">{signal.symbol}</h2>
                              <Badge className={signal.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                                {signal.action.toUpperCase().replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                {signal.asset_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">{signal.strategy_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-sm text-slate-500">Confidence</span>
                            <Badge className="bg-purple-500/20 text-purple-300 text-base">
                              {signal.confidence}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {new Date(signal.created_date).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-sm text-slate-300 leading-relaxed">{signal.rationale}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Entry Price</span>
                          </div>
                          <p className="text-lg font-bold text-white">${signal.entry_price?.toFixed(2)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-red-400" />
                            <span className="text-xs text-slate-500">Stop Loss</span>
                          </div>
                          <p className="text-lg font-bold text-red-400">${signal.stop_loss?.toFixed(2)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-500">Take Profit</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-400">${signal.take_profit?.toFixed(2)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">Quantity</span>
                          </div>
                          <p className="text-lg font-bold text-white">{signal.quantity}</p>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => executeSignal(signal)}
                      >
                        Execute Trade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Execute Trade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExecuteTrade} className="space-y-4">
            <div>
              <Label className="text-slate-300">Symbol</Label>
              <Input value={selectedSignal?.symbol} disabled className="bg-slate-800 border-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry_price" className="text-slate-300">Entry Price</Label>
                <Input
                  id="entry_price"
                  name="entry_price"
                  type="number"
                  step="0.01"
                  defaultValue={selectedSignal?.entry_price}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={selectedSignal?.quantity}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any notes about this trade..."
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsExecuteDialogOpen(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Confirm Execute
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}