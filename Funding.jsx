import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Building2
} from "lucide-react";

export default function Funding() {
  const [achRelationships, setAchRelationships] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState('INCOMING');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load ACH relationships
      const achResponse = await base44.functions.invoke('alpacaBrokerage', {
        action: 'getACHRelationships'
      });

      if (achResponse.data?.success) {
        setAchRelationships(achResponse.data.data || []);
      }

      // Load transfer history
      const transfersResponse = await base44.functions.invoke('alpacaBrokerage', {
        action: 'getTransfers',
        limit: 50
      });

      if (transfersResponse.data?.success) {
        setTransfers(transfersResponse.data.data || []);
      }
    } catch (err) {
      console.error('Error loading funding data:', err);
      setError('Failed to load funding information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.target);
    const amount = formData.get('amount');
    const relationshipId = formData.get('relationship_id');

    try {
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'createTransfer',
        relationship_id: relationshipId,
        amount: amount,
        direction: transferDirection
      });

      if (response.data?.success) {
        setSuccess(`${transferDirection === 'INCOMING' ? 'Deposit' : 'Withdrawal'} of $${amount} initiated successfully! Status: ${response.data.data.status}`);
        setIsTransferDialogOpen(false);
        setTimeout(() => {
          loadData();
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Transfer failed');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to initiate transfer');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETE':
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'QUEUED':
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-600';
    }
  };

  const approvedBanks = achRelationships.filter(ach => ach.status === 'APPROVED');

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-emerald-400" />
            Account Funding
          </h1>
          <p className="text-slate-400">Deposit and withdraw funds via ACH transfer</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">{success}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Deposit Funds</h3>
                  <p className="text-slate-400">Add money to your trading account</p>
                </div>
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setTransferDirection('INCOMING');
                  setIsTransferDialogOpen(true);
                }}
                disabled={approvedBanks.length === 0}
              >
                {approvedBanks.length === 0 ? 'No Bank Accounts Linked' : 'Deposit via ACH'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <ArrowUpCircle className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Withdraw Funds</h3>
                  <p className="text-slate-400">Transfer money to your bank</p>
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setTransferDirection('OUTGOING');
                  setIsTransferDialogOpen(true);
                }}
                disabled={approvedBanks.length === 0}
              >
                {approvedBanks.length === 0 ? 'No Bank Accounts Linked' : 'Withdraw via ACH'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Linked Banks */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Linked Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {achRelationships.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No bank accounts linked</p>
                <Button 
                  onClick={() => window.location.href = '/page/BankLinking'}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Link Bank Account
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {achRelationships.map((ach) => (
                  <div key={ach.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-white">{ach.nickname}</h3>
                            <p className="text-sm text-slate-400">{ach.account_owner_name}</p>
                          </div>
                          <Badge className={getStatusColor(ach.status)}>
                            {ach.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {ach.bank_account_type} •••• {ach.bank_account_number?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Transfer History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transfers.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No transfer history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          transfer.direction === 'INCOMING' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                        }`}>
                          {transfer.direction === 'INCOMING' ? 
                            <ArrowDownCircle className="w-6 h-6 text-emerald-400" /> : 
                            <ArrowUpCircle className="w-6 h-6 text-blue-400" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {transfer.direction === 'INCOMING' ? 'Deposit' : 'Withdrawal'}
                            </h3>
                            <Badge className={getStatusColor(transfer.status)}>
                              {transfer.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">
                            ${parseFloat(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(transfer.created_at).toLocaleString()}
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
      </div>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="bg-[#1A1F2E] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {transferDirection === 'INCOMING' ? (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                  Deposit Funds
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-blue-400" />
                  Withdraw Funds
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <Label htmlFor="relationship_id" className="text-slate-300">Select Bank Account</Label>
              <Select name="relationship_id" required>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose bank account..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {approvedBanks.map((ach) => (
                    <SelectItem key={ach.id} value={ach.id}>
                      {ach.nickname} (••••{ach.bank_account_number?.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount" className="text-slate-300">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                {transferDirection === 'INCOMING' 
                  ? 'Funds will be available after clearing (typically 2-3 business days)' 
                  : 'Withdrawal will be initiated immediately'}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold mb-1">Important Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Transfers may take 2-5 business days to complete</li>
                    <li>Status will initially show as QUEUED, then update to COMPLETE</li>
                    <li>This is a sandbox environment - no real money is transferred</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsTransferDialogOpen(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={transferDirection === 'INCOMING' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {transferDirection === 'INCOMING' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}