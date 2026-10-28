import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { TrendingUp, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const perks = [
  '₹10,00,000 virtual trading capital',
  'AI strategy generator powered by Claude',
  '5+ years of NSE/BSE historical data',
  'Real-time paper trading simulation',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created successfully! Please sign in to continue.');
      navigate('/login', { state: { email: form.email, registered: true } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-surface border-r border-brand-border items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Trade<span className="text-brand-orange">Genesis</span>
            </span>
          </div>
          <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
            Start your algo<br />trading journey
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Build and test trading strategies powered by AI.<br />
            No coding experience required.
          </p>
          <div className="space-y-4">
            {perks.map(perk => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle size={16} className="text-brand-orange flex-shrink-0" />
                <span className="text-gray-300 text-sm">{perk}</span>
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
            <span className="font-display font-bold text-white text-xl">
              Trade<span className="text-brand-orange">Genesis</span>
            </span>
          </div>

          <h2 className="font-display font-bold text-3xl text-white mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Rahul Sharma"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="rahul@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password.length >= i * 2
                        ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-brand-muted'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-orange hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-gray-600 text-xs mt-4">
            By signing up you agree to our Terms of Service.<br />
            For educational purposes only — not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
