import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../components/shared/AppLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { fetchCharities, fetchCharityById } from '../services/charityService';
import { getCharityVisual } from '../utils/charityPresentation';

export default function CharityPage() {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(user?.charity_id?._id || user?.charity_id || '');
  const [percentage, setPercentage] = useState(user?.charity_percentage || 10);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeCharity, setActiveCharity] = useState(null);
  const [donationCharityId, setDonationCharityId] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    setPercentage(user?.charity_percentage || 10);
    setSelected(user?.charity_id?._id || user?.charity_id || '');
    setDonationCharityId(user?.charity_id?._id || user?.charity_id || '');
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchCharities({ search, category })
      .then((result) => {
        setCharities(result.charities);
        setCategories(result.categories || []);
      })
      .finally(() => setLoading(false));
  }, [search, category]);

  const featuredCharities = useMemo(
    () => charities.filter((charity) => charity.featured),
    [charities]
  );
  const donationTarget = activeCharity
    || charities.find((charity) => charity._id === donationCharityId)
    || charities.find((charity) => charity._id === selected)
    || null;

  const handleSave = async () => {
    if (!selected) return toast.error('Please select a charity');
    if (percentage < 10 || percentage > 100) {
      return toast.error('Percentage must be between 10 and 100');
    }

    setSaving(true);
    try {
      await api.post('/charities/select', { charity_id: selected, charity_percentage: percentage });
      await refreshUser();
      setDonationCharityId(selected);
      if (!activeCharity) {
        const matchedCharity = charities.find((charity) => charity._id === selected);
        if (matchedCharity) {
          setActiveCharity(matchedCharity);
        }
      }
      toast.success('Charity preference saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openCharityDetails = async (charityId) => {
    try {
      const charity = await fetchCharityById(charityId);
      setActiveCharity(charity);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load charity profile');
    }
  };

  const handleDonate = async () => {
    if (!donationTarget?._id) return;
    if (!donationAmount || Number(donationAmount) <= 0) {
      return toast.error('Enter a donation amount greater than 0');
    }

    setDonating(true);
    try {
      await api.post('/charities/donate', {
        charity_id: donationTarget._id,
        amount: Number(donationAmount),
      });
      setDonationAmount('');
      toast.success('Donation recorded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record donation');
    } finally {
      setDonating(false);
    }
  };

  const currentCharityId = user?.charity_id?._id || user?.charity_id;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
        <div className="glass-panel mesh-border p-8 md:p-10">
          <h1 className="page-title">Charity Directory</h1>
          <p className="text-charcoal-400 mt-2 max-w-3xl">
            Search, filter, support a featured charity, and adjust how much of your subscription contributes.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="feature-tile">
              <div className="text-xs uppercase tracking-[0.2em] text-charcoal-500">Selection</div>
              <div className="mt-2 text-sm text-charcoal-300">Pick the cause you want your subscription to support.</div>
            </div>
            <div className="feature-tile">
              <div className="text-xs uppercase tracking-[0.2em] text-charcoal-500">Control</div>
              <div className="mt-2 text-sm text-charcoal-300">Increase your contribution percentage any time.</div>
            </div>
            <div className="feature-tile">
              <div className="text-xs uppercase tracking-[0.2em] text-charcoal-500">Giving</div>
              <div className="mt-2 text-sm text-charcoal-300">Record separate donations outside gameplay when you want to give more.</div>
            </div>
          </div>
        </div>

        {currentCharityId && (
          <div className="glass-panel border border-forest-800/40 bg-forest-900/10 p-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-forest-400 font-medium">Currently supporting</p>
                <p className="text-white font-semibold">{user.charity_id?.name || 'Your selected charity'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-display font-bold text-forest-400">{user.charity_percentage}%</p>
                <p className="text-xs text-charcoal-500">of your subscription</p>
              </div>
            </div>
          </div>
        )}

        {featuredCharities.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Featured Charities</h2>
                <p className="text-charcoal-500 text-sm mt-1">Spotlight causes currently highlighted on the platform.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredCharities.map((charity) => (
                <button
                  key={charity._id}
                  onClick={() => openCharityDetails(charity._id)}
                  className="glass-panel mesh-border text-left p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-5 overflow-hidden rounded-[22px] border border-white/[0.08] bg-charcoal-950/30">
                    <img
                      src={getCharityVisual(charity).imageSrc}
                      alt={getCharityVisual(charity).imageAlt}
                      loading="lazy"
                      decoding="async"
                      className="h-44 w-full object-cover"
                    />
                  </div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gold-400 mb-3">Featured</div>
                  <div className="font-display text-xl font-bold leading-tight text-white">{charity.name}</div>
                  <div className="text-charcoal-400 text-sm mt-3 leading-7 line-clamp-3">{charity.description}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
            <div>
              <label className="label">Search charities</label>
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, mission, or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Filter by category</label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Contribution Percentage</h2>
          <p className="text-charcoal-400 text-sm mb-5">
            Minimum contribution is 10% of your subscription. Increase it any time.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="flex-1 accent-forest-500"
            />
            <div className="w-20 text-center">
              <span className="font-display text-3xl font-bold text-forest-400">{percentage}</span>
              <span className="text-charcoal-400 text-sm">%</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
            <div>
              <h2 className="section-title mb-5">Charity Listing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {charities.map((charity) => {
                  const isSelected = selected === charity._id;
                  const { imageSrc, imageAlt } = getCharityVisual(charity);
                  return (
                    <div
                      key={charity._id}
                      className={`rounded-2xl border p-5 transition-all duration-200 ${
                        isSelected
                          ? 'border-forest-600 bg-forest-900/20 shadow-lg shadow-forest-900/20'
                          : 'border-charcoal-800 bg-charcoal-900/40'
                      }`}
                    >
                      <div className="mb-4 overflow-hidden rounded-[20px] border border-white/[0.08] bg-charcoal-950/30">
                        <img
                          src={imageSrc}
                          alt={imageAlt}
                          loading="lazy"
                          decoding="async"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="font-display text-lg font-semibold leading-snug text-white">{charity.name}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-charcoal-500">{charity.category || 'General'}</div>
                        </div>
                        {charity.featured && <span className="badge-gold">Spotlight</span>}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-charcoal-400 line-clamp-3">{charity.description}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(charity._id);
                            setDonationCharityId(charity._id);
                            setActiveCharity(charity);
                          }}
                          className={isSelected ? 'btn-primary flex-1' : 'btn-outline flex-1'}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openCharityDetails(charity._id)}
                          className="btn-outline flex-1"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || !selected}
                  className="btn-primary px-8"
                >
                  {saving ? 'Saving...' : 'Save Preference'}
                </button>
              </div>
            </div>

            <div className="card border border-charcoal-800/70 bg-charcoal-900/50">
              <h2 className="section-title mb-4">Independent Donation</h2>
              <p className="text-sm text-charcoal-400 mb-4">
                Make a separate donation at any time. This is not tied to gameplay or subscription actions.
              </p>

              {donationTarget ? (
                <>
                  <div className="text-white font-semibold">{donationTarget.name}</div>
                  <div className="text-xs text-charcoal-500 mt-1 mb-4">{donationTarget.category || 'General'}</div>
                </>
              ) : (
                <div className="text-sm text-charcoal-500 mb-4">Select a charity or open a profile to donate to that cause.</div>
              )}

              <label className="label">Choose charity</label>
              <select
                className="input-field"
                value={donationCharityId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setDonationCharityId(nextId);
                  const matched = charities.find((charity) => charity._id === nextId) || null;
                  setActiveCharity(matched);
                }}
              >
                <option value="">Select a charity</option>
                {charities.map((charity) => (
                  <option key={charity._id} value={charity._id}>
                    {charity.name}
                  </option>
                ))}
              </select>

              <label className="label">Donation amount (INR)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="500"
                disabled={!donationTarget}
              />

              <button
                type="button"
                onClick={handleDonate}
                disabled={!donationTarget || donating}
                className="btn-gold w-full mt-4"
              >
                {donating ? 'Recording donation...' : 'Donate Now'}
              </button>
            </div>
          </div>
        )}

        {activeCharity && (
          <div className="card border border-forest-800/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-forest-400 mb-2">Charity Profile</div>
                <h2 className="font-display text-2xl font-bold text-white">{activeCharity.name}</h2>
                <p className="text-charcoal-500 text-sm mt-1">{activeCharity.category || 'General'}</p>
              </div>
              <button type="button" onClick={() => setActiveCharity(null)} className="btn-outline">
                Close
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/[0.08] bg-charcoal-950/30">
              <img
                src={getCharityVisual(activeCharity).imageSrc}
                alt={getCharityVisual(activeCharity).imageAlt}
                loading="lazy"
                decoding="async"
                className="h-60 w-full object-cover"
              />
            </div>

            <p className="text-charcoal-400 mt-5 leading-8">{activeCharity.description}</p>

            <div className="mt-6">
              <h3 className="section-title mb-3">Upcoming Events</h3>
              {activeCharity.events?.length ? (
                <div className="space-y-3">
                  {activeCharity.events.map((event, index) => (
                    <div key={`${event.title}-${index}`} className="rounded-xl border border-charcoal-800/70 bg-charcoal-900/40 p-4">
                      <div className="text-white font-semibold">{event.title}</div>
                      <div className="text-sm text-charcoal-500 mt-1">
                        {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}
                        {event.location ? ` · ${event.location}` : ''}
                      </div>
                      {event.description && (
                        <div className="text-sm text-charcoal-400 mt-2">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-charcoal-500">No upcoming events listed.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
