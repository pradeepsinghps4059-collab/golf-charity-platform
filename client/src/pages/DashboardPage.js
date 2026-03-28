import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../components/shared/AppLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import api from '../utils/api';

const PrizeBadge = ({ tier }) => {
  const map = {
    gold: 'prize-gold',
    silver: 'prize-silver',
    bronze: 'prize-bronze',
  };

  return (
    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[tier] || ''}`}>
      {tier}
    </span>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    score: '',
    date: new Date().toISOString().split('T')[0],
  });

  const loadDashboard = () => {
    api.get('/users/dashboard')
      .then((response) => setData(response.data.dashboard || null))
      .catch((error) => {
        setData(null);
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const resetScoreForm = () => {
    setScoreForm({
      score: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingScoreId(null);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    const nextScore = Number(scoreForm.score);

    if (!nextScore || nextScore < 1 || nextScore > 45) {
      return toast.error('Score must be between 1 and 45');
    }

    setSavingScore(true);
    try {
      const response = editingScoreId
        ? await api.put(`/scores/${editingScoreId}`, scoreForm)
        : await api.post('/scores', scoreForm);

      setData((prev) => ({
        ...prev,
        scores: response.data.scores,
        score_count: response.data.scores.length,
      }));
      toast.success(editingScoreId ? 'Score updated' : 'Score added');
      resetScoreForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save score');
    } finally {
      setSavingScore(false);
    }
  };

  const handleEditScore = (score) => {
    setEditingScoreId(score._id);
    setScoreForm({
      score: String(score.score),
      date: new Date(score.date).toISOString().split('T')[0],
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center mt-20">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </AppLayout>
    );
  }

  if (!data?.user) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto mt-16">
          <div className="card text-center">
            <h1 className="page-title mb-3">Dashboard unavailable</h1>
            <p className="text-charcoal-400 mb-5">Your account loaded, but dashboard data could not be prepared yet.</p>
            <button type="button" className="btn-primary" onClick={() => {
              setLoading(true);
              loadDashboard();
            }}>
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const {
    user,
    scores,
    wins,
    total_wins,
    gold_wins,
    silver_wins,
    bronze_wins,
    draws_entered,
    upcoming_draws,
    total_amount_won,
    pending_payouts,
    paid_payouts,
  } = data;
  const isActive = user.subscription_status === 'active';

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Good to see you, {user.name.split(' ')[0]}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                {isActive ? 'Subscription Active' : 'Subscription Inactive'}
              </span>
              {user.charity_id?.name && (
                <span className="badge-gold">{user.charity_id.name}</span>
              )}
              <span className="badge-inactive">{scores.length} scores tracked</span>
            </div>
          </div>
          <div className={`card min-w-[280px] ${isActive ? 'border-forest-800/40 bg-forest-900/10' : 'border-charcoal-800/70'}`}>
            <div className="text-xs uppercase tracking-[0.22em] text-charcoal-500 mb-2">Subscription status</div>
            <div className={isActive ? 'badge-active' : 'badge-inactive'}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-forest-500 animate-pulse-slow' : 'bg-charcoal-500'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </div>
            <div className="text-white font-semibold mt-3 capitalize">{user.plan || 'No active plan'}</div>
            <div className="text-sm text-charcoal-400 mt-1">
              {user.subscription_end
                ? `Renewal date: ${format(new Date(user.subscription_end), 'MMMM d, yyyy')}`
                : 'Renewal date not available'}
            </div>
          </div>
        </div>

        {!isActive && (
          <div className="card border border-gold-700/30 bg-gold-900/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-white mb-1">Subscribe to start playing</h3>
                <p className="text-charcoal-400 text-sm">You need an active subscription to add scores and enter draws.</p>
              </div>
              <Link to="/subscription" className="btn-gold shrink-0">Choose a Plan</Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat-card">
            <div className="stat-number">{scores.length}</div>
            <div className="stat-label">Latest scores</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{draws_entered}</div>
            <div className="stat-label">Draws entered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gold-400">{gold_wins}</div>
            <div className="stat-label">Gold wins</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-charcoal-300">{silver_wins}</div>
            <div className="stat-label">Silver wins</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-amber-600">{bronze_wins}</div>
            <div className="stat-label">Bronze wins</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">Score Entry And Edit</h2>
                <Link to="/scores" className="text-forest-400 hover:text-forest-300 text-sm font-medium">Full score page</Link>
              </div>

              {isActive ? (
                <form onSubmit={handleSubmitScore} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 mb-6">
                  <div>
                    <label className="label">Stableford Score</label>
                    <input
                      type="number"
                      min="1"
                      max="45"
                      className="input-field"
                      value={scoreForm.score}
                      onChange={(e) => setScoreForm((prev) => ({ ...prev, score: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Date Played</label>
                    <input
                      type="date"
                      className="input-field"
                      value={scoreForm.date}
                      onChange={(e) => setScoreForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="submit" className="btn-primary" disabled={savingScore}>
                      {savingScore ? 'Saving...' : editingScoreId ? 'Update' : 'Add'}
                    </button>
                    {editingScoreId && (
                      <button type="button" className="btn-outline" onClick={resetScoreForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="text-sm text-charcoal-500 mb-5">Activate a subscription to enter and edit scores.</div>
              )}

              {scores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-charcoal-400 text-sm">No scores yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scores.map((score, index) => (
                    <div key={score._id} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-800/40">
                      <div className={`score-bubble ${index === 0 ? 'bg-forest-800 text-forest-300 border border-forest-700' : 'bg-charcoal-700 text-charcoal-300'}`}>
                        {score.score}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Score: {score.score} pts</div>
                        <div className="text-xs text-charcoal-500">{format(new Date(score.date), 'MMM dd, yyyy')}</div>
                      </div>
                      {isActive && (
                        <button type="button" className="btn-outline text-sm py-2 px-3" onClick={() => handleEditScore(score)}>
                          Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Participation Summary</h2>
                <Link to="/draws" className="text-forest-400 hover:text-forest-300 text-sm font-medium">Open draws</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-charcoal-800/40 p-4">
                  <div className="text-sm text-charcoal-500 mb-1">Draws entered</div>
                  <div className="text-3xl font-display font-bold text-white">{draws_entered}</div>
                  <div className="text-xs text-charcoal-500 mt-2">Published draws since your subscription started.</div>
                </div>
                <div className="rounded-xl bg-charcoal-800/40 p-4">
                  <div className="text-sm text-charcoal-500 mb-1">Upcoming draws</div>
                  <div className="text-3xl font-display font-bold text-white">{upcoming_draws?.length || 0}</div>
                  <div className="text-xs text-charcoal-500 mt-2">Draft draws prepared by admin and not published yet.</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(upcoming_draws || []).length === 0 ? (
                  <p className="text-sm text-charcoal-500">No upcoming draws are queued right now.</p>
                ) : (
                  upcoming_draws.map((draw) => (
                    <div key={draw._id} className="flex items-center justify-between rounded-xl bg-charcoal-800/30 p-3">
                      <div>
                        <div className="text-white font-medium">Draw {draw.month} #{draw.sequence || 1}</div>
                        <div className="text-xs text-charcoal-500">
                          {format(new Date(draw.date), 'MMM d, yyyy')} · {draw.generation_mode} mode
                        </div>
                      </div>
                      <span className="badge-gold">Upcoming</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Selected Charity</h2>
                <Link to="/charity" className="text-forest-400 hover:text-forest-300 text-sm font-medium">Manage</Link>
              </div>
              {user.charity_id ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-charcoal-800 shrink-0">
                      {user.charity_id.image && (
                        <img
                          src={user.charity_id.image}
                          alt={user.charity_id.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{user.charity_id.name}</div>
                      <div className="text-sm text-forest-400 font-medium">{user.charity_percentage}% contribution</div>
                    </div>
                  </div>
                  {user.charity_id.description && (
                    <p className="text-sm text-charcoal-400 leading-relaxed">{user.charity_id.description}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-charcoal-400 text-sm mb-3">No charity selected</p>
                  <Link to="/charity" className="btn-primary text-sm py-2 px-4 inline-block">Select Charity</Link>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Winnings Overview</h2>
                <Link to="/draws" className="text-forest-400 hover:text-forest-300 text-sm font-medium">Payout details</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-charcoal-800/40 p-4">
                  <div className="text-sm text-charcoal-500 mb-1">Total won</div>
                  <div className="text-2xl font-display font-bold text-white">Rs {total_amount_won || 0}</div>
                </div>
                <div className="rounded-xl bg-charcoal-800/40 p-4">
                  <div className="text-sm text-charcoal-500 mb-1">Pending payment</div>
                  <div className="text-2xl font-display font-bold text-gold-400">{pending_payouts || 0}</div>
                </div>
                <div className="rounded-xl bg-charcoal-800/40 p-4">
                  <div className="text-sm text-charcoal-500 mb-1">Paid</div>
                  <div className="text-2xl font-display font-bold text-forest-400">{paid_payouts || 0}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Recent Wins</h2>
                <Link to="/draws" className="text-forest-400 hover:text-forest-300 text-sm font-medium">All</Link>
              </div>
              {wins.length === 0 ? (
                <p className="text-charcoal-500 text-sm text-center py-4">No wins yet - keep playing.</p>
              ) : (
                <div className="space-y-2">
                  {wins.slice(0, 3).map((win) => (
                    <div key={win._id} className="flex items-center justify-between p-3 rounded-xl bg-charcoal-800/40">
                      <div>
                        <div className="text-sm text-white">{win.match_count} matches</div>
                        <div className="text-xs text-charcoal-500">{win.draw_id?.month}</div>
                      </div>
                      <PrizeBadge tier={win.prize_tier} />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-charcoal-800/60 text-sm text-charcoal-500">
                Total wins recorded: {total_wins}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
