import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Power, PowerOff, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Strategies() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const queryClient = useQueryClient();

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Strategy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      setIsDialogOpen(false);
      setEditingStrategy(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Strategy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
      setIsDialogOpen(false);
      setEditingStrategy(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Strategy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategies']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      asset_types: formData.get('asset_types').split(',').map(t => t.trim()),
      strategy_type: formData.get('strategy_type'),
      timeframe: formData.get('timeframe'),
      rules: {
        entry_conditions: formData.get('entry_conditions'),
        exit_conditions: formData.get('exit_conditions'),
        risk_per_trade: parseFloat(formData.get('risk_per_trade') || 1),
        max_position_size: parseFloat(formData.get('max_position_size') || 1000),
      },
      indicators: formData.get('indicators').split(',').map(i => i.trim()).filter(i => i),
      is_active: true,
    };

    if (editingStrategy) {
      updateMutation.mutate({ id: editingStrategy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleActive = (strategy) => {
    updateMutation.mutate({
      id: strategy.id,
      data: { ...strategy, is_active: !strategy.is_active }
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Trading Strategies</h1>
            <p className="text-slate-400">Create and manage your algorithmic trading strategies</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setEditingStrategy(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Strategy Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingStrategy?.name}
                    placeholder="e.g., RSI Mean Reversion"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingStrategy?.description}
                    placeholder="Describe your strategy..."
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="strategy_type" className="text-slate-300">Strategy Type</Label>
                    <Select name="strategy_type" defaultValue={editingStrategy?.strategy_type || "momentum"}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                        <SelectItem value="trend_following">Trend Following</SelectItem>
                        <SelectItem value="volatility">Volatility</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeframe" className="text-slate-300">Timeframe</Label>
                    <Select name="timeframe" defaultValue={editingStrategy?.timeframe || "daily"}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="1min">1 Minute</SelectItem>
                        <SelectItem value="5min">5 Minutes</SelectItem>
                        <SelectItem value="15min">15 Minutes</SelectItem>
                        <SelectItem value="1hour">1 Hour</SelectItem>
                        <SelectItem value="4hour">4 Hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="asset_types" className="text-slate-300">Asset Types (comma-separated)</Label>
                  <Input
                    id="asset_types"
                    name="asset_types"
                    defaultValue={editingStrategy?.asset_types?.join(', ')}
                    placeholder="stocks, options, futures"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="indicators" className="text-slate-300">Technical Indicators (comma-separated)</Label>
                  <Input
                    id="indicators"
                    name="indicators"
                    defaultValue={editingStrategy?.indicators?.join(', ')}
                    placeholder="RSI, MACD, SMA, EMA, Bollinger Bands"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="entry_conditions" className="text-slate-300">Entry Conditions</Label>
                  <Textarea
                    id="entry_conditions"
                    name="entry_conditions"
                    defaultValue={editingStrategy?.rules?.entry_conditions}
                    placeholder="e.g., RSI < 30 and price crosses above SMA(20)"
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="exit_conditions" className="text-slate-300">Exit Conditions</Label>
                  <Textarea
                    id="exit_conditions"
                    name="exit_conditions"
                    defaultValue={editingStrategy?.rules?.exit_conditions}
                    placeholder="e.g., RSI > 70 or 2% profit target hit"
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk_per_trade" className="text-slate-300">Risk Per Trade (%)</Label>
                    <Input
                      id="risk_per_trade"
                      name="risk_per_trade"
                      type="number"
                      step="0.1"
                      defaultValue={editingStrategy?.rules?.risk_per_trade || 1}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_position_size" className="text-slate-300">Max Position Size ($)</Label>
                    <Input
                      id="max_position_size"
                      name="max_position_size"
                      type="number"
                      defaultValue={editingStrategy?.rules?.max_position_size || 1000}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {editingStrategy ? 'Update' : 'Create'} Strategy
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {strategies.length === 0 ? (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardContent className="py-16 text-center">
              <p className="text-slate-400 mb-4">No strategies yet</p>
              <p className="text-sm text-slate-500 mb-6">Create your first trading strategy to get started</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="bg-[#1A1F2E] border-slate-800 hover:border-emerald-500/30 transition-colors">
                <CardHeader className="border-b border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-white text-lg">{strategy.name}</CardTitle>
                    <Badge className={strategy.is_active !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}>
                      {strategy.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{strategy.description}</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {strategy.strategy_type}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {strategy.timeframe}
                    </Badge>
                    {strategy.asset_types?.map((type) => (
                      <Badge key={type} variant="outline" className="text-slate-400 border-slate-600">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  {strategy.indicators && strategy.indicators.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Indicators:</p>
                      <p className="text-sm text-slate-300">{strategy.indicators.join(', ')}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300"
                      onClick={() => {
                        setEditingStrategy(strategy);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`border-slate-700 ${strategy.is_active !== false ? 'text-emerald-400' : 'text-slate-400'}`}
                      onClick={() => toggleActive(strategy)}
                    >
                      {strategy.is_active !== false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-red-400"
                      onClick={() => deleteMutation.mutate(strategy.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}