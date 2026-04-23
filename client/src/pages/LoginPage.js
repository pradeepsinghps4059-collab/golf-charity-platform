import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../components/shared/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-forest-600/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="auth-shell grid overflow-hidden md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden border-r border-white/[0.08] p-10 md:flex md:flex-col md:justify-between">
            <div className="auth-spotlight" />
            <div className="auth-spotlight gold" />
            <Link to="/" className="relative z-10">
              <BrandLogo showTagline />
            </Link>
            <div className="relative z-10">
              <div className="section-kicker mb-5">Member access</div>
              <div className="hero-badge-grid mb-6">
                <div className="spotlight-chip">Premium portal</div>
                <div className="spotlight-chip">Faster status view</div>
                <div className="spotlight-chip">Clear next actions</div>
              </div>
              <h1 className="max-w-sm font-display text-5xl font-bold leading-tight text-white">
                Welcome back to your player portal.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-charcoal-300">
                Review your charity contribution, track your scores, and stay current with draw results in one calmer workspace.
              </p>
              <div className="mt-8 grid gap-3">
                <div className="info-strip">
                  <div className="text-sm font-semibold text-white">Clear account status</div>
                  <div className="mt-1 text-sm text-charcoal-400">Subscription, charity, and participation details stay easy to scan.</div>
                </div>
                <div className="info-strip">
                  <div className="text-sm font-semibold text-white">Better focus</div>
                  <div className="mt-1 text-sm text-charcoal-400">The updated interface reduces noise around the actions members use most.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative p-6 md:p-10">
            <Link to="/" className="mb-8 flex justify-center md:hidden">
              <BrandLogo showTagline={false} />
            </Link>

            <div className="mx-auto w-full max-w-md animate-slide-up">
              <div className="section-kicker mb-4 md:hidden">Member access</div>
              <h2 className="font-display text-3xl font-bold text-white mb-1">Welcome back</h2>
              <p className="mb-8 text-sm text-charcoal-400">Sign in to your account</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="metric-panel-highlight mt-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Demo access</div>
                <p className="mt-2 break-all font-mono text-xs text-charcoal-400">admin@golfcharity.com / Admin@1234</p>
              </div>

              <div className="mt-6 border-t border-white/[0.08] pt-6">
                <p className="text-center text-sm text-charcoal-500">
                  Do not have an account?{' '}
                  <Link to="/register" className="font-medium text-forest-400 hover:text-forest-300">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
