
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BacktestResults({ backtest }) {
  if (!backtest) return null;

  const totalReturn = backtest.total_return || 0;
  const isProfit = totalReturn >= 0;

  return (
    <div className="space-y-6">
      {/* Backtest ID Badge */}
      {backtest.backtest_run_id && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Backtest Run ID</p>
                <p className="text-sm font-mono text-emerald-400">{backtest.backtest_run_id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Test Period</p>
                <p className="text-sm text-slate-300">{backtest.start_date} to {backtest.end_date}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ${backtest.initial_capital} → ${backtest.final_capital?.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {backtest.win_rate?.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {backtest.winning_trades}/{backtest.total_trades} wins
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {backtest.sharpe_ratio?.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {backtest.max_drawdown?.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Worst peak-to-trough
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card className="bg-[#1A1F2E] border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-white">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-400">Average Win</span>
              </div>
              <p className="text-xl font-semibold text-emerald-400">
                ${backtest.avg_win?.toFixed(2)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-400">Average Loss</span>
              </div>
              <p className="text-xl font-semibold text-red-400">
                ${backtest.avg_loss?.toFixed(2)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Profit Factor</span>
              </div>
              <p className="text-xl font-semibold text-blue-400">
                {backtest.profit_factor?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Charts and Logs */}
      <Tabs defaultValue="equity" className="w-full">
        <TabsList className="bg-[#1A1F2E] border border-slate-800">
          <TabsTrigger value="equity" className="data-[state=active]:bg-slate-800">
            Equity Curve
          </TabsTrigger>
          <TabsTrigger value="trades" className="data-[state=active]:bg-slate-800">
            Trade Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equity" className="mt-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Portfolio Value Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={backtest.equity_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Equity']}
                  />
                  <ReferenceLine 
                    y={backtest.initial_capital} 
                    stroke="#64748b" 
                    strokeDasharray="3 3"
                    label={{ value: 'Starting Capital', fill: '#64748b', position: 'right' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke={isProfit ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Detailed Trade Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">Symbol</TableHead>
                      <TableHead className="text-slate-400">Action</TableHead>
                      <TableHead className="text-slate-400">Entry</TableHead>
                      <TableHead className="text-slate-400">Exit</TableHead>
                      <TableHead className="text-slate-400">Quantity</TableHead>
                      <TableHead className="text-slate-400">P&L</TableHead>
                      <TableHead className="text-slate-400">Return %</TableHead>
                      <TableHead className="text-slate-400">Exit Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtest.trade_log?.map((trade, idx) => {
                      const isProfitable = (trade.pnl || 0) >= 0;
                      return (
                        <TableRow key={idx} className="border-slate-800 hover:bg-slate-800/30">
                          <TableCell className="font-medium text-white">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                              {trade.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="text-sm">${trade.entry_price?.toFixed(2)}</div>
                            <div className="text-xs text-slate-500">{trade.entry_date}</div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="text-sm">${trade.exit_price?.toFixed(2)}</div>
                            <div className="text-xs text-slate-500">{trade.exit_date}</div>
                          </TableCell>
                          <TableCell className="text-slate-300">{trade.quantity}</TableCell>
                          <TableCell className={isProfitable ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                            ${trade.pnl?.toFixed(2)}
                          </TableCell>
                          <TableCell className={isProfitable ? 'text-emerald-400' : 'text-red-400'}>
                            {trade.pnl_percentage?.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                            {trade.reason}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warnings & Insights */}
      {(backtest.max_drawdown > 15 || backtest.win_rate < 50) && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300 mb-1">Performance Warning</h4>
              <ul className="text-sm text-amber-200/80 space-y-1">
                {backtest.max_drawdown > 15 && (
                  <li>• High drawdown detected ({backtest.max_drawdown?.toFixed(2)}%). Consider reducing position sizes.</li>
                )}
                {backtest.win_rate < 50 && (
                  <li>• Win rate below 50%. Ensure profit factor is strong enough to compensate.</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
