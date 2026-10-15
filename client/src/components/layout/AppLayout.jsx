import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Bot, Code2, FlaskConical,
  TrendingUp, LogOut, Menu, X, ChevronRight,
  Wallet, Bell, Settings
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-chat', icon: Bot, label: 'AI Assistant' },
  { to: '/strategy-builder', icon: Code2, label: 'Strategy Builder' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtesting' },
  { to: '/paper-trading', icon: TrendingUp, label: 'Paper Trading' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatBalance = (bal) => {
    if (bal >= 100000) return `₹${(bal / 100000).toFixed(2)}L`;
    return `₹${bal?.toLocaleString('en-IN') || '0'}`;
  };

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
        bg-brand-surface border-r border-brand-border
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">
              Trade<span className="text-brand-orange">Genesis</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-widest px-3 pt-2 pb-3">
            Platform
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={13} className="ml-auto opacity-30" />
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-brand-border space-y-2">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <div className="flex items-center gap-1 text-brand-orange text-xs font-mono">
                <Wallet size={10} />
                {formatBalance(user?.virtualBalance)}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all text-sm"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-surface/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live Market</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 bg-brand-card border border-brand-border rounded-lg px-3 py-1.5">
              <Wallet size={13} className="text-brand-orange" />
              <span className="text-sm font-mono text-white">{formatBalance(user?.virtualBalance)}</span>
              <span className="text-xs text-gray-500">virtual</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-brand-card transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
