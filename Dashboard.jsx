
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  AlertCircle,
  ArrowRight,
  Zap,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MarketDataCard from "../components/market/MarketDataCard";
import AddAssetDialog from "../components/market/AddAssetDialog";

export default function Dashboard() {
  const [marketData, setMarketData] = useState({});
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const queryClient = useQueryClient();

  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.list('-created_date'),
    initialData: [],
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: () => base44.entities.Signal.list('-created_date', 10),
    initialData: [],
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.list('-entry_date', 20),
    initialData: [],
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => base44.entities.WatchlistAsset.list('-created_date'),
    initialData: [],
  });

  const addAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.WatchlistAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchlistAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
    },
  });

  const fetchMarketData = async () => {
    if (watchlist.length === 0) {
      setMarketData({}); // Clear market data if watchlist is empty
      setIsLoadingMarket(false);
      return;
    }
    
    setIsLoadingMarket(true);
    try {
      const symbols = watchlist.map(asset => asset.symbol);
      const response = await base44.functions.invoke('getMarketData', { symbols });
      
      if (response.data?.success && response.data?.data) {
        const dataMap = {};
        response.data.data.forEach(item => {
          dataMap[item.symbol] = item;
        });
        setMarketData(dataMap);
      } 
      // Don't set error state - just log it to avoid UI disruption
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoadingMarket(false);
    }
  };

  useEffect(() => {
    if (watchlist.length === 0) {
      setMarketData({});
      return;
    }
    
    // Fetch data immediately when watchlist changes or on initial load
    fetchMarketData();
    // Set up interval for refreshing every minute
    const interval = setInterval(fetchMarketData, 60000); 
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [watchlist.length]); // Only depend on length to avoid infinite loops

  const activeStrategies = strategies.filter(s => s.is_active !== false);
  const activeSignals = signals.filter(s => s.status === 'active');
  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');

  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  const handleAddAsset = (assetData) => {
    addAssetMutation.mutate(assetData);
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Trading Dashboard</h1>
            <p className="text-slate-400">Monitor your strategies and live signals</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Strategies")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#1A1F2E] border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-400">Active Strategies</CardTitle>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{activeStrategies.length}</div>
              <p className="text-xs text-slate-500">out of {strategies.length} total</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-400">Live Signals</CardTitle>
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{activeSignals.length}</div>
              <p className="text-xs text-slate-500">{signals.length} total generated</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${totalPnL >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5'} rounded-full -translate-y-8 translate-x-8`} />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-400">Total P&L</CardTitle>
                {totalPnL >= 0 ? 
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> : 
                  <TrendingDown className="w-5 h-5 text-red-400" />
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500">{closedTrades.length} closed trades</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-8 translate-x-8" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-500">{winningTrades}/{closedTrades.length} wins</p>
            </CardContent>
          </Card>
        </div>

        {/* Market Watchlist */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-white">Market Watchlist</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchMarketData}
                  disabled={isLoadingMarket}
                  className="border-slate-700"
                >
                  {isLoadingMarket ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <AddAssetDialog onAdd={handleAddAsset} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {watchlist.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No assets in watchlist</p>
                <p className="text-sm text-slate-500 mb-4">Add stocks, crypto, or forex to track live prices</p>
                <AddAssetDialog onAdd={handleAddAsset} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {watchlist.map((asset) => (
                  <MarketDataCard
                    key={asset.id}
                    asset={asset}
                    marketData={marketData[asset.symbol]}
                    onDelete={deleteAssetMutation.mutate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Signals */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-white">Active Trading Signals</CardTitle>
              <Link to={createPageUrl("Signals")}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {activeSignals.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No active signals</p>
                <p className="text-sm text-slate-500">Your strategies haven't generated any signals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSignals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${signal.action.includes('buy') ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                          {signal.action.includes('buy') ? 
                            <TrendingUp className={`w-6 h-6 text-emerald-400`} /> : 
                            <TrendingDown className={`w-6 h-6 text-red-400`} />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{signal.symbol}</h3>
                            <Badge className={signal.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                              {signal.action.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              {signal.asset_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{signal.strategy_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 lg:text-right">
                        <div>
                          <p className="text-xs text-slate-500">Entry</p>
                          <p className="font-semibold text-white">${signal.entry_price?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Confidence</p>
                          <p className="font-semibold text-emerald-400">{signal.confidence}%</p>
                        </div>
                        <Link to={createPageUrl("Signals")}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Strategies & Open Positions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white">Active Strategies</CardTitle>
                <Link to={createPageUrl("Strategies")}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    Manage <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {activeStrategies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">No active strategies</p>
                  <Link to={createPageUrl("Strategies")}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Create Your First Strategy
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStrategies.slice(0, 4).map((strategy) => (
                    <div key={strategy.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{strategy.name}</h3>
                        <Badge className="bg-emerald-500/20 text-emerald-300">Active</Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{strategy.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                          {strategy.strategy_type}
                        </Badge>
                        <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                          {strategy.timeframe}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white">Open Positions</CardTitle>
                <Link to={createPageUrl("TradeJournal")}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {openTrades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No open positions</p>
                  <p className="text-sm text-slate-500 mt-2">Execute signals from the Signals page</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openTrades.slice(0, 4).map((trade) => (
                    <div key={trade.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{trade.symbol}</h3>
                          <Badge className={trade.action.includes('buy') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                            {trade.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{trade.quantity} shares</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Entry: ${trade.entry_price?.toFixed(2)}</span>
                        <span className="text-slate-500">
                          SL: ${trade.stop_loss_price?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
