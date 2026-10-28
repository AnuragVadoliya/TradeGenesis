import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Bot, FlaskConical, Shield, ArrowRight,
  ChevronRight, Zap, BarChart3, Code2, Check, Sparkles, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: Bot,
    title: 'AI Strategy Generator',
    desc: 'Describe your trading idea in plain English. Our AI converts it into production-ready Python code instantly.',
    color: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/20',
    target: 'strategies',
  },
  {
    icon: FlaskConical,
    title: 'Backtest Engine',
    desc: 'Test strategies on years of NSE/BSE historical data. Get detailed P&L, win rate, and equity curve analysis.',
    color: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/20',
    target: 'backtest',
  },
  {
    icon: TrendingUp,
    title: 'Paper Trading',
    desc: 'Execute your strategies with ₹10L virtual capital. Track portfolio, P&L, and trade history in real-time.',
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/20',
    target: 'backtest',
  },
  {
    icon: Code2,
    title: 'Strategy Builder',
    desc: 'Save, edit, and manage your strategy library. Each strategy stores code, explanation, and backtest results.',
    color: 'from-purple-500/20 to-violet-500/10',
    border: 'border-purple-500/20',
    target: 'strategies',
  },
];

const stats = [
  { value: '50+', label: 'Technical Indicators' },
  { value: '₹10L', label: 'Virtual Capital' },
  { value: '5Y+', label: 'Historical Data' },
  { value: '100%', label: 'AI-Powered' },
];

const sampleStrategies = [
  {
    name: 'RSI Mean Reversion',
    symbol: 'RELIANCE.NS',
    type: 'Momentum / Counter-Trend',
    winRate: '71.4%',
    roi: '+28.5%',
    drawdown: '5.2%',
    desc: 'Identifies oversold conditions when 14-period RSI drops below 30 and sells when RSI exceeds 70.',
    tags: ['RSI', 'NIFTY 50', 'Daily'],
  },
  {
    name: 'EMA Golden Cross (50/200)',
    symbol: 'TCS.NS',
    type: 'Trend Following',
    winRate: '65.2%',
    roi: '+42.1%',
    drawdown: '7.8%',
    desc: 'Captures sustained market trends by entering long positions when 50 EMA crosses above 200 EMA.',
    tags: ['EMA', 'IT Sector', 'Swing'],
  },
  {
    name: 'Bollinger Band Squeeze',
    symbol: 'HDFCBANK.NS',
    type: 'Volatility Breakout',
    winRate: '68.8%',
    roi: '+34.6%',
    drawdown: '6.4%',
    desc: 'Monitors low volatility compression zones and buys on aggressive volume breakouts above upper bands.',
    tags: ['Bollinger', 'Banking', 'Intraday/Swing'],
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'Forever free',
    desc: 'Perfect for beginners exploring algorithmic trading and backtesting.',
    features: [
      '₹10,00,000 Virtual Paper Capital',
      '5 AI Strategy Generations / Day',
      '1 Year Historical Data Backtesting',
      'NSE & BSE Standard Indicators',
      'Real-time P&L & Trade Journal',
    ],
    highlight: false,
    cta: 'Start Trading Free',
  },
  {
    name: 'Pro Trader',
    price: '₹999',
    period: 'per month',
    desc: 'For active traders wanting unrestricted AI generation & multi-year historical depth.',
    features: [
      'Everything in Starter',
      'Unlimited AI Strategy Generations',
      '5+ Years Historical Data Backtests',
      'Custom Python Sandbox & AST Validation',
      'Sharpe, Sortino & Max Drawdown Analysis',
      'Priority Execution & Cloud Storage',
    ],
    highlight: true,
    cta: 'Start Pro Trial',
  },
  {
    name: 'Quant Elite',
    price: '₹2,499',
    period: 'per month',
    desc: 'Advanced tools and future broker integration for serious quantitative investors.',
    features: [
      'Everything in Pro Trader',
      'Multi-asset Portfolio Optimization',
      'Dedicated Strategy Backtest Worker',
      'Live Webhook & Broker API Connectors (Coming Soon)',
      '1-on-1 Algorithmic Trading Support',
    ],
    highlight: false,
    cta: 'Get Quant Elite',
  },
];

