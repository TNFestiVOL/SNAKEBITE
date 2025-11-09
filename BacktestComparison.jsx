
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from "recharts";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BacktestComparison({ results }) {
  if (!results || results.length === 0) return null;

  // Find best performers
  const bestReturn = results.reduce((best, current) => 
    (current.total_return || 0) > (best?.total_return || -Infinity) ? current : best
  );

  const bestSharpe = results.reduce((best, current) => 
    (current.sharpe_ratio || 0) > (best?.sharpe_ratio || -Infinity) ? current : best
  );

  const bestWinRate = results.reduce((best, current) => 
    (current.win_rate || 0) > (best?.win_rate || -Infinity) ? current : best
  );

  // Prepare comparison data
  const comparisonData = results.map(r => ({
    name: r.strategy_name?.substring(0, 20) + (r.strategy_name?.length > 20 ? '...' : ''),
    fullName: r.strategy_name,
    backtestId: r.backtest_run_id || r.id,
    return: r.total_return || 0,
    sharpe: r.sharpe_ratio || 0,
    winRate: r.win_rate || 0,
    maxDD: Math.abs(r.max_drawdown || 0),
    profitFactor: r.profit_factor || 0,
    trades: r.total_trades || 0
  }));

  return (
    <div className="space-y-6">
      {/* Backtest Session Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Batch Backtest Comparison</p>
              <p className="text-sm text-slate-300">{results.length} strategies tested</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Run IDs</p>
              <p className="text-xs font-mono text-slate-400">
                {results[0]?.backtest_run_id ? results[0].backtest_run_id.split('-')[1] : 'Multiple'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-sm text-emerald-300">Best Return</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-white mb-1">{bestReturn.strategy_name}</p>
            <p className="text-2xl font-bold text-emerald-400">{bestReturn.total_return?.toFixed(2)}%</p>
            {bestReturn.backtest_run_id && (
              <p className="text-xs font-mono text-slate-400 mt-2">{bestReturn.backtest_run_id}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-sm text-purple-300">Best Sharpe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-white mb-1">{bestSharpe.strategy_name}</p>
            <p className="text-2xl font-bold text-purple-400">{bestSharpe.sharpe_ratio?.toFixed(2)}</p>
            {bestSharpe.backtest_run_id && (
              <p className="text-xs font-mono text-slate-400 mt-2">{bestSharpe.backtest_run_id}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-sm text-blue-300">Best Win Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-white mb-1">{bestWinRate.strategy_name}</p>
            <p className="text-2xl font-bold text-blue-400">{bestWinRate.win_rate?.toFixed(1)}%</p>
            {bestWinRate.backtest_run_id && (
              <p className="text-xs font-mono text-slate-400 mt-2">{bestWinRate.backtest_run_id}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Return Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                  labelFormatter={(value) => comparisonData.find(d => d.name === value)?.fullName || value}
                />
                <Bar dataKey="return" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Sharpe Ratio Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  label={{ value: 'Sharpe Ratio', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(value) => comparisonData.find(d => d.name === value)?.fullName || value}
                />
                <Bar dataKey="sharpe" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card className="bg-[#1A1F2E] border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-white">Detailed Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400">Strategy</TableHead>
                  <TableHead className="text-slate-400">Run ID</TableHead>
                  <TableHead className="text-slate-400">Return</TableHead>
                  <TableHead className="text-slate-400">Win Rate</TableHead>
                  <TableHead className="text-slate-400">Sharpe</TableHead>
                  <TableHead className="text-slate-400">Max DD</TableHead>
                  <TableHead className="text-slate-400">Profit Factor</TableHead>
                  <TableHead className="text-slate-400">Trades</TableHead>
                  <TableHead className="text-slate-400">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .sort((a, b) => (b.total_return || 0) - (a.total_return || 0))
                  .map((result, idx) => {
                    const isTop = idx === 0;
                    const overallScore = (
                      ((result.total_return || 0) * 0.4) +
                      ((result.sharpe_ratio || 0) * 20) +
                      ((result.win_rate || 0) * 0.3) +
                      ((result.profit_factor || 0) * 10)
                    ).toFixed(1);
                    
                    return (
                      <TableRow 
                        key={result.id} 
                        className={`border-slate-800 hover:bg-slate-800/30 ${isTop ? 'bg-emerald-500/5' : ''}`}
                      >
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            {isTop && <Trophy className="w-4 h-4 text-emerald-400" />}
                            {result.strategy_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">
                          {result.backtest_run_id || result.id.substring(0, 8)}
                        </TableCell>
                        <TableCell className={`font-semibold ${(result.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.total_return?.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-white">
                          {result.win_rate?.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-purple-400 font-semibold">
                          {result.sharpe_ratio?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-400">
                          {result.max_drawdown?.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-blue-400">
                          {result.profit_factor?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {result.total_trades}
                        </TableCell>
                        <TableCell>
                          <Badge className={isTop ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}>
                            {overallScore}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Risk/Return Scatter Analysis */}
      <Card className="bg-[#1A1F2E] border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-white">Risk vs. Return Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Strategy Rankings</h4>
              <div className="space-y-2">
                {results
                  .sort((a, b) => (b.sharpe_ratio || 0) - (a.sharpe_ratio || 0))
                  .map((result, idx) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-sm">#{idx + 1}</span>
                        <span className="text-white text-sm">{result.strategy_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-emerald-400">{result.total_return?.toFixed(1)}%</span>
                        <span className="text-purple-400">SR: {result.sharpe_ratio?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Key Insights</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-emerald-300 font-semibold mb-1">✓ Top Performer</p>
                  <p className="text-slate-300">{bestReturn.strategy_name} leads with {bestReturn.total_return?.toFixed(2)}% return</p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 font-semibold mb-1">✓ Most Consistent</p>
                  <p className="text-slate-300">{bestSharpe.strategy_name} has best risk-adjusted return (Sharpe: {bestSharpe.sharpe_ratio?.toFixed(2)})</p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-300 font-semibold mb-1">✓ Most Accurate</p>
                  <p className="text-slate-300">{bestWinRate.strategy_name} achieves {bestWinRate.win_rate?.toFixed(1)}% win rate</p>
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <p className="text-slate-400 text-xs">
                    Avg Return: {(results.reduce((sum, r) => sum + (r.total_return || 0), 0) / results.length).toFixed(2)}% | 
                    Avg Sharpe: {(results.reduce((sum, r) => sum + (r.sharpe_ratio || 0), 0) / results.length).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
