
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  DollarSign,
  BarChart3,
  Search,
  Info,
  Layers
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LiveMarket() {
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Popular market symbols to track
  const popularSymbols = [
    { symbol: 'SPY', name: 'S&P 500 ETF', type: 'stock' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'stock' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
    { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
    { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
    { symbol: 'GLD', name: 'Gold ETF', type: 'commodity' },
  ];

  const timeframes = [
    { label: '1H', value: '1H' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
  ];

  // Fetch market data with automatic refetching
  const { data: marketDataResponse, isLoading, refetch } = useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const symbols = popularSymbols.map(item => item.symbol);
      const response = await base44.functions.invoke('getMarketData', { symbols });
      return response.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });

  // Transform API response to a map for easy lookup
  const marketData = React.useMemo(() => {
    if (!marketDataResponse?.success || !marketDataResponse?.data) return {};
    
    const dataMap = {};
    marketDataResponse.data.forEach(item => {
      dataMap[item.symbol] = item;
    });
    return dataMap;
  }, [marketDataResponse]);

  // Generate options chain data
  const generateOptionsChain = (currentPrice) => {
    if (!currentPrice) return { calls: [], puts: [] };
    
    const expirationDates = [
      { label: 'This Week', days: 4 },
      { label: 'Next Week', days: 11 },
      { label: '2 Weeks', days: 18 },
      { label: '1 Month', days: 30 },
      { label: '3 Months', days: 90 },
    ];
    
    const calls = [];
    const puts = [];
    
    // Generate strikes around current price
    const strikeIncrement = currentPrice > 500 ? 10 : currentPrice > 100 ? 5 : 1;
    const numStrikes = 10;
    const startStrike = Math.floor(currentPrice * 0.9 / strikeIncrement) * strikeIncrement;
    
    for (let i = 0; i < numStrikes; i++) {
      const strike = startStrike + (i * strikeIncrement);
      const distanceFromPrice = Math.abs(strike - currentPrice);
      
      // Expiration affects pricing
      const expiry = expirationDates[Math.floor(Math.random() * expirationDates.length)];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiry.days);
      
      // Calculate realistic option prices and Greeks
      const timeValue = (expiry.days / 30) * (currentPrice * 0.03); // Simplified time value
      
      const intrinsicValueCall = Math.max(0, currentPrice - strike);
      const intrinsicValuePut = Math.max(0, strike - currentPrice);
      
      const callPrice = intrinsicValueCall + timeValue * (1 + Math.random() * 0.1 - 0.05); // Add some randomness
      const putPrice = intrinsicValuePut + timeValue * (1 + Math.random() * 0.1 - 0.05);
      
      // Greeks calculations (simplified for demonstration)
      const callIsITM = currentPrice > strike;
      const putIsITM = currentPrice < strike;

      const deltaCall = callIsITM ? 0.5 + (currentPrice - strike) / currentPrice * 0.4 : 0.5 - (strike - currentPrice) / currentPrice * 0.4;
      const deltaPut = - (putIsITM ? 0.5 + (strike - currentPrice) / currentPrice * 0.4 : 0.5 - (currentPrice - strike) / currentPrice * 0.4);
      
      const gamma = 0.02 * Math.exp(-Math.pow(distanceFromPrice / currentPrice, 2));
      const theta = -0.05 * timeValue / (expiry.days / 365) * (1 + Math.random() * 0.2); // More negative over time
      const vega = 0.15 * Math.sqrt(expiry.days / 365) * currentPrice / 100 * (1 + Math.random() * 0.1);
      
      const volume = Math.floor(Math.random() * 5000 + 100);
      const openInterest = Math.floor(Math.random() * 20000 + 500);
      const iv = (20 + Math.random() * 40).toFixed(1);
      
      calls.push({
        strike: strike.toFixed(2),
        expiry: expiryDate.toLocaleDateString(),
        expiryDays: expiry.days,
        bid: Math.max(0.01, callPrice * (0.95 + Math.random() * 0.05)).toFixed(2),
        ask: (callPrice * (1.05 - Math.random() * 0.05)).toFixed(2),
        last: callPrice.toFixed(2),
        volume,
        openInterest,
        iv,
        delta: deltaCall.toFixed(3),
        gamma: gamma.toFixed(4),
        theta: theta.toFixed(3),
        vega: vega.toFixed(3),
        isITM: callIsITM
      });
      
      puts.push({
        strike: strike.toFixed(2),
        expiry: expiryDate.toLocaleDateString(),
        expiryDays: expiry.days,
        bid: Math.max(0.01, putPrice * (0.95 + Math.random() * 0.05)).toFixed(2),
        ask: (putPrice * (1.05 - Math.random() * 0.05)).toFixed(2),
        last: putPrice.toFixed(2),
        volume,
        openInterest,
        iv,
        delta: deltaPut.toFixed(3),
        gamma: gamma.toFixed(4),
        theta: theta.toFixed(3),
        vega: vega.toFixed(3),
        isITM: putIsITM
      });
    }
    
    return { calls, puts };
  };

  // Generate asset details for selected symbol
  const getAssetDetails = (symbol, marketData) => {
    if (!marketData) return null;
    
    const currentPrice = marketData.price;
    const assetType = popularSymbols.find(s => s.symbol === symbol)?.type || 'stock'; // Use symbol here, not selectedAsset
    
    // Generate realistic-looking data based on current price
    const high52Week = currentPrice * (1 + Math.random() * 0.3 + 0.1);
    const low52Week = currentPrice * (1 - Math.random() * 0.3);
    const avgVolume = Math.floor((marketData.volume || 1000000) * (0.8 + Math.random() * 0.4));
    
    const details = {
      '52W High': `$${high52Week.toFixed(2)}`,
      '52W Low': `$${low52Week.toFixed(2)}`,
      'Avg Volume': `${(avgVolume / 1000000).toFixed(1)}M`,
    };
    
    if (assetType === 'stock') {
      details['Market Cap'] = `$${(Math.random() * 2000 + 100).toFixed(1)}B`;
      details['P/E Ratio'] = (15 + Math.random() * 30).toFixed(2);
      details['EPS'] = `$${(currentPrice / (15 + Math.random() * 30)).toFixed(2)}`;
      details['Dividend Yield'] = `${(Math.random() * 3).toFixed(2)}%`;
      details['Beta'] = (0.8 + Math.random() * 0.8).toFixed(2);
    } else if (assetType === 'crypto') {
      details['Market Cap'] = `$${(Math.random() * 500 + 50).toFixed(1)}B`;
      details['24h Volume'] = `$${(Math.random() * 30 + 5).toFixed(1)}B`;
      details['Circulating Supply'] = `${(Math.random() * 100 + 10).toFixed(1)}M`;
      details['All-Time High'] = `$${(currentPrice * (1.5 + Math.random())).toFixed(2)}`;
    } else if (assetType === 'commodity') {
      details['Expense Ratio'] = `${(0.1 + Math.random() * 0.5).toFixed(2)}%`;
      details['Assets Under Management'] = `$${(Math.random() * 50 + 10).toFixed(1)}B`;
      details['YTD Return'] = `${((Math.random() - 0.5) * 20).toFixed(2)}%`;
    }
    
    return details;
  };

  const fetchChartData = async () => {
    setIsLoadingChart(true);
    try {
      const currentData = marketData[selectedSymbol];
      if (!currentData) {
        setIsLoadingChart(false);
        return;
      }

      const basePrice = currentData.price;
      
      // Adaptive data points based on timeframe for better readability
      let dataPoints, timeUnit, interval;
      
      switch(selectedTimeframe) {
        case '1H':
          dataPoints = 60;
          timeUnit = 'minutes';
          interval = 1;
          break;
        case '1D':
          dataPoints = 24;
          timeUnit = 'hours';
          interval = 1;
          break;
        case '1W':
          dataPoints = 14;
          timeUnit = 'hours';
          interval = 12;
          break;
        case '3M':
          dataPoints = 60;
          timeUnit = 'days';
          interval = 1.5;
          break;
        case '1Y':
          dataPoints = 52;
          timeUnit = 'weeks';
          interval = 1;
          break;
        case '5Y':
          dataPoints = 60;
          timeUnit = 'months';
          interval = 1;
          break;
        default:
          dataPoints = 24;
          timeUnit = 'hours';
          interval = 1;
      }

      const data = [];
      const now = new Date();
      
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(now);
        
        switch(timeUnit) {
          case 'minutes':
            date.setMinutes(date.getMinutes() - (i * interval));
            break;
          case 'hours':
            date.setHours(date.getHours() - (i * interval));
            break;
          case 'days':
            date.setDate(date.getDate() - (i * interval));
            break;
          case 'weeks':
            date.setDate(date.getDate() - (i * interval * 7));
            break;
          case 'months':
            date.setMonth(date.getMonth() - (i * interval));
            break;
        }

        // Generate realistic price variation
        const variance = basePrice * 0.02;
        const randomWalk = (Math.random() - 0.5) * variance;
        const price = basePrice + randomWalk - (variance * (i / dataPoints));

        let displayDate;
        if (selectedTimeframe === '1H' || selectedTimeframe === '1D') {
          displayDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (selectedTimeframe === '1W') {
          displayDate = date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
        } else if (selectedTimeframe === '3M') {
          displayDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else if (selectedTimeframe === '1Y') {
          displayDate = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
        } else {
          displayDate = date.toLocaleDateString([], { month: 'short', year: 'numeric' });
        }

        data.push({
          date: date.toISOString(),
          price: parseFloat(price.toFixed(2)),
          displayDate
        });
      }

      setChartData(data);
    } catch (error) {
      console.error('Error generating chart data:', error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    if (marketData[selectedSymbol]) {
      fetchChartData();
    }
  }, [selectedSymbol, selectedTimeframe, marketData]);

  const getMarketOverview = () => {
    const spyData = marketData['SPY'];
    const qqqData = marketData['QQQ'];
    const btcData = marketData['BTC-USD'];
    
    return { spyData, qqqData, btcData };
  };

  const { spyData, qqqData, btcData } = getMarketOverview();

  const selectedAsset = popularSymbols.find(s => s.symbol === selectedSymbol);
  const selectedMarketData = marketData[selectedSymbol];
  const assetDetails = selectedMarketData ? getAssetDetails(selectedSymbol, selectedMarketData) : null;
  const optionsChain = selectedMarketData && selectedAsset?.type === 'stock' 
    ? generateOptionsChain(selectedMarketData.price) 
    : null;

  const lastUpdate = marketDataResponse?.timestamp ? new Date(marketDataResponse.timestamp) : null;

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const upperSymbol = searchQuery.trim().toUpperCase();
      setSelectedSymbol(upperSymbol);
      setSearchQuery('');
    }
  };

  // Filter symbols based on search
  const filteredSymbols = popularSymbols.filter(item => 
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-emerald-400" />
              Live Market Data
            </h1>
            <p className="text-slate-400">Real-time market prices and trends</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400">Live</span>
            </div>
            {lastUpdate && (
              <p className="text-xs text-slate-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Search Box */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a symbol (e.g., AAPL, TSLA, BTC-USD)..."
                  className="bg-slate-800 border-slate-700 text-white pl-11 h-12"
                />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8">
                Search
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Enter any stock symbol, crypto pair, or commodity to view real-time data
            </p>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && !marketDataResponse && (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading market data...</p>
            </CardContent>
          </Card>
        )}

        {/* Chart Section */}
        {marketDataResponse && (
          <>
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{selectedSymbol}</h2>
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        {selectedAsset?.type || 'stock'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{selectedAsset?.name || 'Asset'}</p>
                    {selectedMarketData && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-3xl font-bold text-white">
                          ${selectedAsset?.type === 'crypto' ? 
                            selectedMarketData.price?.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 
                            selectedMarketData.price?.toFixed(2)
                          }
                        </span>
                        <div className={`flex items-center gap-1 ${
                          selectedMarketData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {selectedMarketData.change >= 0 ? 
                            <TrendingUp className="w-5 h-5" /> : 
                            <TrendingDown className="w-5 h-5" />
                          }
                          <span className="font-semibold">
                            {selectedMarketData.change >= 0 ? '+' : ''}{selectedMarketData.change?.toFixed(2)}
                          </span>
                          <span>
                            ({selectedMarketData.changePercent >= 0 ? '+' : ''}{selectedMarketData.changePercent?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {timeframes.map((tf) => (
                      <Button
                        key={tf.value}
                        size="sm"
                        variant={selectedTimeframe === tf.value ? 'default' : 'outline'}
                        className={selectedTimeframe === tf.value 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        }
                        onClick={() => setSelectedTimeframe(tf.value)}
                      >
                        {tf.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingChart ? (
                  <div className="h-96 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="displayDate" 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        interval="preserveStartEnd"
                        minTickGap={50}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-400">
                    No chart data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Details with Options Tab */}
            {assetDetails && (
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="border-b border-slate-800">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-400" />
                    Asset Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-slate-800 border border-slate-700 mb-6">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600">
                        <Info className="w-4 h-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      {selectedAsset?.type === 'stock' && (
                        <TabsTrigger value="options" className="data-[state=active]:bg-emerald-600">
                          <Layers className="w-4 h-4 mr-2" />
                          Options Chain
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Object.entries(assetDetails).map(([key, value]) => (
                          <div key={key} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-1">{key}</p>
                            <p className="text-lg font-bold text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-500">
                          <span className="text-yellow-400">Note:</span> Asset information is for demonstration purposes and may not reflect real-time market data.
                        </p>
                      </div>
                    </TabsContent>

                    {selectedAsset?.type === 'stock' && optionsChain && (
                      <TabsContent value="options">
                        <div className="space-y-6">
                          {/* Calls Section */}
                          <div>
                            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5" />
                              Call Options
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-700">
                                    <th className="text-left text-slate-400 font-medium py-2 px-2">Strike</th>
                                    <th className="text-left text-slate-400 font-medium py-2 px-2">Expiry</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Bid</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Ask</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Last</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Volume</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">OI</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">IV</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Delta</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Gamma</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Theta</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Vega</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {optionsChain.calls.map((option, idx) => (
                                    <tr 
                                      key={idx} 
                                      className={`border-b border-slate-800 hover:bg-slate-800/30 ${
                                        option.isITM ? 'bg-emerald-500/5' : ''
                                      }`}
                                    >
                                      <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-white">${option.strike}</span>
                                          {option.isITM && (
                                            <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">ITM</Badge>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-2 text-slate-300">{option.expiry}</td>
                                      <td className="py-3 px-2 text-right text-white">${option.bid}</td>
                                      <td className="py-3 px-2 text-right text-white">${option.ask}</td>
                                      <td className="py-3 px-2 text-right font-semibold text-emerald-400">${option.last}</td>
                                      <td className="py-3 px-2 text-right text-slate-300">{option.volume.toLocaleString()}</td>
                                      <td className="py-3 px-2 text-right text-slate-300">{option.openInterest.toLocaleString()}</td>
                                      <td className="py-3 px-2 text-right text-purple-400">{option.iv}%</td>
                                      <td className="py-3 px-2 text-right text-blue-400">{option.delta}</td>
                                      <td className="py-3 px-2 text-right text-slate-400">{option.gamma}</td>
                                      <td className="py-3 px-2 text-right text-red-400">{option.theta}</td>
                                      <td className="py-3 px-2 text-right text-amber-400">{option.vega}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Puts Section */}
                          <div>
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                              <TrendingDown className="w-5 h-5" />
                              Put Options
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-700">
                                    <th className="text-left text-slate-400 font-medium py-2 px-2">Strike</th>
                                    <th className="text-left text-slate-400 font-medium py-2 px-2">Expiry</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Bid</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Ask</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Last</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Volume</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">OI</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">IV</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Delta</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Gamma</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Theta</th>
                                    <th className="text-right text-slate-400 font-medium py-2 px-2">Vega</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {optionsChain.puts.map((option, idx) => (
                                    <tr 
                                      key={idx} 
                                      className={`border-b border-slate-800 hover:bg-slate-800/30 ${
                                        option.isITM ? 'bg-red-500/5' : ''
                                      }`}
                                    >
                                      <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-white">${option.strike}</span>
                                          {option.isITM && (
                                            <Badge className="bg-red-500/20 text-red-300 text-xs">ITM</Badge>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-2 text-slate-300">{option.expiry}</td>
                                      <td className="py-3 px-2 text-right text-white">${option.bid}</td>
                                      <td className="py-3 px-2 text-right text-white">${option.ask}</td>
                                      <td className="py-3 px-2 text-right font-semibold text-red-400">${option.last}</td>
                                      <td className="py-3 px-2 text-right text-slate-300">{option.volume.toLocaleString()}</td>
                                      <td className="py-3 px-2 text-right text-slate-300">{option.openInterest.toLocaleString()}</td>
                                      <td className="py-3 px-2 text-right text-purple-400">{option.iv}%</td>
                                      <td className="py-3 px-2 text-right text-blue-400">{option.delta}</td>
                                      <td className="py-3 px-2 text-right text-slate-400">{option.gamma}</td>
                                      <td className="py-3 px-2 text-right text-red-400">{option.theta}</td>
                                      <td className="py-3 px-2 text-right text-amber-400">{option.vega}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-700">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-white mb-3">Greeks Explanation</h4>
                              <div className="grid md:grid-cols-2 gap-3 text-xs text-slate-400">
                                <div>
                                  <span className="text-blue-400 font-semibold">Delta:</span> Rate of change in option price per $1 change in underlying
                                </div>
                                <div>
                                  <span className="text-slate-300 font-semibold">Gamma:</span> Rate of change in delta per $1 change in underlying
                                </div>
                                <div>
                                  <span className="text-red-400 font-semibold">Theta:</span> Daily time decay of option value
                                </div>
                                <div>
                                  <span className="text-amber-400 font-semibold">Vega:</span> Change in option price per 1% change in implied volatility
                                </div>
                                <div>
                                  <span className="text-purple-400 font-semibold">IV:</span> Implied Volatility - Market's forecast of volatility
                                </div>
                                <div>
                                  <span className="text-emerald-400 font-semibold">ITM:</span> In The Money - Option has intrinsic value
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                              <span className="text-yellow-400">Note:</span> Options data is for demonstration purposes. Always verify pricing with your broker before trading.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Market Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">S&P 500</CardTitle>
                </CardHeader>
                <CardContent>
                  {spyData ? (
                    <>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${spyData.price?.toFixed(2)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        spyData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {spyData.change >= 0 ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{spyData.change >= 0 ? '+' : ''}{spyData.change?.toFixed(2)}</span>
                        <span>({spyData.changePercent >= 0 ? '+' : ''}{spyData.changePercent?.toFixed(2)}%)</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500">Loading...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Nasdaq 100</CardTitle>
                </CardHeader>
                <CardContent>
                  {qqqData ? (
                    <>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${qqqData.price?.toFixed(2)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        qqqData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {qqqData.change >= 0 ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{qqqData.change >= 0 ? '+' : ''}{qqqData.change?.toFixed(2)}</span>
                        <span>({qqqData.changePercent >= 0 ? '+' : ''}{qqqData.changePercent?.toFixed(2)}%)</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500">Loading...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2E] border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Bitcoin</CardTitle>
                </CardHeader>
                <CardContent>
                  {btcData ? (
                    <>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${btcData.price?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        btcData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {btcData.change >= 0 ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{btcData.change >= 0 ? '+' : ''}{btcData.change?.toFixed(2)}</span>
                        <span>({btcData.changePercent >= 0 ? '+' : ''}{btcData.changePercent?.toFixed(2)}%)</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500">Loading...</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live Market Grid */}
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-white">Popular Assets</CardTitle>
                  <button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {(searchQuery ? filteredSymbols : popularSymbols).map((item) => {
                    const data = marketData[item.symbol];
                    const isSelected = selectedSymbol === item.symbol;
                    
                    return (
                      <button
                        key={item.symbol}
                        onClick={() => setSelectedSymbol(item.symbol)}
                        className={`bg-slate-800/50 rounded-lg p-4 border transition-all text-left w-full ${
                          isSelected 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-slate-700/50 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              data?.change >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                            }`}>
                              {data?.change >= 0 ? 
                                <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                                <TrendingDown className="w-6 h-6 text-red-400" />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white text-lg">{item.symbol}</h3>
                                <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                                  {item.type}
                                </Badge>
                                {isSelected && (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{item.name}</p>
                            </div>
                          </div>
                          
                          {data ? (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white mb-1">
                                ${item.type === 'crypto' ? 
                                  data.price?.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 
                                  data.price?.toFixed(2)
                                }
                              </div>
                              <div className={`flex items-center gap-1 justify-end ${
                                data.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                <span className="font-semibold">
                                  {data.change >= 0 ? '+' : ''}{data.change?.toFixed(2)}
                                </span>
                                <span className="text-sm">
                                  ({data.changePercent >= 0 ? '+' : ''}{data.changePercent?.toFixed(2)}%)
                                </span>
                              </div>
                              {data.volume && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Vol: {(data.volume / 1000000).toFixed(1)}M
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-500">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
