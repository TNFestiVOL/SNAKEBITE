import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function MarketDataCard({ asset, marketData }) {
  if (!marketData || !marketData.available) {
    return (
      <Card className="bg-[#1A1F2E] border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">{asset.symbol}</h3>
              <p className="text-xs text-slate-500">Data unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = (marketData.change_percent || 0) >= 0;

  return (
    <Card className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-lg flex items-center justify-center`}>
              {isPositive ? 
                <TrendingUp className="w-5 h-5 text-emerald-400" /> : 
                <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{asset.symbol}</h3>
              <p className="text-xs text-slate-400">{marketData.name || asset.name}</p>
            </div>
          </div>
          <Badge className={asset.asset_type === 'stock' ? 'bg-blue-500/20 text-blue-300' : 
            asset.asset_type === 'crypto' ? 'bg-purple-500/20 text-purple-300' : 
            'bg-amber-500/20 text-amber-300'}>
            {asset.asset_type}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                ${marketData.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{marketData.change?.toFixed(2)}
                </span>
                <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({isPositive ? '+' : ''}{marketData.change_percent?.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-500">Day High</p>
              <p className="text-sm font-semibold text-slate-300">
                ${marketData.day_high?.toFixed(2) || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Day Low</p>
              <p className="text-sm font-semibold text-slate-300">
                ${marketData.day_low?.toFixed(2) || '-'}
              </p>
            </div>
          </div>

          {marketData.volume && (
            <div className="pt-2">
              <p className="text-xs text-slate-500">Volume</p>
              <p className="text-sm font-semibold text-slate-300">
                {(marketData.volume / 1000000).toFixed(2)}M
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}