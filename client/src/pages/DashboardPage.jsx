import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { strategyAPI, backtestAPI, paperAPI } from '../services/api';
import {
  TrendingUp, TrendingDown, Bot, Code2, FlaskConical,
  ArrowRight, Wallet, BarChart3, Activity, Clock,
  Plus, ChevronRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatINR = (n) => {
  if (n === undefined || n === null) return '₹0';
  const abs = Math.abs(n);
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const quickActions = [
  { to: '/ai-chat', icon: Bot, label: 'Generate Strategy', desc: 'Use AI to create', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { to: '/strategy-builder', icon: Code2, label: 'Strategy Builder', desc: 'View & edit code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { to: '/backtest', icon: FlaskConical, label: 'Run Backtest', desc: 'Test on history', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { to: '/paper-trading', icon: TrendingUp, label: 'Paper Trade', desc: 'Virtual execution', color: 'text-green-400', bg: 'bg-green-500/10' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      strategyAPI.getAll().catch(() => ({ data: { strategies: [] } })),
      backtestAPI.getAll().catch(() => ({ data: { backtests: [] } })),
      paperAPI.getPortfolio().catch(() => ({ data: { portfolio: null, virtualBalance: user?.virtualBalance } })),
    ]).then(([sRes, bRes, pRes]) => {
      setStrategies(sRes.data.strategies || []);
      setBacktests(bRes.data.backtests || []);
      setPortfolio(pRes.data);
      setLoading(false);
    });
  }, []);

  // Build equity chart from latest backtest
  const latestBacktest = backtests.find(b => b.status === 'completed' && b.results?.equityCurve?.length);
  const chartData = latestBacktest ? {
    labels: latestBacktest.results.equityCurve.map(p => p.date.slice(5)),
    datasets: [{
      label: 'Equity',
      data: latestBacktest.results.equityCurve.map(p => p.equity),
      borderColor: '#F97316',
      backgroundColor: 'rgba(249,115,22,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1A1A1A',
      borderColor: '#2A2A2A',
      borderWidth: 1,
      titleColor: '#9CA3AF',
      bodyColor: '#F97316',
      callbacks: { label: ctx => formatINR(ctx.parsed.y) }
    }},
    scales: {
      x: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, maxTicksLimit: 8 } },
      y: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, callback: v => formatINR(v) } },
    },
  };

  const totalPnl = portfolio?.portfolio?.realizedPnl || 0;
  const holdings = portfolio?.portfolio?.holdings || [];
  const totalHoldingsValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);

  const StatCard = ({ label, value, sub, icon: Icon, positive }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={14} className="text-gray-600" />}
      </div>
      <div className={`font-display font-bold text-2xl ${positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </div>
      {sub && <div className="text-gray-600 text-xs">{sub}</div>}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-brand-orange">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your trading overview</p>
        </div>
        <Link to="/ai-chat" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} />
          New Strategy
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Virtual Balance"
          value={formatINR(portfolio?.virtualBalance || user?.virtualBalance)}
          sub="Available capital"
          icon={Wallet}
        />
        <StatCard
          label="Realized P&L"
          value={formatINR(totalPnl)}
          sub="All closed trades"
          icon={Activity}
          positive={totalPnl >= 0}
        />
        <StatCard
          label="Strategies"
          value={strategies.length}
          sub="Total saved"
          icon={Code2}
        />
        <StatCard
          label="Portfolio Value"
          value={formatINR(totalHoldingsValue)}
          sub={`${holdings.length} holdings`}
          icon={BarChart3}
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Equity Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Equity Curve</h3>
              {latestBacktest && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {latestBacktest.strategyId?.name || 'Latest backtest'} · {latestBacktest.symbol}
                </p>
              )}
            </div>
            {latestBacktest && (
              <span className={`badge ${latestBacktest.results.totalProfit >= 0 ? 'badge-green' : 'badge-red'}`}>
                {latestBacktest.results.totalReturn?.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-52">
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FlaskConical size={32} className="text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm">No backtest results yet</p>
                <Link to="/backtest" className="text-brand-orange text-xs mt-2 hover:underline">
                  Run your first backtest →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-surface transition-all group border border-transparent hover:border-brand-border"
              >
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-gray-600 text-xs">{desc}</div>
                </div>
                <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Strategies */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Strategies</h3>
            <Link to="/strategy-builder" className="text-brand-orange text-xs hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="shimmer h-12 rounded-lg" />)}
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-8">
              <Code2 size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No strategies yet</p>
              <Link to="/ai-chat" className="text-brand-orange text-xs mt-1 hover:underline block">
                Generate one with AI →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {strategies.slice(0, 4).map(s => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-brand-surface hover:bg-brand-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Code2 size={12} className="text-brand-orange" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.name}</p>
                      <p className="text-gray-600 text-xs">{s.timeframe} · {s.assetClass}</p>
                    </div>
                  </div>
                  <span className="badge badge-orange text-xs flex-shrink-0">{s.indicators?.[0] || 'Custom'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Backtests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Backtests</h3>
            <Link to="/backtest" className="text-brand-orange text-xs hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="shimmer h-12 rounded-lg" />)}
            </div>
          ) : backtests.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No backtests run yet</p>
              <Link to="/backtest" className="text-brand-orange text-xs mt-1 hover:underline block">
                Test a strategy →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {backtests.slice(0, 4).map(b => (
                <div key={b._id} className="flex items-center justify-between p-3 rounded-lg bg-brand-surface hover:bg-brand-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      b.status === 'completed' ? 'bg-green-500/10' : b.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                    }`}>
                      {b.status === 'completed'
                        ? <TrendingUp size={12} className="text-green-400" />
                        : b.status === 'failed'
                        ? <TrendingDown size={12} className="text-red-400" />
                        : <Clock size={12} className="text-yellow-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{b.symbol}</p>
                      <p className="text-gray-600 text-xs">{b.strategyId?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  {b.results && (
                    <span className={`text-sm font-mono font-medium flex-shrink-0 ${b.results.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {b.results.totalProfit >= 0 ? '+' : ''}{b.results.totalReturn?.toFixed(1)}%
                    </span>
                  )}
                  {b.status !== 'completed' && (
                    <span className={`badge text-xs ${b.status === 'failed' ? 'badge-red' : 'badge-orange'}`}>
                      {b.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
