import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Strategies from "./Strategies";

import Signals from "./Signals";

import TradeJournal from "./TradeJournal";

import BacktestLab from "./BacktestLab";

import Performance from "./Performance";

import AIAnalyst from "./AIAnalyst";

import StrategyDiscovery from "./StrategyDiscovery";

import Home from "./Home";

import Admin from "./Admin";

import ExecuteLive from "./ExecuteLive";

import AlpacaOnboarding from "./AlpacaOnboarding";

import BankLinking from "./BankLinking";

import Funding from "./Funding";

import LiveMarket from "./LiveMarket";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Strategies: Strategies,
    
    Signals: Signals,
    
    TradeJournal: TradeJournal,
    
    BacktestLab: BacktestLab,
    
    Performance: Performance,
    
    AIAnalyst: AIAnalyst,
    
    StrategyDiscovery: StrategyDiscovery,
    
    Home: Home,
    
    Admin: Admin,
    
    ExecuteLive: ExecuteLive,
    
    AlpacaOnboarding: AlpacaOnboarding,
    
    BankLinking: BankLinking,
    
    Funding: Funding,
    
    LiveMarket: LiveMarket,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Strategies" element={<Strategies />} />
                
                <Route path="/Signals" element={<Signals />} />
                
                <Route path="/TradeJournal" element={<TradeJournal />} />
                
                <Route path="/BacktestLab" element={<BacktestLab />} />
                
                <Route path="/Performance" element={<Performance />} />
                
                <Route path="/AIAnalyst" element={<AIAnalyst />} />
                
                <Route path="/StrategyDiscovery" element={<StrategyDiscovery />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/ExecuteLive" element={<ExecuteLive />} />
                
                <Route path="/AlpacaOnboarding" element={<AlpacaOnboarding />} />
                
                <Route path="/BankLinking" element={<BankLinking />} />
                
                <Route path="/Funding" element={<Funding />} />
                
                <Route path="/LiveMarket" element={<LiveMarket />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}