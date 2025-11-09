

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Signal, 
  FlaskConical, 
  BookOpen,
  BarChart3,
  Bot,
  Brain,
  Shield,
  Activity, // Added Activity icon
  Zap,
  LogOut,
  Info
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Live Market Data", // Changed title from "Live Market"
    url: createPageUrl("LiveMarket"),
    icon: Activity,
  },
  {
    title: "Strategies",
    url: createPageUrl("Strategies"),
    icon: TrendingUp,
  },
  {
    title: "Strategy Discovery",
    url: createPageUrl("StrategyDiscovery"),
    icon: Brain,
  },
  {
    title: "Execute via Brokerage",
    url: createPageUrl("ExecuteLive"),
    icon: Zap,
    badge: "Soon"
  },
  {
    title: "Live Signals",
    url: createPageUrl("Signals"),
    icon: Signal,
  },
  {
    title: "Backtest Lab",
    url: createPageUrl("BacktestLab"),
    icon: FlaskConical,
  },
  {
    title: "Trade Journal",
    url: createPageUrl("TradeJournal"),
    icon: BookOpen,
  },
  {
    title: "Performance",
    url: createPageUrl("Performance"),
    icon: BarChart3,
  },
  {
    title: "AI Analyst",
    url: createPageUrl("AIAnalyst"),
    icon: Bot,
  },
];