// Animated chart line (SVG)
const AnimatedChart = () => (
  <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* Grid lines */}
    {[60, 120, 180, 240].map(y => (
      <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#2A2A2A" strokeWidth="1" />
    ))}

    {/* Area fill */}
    <path
      d="M0,240 L0,200 C50,190 80,170 120,150 C160,130 180,110 220,90 C260,70 280,100 320,80 C360,60 380,40 420,50 C460,60 480,30 520,20 C560,10 580,40 620,30 C660,20 700,50 740,40 C760,35 780,30 800,25 L800,240 Z"
      fill="url(#chartGrad)"
    />

    {/* Main line */}
    <path
      d="M0,200 C50,190 80,170 120,150 C160,130 180,110 220,90 C260,70 280,100 320,80 C360,60 380,40 420,50 C460,60 480,30 520,20 C560,10 580,40 620,30 C660,20 700,50 740,40 C760,35 780,30 800,25"
      fill="none"
      stroke="url(#lineGrad)"
      strokeWidth="2.5"
      filter="url(#glow)"
    />

    {/* Data points */}
    {[[120,150],[220,90],[320,80],[420,50],[520,20],[620,30],[740,40]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="4" fill="#F97316" filter="url(#glow)" />
    ))}

    {/* Bar chart on right */}
    {[
      [650,160,40],[680,100,40],[710,130,40],[740,70,40],[770,90,40]
    ].map(([x,y,w],i) => (
      <rect key={i} x={x} y={y} width="18" height={240-y}
        fill={`rgba(249,115,22,${0.3 + i*0.1})`}
        rx="2"
      />
    ))}
  </svg>
);

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${sectionId}`);
    }
  };

  const navLinks = [
    { name: 'Features', id: 'features' },
    { name: 'Strategies', id: 'strategies' },
    { name: 'Backtest', id: 'backtest' },
    { name: 'Pricing', id: 'pricing' },
  ];

  return (
    <div className="min-h-screen bg-brand-dark font-body overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-700/5 rounded-full blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 border-b border-brand-border/80 bg-brand-dark/95 backdrop-blur-md shadow-lg shadow-black/20">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.pushState(null, '', ' ');
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center animate-glow">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl tracking-tight">
            Trade<span className="text-brand-orange">Genesis</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          {navLinks.map(({ name, id }) => (
            <a
              key={name}
              href={`#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className="hover:text-brand-orange hover:scale-105 transition-all duration-150 cursor-pointer"
            >
              {name}
            </a>
          ))}
        </div>

        {/* Auth CTA buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm flex items-center gap-1.5">
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm flex items-center gap-1.5">
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-brand-surface"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[65px] left-0 right-0 z-40 bg-brand-surface/95 border-b border-brand-border backdrop-blur-lg px-6 py-5 flex flex-col gap-4 animate-slide-up shadow-xl">
          {navLinks.map(({ name, id }) => (
            <a
              key={name}
              href={`#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className="text-gray-300 hover:text-brand-orange text-base font-medium py-1"
            >
              {name}
            </a>
          ))}
          <div className="pt-3 border-t border-brand-border flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm w-full text-center">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm flex-1 text-center">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 px-8 pt-32 pb-16 text-center max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8 animate-slide-up">
          <Zap size={13} className="fill-current" />
          AI-Powered Trading Platform for NSE & BSE
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-[1.05] mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Digital<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 glow-text">
            Trading Agency
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Create algorithmic trading strategies using plain English. Our AI converts your ideas
          into Python, backtests them on real NSE/BSE data, and executes paper trades.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link to={user ? "/dashboard" : "/register"} className="btn-primary text-base px-8 py-3.5">
            Start Trading Free
            <ArrowRight size={16} className="inline ml-2" />
          </Link>
          <a
            href="#backtest"
            onClick={(e) => scrollToSection(e, 'backtest')}
            className="btn-secondary text-base px-8 py-3.5 cursor-pointer"
          >
            View Demo
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-14 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display font-bold text-2xl text-brand-orange">{value}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Backtest & Simulation Hero Visual (Section #backtest) */}
      <section id="backtest" className="relative z-10 px-8 pb-20 max-w-6xl mx-auto scroll-mt-24">
        <div className="text-center mb-8">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-2">Live Strategy Simulation</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white">Backtest Engine Preview</h2>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-brand-border bg-brand-surface glow-orange">
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-brand-border bg-brand-card">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-gray-500 text-xs font-mono">tradegenesis.app/backtest</span>
            </div>
          </div>

          {/* Chart area */}
          <div className="relative h-72 p-6">
            <div className="absolute inset-0 flex items-end pb-6 px-6">
              <AnimatedChart />
            </div>
            {/* Overlay labels */}
            <div className="relative z-10 flex justify-between text-xs text-gray-500 font-mono">
              <span className="text-white font-semibold">RELIANCE.NS (1Y Backtest)</span>
              <span className="text-green-400 font-medium">+18.4% Net Return ↑</span>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-border">
            {[
              { label: 'Total Profit', value: '₹1,84,320', color: 'text-green-400' },
              { label: 'Win Rate', value: '68.5%', color: 'text-blue-400' },
              { label: 'Total Trades', value: '142', color: 'text-white' },
              { label: 'Max Drawdown', value: '8.2%', color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-brand-card px-5 py-4">
                <div className="text-gray-500 text-xs mb-1">{label}</div>
                <div className={`font-display font-bold text-lg ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Section #features) */}
      <section id="features" className="relative z-10 px-8 py-20 max-w-6xl mx-auto scroll-mt-24">
        <div className="text-center mb-14">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">Everything You Need</p>
          <h2 className="font-display font-bold text-4xl text-white">
            Smart Trading,<br />
            <span className="text-gray-400">Simplified</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc, color, border, target }) => (
            <div
              key={title}
              className={`card p-6 border ${border} bg-gradient-to-br ${color} hover:scale-[1.02] transition-all duration-300 group`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} border ${border} flex items-center justify-center mb-4`}>
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              <a
                href={`#${target}`}
                onClick={(e) => scrollToSection(e, target)}
                className="inline-flex items-center gap-1 text-gray-500 group-hover:text-brand-orange text-xs mt-4 transition-colors cursor-pointer"
              >
                Learn more <ChevronRight size={12} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Strategies Showcase (Section #strategies) */}
      <section id="strategies" className="relative z-10 px-8 py-20 max-w-6xl mx-auto scroll-mt-24">
        <div className="text-center mb-14">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">Algorithmic Strategies</p>
          <h2 className="font-display font-bold text-4xl text-white">
            Ready-to-Use &amp; AI-Crafted<br />
            <span className="text-gray-400">Quantitative Models</span>
          </h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mt-4">
            Test pre-configured rule sets or prompt our AI to synthesize your custom mathematical triggers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {sampleStrategies.map((strat) => (
            <div
              key={strat.name}
              className="card p-6 border-brand-border bg-brand-surface/70 hover:border-brand-orange/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-orange font-mono text-xs">{strat.symbol}</span>
                  <span className="text-xs text-gray-400">{strat.type}</span>
                </div>

                <h3 className="font-display font-semibold text-white text-lg mb-2">{strat.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-5">{strat.desc}</p>

                <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-brand-card rounded-lg border border-brand-border mb-4 text-center">
                  <div>
                    <div className="text-[11px] text-gray-500">Win Rate</div>
                    <div className="font-display font-bold text-sm text-green-400">{strat.winRate}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Sim. ROI</div>
                    <div className="font-display font-bold text-sm text-brand-orange">{strat.roi}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Drawdown</div>
                    <div className="font-display font-bold text-sm text-gray-300">{strat.drawdown}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {strat.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-brand-border text-gray-400 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to={user ? "/strategy-builder" : "/register"}
                className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 group-hover:bg-brand-orange transition-colors"
              >
                Build or Backtest <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section (Section #pricing) */}
      <section id="pricing" className="relative z-10 px-8 py-20 max-w-6xl mx-auto scroll-mt-24">
        <div className="text-center mb-14">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">Simple &amp; Transparent</p>
          <h2 className="font-display font-bold text-4xl text-white">
            Choose Your Plan
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mt-3">
            Start completely free with virtual money, then upgrade whenever you're ready for advanced quantitative firepower.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 flex flex-col justify-between relative transition-all duration-300 ${
                plan.highlight
                  ? 'border-brand-orange bg-gradient-to-b from-orange-500/10 via-brand-surface to-brand-card shadow-lg shadow-orange-500/10 scale-105 z-10'
                  : 'border-brand-border bg-brand-surface/60 hover:border-gray-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                  <Sparkles size={12} /> Most Popular
                </div>
              )}

              <div>
                <h3 className="font-display font-bold text-xl text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-xs mb-6 min-h-[32px]">{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display font-extrabold text-4xl text-white">{plan.price}</span>
                  <span className="text-gray-500 text-xs">{plan.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <Check size={14} className="text-brand-orange mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={user ? "/dashboard" : "/register"}
                className={`w-full py-3 text-sm font-semibold rounded-lg text-center transition-all ${
                  plan.highlight
                    ? 'btn-primary'
                    : 'btn-secondary hover:border-brand-orange hover:text-brand-orange'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12 border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent glow-orange">
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Ready to generate<br />your first strategy?
            </h2>
            <p className="text-gray-400 mb-8">Join traders using AI to build smarter algorithms</p>
            <Link to={user ? "/dashboard" : "/register"} className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
              Create Free Account
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-brand-border px-8 py-10 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp size={16} className="text-brand-orange" />
          <span className="font-display font-semibold text-gray-300 text-base">TradeGenesis</span>
        </div>
        <div className="flex justify-center gap-6 text-xs text-gray-500 mb-4">
          {navLinks.map(({ name, id }) => (
            <a
              key={name}
              href={`#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className="hover:text-gray-300 transition-colors cursor-pointer"
            >
              {name}
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-600">© 2024 TradeGenesis. For educational purposes only. Not financial advice.</p>
      </footer>
    </div>
  );
}
