import React, { useState, useEffect } from 'react';
import { backtestAPI, strategyAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FlaskConical, TrendingUp, TrendingDown, BarChart3,
  AlertCircle, CheckCircle, Clock, Play, ChevronDown,
  ShieldAlert, Code2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const NSE_SYMBOLS = [
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','HCLTECH',
  'BAJFINANCE','ADANIENT','TATAMOTORS','SBIN','AXISBANK','KOTAKBANK',
  'LT','ASIANPAINT','MARUTI','SUNPHARMA','TITAN','NESTLEIND','ITC'
];

const formatINR = (n) => {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000) return `${sign}₹${(abs/100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs/1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

const MetricCard = ({ label, value, sub, positive, icon: Icon }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-1">
      <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
      {Icon && <Icon size={13} className="text-gray-600" />}
    </div>
    <div className={`font-display font-bold text-xl ${
      positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'
    }`}>{value}</div>
    {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
  </div>
);

const ResultsSection = ({ results, symbol }) => {
  const isProfit = results.totalProfit >= 0;

  const chartData = {
    labels: results.equityCurve?.map(p => p.date.slice(5)) || [],
    datasets: [{
      label: 'Equity',
      data: results.equityCurve?.map(p => p.equity) || [],
      borderColor: isProfit ? '#22C55E' : '#EF4444',
      backgroundColor: isProfit ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: 1,
      callbacks: { label: ctx => formatINR(ctx.parsed.y) }
    }},
    scales: {
      x: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, maxTicksLimit: 8 } },
      y: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, callback: v => formatINR(v) } },
    },
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Summary banner */}
      <div className={`card p-5 border flex flex-wrap items-center gap-4 ${
        isProfit ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isProfit ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {isProfit ? <TrendingUp size={22} className="text-green-400" /> : <TrendingDown size={22} className="text-red-400" />}
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total Return on {symbol}</p>
          <div className={`font-display font-bold text-3xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{results.totalReturn?.toFixed(2)}%
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-gray-500 text-xs">Net P&L</p>
          <p className={`font-display font-bold text-xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{formatINR(results.totalProfit)}
          </p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Win Rate" value={`${results.winRate?.toFixed(1)}%`} positive={results.winRate > 50} icon={BarChart3} />
        <MetricCard label="Total Trades" value={results.totalTrades} sub={`${results.winningTrades}W · ${results.losingTrades}L`} />
        <MetricCard label="Max Drawdown" value={`${results.maxDrawdown?.toFixed(2)}%`} positive={results.maxDrawdown < 10} icon={TrendingDown} />
        <MetricCard label="Sharpe Ratio" value={results.sharpeRatio?.toFixed(2)} positive={results.sharpeRatio > 1} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Initial Capital" value={formatINR(results.initialCapital)} />
        <MetricCard label="Final Capital" value={formatINR(results.finalCapital)} positive={results.finalCapital > results.initialCapital} />
        <MetricCard label="Profit Factor" value={results.winningTrades > 0 ? (results.winningTrades / Math.max(results.losingTrades, 1)).toFixed(2) : '—'} />
      </div>

      {/* Equity curve chart */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-white mb-4">Equity Curve</h3>
        <div className="h-56">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Trade list */}
      {results.trades?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-brand-border">
                  <th className="text-left pb-3 pr-4">Date</th>
                  <th className="text-left pb-3 pr-4">Type</th>
                  <th className="text-right pb-3 pr-4">Price</th>
                  <th className="text-right pb-3 pr-4">Qty</th>
                  <th className="text-right pb-3">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {results.trades.slice(-15).reverse().map((t, i) => (
                  <tr key={i} className="hover:bg-brand-surface transition-colors">
                    <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs">{t.date}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge text-xs ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-gray-300">₹{t.price?.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-400">{t.quantity}</td>
                    <td className={`py-2.5 text-right font-mono font-medium ${
                      t.pnl > 0 ? 'text-green-400' : t.pnl < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {t.pnl !== 0 ? formatINR(t.pnl) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Strategy Code Warning Banner ──────────────────────────────────────────────
const StrategyCodeWarning = ({ strategy }) => {
  const [expanded, setExpanded] = useState(false);

  if (!strategy) return null;

  const code = strategy.code || '';
  const hasRunStrategy = /def\s+run_strategy\s*\(/.test(code);
  const isEmpty = code.trim() === '';

  if (hasRunStrategy) return null; // Code looks fine, no warning needed

  return (
    <div className="card border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-yellow-400 font-medium text-sm">Strategy Code Issue Detected</p>
          <p className="text-yellow-400/70 text-xs mt-1 leading-relaxed">
            {isEmpty
              ? 'This strategy has no code. Go to Strategy Builder and add a Python function named run_strategy(df).'
              : "This strategy's code does not define a run_strategy(df) function. The backtest engine requires it. Edit this strategy before running."}
          </p>
          {!isEmpty && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-yellow-500/80 text-xs mt-2 hover:text-yellow-400 transition-colors"
            >
              <Code2 size={11} />
              {expanded ? 'Hide code' : 'View current code'}
              <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          {expanded && (
            <pre className="mt-3 bg-black/40 border border-yellow-500/20 rounded-lg p-3 text-xs font-mono text-gray-400 overflow-auto max-h-40 leading-relaxed">
              {code}
            </pre>
          )}
          <p className="text-yellow-500/60 text-xs mt-3 font-mono bg-black/30 rounded px-2 py-1 inline-block">
            Required: def run_strategy(df): ... return df
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BacktestPage() {
  const [strategies, setStrategies] = useState([]);
  const [form, setForm] = useState({
    strategyId: '', symbol: 'RELIANCE',
    startDate: '2022-01-01', endDate: new Date().toISOString().slice(0,10),
    initialCapital: 100000
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('run');

  useEffect(() => {
    strategyAPI.getAll().then(r => {
      const strats = r.data.strategies || [];
      setStrategies(strats);
      if (strats.length > 0) setForm(f => ({ ...f, strategyId: strats[0]._id }));
    });
    backtestAPI.getAll().then(r => setHistory(r.data.backtests || []));
  }, []);

  // Get currently selected strategy object
  const selectedStrategy = strategies.find(s => s._id === form.strategyId) || null;

  // Check if selected strategy has valid code before allowing run
  const strategyCodeValid = selectedStrategy
    ? /def\s+run_strategy\s*\(/.test(selectedStrategy.code || '')
    : false;

  const handleRun = async () => {
    if (!form.strategyId) return toast.error('Select a strategy');
    if (!form.symbol) return toast.error('Enter a symbol');

    // Client-side pre-check: warn if run_strategy is missing
    if (!strategyCodeValid) {
      toast.error("Strategy code must define a run_strategy(df) function. Edit it in Strategy Builder first.");
      return;
    }

    setRunning(true);
    setError('');
    setResults(null);

    try {
      const res = await backtestAPI.run(form);
      setResults(res.data.results);
      toast.success('Backtest completed!');
      backtestAPI.getAll().then(r => setHistory(r.data.backtests || []));
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || 'Backtest failed';
      setError(msg);
      toast.error('Backtest failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Backtesting Engine</h1>
        <p className="text-gray-500 text-sm mt-0.5">Test your strategies on historical NSE/BSE data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-lg p-1 w-fit">
        {['run', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {tab === 'run' ? '🧪 Run Backtest' : '📊 History'}
          </button>
        ))}
      </div>

      {activeTab === 'run' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Config panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-display font-semibold text-white">Configuration</h3>

              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Strategy *</label>
                <select value={form.strategyId} onChange={e => {
                  setForm({...form, strategyId: e.target.value});
                  setError('');
                  setResults(null);
                }} className="input-field">
                  <option value="">Select strategy...</option>
                  {strategies.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {strategies.length === 0 && (
                  <p className="text-gray-600 text-xs mt-1">No strategies. <a href="/strategy-builder" className="text-brand-orange">Create one first.</a></p>
                )}
              </div>

              {/* ✅ NEW: Show warning banner if selected strategy has bad code */}
              <StrategyCodeWarning strategy={selectedStrategy} />

              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">NSE Symbol *</label>
                <input
                  value={form.symbol}
                  onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})}
                  placeholder="RELIANCE"
                  list="symbol-list"
                  className="input-field font-mono"
                />
                <datalist id="symbol-list">
                  {NSE_SYMBOLS.map(s => <option key={s} value={s} />)}
                </datalist>
                <p className="text-gray-600 text-xs mt-1">NSE suffix (.NS) added automatically</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">End Date</label>
                  <input type="date" value={form.endDate}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    className="input-field text-xs" />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Initial Capital (₹)</label>
                <input type="number" value={form.initialCapital}
                  onChange={e => setForm({...form, initialCapital: Number(e.target.value)})}
                  min={10000} max={10000000} step={10000}
                  className="input-field font-mono" />
              </div>

              <button
                onClick={handleRun}
                disabled={running || !form.strategyId || !form.symbol || !strategyCodeValid}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running Backtest...</>
                ) : (
                  <><Play size={15} />Run Backtest</>
                )}
              </button>

              {/* Show hint when button is disabled due to bad code */}
              {selectedStrategy && !strategyCodeValid && (
                <p className="text-yellow-500/70 text-xs text-center">
                  Fix the strategy code above to enable backtesting.
                </p>
              )}

              {running && (
                <p className="text-gray-500 text-xs text-center">
                  Fetching data & executing strategy... this may take 30-60 seconds.
                </p>
              )}
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-2">
            {error && (
              <div className="card p-4 border-red-500/30 bg-red-500/5 flex gap-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Backtest Failed</p>
                  <p className="text-red-400/70 text-xs mt-1 font-mono leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {!results && !error && !running && (
              <div className="card p-16 text-center">
                <FlaskConical size={40} className="text-gray-700 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-gray-400 mb-2">Ready to backtest</h3>
                <p className="text-gray-600 text-sm">Configure and run a backtest to see results here</p>
              </div>
            )}

            {running && (
              <div className="card p-16 text-center">
                <div className="w-12 h-12 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="font-display font-semibold text-white mb-2">Running Backtest</h3>
                <p className="text-gray-500 text-sm">Fetching {form.symbol} data and executing strategy...</p>
              </div>
            )}

            {results && <ResultsSection results={results} symbol={form.symbol} />}
          </div>
        </div>
      ) : (
        /* History tab */
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card p-16 text-center">
              <FlaskConical size={40} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No backtests run yet</p>
            </div>
          ) : (
            history.map(b => (
              <div key={b._id} className="card p-4 flex flex-wrap items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  b.status === 'completed' ? 'bg-green-500/10' : b.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                }`}>
                  {b.status === 'completed' ? <CheckCircle size={16} className="text-green-400" />
                    : b.status === 'failed' ? <AlertCircle size={16} className="text-red-400" />
                    : <Clock size={16} className="text-yellow-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-white">{b.symbol}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-400 text-sm truncate">{b.strategyId?.name || 'Unknown strategy'}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
                {b.results && (
                  <div className="text-right">
                    <div className={`font-display font-bold text-lg ${b.results.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {b.results.totalProfit >= 0 ? '+' : ''}{b.results.totalReturn?.toFixed(2)}%
                    </div>
                    <div className="text-gray-500 text-xs">{b.results.winRate?.toFixed(1)}% win rate</div>
                  </div>
                )}
                {b.status !== 'completed' && (
                  <span className={`badge ${b.status === 'failed' ? 'badge-red' : 'badge-orange'}`}>{b.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}






// import React, { useState, useEffect } from 'react';
// import { backtestAPI, strategyAPI } from '../services/api';
// import toast from 'react-hot-toast';
// import {
//   FlaskConical, TrendingUp, TrendingDown, BarChart3,
//   AlertCircle, CheckCircle, Clock, Play, ChevronDown
// } from 'lucide-react';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS, CategoryScale, LinearScale, PointElement,
//   LineElement, Title, Tooltip, Filler
// } from 'chart.js';

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

// const NSE_SYMBOLS = [
//   'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','HCLTECH',
//   'BAJFINANCE','ADANIENT','TATAMOTORS','SBIN','AXISBANK','KOTAKBANK',
//   'LT','ASIANPAINT','MARUTI','SUNPHARMA','TITAN','NESTLEIND','ITC'
// ];

// const formatINR = (n) => {
//   if (!n && n !== 0) return '—';
//   const abs = Math.abs(n);
//   const sign = n < 0 ? '-' : '';
//   if (abs >= 100000) return `${sign}₹${(abs/100000).toFixed(2)}L`;
//   if (abs >= 1000) return `${sign}₹${(abs/1000).toFixed(1)}K`;
//   return `${sign}₹${abs.toFixed(0)}`;
// };

// const MetricCard = ({ label, value, sub, positive, icon: Icon }) => (
//   <div className="stat-card">
//     <div className="flex items-center justify-between mb-1">
//       <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
//       {Icon && <Icon size={13} className="text-gray-600" />}
//     </div>
//     <div className={`font-display font-bold text-xl ${
//       positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'
//     }`}>{value}</div>
//     {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
//   </div>
// );

// const ResultsSection = ({ results, symbol }) => {
//   const isProfit = results.totalProfit >= 0;

//   const chartData = {
//     labels: results.equityCurve?.map(p => p.date.slice(5)) || [],
//     datasets: [{
//       label: 'Equity',
//       data: results.equityCurve?.map(p => p.equity) || [],
//       borderColor: isProfit ? '#22C55E' : '#EF4444',
//       backgroundColor: isProfit ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
//       borderWidth: 2,
//       fill: true,
//       tension: 0.4,
//       pointRadius: 0,
//     }]
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: { legend: { display: false }, tooltip: {
//       backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: 1,
//       callbacks: { label: ctx => formatINR(ctx.parsed.y) }
//     }},
//     scales: {
//       x: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, maxTicksLimit: 8 } },
//       y: { grid: { color: '#1E1E1E' }, ticks: { color: '#4B5563', font: { size: 10 }, callback: v => formatINR(v) } },
//     },
//   };

//   return (
//     <div className="space-y-5 animate-slide-up">
//       {/* Summary banner */}
//       <div className={`card p-5 border flex flex-wrap items-center gap-4 ${
//         isProfit ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
//       }`}>
//         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
//           isProfit ? 'bg-green-500/20' : 'bg-red-500/20'
//         }`}>
//           {isProfit ? <TrendingUp size={22} className="text-green-400" /> : <TrendingDown size={22} className="text-red-400" />}
//         </div>
//         <div>
//           <p className="text-gray-400 text-sm">Total Return on {symbol}</p>
//           <div className={`font-display font-bold text-3xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
//             {isProfit ? '+' : ''}{results.totalReturn?.toFixed(2)}%
//           </div>
//         </div>
//         <div className="ml-auto text-right">
//           <p className="text-gray-500 text-xs">Net P&L</p>
//           <p className={`font-display font-bold text-xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
//             {isProfit ? '+' : ''}{formatINR(results.totalProfit)}
//           </p>
//         </div>
//       </div>

//       {/* Metrics grid */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <MetricCard label="Win Rate" value={`${results.winRate?.toFixed(1)}%`} positive={results.winRate > 50} icon={BarChart3} />
//         <MetricCard label="Total Trades" value={results.totalTrades} sub={`${results.winningTrades}W · ${results.losingTrades}L`} />
//         <MetricCard label="Max Drawdown" value={`${results.maxDrawdown?.toFixed(2)}%`} positive={results.maxDrawdown < 10} icon={TrendingDown} />
//         <MetricCard label="Sharpe Ratio" value={results.sharpeRatio?.toFixed(2)} positive={results.sharpeRatio > 1} />
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//         <MetricCard label="Initial Capital" value={formatINR(results.initialCapital)} />
//         <MetricCard label="Final Capital" value={formatINR(results.finalCapital)} positive={results.finalCapital > results.initialCapital} />
//         <MetricCard label="Profit Factor" value={results.winningTrades > 0 ? (results.winningTrades / Math.max(results.losingTrades, 1)).toFixed(2) : '—'} />
//       </div>

//       {/* Equity curve chart */}
//       <div className="card p-5">
//         <h3 className="font-display font-semibold text-white mb-4">Equity Curve</h3>
//         <div className="h-56">
//           <Line data={chartData} options={chartOptions} />
//         </div>
//       </div>

//       {/* Trade list */}
//       {results.trades?.length > 0 && (
//         <div className="card p-5">
//           <h3 className="font-display font-semibold text-white mb-4">Recent Trades</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="text-gray-500 text-xs border-b border-brand-border">
//                   <th className="text-left pb-3 pr-4">Date</th>
//                   <th className="text-left pb-3 pr-4">Type</th>
//                   <th className="text-right pb-3 pr-4">Price</th>
//                   <th className="text-right pb-3 pr-4">Qty</th>
//                   <th className="text-right pb-3">P&L</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-brand-border">
//                 {results.trades.slice(-15).reverse().map((t, i) => (
//                   <tr key={i} className="hover:bg-brand-surface transition-colors">
//                     <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs">{t.date}</td>
//                     <td className="py-2.5 pr-4">
//                       <span className={`badge text-xs ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
//                         {t.type}
//                       </span>
//                     </td>
//                     <td className="py-2.5 pr-4 text-right font-mono text-gray-300">₹{t.price?.toFixed(2)}</td>
//                     <td className="py-2.5 pr-4 text-right text-gray-400">{t.quantity}</td>
//                     <td className={`py-2.5 text-right font-mono font-medium ${
//                       t.pnl > 0 ? 'text-green-400' : t.pnl < 0 ? 'text-red-400' : 'text-gray-500'
//                     }`}>
//                       {t.pnl !== 0 ? formatINR(t.pnl) : '—'}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default function BacktestPage() {
//   const [strategies, setStrategies] = useState([]);
//   const [form, setForm] = useState({
//     strategyId: '', symbol: 'RELIANCE',
//     startDate: '2022-01-01', endDate: new Date().toISOString().slice(0,10),
//     initialCapital: 100000
//   });
//   const [running, setRunning] = useState(false);
//   const [results, setResults] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [error, setError] = useState('');
//   const [activeTab, setActiveTab] = useState('run');

//   useEffect(() => {
//     strategyAPI.getAll().then(r => {
//       const strats = r.data.strategies || [];
//       setStrategies(strats);
//       if (strats.length > 0) setForm(f => ({ ...f, strategyId: strats[0]._id }));
//     });
//     backtestAPI.getAll().then(r => setHistory(r.data.backtests || []));
//   }, []);

//   const handleRun = async () => {
//     if (!form.strategyId) return toast.error('Select a strategy');
//     if (!form.symbol) return toast.error('Enter a symbol');
//     setRunning(true);
//     setError('');
//     setResults(null);

//     try {
//       const res = await backtestAPI.run(form);
//       setResults(res.data.results);
//       toast.success('Backtest completed!');
//       backtestAPI.getAll().then(r => setHistory(r.data.backtests || []));
//     } catch (err) {
//       const msg = err.response?.data?.details || err.response?.data?.error || 'Backtest failed';
//       setError(msg);
//       toast.error('Backtest failed');
//     } finally {
//       setRunning(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto space-y-6">
//       <div>
//         <h1 className="font-display font-bold text-2xl text-white">Backtesting Engine</h1>
//         <p className="text-gray-500 text-sm mt-0.5">Test your strategies on historical NSE/BSE data</p>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-lg p-1 w-fit">
//         {['run', 'history'].map(tab => (
//           <button key={tab} onClick={() => setActiveTab(tab)}
//             className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
//               activeTab === tab ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
//             }`}>
//             {tab === 'run' ? '🧪 Run Backtest' : '📊 History'}
//           </button>
//         ))}
//       </div>

//       {activeTab === 'run' ? (
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Config panel */}
//           <div className="lg:col-span-1 space-y-4">
//             <div className="card p-5 space-y-4">
//               <h3 className="font-display font-semibold text-white">Configuration</h3>

//               <div>
//                 <label className="text-gray-400 text-xs mb-1.5 block">Strategy *</label>
//                 <select value={form.strategyId} onChange={e => setForm({...form, strategyId: e.target.value})}
//                   className="input-field">
//                   <option value="">Select strategy...</option>
//                   {strategies.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
//                 </select>
//                 {strategies.length === 0 && (
//                   <p className="text-gray-600 text-xs mt-1">No strategies. <a href="/strategy-builder" className="text-brand-orange">Create one first.</a></p>
//                 )}
//               </div>

//               <div>
//                 <label className="text-gray-400 text-xs mb-1.5 block">NSE Symbol *</label>
//                 <input
//                   value={form.symbol}
//                   onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})}
//                   placeholder="RELIANCE"
//                   list="symbol-list"
//                   className="input-field font-mono"
//                 />
//                 <datalist id="symbol-list">
//                   {NSE_SYMBOLS.map(s => <option key={s} value={s} />)}
//                 </datalist>
//                 <p className="text-gray-600 text-xs mt-1">NSE suffix (.NS) added automatically</p>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-gray-400 text-xs mb-1.5 block">Start Date</label>
//                   <input type="date" value={form.startDate}
//                     onChange={e => setForm({...form, startDate: e.target.value})}
//                     className="input-field text-xs" />
//                 </div>
//                 <div>
//                   <label className="text-gray-400 text-xs mb-1.5 block">End Date</label>
//                   <input type="date" value={form.endDate}
//                     onChange={e => setForm({...form, endDate: e.target.value})}
//                     className="input-field text-xs" />
//                 </div>
//               </div>

//               <div>
//                 <label className="text-gray-400 text-xs mb-1.5 block">Initial Capital (₹)</label>
//                 <input type="number" value={form.initialCapital}
//                   onChange={e => setForm({...form, initialCapital: Number(e.target.value)})}
//                   min={10000} max={10000000} step={10000}
//                   className="input-field font-mono" />
//               </div>

//               <button
//                 onClick={handleRun}
//                 disabled={running || !form.strategyId || !form.symbol}
//                 className="btn-primary w-full py-3 flex items-center justify-center gap-2"
//               >
//                 {running ? (
//                   <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running Backtest...</>
//                 ) : (
//                   <><Play size={15} />Run Backtest</>
//                 )}
//               </button>

//               {running && (
//                 <p className="text-gray-500 text-xs text-center">
//                   Fetching data & executing strategy... this may take 30-60 seconds.
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Results panel */}
//           <div className="lg:col-span-2">
//             {error && (
//               <div className="card p-4 border-red-500/30 bg-red-500/5 flex gap-3">
//                 <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-red-400 font-medium text-sm">Backtest Failed</p>
//                   <p className="text-red-400/70 text-xs mt-1 font-mono leading-relaxed">{error}</p>
//                 </div>
//               </div>
//             )}

//             {!results && !error && !running && (
//               <div className="card p-16 text-center">
//                 <FlaskConical size={40} className="text-gray-700 mx-auto mb-4" />
//                 <h3 className="font-display font-semibold text-gray-400 mb-2">Ready to backtest</h3>
//                 <p className="text-gray-600 text-sm">Configure and run a backtest to see results here</p>
//               </div>
//             )}

//             {running && (
//               <div className="card p-16 text-center">
//                 <div className="w-12 h-12 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                 <h3 className="font-display font-semibold text-white mb-2">Running Backtest</h3>
//                 <p className="text-gray-500 text-sm">Fetching {form.symbol} data and executing strategy...</p>
//               </div>
//             )}

//             {results && <ResultsSection results={results} symbol={form.symbol} />}
//           </div>
//         </div>
//       ) : (
//         /* History tab */
//         <div className="space-y-3">
//           {history.length === 0 ? (
//             <div className="card p-16 text-center">
//               <FlaskConical size={40} className="text-gray-700 mx-auto mb-4" />
//               <p className="text-gray-500">No backtests run yet</p>
//             </div>
//           ) : (
//             history.map(b => (
//               <div key={b._id} className="card p-4 flex flex-wrap items-center gap-4">
//                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
//                   b.status === 'completed' ? 'bg-green-500/10' : b.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'
//                 }`}>
//                   {b.status === 'completed' ? <CheckCircle size={16} className="text-green-400" />
//                     : b.status === 'failed' ? <AlertCircle size={16} className="text-red-400" />
//                     : <Clock size={16} className="text-yellow-400" />}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2">
//                     <span className="font-mono font-medium text-white">{b.symbol}</span>
//                     <span className="text-gray-600 text-xs">·</span>
//                     <span className="text-gray-400 text-sm truncate">{b.strategyId?.name || 'Unknown strategy'}</span>
//                   </div>
//                   <p className="text-gray-600 text-xs">{new Date(b.createdAt).toLocaleDateString()}</p>
//                 </div>
//                 {b.results && (
//                   <div className="text-right">
//                     <div className={`font-display font-bold text-lg ${b.results.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                       {b.results.totalProfit >= 0 ? '+' : ''}{b.results.totalReturn?.toFixed(2)}%
//                     </div>
//                     <div className="text-gray-500 text-xs">{b.results.winRate?.toFixed(1)}% win rate</div>
//                   </div>
//                 )}
//                 {b.status !== 'completed' && (
//                   <span className={`badge ${b.status === 'failed' ? 'badge-red' : 'badge-orange'}`}>{b.status}</span>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
