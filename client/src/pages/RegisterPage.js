import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../components/shared/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { fetchCharities } from '../services/charityService';

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

  useEffect(() => {
    fetchCharities()
      .then((result) => setCharities(result.charities))
      .catch(() => {
        setCharities([]);
        toast.error('Unable to load charities right now');
      })
      .finally(() => setLoadingCharities(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gold-500/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        <Link to="/" className="mb-8 flex justify-center">
          <BrandLogo showTagline={false} />
        </Link>

        <div className="card animate-slide-up">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-charcoal-400 text-sm mb-6">Choose your charity from day one and start playing for good.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="card border border-charcoal-800/70 bg-charcoal-900/40 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="section-title">Charity selection</h2>
                  <p className="text-charcoal-400 text-sm mt-1">Users select a charity at signup and contribute at least 10%.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-forest-400">{form.charity_percentage}%</div>
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
                  className="w-full accent-forest-500"
                />
              </div>

              {loadingCharities ? (
                <div className="text-sm text-charcoal-500">Loading charities...</div>
              ) : charities.length === 0 ? (
                <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-sm text-red-300">
                  Charity list could not be loaded. Refresh the page after the backend is running.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charities.map((charity) => {
                    const isSelected = form.charity_id === charity._id;
                    return (
                      <button
                        key={charity._id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, charity_id: charity._id }))}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-forest-600 bg-forest-900/20'
                            : 'border-charcoal-800 bg-charcoal-900/40 hover:border-charcoal-700'
                        }`}
                      >
                        <div className="font-semibold text-white">{charity.name}</div>
                        <div className="text-xs text-charcoal-500 mt-1">{charity.category || 'General'}</div>
                        <div className="text-sm text-charcoal-400 mt-2 line-clamp-2">{charity.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" className="btn-gold w-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-charcoal-800">
            <p className="text-charcoal-500 text-sm text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-forest-400 hover:text-forest-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
