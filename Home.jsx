import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Zap, 
  BarChart3,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        navigate(createPageUrl("Dashboard"));
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    }
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">AI-Powered Algorithmic Trading</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight">
              Trade Smarter with
              <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                TradingEdge AI
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Harness the power of artificial intelligence to create, backtest, and execute 
              sophisticated trading strategies across stocks, options, and futures.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                onClick={handleGetStarted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleGetStarted}
                className="border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-slate-400 text-lg">
            Professional-grade tools for algorithmic traders
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Strategy Discovery</h3>
              <p className="text-slate-400 leading-relaxed">
                Let AI analyze market patterns and generate profitable trading strategies tailored to your risk profile.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Advanced Backtesting</h3>
              <p className="text-slate-400 leading-relaxed">
                Test your strategies against historical data with comprehensive performance analytics and risk metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Trading Signals</h3>
              <p className="text-slate-400 leading-relaxed">
                Receive real-time AI-generated signals based on your active strategies with confidence scores.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automated Execution</h3>
              <p className="text-slate-400 leading-relaxed">
                Execute trades automatically through integrated brokerage accounts with smart risk management.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Risk Management</h3>
              <p className="text-slate-400 leading-relaxed">
                Built-in position sizing, stop losses, and portfolio risk controls to protect your capital.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Performance Analytics</h3>
              <p className="text-slate-400 leading-relaxed">
                Track your trading performance with detailed analytics, win rates, and profit/loss metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Join traders who are leveraging AI to make smarter, data-driven decisions
            </p>
            <Button 
              onClick={handleGetStarted}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-lg"
            >
              Start Trading Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">
              © 2025 TradingEdge. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-slate-500 text-sm">Live Trading Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}