
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Users,
  Shield,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Admin() {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
    enabled: currentUser?.role === 'admin'
  });

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page. Admin access required.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const sendWelcomeEmails = async () => {
    setIsSending(true);
    setResults([]);
    const emailResults = [];

    for (const userId of selectedUsers) {
      const user = users.find(u => u.id === userId);
      if (!user) continue;

      try {
        console.log('Sending email to:', user.email);
        const response = await base44.functions.invoke('sendWelcomeEmail', {
          to_email: user.email,
          to_name: user.full_name
        });

        console.log('Response received:', response);

        // Check if the response indicates an error
        if (response.data?.error || !response.data?.success) {
          emailResults.push({
            email: user.email,
            name: user.full_name,
            success: false,
            message: response.data?.error || response.data?.details || response.data?.message || 'Unknown error occurred'
          });
        } else {
          emailResults.push({
            email: user.email,
            name: user.full_name,
            success: true,
            message: response.data.message || 'Email sent successfully'
          });
        }
      } catch (error) {
        console.error('Error sending email:', error);
        emailResults.push({
          email: user.email,
          name: user.full_name,
          success: false,
          message: error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to send email'
        });
      }
    }

    setResults(emailResults);
    setSelectedUsers(new Set());
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-emerald-400" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400">Manage users and send welcome emails</p>
          </div>
        </div>

        {results.length > 0 && (
          <Card className="bg-[#1A1F2E] border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Email Results</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <Alert 
                    key={idx}
                    variant={result.success ? "default" : "destructive"}
                    className={result.success ? "border-emerald-500/30 bg-emerald-500/10" : ""}
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <span className="font-semibold">{result.name || result.email}</span>: {result.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-white">User Management</CardTitle>
                <Badge className="bg-blue-500/20 text-blue-300">
                  {users.length} Users
                </Badge>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white w-full lg:w-64"
                />
                <Button
                  onClick={sendWelcomeEmails}
                  disabled={selectedUsers.size === 0 || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Welcome ({selectedUsers.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
                <p className="text-slate-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="border-slate-700 text-slate-300"
                  >
                    {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <p className="text-sm text-slate-500">
                    {selectedUsers.size} of {filteredUsers.length} selected
                  </p>
                </div>

                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-slate-800/50 rounded-lg p-4 border transition-colors cursor-pointer ${
                      selectedUsers.has(user.id)
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUser(user.id)}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{user.full_name || 'No name'}</h3>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-slate-500/20 text-slate-300'
                          }
                        >
                          {user.role}
                        </Badge>
                        <p className="text-xs text-slate-500">
                          {new Date(user.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-2">About Welcome Emails</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Welcome emails are sent using Resend and include:
                </p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Introduction to TradingEdge features</li>
                  <li>• Quick start guide and links</li>
                  <li>• Professional branding and design</li>
                  <li>• Direct link to dashboard</li>
                </ul>
                <p className="text-xs text-slate-500 mt-3">
                  Note: Make sure RESEND_API_KEY and RESEND_FROM_EMAIL are configured in your environment settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
