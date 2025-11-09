
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText
} from "lucide-react";

export default function AlpacaOnboarding() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'getAccountStatus'
      });

      if (response.data?.success && response.data.has_account) {
        setAccountStatus(response.data.status);
        if (response.data.status === 'APPROVED' || response.data.status === 'ACTIVE') {
          navigate(createPageUrl("ExecuteLive"));
        }
      }
    } catch (err) {
      console.error('Error checking account status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    
    try {
      const response = await base44.functions.invoke('alpacaBrokerage', {
        action: 'createAccount',
        // Personal Information
        given_name: formData.get('given_name'),
        family_name: formData.get('family_name'),
        date_of_birth: formData.get('date_of_birth'),
        
        // Contact Information
        phone_number: formData.get('phone_number'),
        street_address: formData.get('street_address'),
        city: formData.get('city'),
        state: formData.get('state'),
        postal_code: formData.get('postal_code'),
        
        // Tax Information
        tax_id: formData.get('tax_id'),
        tax_id_type: formData.get('tax_id_type') || 'USA_SSN',
        
        // Other
        country_of_citizenship: formData.get('country') || 'USA',
        country_of_birth: formData.get('country') || 'USA',
        country_of_tax_residence: formData.get('country') || 'USA',
        funding_source: [formData.get('funding_source') || 'employment_income'],
        
        // Disclosures
        is_control_person: formData.get('is_control_person') === 'on',
        is_affiliated_exchange_or_finra: formData.get('is_affiliated_exchange_or_finra') === 'on',
        is_politically_exposed: formData.get('is_politically_exposed') === 'on',
        immediate_family_exposed: formData.get('immediate_family_exposed') === 'on',
      });

      if (response.data?.success) {
        setStep(3); // Success step
        setTimeout(() => {
          navigate(createPageUrl("Funding")); // Updated redirect target
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create Alpaca account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountStatus === 'APPROVED' || accountStatus === 'ACTIVE') {
    return (
      <div className="min-h-screen bg-[#0F1419] p-6 flex items-center justify-center">
        <Card className="bg-[#1A1F2E] border-slate-800 max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Account Active</h2>
            <p className="text-slate-400 mb-6">Your Alpaca account is already set up and ready for trading.</p>
            <Button 
              onClick={() => navigate(createPageUrl("ExecuteLive"))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Live Trading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Alpaca Brokerage Account Setup
          </h1>
          <p className="text-slate-400">
            Create your brokerage account to start live trading
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-500/20 border-2 border-emerald-400' : 'bg-slate-700 border-2 border-slate-600'}`}>
              1
            </div>
            <span className="text-sm font-medium">Personal Info</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-500/20 border-2 border-emerald-400' : 'bg-slate-700 border-2 border-slate-600'}`}>
              2
            </div>
            <span className="text-sm font-medium">Disclosures</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-500/20 border-2 border-emerald-400' : 'bg-slate-700 border-2 border-slate-600'}`}>
              3
            </div>
            <span className="text-sm font-medium">Complete</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="given_name" className="text-slate-300">First Name *</Label>
                    <Input
                      id="given_name"
                      name="given_name"
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="family_name" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="family_name"
                      name="family_name"
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="date_of_birth" className="text-slate-300">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number" className="text-slate-300">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="555-555-5555"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="street_address" className="text-slate-300">Street Address *</Label>
                  <Input
                    id="street_address"
                    name="street_address"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-slate-300">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-slate-300">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="CA"
                      maxLength={2}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className="text-slate-300">ZIP Code *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tax_id" className="text-slate-300">SSN / Tax ID *</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    type="password"
                    placeholder="XXX-XX-XXXX"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Your information is encrypted and secure</p>
                </div>

                <div>
                  <Label htmlFor="funding_source" className="text-slate-300">Source of Funds *</Label>
                  <Select name="funding_source" defaultValue="employment_income">
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="employment_income">Employment Income</SelectItem>
                      <SelectItem value="investments">Investments</SelectItem>
                      <SelectItem value="inheritance">Inheritance</SelectItem>
                      <SelectItem value="business_income">Business Income</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-[#1A1F2E] border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white">Regulatory Disclosures</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="is_control_person" 
                      name="is_control_person"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="is_control_person" className="text-slate-300 font-normal cursor-pointer">
                        I am a control person of a publicly traded company
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">
                        A control person is a director, officer, or owner of 10% or more of a company's stock
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="is_affiliated_exchange_or_finra" 
                      name="is_affiliated_exchange_or_finra"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="is_affiliated_exchange_or_finra" className="text-slate-300 font-normal cursor-pointer">
                        I am affiliated with a stock exchange or FINRA member
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="is_politically_exposed" 
                      name="is_politically_exposed"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="is_politically_exposed" className="text-slate-300 font-normal cursor-pointer">
                        I am a politically exposed person
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">
                        Someone with a prominent public position or function
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="immediate_family_exposed" 
                      name="immediate_family_exposed"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="immediate_family_exposed" className="text-slate-300 font-normal cursor-pointer">
                        An immediate family member is politically exposed
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Customer Agreement</h4>
                      <p className="text-sm text-slate-300">
                        By submitting this form, you agree to Alpaca's Customer Agreement and acknowledge that you have read and understood the terms.
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
                onClick={() => setStep(1)}
                className="border-slate-700"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-3">Account Created!</h2>
              <p className="text-slate-400 mb-8">
                Next, let's set up your funding options.
              </p>
              <div className="inline-block">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
