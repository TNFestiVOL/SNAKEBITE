
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BankLinking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [achRelationships, setAchRelationships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadACHRelationships();
  }, []);

  const loadACHRelationships = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'getACHRelationships'
      });

      if (response.data?.success) {
        setAchRelationships(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading ACH relationships:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.target);
    
    try {
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'createACHRelationship',
        account_owner_name: formData.get('account_owner_name'),
        bank_account_type: formData.get('bank_account_type') || 'CHECKING',
        bank_account_number: formData.get('bank_account_number'),
        bank_routing_number: formData.get('bank_routing_number'),
        nickname: formData.get('nickname')
      });

      if (response.data?.success) {
        setSuccess(true);
        e.target.reset();
        // Reload ACH relationships after a short delay to allow for processing
        setTimeout(() => {
          loadACHRelationships();
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Failed to link bank account');
      }
    } catch (err) {
      console.error('Error linking bank account:', err);
      setError(err.message || 'Failed to link bank account. Please check your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (relationshipId) => {
    if (!confirm('Are you sure you want to remove this bank account?')) {
      return;
    }

    try {
      await base44.functions.invoke('alpacaBrokerage', {
        action: 'deleteACHRelationship',
        relationship_id: relationshipId
      });
      loadACHRelationships();
    } catch (err) {
      setError('Failed to remove bank account');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'QUEUED':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'PENDING':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Link Your Bank Account
          </h1>
          <p className="text-slate-400">
            Connect your bank to fund your trading account
          </p>
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
            <AlertDescription className="text-emerald-300">
              Bank account linked successfully! Approval typically takes about 1 minute.
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Bank Accounts */}
        {achRelationships.length > 0 && (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Linked Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {achRelationships.map((ach) => (
                  <div key={ach.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">{ach.nickname}</h3>
                          <p className="text-sm text-slate-400">{ach.account_owner_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {ach.bank_account_type} •••• {ach.bank_account_number?.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(ach.status)}>
                          {ach.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDelete(ach.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Link New Bank Account Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Add New Bank Account</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="account_owner_name" className="text-slate-300">Account Owner Name *</Label>
                <Input
                  id="account_owner_name"
                  name="account_owner_name"
                  placeholder="Full name on bank account"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nickname" className="text-slate-300">Account Nickname *</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  placeholder="e.g., Bank of America Checking"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bank_account_type" className="text-slate-300">Account Type *</Label>
                <Select name="bank_account_type" defaultValue="CHECKING">
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bank_routing_number" className="text-slate-300">Routing Number *</Label>
                <Input
                  id="bank_routing_number"
                  name="bank_routing_number"
                  placeholder="9-digit routing number"
                  maxLength={9}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Usually found at the bottom left of your check</p>
              </div>

              <div>
                <Label htmlFor="bank_account_number" className="text-slate-300">Account Number *</Label>
                <Input
                  id="bank_account_number"
                  name="bank_account_number"
                  type="password"
                  placeholder="Your bank account number"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Your information is encrypted and secure</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Secure Connection</h4>
                    <p className="text-sm text-slate-300">
                      Your bank information is encrypted and stored securely. We use industry-standard security protocols to protect your data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(createPageUrl("Funding"))}
              className="border-slate-700"
            >
              Skip for Now
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking Account...
                </>
              ) : (
                <>
                  Link Bank Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
