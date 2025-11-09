
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield, // New import
  ArrowRight, // New import
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Assuming Link is from react-router-dom or a similar routing library
import { Link } from "react-router-dom"; // Add this import

// Assuming createPageUrl is a utility function available in the project
// For demonstration, a placeholder is provided. In a real application, this would be imported or globally available.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "AlpacaOnboarding":
      return "/settings/alpaca-onboarding"; // Example path
    // Add other cases as needed
    default:
      return `/${pageName.toLowerCase()}`;
  }
};


export default function ExecuteLive() {
  const [accountData, setAccountData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [hasAlpacaAccount, setHasAlpacaAccount] = useState(null); // New state
  const queryClient = useQueryClient();

  const { data: signals = [] } = useQuery({
    queryKey: ['signals'],
    queryFn: () => base44.entities.Signal.list('-created_date'),
    initialData: [],
  });

  const { data: currentUser } = useQuery({ // New useQuery for current user
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    checkAlpacaAccount();
  }, [currentUser]); // Trigger check when currentUser changes

  const checkAlpacaAccount = async () => {
    if (!currentUser) {
      // If no user is logged in, or user data is not yet available, assume no Alpaca account linked for now.
      // This state will cause the prompt to create an account.
      setHasAlpacaAccount(false);
      return;
    }

    try {
      // Invoke the backend function to get Alpaca account status
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'getAccountStatus'
      });

      if (response.data?.success) {
        // Determine if the user has an approved/active Alpaca account
        const hasAccount = response.data.has_account &&
          (response.data.status === 'APPROVED' || response.data.status === 'ACTIVE');
        setHasAlpacaAccount(hasAccount);

        if (hasAccount) {
          // If an active/approved Alpaca account exists, proceed to load trading data
          loadAccountData();
        }
      } else {
        console.error('Alpaca account status check failed:', response.data?.error || 'Unknown error');
        setHasAlpacaAccount(false); // If check fails, assume no valid account
      }
    } catch (err) {
      console.error('Error checking Alpaca account:', err);
      setHasAlpacaAccount(false); // If API call fails, assume no valid account
    }
  };

  const loadAccountData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get account info
      const accountResponse = await base44.functions.invoke('alpacaTrading', {
        action: 'getAccount'
      });

      if (accountResponse.data?.success) {
        setAccountData(accountResponse.data.data);
      } else {
        // Updated error message for when an account is expected to exist but data loading fails
        throw new Error(accountResponse.data?.error || 'Failed to load account details from Alpaca.');
      }

      // Get positions
      const positionsResponse = await base44.functions.invoke('alpacaTrading', {
        action: 'getPositions'
      });

      if (positionsResponse.data?.success) {
        setPositions(positionsResponse.data.data || []);
      }

      // Get recent orders
      const ordersResponse = await base44.functions.invoke('alpacaTrading', {
        action: 'getOrders',
        status: 'all',
        limit: 20
      });

      if (ordersResponse.data?.success) {
        setOrders(ordersResponse.data.data || []);
      }

    } catch (err) {
      console.error('Error loading Alpaca data:', err);
      // Updated error message, assuming we are past the initial account existence check
      setError('Failed to connect to Alpaca. Please check your account status.');
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async (orderData) => {
    try {
      const response = await base44.functions.invoke('alpacaTrading', {
        action: 'placeOrder',
        ...orderData
      });

      if (response.data?.success) {
        await loadAccountData();
        setIsTradeDialogOpen(false);
        setSelectedSignal(null);
        return { success: true };
      } else {
        throw new Error(response.data?.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      return { success: false, error: err.message };
    }
  };

  const handleExecuteSignal = (signal) => {
    setSelectedSignal(signal);
    setIsTradeDialogOpen(true);
  };

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const orderData = {
      symbol: selectedSignal.symbol,
      quantity: parseInt(formData.get('quantity')),
      side: selectedSignal.action.includes('buy') ? 'buy' : 'sell',
      type: formData.get('order_type'),
      time_in_force: 'day'
    };

    if (orderData.type === 'limit') {
      orderData.limit_price = parseFloat(formData.get('limit_price'));
    }

    const result = await placeOrder(orderData);
    
    if (result.success) {
      // Update signal status
      await base44.entities.Signal.update(selectedSignal.id, {
        ...selectedSignal,
        status: 'executed'
      });
      queryClient.invalidateQueries(['signals']);
    } else {
      setError(result.error);
    }
  };

  const closePosition = async (symbol) => {
    try {
      await base44.functions.invoke('alpacaTrading', {
        action: 'closePosition',
        symbol: symbol
      });
      await loadAccountData();
    } catch (err) {
      setError(`Failed to close position: ${err.message}`);
    }
  };

  const activeSignals = signals.filter(s => s.status === 'active');

  // Conditional rendering for initial loading or checking Alpaca account status
  if (hasAlpacaAccount === null || (hasAlpacaAccount && isLoading && !accountData)) {
    return (
      <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading account status...</p>
        </div>
      </div>
    );
  }

  // Conditional rendering if user does not have an approved Alpaca account
  if (hasAlpacaAccount === false) {
    return (
      <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Zap className="w-10 h-10 text-emerald-400" />
              Live Trading
            </h1>
            <p className="text-slate-400">Execute trades directly through Alpaca</p>
          </div>

          <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
            <CardContent className="p-12 text-center">
              <Shield className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-3">Set Up Your Brokerage Account</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                To start live trading, you'll need to create an Alpaca brokerage account. 
                This is a regulated account where your funds and trades are managed securely.
              </p>
              <div className="bg-slate-800/50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="font-semibold text-white mb-3">What you'll need:</h3>
                <ul className="text-sm text-slate-300 space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Government-issued ID
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Social Security Number or Tax ID
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Current address information
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Employment and financial information
                  </li>
                </ul>
              </div>
              <Link to={createPageUrl("AlpacaOnboarding")}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">
                  Create Brokerage Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-xs text-slate-500 mt-4">
                Takes about 5 minutes • Secure & encrypted • Sandbox environment for testing
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Original error condition, now applicable if hasAlpacaAccount is true but actual account data cannot be loaded
  if (error && !accountData) {
    return (
      <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <Button onClick={loadAccountData} className="bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Zap className="w-10 h-10 text-emerald-400" />
              Live Trading
            </h1>
            <p className="text-slate-400">Execute trades directly through Alpaca</p>
          </div>
          <Button 
            onClick={loadAccountData} 
            variant="outline"
            className="border-slate-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account Overview */}
        {accountData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-400">Portfolio Value</CardTitle>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  ${parseFloat(accountData.portfolio_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500">Total equity</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-400">Buying Power</CardTitle>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  ${parseFloat(accountData.buying_power || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500">Available to trade</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-400">P&L Today</CardTitle>
                  {parseFloat(accountData.equity || 0) - parseFloat(accountData.last_equity || 0) >= 0 ? 
                    <TrendingUp className="w-5 h-5 text-emerald-400" /> : 
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  }
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-1 ${
                  parseFloat(accountData.equity || 0) - parseFloat(accountData.last_equity || 0) >= 0 ? 
                  'text-emerald-400' : 'text-red-400'
                }`}>
                  ${(parseFloat(accountData.equity || 0) - parseFloat(accountData.last_equity || 0)).toFixed(2)}
                </div>
                <p className="text-xs text-slate-500">
                  {((parseFloat(accountData.equity || 0) - parseFloat(accountData.last_equity || 0)) / parseFloat(accountData.last_equity || 1) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-400">Account Status</CardTitle>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <Badge className="bg-emerald-500/20 text-emerald-300 mb-2">
                  {accountData.status === 'ACTIVE' ? 'Active' : accountData.status}
                </Badge>
                <p className="text-xs text-slate-500">
                  {accountData.pattern_day_trader ? 'PDT Status' : 'Cash Account'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Signals */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Active Signals - Ready to Execute</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {activeSignals.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No active signals</p>
                <p className="text-sm text-slate-500 mt-2">Generate signals from the Live Signals page</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeSignals.map((signal) => (
                  <Card key={signal.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white">{signal.symbol}</h3>
                          <p className="text-sm text-slate-400">{signal.strategy_name}</p>
                        </div>
                        <Badge className={signal.action.includes('buy') ? 
                          'bg-emerald-500/20 text-emerald-300' : 
                          'bg-red-500/20 text-red-300'
                        }>
                          {signal.action.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Entry:</span>
                          <span className="text-white font-semibold">${signal.entry_price?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Stop Loss:</span>
                          <span className="text-red-400 font-semibold">${signal.stop_loss?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Take Profit:</span>
                          <span className="text-emerald-400 font-semibold">${signal.take_profit?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Confidence:</span>
                          <span className="text-purple-400 font-semibold">{signal.confidence}%</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleExecuteSignal(signal)}
                      >
                        Execute on Alpaca
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Positions */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Current Positions ({positions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No open positions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((position) => {
                  const unrealizedPL = parseFloat(position.unrealized_pl);
                  const unrealizedPLPercent = parseFloat(position.unrealized_plpc) * 100;
                  
                  return (
                    <div key={position.symbol} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${unrealizedPL >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                            {unrealizedPL >= 0 ? 
                              <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                              <TrendingDown className="w-6 h-6 text-red-400" />
                            }
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{position.symbol}</h3>
                            <p className="text-sm text-slate-400">
                              {position.qty} shares @ ${parseFloat(position.avg_entry_price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${unrealizedPL.toFixed(2)}
                          </p>
                          <p className={`text-sm ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {unrealizedPLPercent.toFixed(2)}%
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => closePosition(position.symbol)}
                          >
                            Close Position
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Badge className={order.side === 'buy' ? 
                          'bg-emerald-500/20 text-emerald-300' : 
                          'bg-red-500/20 text-red-300'
                        }>
                          {order.side.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-white">{order.symbol}</span>
                        <span className="text-sm text-slate-400">
                          {order.qty} @ {order.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={
                          order.status === 'filled' ? 'border-emerald-500/30 text-emerald-300' :
                          order.status === 'canceled' ? 'border-red-500/30 text-red-300' :
                          'border-slate-600 text-slate-400'
                        }>
                          {order.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Execution Dialog */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Execute Trade - {selectedSignal?.symbol}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTradeSubmit} className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-semibold text-white">{selectedSignal?.action.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recommended Entry:</span>
                <span className="font-semibold text-white">${selectedSignal?.entry_price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-semibold text-purple-400">{selectedSignal?.confidence}%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="order_type" className="text-slate-300">Order Type</Label>
              <Select name="order_type" defaultValue="market">
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                defaultValue={selectedSignal?.quantity || 1}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="limit_price" className="text-slate-300">Limit Price (for limit orders)</Label>
              <Input
                id="limit_price"
                name="limit_price"
                type="number"
                step="0.01"
                defaultValue={selectedSignal?.entry_price}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTradeDialogOpen(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Execute Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
