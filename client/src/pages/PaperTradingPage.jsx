import React, { useState, useEffect } from 'react';
import { paperAPI, strategyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, Wallet, BarChart3,
  Plus, Minus, RefreshCw, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';

const NSE_SYMBOLS = [
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','HCLTECH',
  'BAJFINANCE','ADANIENT','TATAMOTORS','SBIN','AXISBANK','KOTAKBANK',
  'LT','ASIANPAINT','MARUTI','SUNPHARMA','TITAN','NESTLEIND','ITC'
];

const formatINR = (n) => {
  if (n === undefined || n === null) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000) return `${sign}₹${(abs/100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs/1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(2)}`;
};

const TradeForm = ({ type, strategies, onTrade, loading }) => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [quantity, setQuantity] = useState(1);
  const [strategyId, setStrategyId] = useState('');

  const isBuy = type === 'BUY';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || quantity < 1) return toast.error('Enter valid symbol and quantity');
    await onTrade({ symbol, quantity: Number(quantity), strategyId: strategyId || undefined });
    setQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-gray-400 text-xs mb-1.5 block">NSE Symbol</label>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          placeholder="RELIANCE"
          list="pt-symbols"
          className="input-field font-mono uppercase"
          required
        />
        <datalist id="pt-symbols">
          {NSE_SYMBOLS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1.5 block">Quantity</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setQuantity(q => Math.max(1, q-1))}
            className="w-9 h-9 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Minus size={14} />
          </button>
          <input
            type="number" value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1} className="input-field text-center font-mono flex-1" required
          />
          <button type="button" onClick={() => setQuantity(q => q+1)}
            className="w-9 h-9 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1.5 block">Strategy (optional)</label>
        <select value={strategyId} onChange={e => setStrategyId(e.target.value)} className="input-field">
          <option value="">Manual trade</option>
          {strategies.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-lg font-display font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
          isBuy
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {isBuy ? 'Buy' : 'Sell'} {symbol}
          </>
        )}
      </button>
    </form>
  );
};