// Function to check if market is open
const getMarketStatus = () => {
  const now = new Date();
  
  // Convert to ET timezone
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = etTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Market hours in minutes
  const preMarketStart = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  const afterHoursEnd = 20 * 60; // 8:00 PM
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const isWeekday = day >= 1 && day <= 5;
  
  let status = 'closed';
  let statusLabel = 'CLOSED';
  
  if (isWeekday) {
    if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
      status = 'open';
      statusLabel = 'OPEN';
    } else if ((totalMinutes >= preMarketStart && totalMinutes < marketOpen) || 
               (totalMinutes >= marketClose && totalMinutes < afterHoursEnd)) {
      status = 'extended';
      statusLabel = totalMinutes < marketOpen ? 'PRE-MARKET' : 'AFTER-HOURS';
    }
  }
  
  return {
    status,
    statusLabel,
    currentTime: etTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  };
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [marketStatus, setMarketStatus] = React.useState(getMarketStatus());

  React.useEffect(() => {
    loadUser();
    
    // Update market status every minute
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      
      if (!isAuthed) {
        // Not authenticated - redirect to home unless already on a public page
        if (currentPageName !== "Home" && currentPageName !== "AlpacaOnboarding" && currentPageName !== "BankLinking" && currentPageName !== "Funding") {
          navigate(createPageUrl("Home"));
        }
        return;
      }

      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      // On error, redirect to home
      if (currentPageName !== "Home" && currentPageName !== "AlpacaOnboarding" && currentPageName !== "BankLinking" && currentPageName !== "Funding") {
        navigate(createPageUrl("Home"));
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      // Force a full page reload to clear all state
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Logout error:", error);
      // Force reload anyway
      window.location.href = window.location.origin;
    }
  };

  // Public pages that don't need authentication
  if (currentPageName === "Home" || currentPageName === "AlpacaOnboarding" || currentPageName === "BankLinking" || currentPageName === "Funding") {
    return children;
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on a public page, the effect will redirect
  if (!currentUser) {
    return null;
  }

  // Get indicator color and animation based on status
  const getIndicatorClass = () => {
    switch (marketStatus.status) {
      case 'open':
        return 'bg-emerald-400 animate-pulse';
      case 'extended':
        return 'bg-yellow-400 animate-pulse';
      default:
        return 'bg-slate-500';
    }
  };

  const getBadgeClass = () => {
    switch (marketStatus.status) {
      case 'open':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
      case 'extended':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-600 hover:bg-slate-500/20';
    }
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --background: 217 33% 8%;
          --foreground: 210 40% 98%;
          --card: 217 33% 10%;
          --card-foreground: 210 40% 98%;
          --popover: 217 33% 10%;
          --popover-foreground: 210 40% 98%;
          --primary: 142 76% 36%;
          --primary-foreground: 144 61% 20%;
          --secondary: 217 33% 17%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217 33% 17%;
          --muted-foreground: 215 20% 65%;
          --accent: 142 76% 36%;
          --accent-foreground: 144 61% 20%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 210 40% 98%;
          --border: 217 33% 17%;
          --input: 217 33% 17%;
          --ring: 142 76% 36%;
          --radius: 0.75rem;
          
          --sidebar-background: 15 25% 8%;
          --sidebar-foreground: 210 40% 98%;
          --sidebar-primary: 142 76% 36%;
          --sidebar-primary-foreground: 210 40% 98%;
          --sidebar-accent: 217 33% 17%;
          --sidebar-accent-foreground: 210 40% 98%;
          --sidebar-border: 217 33% 17%;
          --sidebar-ring: 142 76% 36%;
        }
        
        body {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        [data-sidebar="sidebar"] {
          background-color: #0F1419 !important;
          border-right: 1px solid rgb(30 41 59) !important;
        }

        [data-sidebar="sidebar"] * {
          border-color: rgb(30 41 59) !important;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-[#0F1419]">
        <Sidebar className="border-r border-slate-800 bg-[#0F1419]">
          <SidebarHeader className="border-b border-slate-800 p-6 bg-[#0F1419]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690be9918a99447189a67cda/79ddf86f8_IMG_20251106_142351.png"
                  alt="TradingEdge Logo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg tracking-tight">TradingEdge</h2>
                <p className="text-xs text-slate-400">AI Trading Platform</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 bg-[#0F1419]">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`
                            mb-1 rounded-lg transition-all duration-200
                            ${isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15' 
                              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                            }
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                            {item.badge && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 ml-auto text-[10px]">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {currentUser?.role === 'admin' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        className={`
                          mb-1 rounded-lg transition-all duration-200 mt-4
                          ${location.pathname === createPageUrl("Admin")
                            ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/15' 
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                          }
                        `}
                      >
                        <Link to={createPageUrl("Admin")} className="flex items-center gap-3 px-3 py-2.5">
                          <Shield className="w-4 h-4" />
                          <span className="font-medium text-sm">Admin Panel</span>
                          <Badge className="bg-purple-500/20 text-purple-300 ml-auto text-[10px]">Admin</Badge>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-800 p-4 bg-[#0F1419] space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getIndicatorClass()}`}></div>
                <span className="text-xs font-medium text-slate-300">Market Status</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Live monitoring active</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                <span className="text-xs text-slate-400">US Markets:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 group">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] cursor-pointer transition-all ${getBadgeClass()}`}
                      >
                        {marketStatus.statusLabel}
                      </Badge>
                      <Info className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="right" 
                    align="start"
                    className="w-72 bg-slate-900 border-slate-700 text-slate-300"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          Market Hours
                        </h4>
                        <p className="text-xs text-slate-400">
                          Standard US market hours: <span className="text-white font-medium">9:30 AM - 4:00 PM ET</span>
                        </p>
                      </div>
                      
                      <div className="border-t border-slate-700 pt-3">
                        <h5 className="text-xs font-semibold text-yellow-400 mb-2">Extended Hours Trading</h5>
                        <p className="text-xs text-slate-400 mb-2">
                          Some stocks and ETFs trade during extended hours and certain ETFs trade <span className="text-white font-medium">24/7</span>:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1 ml-4 list-disc">
                          <li>Pre-market: 4:00 AM - 9:30 AM ET</li>
                          <li>After-hours: 4:00 PM - 8:00 PM ET</li>
                          <li>Select ETFs available around the clock</li>
                        </ul>
                      </div>
                      
                      <div className="border-t border-slate-700 pt-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-xs text-slate-400">Green = Standard hours</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-xs text-slate-400">Yellow = Extended hours</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                            <span className="text-xs text-slate-400">Gray = Closed</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-700 pt-3">
                        <p className="text-[10px] text-slate-500">
                          Our platform monitors markets continuously, even outside standard hours.
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                {marketStatus.currentTime} ET
              </p>
            </div>
            
            {currentUser && (
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Logged in as</p>
                <p className="text-sm font-medium text-white truncate">{currentUser.full_name || currentUser.email}</p>
              </div>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-[#0F1419] border-b border-slate-800 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors text-white" />
              <h1 className="text-lg font-semibold text-white">TradingEdge</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-[#0F1419]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

