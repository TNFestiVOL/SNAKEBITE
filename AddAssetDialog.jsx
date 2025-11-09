import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function AddAssetDialog({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      symbol: symbol.toUpperCase(),
      asset_type: assetType,
      name: name || symbol.toUpperCase(),
      is_favorite: false
    });
    setSymbol("");
    setName("");
    setOpen(false);
  };

  const popularAssets = {
    stock: ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"],
    crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD"],
    forex: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"],
    commodity: ["GC=F", "CL=F", "SI=F"]
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add Asset to Watchlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="assetType" className="text-slate-300">Asset Type</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="commodity">Commodity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g., AAPL, BTC-USD, EUR/USD"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Popular: {popularAssets[assetType].slice(0, 4).join(', ')}
            </p>
          </div>

          <div>
            <Label htmlFor="name" className="text-slate-300">Name (Optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple Inc."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Add to Watchlist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}