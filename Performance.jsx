import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  FlaskConical,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Performance() {
  const { data: backtests = [] } = useQuery({
    queryKey: ['backtests'],
    queryFn: () => base44.entities.Backtest.list('-created_date'),
    initialData: [],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-entry_date'),
    initialData: [],
  });

  const completedBacktests = backtests.filter(b => b.status === 'completed');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const openTrades = trades.filter(t => t.status === 'open');

  // BACKTEST METRICS
  const avgWinRate = completedBacktests.length > 0
    ? completedBacktests.reduce((sum, b) => sum + (b.win_rate || 0), 0) / completedBacktests.length
    : 0;

  const avgSharpe = completedBacktests.length > 0
    ? completedBacktests.reduce((sum, b) => sum + (b.sharpe_ratio || 0), 0) / completedBacktests.length
    : 0;

  const avgReturn = completedBacktests.length > 0
    ? completedBacktests.reduce((sum, b) => sum + (b.total_return || 0), 0) / completedBacktests.length
    : 0;

  const bestBacktest = completedBacktests.reduce((best, current) => 
    (current.total_return || 0) > (best?.total_return || -Infinity) ? current : best
  , null);

  const strategyPerformance = completedBacktests.reduce((acc, backtest) => {
    const existing = acc.find(s => s.strategy === backtest.strategy_name);
    if (existing) {
      existing.avgReturn = (existing.avgReturn + (backtest.total_return || 0)) / 2;
      existing.trades += backtest.total_trades || 0;
    } else {
      acc.push({
        strategy: backtest.strategy_name,
        avgReturn: backtest.total_return || 0,
        trades: backtest.total_trades || 0,
        sharpe: backtest.sharpe_ratio || 0
      });
    }
    return acc;
  }, []);

  // LIVE TRADING METRICS
  const totalLivePnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const liveWinningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const liveWinRate = closedTrades.length > 0
    ? (liveWinningTrades / closedTrades.length) * 100
    : 0;

  const avgWin = liveWinningTrades > 0
    ? closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + t.pnl, 0) / liveWinningTrades
    : 0;

  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length
    : 0;

  const winLossData = [
    { name: 'Wins', value: liveWinningTrades, color: '#10b981' },
    { name: 'Losses', value: losingTrades.length, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-emerald-400" />
            Performance Analytics
          </h1>
          <p className="text-slate-400">Compare backtest results and live trading performance</p>
        </div>

        <Tabs defaultValue="backtests" className="space-y-6">
          <TabsList className="bg-[#1A1F2E] border border-slate-800">
            <TabsTrigger value="backtests" className="data-[state=active]:bg-emerald-600">
              <FlaskConical className="w-4 h-4 mr-2" />
              Backtest Performance
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-emerald-600">
              <Activity className="w-4 h-4 mr-2" />
              Live Trading Performance
            </TabsTrigger>
          </TabsList>

          {/* BACKTEST TAB */}
          <TabsContent value="backtests" className="space-y-6">
            {/* Backtest Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Avg Return</CardTitle>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-1 ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {avgReturn.toFixed(2)}%
                  </div>
                  <p className="text-xs text-slate-500">{completedBacktests.length} backtests completed</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Avg Win Rate</CardTitle>
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">
                    {avgWinRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500">Across all strategies</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Avg Sharpe Ratio</CardTitle>
                    <Award className="w-5 h-5 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {avgSharpe.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">Risk-adjusted performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Best Performing Backtest */}
            {bestBacktest && (
              <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-emerald-400" />
                    <CardTitle className="text-white">Top Performing Backtest</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Strategy</p>
                      <p className="text-lg font-semibold text-white">{bestBacktest.strategy_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Return</p>
                      <p className="text-lg font-semibold text-emerald-400">
                        {bestBacktest.total_return?.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Win Rate</p>
                      <p className="text-lg font-semibold text-white">
                        {bestBacktest.win_rate?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Sharpe Ratio</p>
                      <p className="text-lg font-semibold text-purple-400">
                        {bestBacktest.sharpe_ratio?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strategy Comparison Chart */}
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white">Strategy Comparison by Return</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {strategyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={strategyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="strategy" 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        label={{ value: 'Return %', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="avgReturn" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    No backtest data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Backtests Table */}
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white">All Backtest Results</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {completedBacktests.length === 0 ? (
                  <div className="text-center py-8">
                    <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No backtests completed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedBacktests.map((backtest) => (
                      <div key={backtest.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{backtest.strategy_name}</h3>
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                {backtest.symbols_tested?.join(', ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              {backtest.start_date} to {backtest.end_date} • {backtest.total_trades} trades
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Return</p>
                              <p className={`text-lg font-bold ${(backtest.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {backtest.total_return?.toFixed(2)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Win Rate</p>
                              <p className="text-lg font-bold text-white">
                                {backtest.win_rate?.toFixed(1)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Sharpe</p>
                              <p className="text-lg font-bold text-purple-400">
                                {backtest.sharpe_ratio?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIVE TRADING TAB */}
          <TabsContent value="live" className="space-y-6">
            {/* Live Trading Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Total P&L</CardTitle>
                    {totalLivePnL >= 0 ? 
                      <TrendingUp className="w-5 h-5 text-emerald-400" /> : 
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-1 ${totalLivePnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${totalLivePnL.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">{closedTrades.length} closed trades</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">
                    {liveWinRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500">{liveWinningTrades}/{closedTrades.length} winners</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Avg Win</CardTitle>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    ${avgWin.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">Per winning trade</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-slate-400">Avg Loss</CardTitle>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    ${avgLoss.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">Per losing trade</p>
                </CardContent>
              </Card>
            </div>

            {/* Win/Loss Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="border-b border-slate-800">
                  <CardTitle className="text-white">Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {closedTrades.length > 0 ? (
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={winLossData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {winLossData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #475569',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                      No closed trades yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="border-b border-slate-800">
                  <CardTitle className="text-white">Open Positions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {openTrades.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                      No open positions
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {openTrades.map((trade) => (
                        <div key={trade.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white">{trade.symbol}</h3>
                                <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                                  {trade.action}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">{trade.quantity} @ ${trade.entry_price?.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Entry Date</p>
                              <p className="text-sm text-slate-300">
                                {new Date(trade.entry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Closed Trades */}
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white">Recent Closed Trades</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {closedTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No closed trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {closedTrades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white">{trade.symbol}</h3>
                              <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                                {trade.action}
                              </Badge>
                              <Badge variant="outline" className="text-slate-400 border-slate-600">
                                {trade.asset_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              Entry: ${trade.entry_price?.toFixed(2)} → Exit: ${trade.exit_price?.toFixed(2)} • {trade.quantity} shares
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">P&L</p>
                              <p className={`text-lg font-bold ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ${trade.pnl?.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Return</p>
                              <p className={`text-lg font-bold ${(trade.pnl_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.pnl_percentage?.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}