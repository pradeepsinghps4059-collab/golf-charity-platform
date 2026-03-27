import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import AppLayout from '../../components/shared/AppLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const tierConfig = {
  gold: { label: 'Gold', cls: 'prize-gold' },
  silver: { label: 'Silver', cls: 'prize-silver' },
  bronze: { label: 'Bronze', cls: 'prize-bronze' },
};

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewing, setReviewing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    api.get('/admin/winners')
      .then((response) => setWinners(response.data.winners))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? winners : winners.filter((winner) => winner.prize_tier === filter);

  const counts = {
    all: winners.length,
    gold: winners.filter((winner) => winner.prize_tier === 'gold').length,
    silver: winners.filter((winner) => winner.prize_tier === 'silver').length,
    bronze: winners.filter((winner) => winner.prize_tier === 'bronze').length,
  };

  const updateWinner = (winner) => {
    setWinners((prev) => prev.map((item) => (item._id === winner._id ? winner : item)));
  };

  const handleReview = async (winnerId, decision) => {
    setReviewing(winnerId);
    try {
      const response = await api.put(`/admin/winners/${winnerId}/review`, {
        decision,
        admin_review_note: reviewNotes[winnerId] || '',
      });
      updateWinner(response.data.winner);
      toast.success(`Winner ${decision}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review winner');
    } finally {
      setReviewing(null);
    }
  };

  const handleMarkPaid = async (winnerId) => {
    setPaying(winnerId);
    try {
      const response = await api.put(`/admin/winners/${winnerId}/pay`);
      updateWinner(response.data.winner);
      toast.success('Winner marked as paid');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setPaying(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
        <div>
          <h1 className="page-title">Winners</h1>
          <p className="text-charcoal-400 mt-1">Review proof uploads, approve or reject submissions, and move winners from pending to paid.</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'all', label: 'Total' },
            { key: 'gold', label: 'Gold' },
            { key: 'silver', label: 'Silver' },
            { key: 'bronze', label: 'Bronze' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`stat-card text-left transition-all ${filter === item.key ? 'border-forest-700/60 bg-forest-900/10' : ''}`}
            >
              <div className="stat-number">{counts[item.key]}</div>
              <div className="stat-label">{item.label}</div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-charcoal-300 font-medium">No winners yet</p>
            <p className="text-charcoal-500 text-sm mt-1">Run and publish a draw to see winners here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((winner) => {
              const tier = tierConfig[winner.prize_tier] || {};
              return (
                <div key={winner._id} className="card">
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-white font-semibold">{winner.user_id?.name || 'Unknown user'}</div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                          {tier.label}
                        </span>
                        <span className="badge-inactive">{winner.verification_status}</span>
                        <span className="badge-inactive">{winner.status}</span>
                      </div>

                      <div className="text-sm text-charcoal-400">
                        {winner.user_id?.email} · Draw {winner.draw_id?.month || '-'}
                        {winner.draw_id?.date ? ` · ${format(new Date(winner.draw_id.date), 'MMM d, yyyy')}` : ''}
                      </div>

                      <div className="text-sm text-charcoal-500">
                        Matches: {winner.match_count} · Prize amount: Rs {winner.prize_amount || 0}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {winner.matched_numbers?.map((number) => (
                          <span
                            key={`${winner._id}-${number}`}
                            className="w-8 h-8 rounded-full bg-gold-900/40 border border-gold-700/50 text-gold-400 text-xs font-mono font-bold flex items-center justify-center"
                          >
                            {number}
                          </span>
                        ))}
                      </div>

                      <div className="rounded-xl border border-charcoal-800/70 bg-charcoal-900/40 p-4 space-y-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-charcoal-500 mb-1">Proof upload</div>
                          {winner.proof_url ? (
                            <a href={winner.proof_url} target="_blank" rel="noreferrer" className="text-forest-400 break-all">
                              {winner.proof_url}
                            </a>
                          ) : (
                            <div className="text-sm text-charcoal-500">No proof submitted yet.</div>
                          )}
                        </div>

                        {winner.proof_note && (
                          <div className="text-sm text-charcoal-400">Winner note: {winner.proof_note}</div>
                        )}

                        <textarea
                          className="input-field resize-none"
                          rows={3}
                          placeholder="Admin review note"
                          value={reviewNotes[winner._id] ?? winner.admin_review_note ?? ''}
                          onChange={(e) => setReviewNotes((prev) => ({ ...prev, [winner._id]: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full xl:w-52">
                      <button
                        onClick={() => handleReview(winner._id, 'approved')}
                        disabled={reviewing === winner._id || winner.verification_status !== 'submitted'}
                        className="btn-primary"
                      >
                        {reviewing === winner._id ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReview(winner._id, 'rejected')}
                        disabled={reviewing === winner._id || winner.verification_status !== 'submitted'}
                        className="btn-outline"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleMarkPaid(winner._id)}
                        disabled={paying === winner._id || winner.verification_status !== 'approved' || winner.status === 'paid'}
                        className="btn-gold"
                      >
                        {paying === winner._id ? 'Updating...' : winner.status === 'paid' ? 'Paid' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
