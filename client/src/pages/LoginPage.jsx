import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { TrendingUp, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const justRegistered = Boolean(location.state?.registered);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-surface border-r border-brand-border items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-4">
            Trade<span className="text-brand-orange">Genesis</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-sm">
            AI-powered algorithmic trading platform for NSE & BSE markets.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { v: '₹10L', l: 'Virtual Capital' },
              { v: 'AI', l: 'Strategy Generator' },
              { v: '5Y+', l: 'Historical Data' },
              { v: '100%', l: 'Paper Trading' },
            ].map(({ v, l }) => (
              <div key={l} className="card p-4 text-center">
                <div className="font-display font-bold text-xl text-brand-orange">{v}</div>
                <div className="text-gray-500 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <TrendingUp size={20} className="text-brand-orange" />
            <span className="font-display font-bold text-white text-xl">Trade<span className="text-brand-orange">Genesis</span></span>
          </div>

          <h2 className="font-display font-bold text-3xl text-white mb-1">
            {justRegistered ? 'Account Created!' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {justRegistered ? 'Please sign in to access your dashboard' : 'Sign in to your trading account'}
          </p>

          {justRegistered && (
            <div className="mb-6 p-3.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2.5 text-green-400 text-xs animate-slide-up">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Registration successful! Please enter your password to sign in.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-orange hover:underline font-medium">
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-lg bg-brand-surface border border-brand-border text-center">
            <p className="text-gray-600 text-xs">Demo: <span className="text-gray-400 font-mono">demo@tradegenesis.app</span> / <span className="text-gray-400 font-mono">demo123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
