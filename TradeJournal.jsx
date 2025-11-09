import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TradeJournal() {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-entry_date'),
    initialData: [],
  });

  const updateTradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trades']);
      setIsCloseDialogOpen(false);
      setSelectedTrade(null);
    },
  });

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');

  const handleCloseTrade = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const exitPrice = parseFloat(formData.get('exit_price'));
    const commission = parseFloat(formData.get('commission') || 0);
    
    const pnl = selectedTrade.action.includes('buy') 
      ? (exitPrice - selectedTrade.entry_price) * selectedTrade.quantity - commission
      : (selectedTrade.entry_price - exitPrice) * selectedTrade.quantity - commission;
    
    const pnlPercentage = ((exitPrice - selectedTrade.entry_price) / selectedTrade.entry_price) * 100;

    updateTradeMutation.mutate({
      id: selectedTrade.id,
      data: {
        ...selectedTrade,
        exit_price: exitPrice,
        exit_date: new Date().toISOString(),
        commission: commission,
        pnl: pnl,
        pnl_percentage: pnlPercentage,
        status: 'closed',
        notes: formData.get('notes')
      }
    });
  };

  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
  const avgWin = winningTrades > 0 
    ? closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades 
    : 0;

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Trade Journal</h1>
          <p className="text-slate-400">Track and analyze your trading performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{openTrades.length}</div>
              <p className="text-sm text-slate-500 mt-1">Active trades</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${totalPnL.toFixed(2)}
              </div>
              <p className="text-sm text-slate-500 mt-1">{closedTrades.length} trades</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{winRate.toFixed(1)}%</div>
              <p className="text-sm text-slate-500 mt-1">{winningTrades} winners</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Avg Win</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">${avgWin.toFixed(2)}</div>
              <p className="text-sm text-slate-500 mt-1">Per winning trade</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="bg-[#1A1F2E] border border-slate-800">
            <TabsTrigger value="open" className="data-[state=active]:bg-slate-800">
              Open Positions ({openTrades.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-slate-800">
              Closed Trades ({closedTrades.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {openTrades.length === 0 ? (
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardContent className="py-16 text-center">
                  <p className="text-slate-400">No open positions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {openTrades.map((trade) => (
                  <Card key={trade.id} className="bg-[#1A1F2E] border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${trade.action.includes('buy') ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                            {trade.action.includes('buy') ? 
                              <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                              <TrendingDown className="w-6 h-6 text-red-400" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white">{trade.symbol}</h3>
                              <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                                {trade.action}
                              </Badge>
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                {trade.asset_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              {trade.quantity} shares @ ${trade.entry_price?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-slate-500">Stop Loss</p>
                            <p className="font-semibold text-red-400">${trade.stop_loss_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Take Profit</p>
                            <p className="font-semibold text-emerald-400">${trade.take_profit_price?.toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-slate-700 hover:bg-slate-600"
                            onClick={() => {
                              setSelectedTrade(trade);
                              setIsCloseDialogOpen(true);
                            }}
                          >
                            Close Position
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            {closedTrades.length === 0 ? (
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardContent className="py-16 text-center">
                  <p className="text-slate-400">No closed trades yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {closedTrades.map((trade) => (
                  <Card key={trade.id} className="bg-[#1A1F2E] border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${(trade.pnl || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                            {(trade.pnl || 0) >= 0 ? 
                              <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                              <TrendingDown className="w-6 h-6 text-red-400" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white">{trade.symbol}</h3>
                              <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                                {trade.action}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              Entry: ${trade.entry_price?.toFixed(2)} → Exit: ${trade.exit_price?.toFixed(2)}
                            </p>
                            {trade.notes && (
                              <p className="text-xs text-slate-500 mt-1">{trade.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 lg:text-right">
                          <div>
                            <p className="text-xs text-slate-500">P&L</p>
                            <p className={`text-xl font-bold ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ${trade.pnl?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Return</p>
                            <p className={`text-xl font-bold ${(trade.pnl_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trade.pnl_percentage?.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Close Position - {selectedTrade?.symbol}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCloseTrade} className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Price:</span>
                <span className="font-semibold text-white">${selectedTrade?.entry_price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="font-semibold text-white">{selectedTrade?.quantity}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="exit_price" className="text-slate-300">Exit Price</Label>
              <Input
                id="exit_price"
                name="exit_price"
                type="number"
                step="0.01"
                placeholder="Current market price"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="commission" className="text-slate-300">Commission/Fees</Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                step="0.01"
                defaultValue="0"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-slate-300">Exit Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Why did you close this position?"
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCloseDialogOpen(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Close Position
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}