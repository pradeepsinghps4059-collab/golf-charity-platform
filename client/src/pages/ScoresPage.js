import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../components/shared/AppLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ScoresPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    score: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchScores = () => {
    api.get('/scores').then((r) => setScores(r.data.scores)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.score) return toast.error('Enter a score');

    const nextScore = Number(form.score);
    if (nextScore < 1 || nextScore > 45) {
      return toast.error('Score must be between 1 and 45');
    }

    setSubmitting(true);
    try {
      const previousCount = scores.length;
      const r = await api.post('/scores', { score: nextScore, date: form.date });

      setScores(r.data.scores);
      setForm((prev) => ({ ...prev, score: '' }));

      if (r.data.retained) {
        toast.success('Score added!');
      } else {
        toast('Score was saved, but it is older than your latest 5 scores.', { icon: 'i' });
      }

      if (r.data.retained && previousCount === 5 && r.data.scores.length === 5) {
        toast('Oldest retained score removed to keep your latest 5.', { icon: 'i' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this score?')) return;
    try {
      await api.delete(`/scores/${id}`);
      setScores((prev) => prev.filter((entry) => entry._id !== id));
      toast.success('Score removed');
    } catch {
      toast.error('Failed to remove score');
    }
  };

  const isActive = user?.subscription_status === 'active';

  const scoreColor = (scoreValue) => {
    if (scoreValue >= 35) return 'bg-gold-900/40 text-gold-400 border border-gold-700/40';
    if (scoreValue >= 25) return 'bg-forest-900/40 text-forest-400 border border-forest-700/40';
    if (scoreValue >= 15) return 'bg-charcoal-700/60 text-charcoal-300 border border-charcoal-600/60';
    return 'bg-red-900/20 text-red-400 border border-red-700/30';
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
        <div>
          <h1 className="page-title">My Scores</h1>
          <p className="text-charcoal-400 mt-1">
            Track your latest 5 Stableford scores by played date. Adding an older score will not replace a newer one.
          </p>
        </div>

        {isActive ? (
          <div className="card border border-forest-800/40">
            <h2 className="section-title mb-5">Add New Score</h2>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="label">Stableford Score (1-45)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 28"
                  min="1"
                  max="45"
                  value={form.score}
                  onChange={(e) => setForm((prev) => ({ ...prev, score: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <label className="label">Date Played</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
                  {submitting ? 'Adding...' : '+ Add Score'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card border border-charcoal-700/40 text-center py-8">
            <div className="text-3xl mb-3">Locked</div>
            <p className="text-charcoal-300 font-medium mb-1">Subscription Required</p>
            <p className="text-charcoal-500 text-sm mb-4">You need an active plan to track scores.</p>
            <a href="/subscription" className="btn-gold inline-block">Subscribe Now</a>
          </div>
        )}

        {scores.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-charcoal-500">Score slots:</span>
            <div className="flex gap-1.5">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                    index < scores.length
                      ? 'bg-forest-600 border-forest-500'
                      : 'bg-charcoal-800 border-charcoal-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-charcoal-500">{scores.length}/5 used</span>
          </div>
        )}

        <div className="card">
          <h2 className="section-title mb-5">Score History</h2>
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">Golf</div>
              <p className="text-charcoal-300 font-medium">No scores yet</p>
              <p className="text-charcoal-500 text-sm mt-1">Add your first Stableford score above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-charcoal-800/40 hover:bg-charcoal-800/60 transition-colors group animate-slide-in"
                >
                  <div className={`score-bubble ${scoreColor(entry.score)}`}>
                    {entry.score}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{entry.score} points</span>
                      {index === 0 && (
                        <span className="text-xs bg-forest-900/60 text-forest-400 border border-forest-700/40 px-2 py-0.5 rounded-full font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-charcoal-400 mt-0.5">
                      {format(new Date(entry.date), 'EEEE, MMMM d yyyy')}
                    </div>
                  </div>
                  <div className="text-right mr-2">
                    <div className="text-xs text-charcoal-600 font-mono">#{5 - index}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-charcoal-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900/20"
                    title="Remove score"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-charcoal-800/30 border border-charcoal-700/40">
          <h3 className="text-sm font-semibold text-charcoal-300 mb-2">How Stableford scoring works</h3>
          <p className="text-xs text-charcoal-500 leading-relaxed">
            Stableford is a points-based scoring system. Scores range from 1-45 points. Higher scores are better.
            Your scores are compared against monthly draw numbers, and matching 3 or more wins a prize.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
