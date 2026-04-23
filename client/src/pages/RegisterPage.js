import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../components/shared/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { fetchCharities } from '../services/charityService';
import { getCharityVisual } from '../utils/charityPresentation';

const leftPanelStats = [
  { value: '10%', label: 'minimum contribution held for your selected cause' },
  { value: '5', label: 'latest score entries kept ready for draw qualification' },
  { value: '1', label: 'dashboard to track support, scores, and results together' },
];

const memberJourney = [
  {
    step: '01',
    title: 'Pick your cause',
    text: 'Start with a charity that reflects the kind of impact you want your membership to support.',
  },
  {
    step: '02',
    title: 'Play and log scores',
    text: 'Keep your activity current so the platform can reflect your progress and draw readiness clearly.',
  },
  {
    step: '03',
    title: 'Track visible impact',
    text: 'See contributions, charity alignment, and reward activity in one calmer member flow.',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    charity_id: '',
    charity_percentage: 10,
  });
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [charityLoadError, setCharityLoadError] = useState('');

  const loadCharities = () => {
    setLoadingCharities(true);
    setCharityLoadError('');

    fetchCharities()
      .then((result) => {
        const nextCharities = result.charities || [];
        setCharities(nextCharities);
        setForm((prev) => ({
          ...prev,
          charity_id: prev.charity_id || nextCharities[0]?._id || '',
        }));
      })
      .catch(() => {
        setCharities([]);
        setCharityLoadError('Charity list could not be loaded. Please make sure the backend is running, then try again.');
      })
      .finally(() => setLoadingCharities(false));
  };

  useEffect(() => {
    loadCharities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loadingCharities) {
      return toast.error('Charities are still loading. Please wait a moment.');
    }

    if (charityLoadError || charities.length === 0) {
      return toast.error('Charity list is unavailable right now. Please retry after the backend is running.');
    }

    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }

    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    if (!form.charity_id) {
      return toast.error('Please select a charity at signup');
    }

    if (Number(form.charity_percentage) < 10 || Number(form.charity_percentage) > 100) {
      return toast.error('Charity percentage must be between 10 and 100');
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        charity_id: form.charity_id,
        charity_percentage: Number(form.charity_percentage),
      });
      toast.success('Account created successfully');
      navigate('/subscription');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/4 right-1/3 h-72 w-72 rounded-full bg-gold-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl">
        <div className="auth-shell grid overflow-hidden lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative hidden border-r border-white/[0.08] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="auth-spotlight" />
            <div className="auth-spotlight gold" />
            <Link to="/" className="relative z-10">
              <BrandLogo showTagline />
            </Link>
            <div className="relative z-10">
              <div className="section-kicker mb-5">New members</div>
              <h1 className="max-w-sm font-display text-5xl font-bold leading-tight text-white">
                Join with your charity already chosen.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-charcoal-300">
                Registration now feels more guided, with clearer contribution choices and a calmer entry flow for new subscribers.
              </p>
              <div className="mt-8 space-y-3">
                <div className="info-strip">
                  <div className="text-sm font-semibold text-white">Choose a cause at signup</div>
                  <div className="mt-1 text-sm text-charcoal-400">Your selected charity stays tied to your account from the first session.</div>
                </div>
                <div className="info-strip">
                  <div className="text-sm font-semibold text-white">Set contribution clearly</div>
                  <div className="mt-1 text-sm text-charcoal-400">The contribution percentage is visible while you complete the form.</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-10 space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {leftPanelStats.map((item) => (
                  <div key={item.label} className="metric-panel-highlight min-h-[132px]">
                    <div className="relative">
                      <div className="font-display text-4xl text-white">{item.value}</div>
                      <div className="mt-3 text-sm leading-relaxed text-charcoal-300">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel-strong p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Member journey</div>
                    <div className="mt-2 font-display text-2xl text-white">What happens after signup</div>
                  </div>
                  <div className="eyebrow-number">Go</div>
                </div>

                <div className="space-y-3">
                  {memberJourney.map((item) => (
                    <div key={item.step} className="feature-tile-spotlight">
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-sm font-bold text-white">
                          {item.step}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-sm leading-relaxed text-charcoal-300">{item.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <Link to="/" className="mb-8 flex justify-center lg:hidden">
              <BrandLogo showTagline={false} />
            </Link>

            <div className="animate-slide-up">
              <div className="section-kicker mb-4 lg:hidden">New members</div>
              <h2 className="mb-1 font-display text-3xl font-bold text-white">Create your account</h2>
              <p className="mb-6 text-sm text-charcoal-400">Choose your charity from day one and start playing for good.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Full name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirm password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Repeat password"
                      value={form.confirm}
                      onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="card border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="section-title">Charity selection</h2>
                      <p className="mt-1 text-sm text-charcoal-400">Users select a charity at signup and contribute at least 10%.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-display font-bold text-gold-300">{form.charity_percentage}%</div>
                      <div className="text-xs text-charcoal-500">contribution</div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="label">Charity contribution percentage</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={form.charity_percentage}
                      onChange={(e) => setForm((prev) => ({ ...prev, charity_percentage: Number(e.target.value) }))}
                      className="w-full accent-gold-400"
                    />
                  </div>

                  {loadingCharities ? (
                    <div className="text-sm text-charcoal-500">Loading charities...</div>
                  ) : charities.length === 0 ? (
                    <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-sm text-red-300">
                      <div>{charityLoadError || 'Charity list could not be loaded right now.'}</div>
                      <button
                        type="button"
                        onClick={loadCharities}
                        className="btn-outline mt-4 px-4 py-2 text-sm"
                      >
                        Retry Loading Charities
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {charities.map((charity) => {
                        const isSelected = form.charity_id === charity._id;
                        const { imageSrc, imageAlt } = getCharityVisual(charity);
                        return (
                          <button
                            key={charity._id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, charity_id: charity._id }))}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-gold-500/35 bg-gold-500/10 shadow-[0_18px_45px_rgba(143,112,33,0.16)]'
                                : 'border-white/[0.08] bg-charcoal-900/45 hover:border-white/[0.14] hover:bg-charcoal-900/65'
                            }`}
                          >
                            <div className="mb-4 overflow-hidden rounded-[20px] border border-white/[0.08] bg-charcoal-950/30">
                              <img
                                src={imageSrc}
                                alt={imageAlt}
                                loading="lazy"
                                decoding="async"
                                className="h-36 w-full object-cover"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="font-semibold leading-snug text-white">{charity.name}</div>
                              <div className="text-xs uppercase tracking-[0.18em] text-charcoal-500">{charity.category || 'General'}</div>
                              <div className="pt-1 text-sm leading-7 text-charcoal-400 line-clamp-3">{charity.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-gold mt-2 w-full"
                  disabled={loading || loadingCharities || charities.length === 0}
                >
                  {loading
                    ? 'Creating account...'
                    : loadingCharities
                      ? 'Loading charities...'
                      : charities.length === 0
                        ? 'Charity list unavailable'
                        : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 border-t border-white/[0.08] pt-6">
                <p className="text-center text-sm text-charcoal-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-forest-400 hover:text-forest-300">
                    Sign in
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