export default function PaperTradingPage() {
  const { user, updateBalance } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [tradeType, setTradeType] = useState('BUY');

  useEffect(() => {
    fetchData();
    strategyAPI.getAll().then(r => setStrategies(r.data.strategies || []));
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const res = await paperAPI.getPortfolio();
      setPortfolio(res.data);
      if (res.data.virtualBalance !== user?.virtualBalance) {
        updateBalance(res.data.virtualBalance);
      }
    } catch { toast.error('Failed to fetch portfolio'); }
    finally { setFetching(false); }
  };

  const handleTrade = async (data) => {
    setLoading(true);
    try {
      if (tradeType === 'BUY') {
        const res = await paperAPI.buy(data);
        toast.success(res.data.message);
        updateBalance(res.data.newBalance);
      } else {
        const res = await paperAPI.sell(data);
        const pnl = res.data.pnl;
        toast.success(`${res.data.message}`, { duration: 4000 });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const holdings = portfolio?.portfolio?.holdings || [];
  const recentTrades = portfolio?.recentTrades || [];
  const totalHoldingsValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
  const totalUnrealizedPnl = holdings.reduce((s, h) => s + (h.unrealizedPnl || 0), 0);
  const realizedPnl = portfolio?.portfolio?.realizedPnl || 0;
  const netWorth = (portfolio?.virtualBalance || 0) + totalHoldingsValue;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Paper Trading</h1>
          <p className="text-gray-500 text-sm mt-0.5">Simulate trades with ₹10,00,000 virtual capital</p>
        </div>
        <button onClick={fetchData} disabled={fetching} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Wallet size={11} /> Available Cash
          </div>
          <div className="font-display font-bold text-xl text-white">{formatINR(portfolio?.virtualBalance)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <BarChart3 size={11} /> Holdings Value
          </div>
          <div className="font-display font-bold text-xl text-white">{formatINR(totalHoldingsValue)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <TrendingUp size={11} /> Unrealized P&L
          </div>
          <div className={`font-display font-bold text-xl ${totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatINR(totalUnrealizedPnl)}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <TrendingDown size={11} /> Realized P&L
          </div>
          <div className={`font-display font-bold text-xl ${realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {realizedPnl >= 0 ? '+' : ''}{formatINR(realizedPnl)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trade panel */}
        <div className="card p-5 space-y-4">
          <h3 className="font-display font-semibold text-white">Execute Trade</h3>

          {/* Buy/Sell toggle */}
          <div className="flex gap-1 p-1 bg-brand-surface border border-brand-border rounded-lg">
            {['BUY', 'SELL'].map(t => (
              <button key={t} onClick={() => setTradeType(t)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  tradeType === t
                    ? t === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <TradeForm
            type={tradeType}
            strategies={strategies}
            onTrade={handleTrade}
            loading={loading}
          />

          <div className="p-3 rounded-lg bg-brand-surface border border-brand-border text-xs text-gray-500 space-y-1">
            <p>📌 Prices fetched from Yahoo Finance (NSE)</p>
            <p>📌 Max capital: ₹10,00,000</p>
            <p>📌 No brokerage fees in paper trading</p>
          </div>
        </div>

        {/* Portfolio + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-lg p-1 w-fit">
            {['portfolio', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {tab === 'portfolio' ? '📊 Holdings' : '📋 Trade History'}
              </button>
            ))}
          </div>

          {activeTab === 'portfolio' ? (
            <div className="card overflow-hidden">
              {fetching ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-lg" />)}
                </div>
              ) : holdings.length === 0 ? (
                <div className="p-16 text-center">
                  <BarChart3 size={36} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No holdings yet</p>
                  <p className="text-gray-600 text-xs mt-1">Execute a BUY trade to start building your portfolio</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-brand-border">
                      <th className="text-left p-4">Symbol</th>
                      <th className="text-right p-4">Qty</th>
                      <th className="text-right p-4">Avg Price</th>
                      <th className="text-right p-4">Current</th>
                      <th className="text-right p-4">P&L</th>
                      <th className="text-right p-4">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-brand-surface transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                              <span className="text-brand-orange text-xs font-bold">{h.symbol[0]}</span>
                            </div>
                            <span className="font-mono font-medium text-white text-sm">{h.symbol}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-gray-300">{h.quantity}</td>
                        <td className="p-4 text-right font-mono text-gray-400 text-sm">₹{h.avgBuyPrice?.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-white text-sm">₹{h.currentPrice?.toFixed(2)}</td>
                        <td className={`p-4 text-right font-mono font-medium ${h.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.unrealizedPnl >= 0 ? '+' : ''}{formatINR(h.unrealizedPnl)}
                        </td>
                        <td className={`p-4 text-right text-sm font-medium ${h.unrealizedPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.unrealizedPnlPercent >= 0 ? '+' : ''}{h.unrealizedPnlPercent?.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-brand-border">
                    <tr>
                      <td colSpan={4} className="p-4 text-gray-500 text-sm font-medium">Total Portfolio</td>
                      <td className={`p-4 text-right font-display font-bold ${totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalUnrealizedPnl >= 0 ? '+' : ''}{formatINR(totalUnrealizedPnl)}
                      </td>
                      <td className="p-4 text-right text-gray-500">
                        {formatINR(totalHoldingsValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {recentTrades.length === 0 ? (
                <div className="p-16 text-center">
                  <Clock size={36} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No trades yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-brand-border">
                      <th className="text-left p-4">Symbol</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-right p-4">Qty</th>
                      <th className="text-right p-4">Total</th>
                      <th className="text-right p-4">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {recentTrades.map((t, i) => (
                      <tr key={i} className="hover:bg-brand-surface transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-white text-sm">{t.symbol}</span>
                          </div>
                          <div className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                            <Clock size={9} /> {new Date(t.tradeDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`badge text-xs ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                            {t.type === 'BUY' ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                            {t.type}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-gray-300 text-sm">₹{t.price?.toFixed(2)}</td>
                        <td className="p-4 text-right text-gray-400">{t.quantity}</td>
                        <td className="p-4 text-right font-mono text-gray-300 text-sm">{formatINR(t.total)}</td>
                        <td className={`p-4 text-right font-mono font-medium ${
                          !t.pnl ? 'text-gray-600' : t.pnl > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {t.pnl ? (t.pnl > 0 ? '+' : '') + formatINR(t.pnl) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
