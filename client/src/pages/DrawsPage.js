import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../components/shared/AppLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import api from '../utils/api';

const tierStyles = {
  gold: { label: 'Gold', cls: 'prize-gold' },
  silver: { label: 'Silver', cls: 'prize-silver' },
  bronze: { label: 'Bronze', cls: 'prize-bronze' },
};

const verificationLabels = {
  not_submitted: 'Proof not submitted',
  submitted: 'Submitted for review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function DrawsPage() {
  const [draws, setDraws] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('draws');
  const [proofDrafts, setProofDrafts] = useState({});
  const [uploading, setUploading] = useState(null);

  const loadData = () => {
    Promise.all([
      api.get('/draws'),
      api.get('/draws/my-results')
    ]).then(([d, r]) => {
      setDraws(d.data.draws || []);
      setMyResults(r.data.results || []);
    }).catch((err) => {
      setDraws([]);
      setMyResults([]);
      toast.error(err.response?.data?.message || 'Failed to load draws');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadProof = async (winnerId) => {
    const draft = proofDrafts[winnerId] || {};
    if (!draft.proof_url) {
      return toast.error('Add a proof URL before submitting');
    }

    setUploading(winnerId);
    try {
      const response = await api.post(`/draws/my-results/${winnerId}/proof`, draft);
      setMyResults((prev) => prev.map((item) => (
        item._id === winnerId ? response.data.winner : item
      )));
      toast.success('Proof uploaded for admin review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUploading(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
        <div>
          <h1 className="page-title">Draws & Results</h1>
          <p className="text-charcoal-400 mt-1">Published draws, payout results, and winner verification tracking.</p>
        </div>

        <div className="flex gap-2 p-1 bg-charcoal-900 rounded-xl border border-charcoal-800 w-fit">
          {['draws', 'my-results'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === item
                  ? 'bg-forest-700 text-white shadow'
                  : 'text-charcoal-400 hover:text-white'
              }`}
            >
              {item === 'draws' ? 'All Draws' : 'My Results'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : tab === 'draws' ? (
          <div className="space-y-4">
            {draws.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-charcoal-300 font-medium">No draws published yet</p>
                <p className="text-charcoal-500 text-sm mt-1">Draws are published by the admin. Check back soon.</p>
              </div>
            ) : draws.map((draw) => (
              <div key={draw._id} className="card hover:border-charcoal-700 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-display font-semibold text-white text-lg">
                        Draw - {draw.month}
                      </h3>
                      <span className="badge-active">Published</span>
                    </div>
                    <p className="text-sm text-charcoal-400 mt-1">
                      {format(new Date(draw.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-charcoal-500 uppercase tracking-wider font-semibold mb-3">Winning Numbers</p>
                  <div className="flex flex-wrap gap-3">
                    {draw.draw_numbers.map((number, index) => (
                      <div key={index} className="draw-number bg-forest-900/50 border-forest-700/60 text-forest-300">
                        {number}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {myResults.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-charcoal-300 font-medium">No wins yet</p>
                <p className="text-charcoal-500 text-sm mt-1">Keep logging scores and participating in draws.</p>
              </div>
            ) : myResults.map((result) => {
              const tier = tierStyles[result.prize_tier] || {};
              const canUploadProof = ['confirmed', 'paid'].includes(result.status);

              return (
                <div key={result._id} className="card">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-display font-semibold text-white">
                          {result.match_count} Matches
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tier.cls}`}>
                          {tier.label}
                        </span>
                        <span className="badge-inactive">{verificationLabels[result.verification_status] || 'Unknown'}</span>
                      </div>
                      <p className="text-sm text-charcoal-400">Draw month: {result.draw_id?.month}</p>
                      <p className="text-sm text-charcoal-500">Prize amount: Rs {result.prize_amount || 0}</p>
                      <p className="text-sm text-charcoal-500">Payment state: {result.status}</p>
                      {result.admin_review_note && (
                        <p className="text-sm text-charcoal-400 mt-2">Admin note: {result.admin_review_note}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-charcoal-500 mb-2">Matched numbers</p>
                      <div className="flex gap-2 justify-end">
                        {result.matched_numbers?.map((number, index) => (
                          <div key={index} className="draw-number bg-gold-900/40 border-gold-600/60 text-gold-300 w-9 h-9 text-xs">
                            {number}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {result.draw_id?.draw_numbers && (
                    <div className="mt-4 pt-4 border-t border-charcoal-800/60">
                      <p className="text-xs text-charcoal-500 uppercase tracking-wider mb-2">All draw numbers</p>
                      <div className="flex flex-wrap gap-2">
                        {result.draw_id.draw_numbers.map((number, index) => {
                          const matched = result.matched_numbers?.includes(number);
                          return (
                            <div
                              key={index}
                              className={`draw-number w-9 h-9 text-xs ${
                                matched
                                  ? 'bg-gold-900/50 border-gold-500 text-gold-300'
                                  : 'bg-charcoal-800 border-charcoal-700 text-charcoal-400'
                              }`}
                            >
                              {number}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canUploadProof && (
                    <div className="mt-4 pt-4 border-t border-charcoal-800/60">
                      <h3 className="text-sm font-semibold text-charcoal-300 mb-3">Winner Verification</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_auto] gap-3">
                        <input
                          type="url"
                          className="input-field"
                          placeholder="Screenshot URL from the golf platform"
                          value={proofDrafts[result._id]?.proof_url ?? result.proof_url ?? ''}
                          onChange={(e) => setProofDrafts((prev) => ({
                            ...prev,
                            [result._id]: {
                              ...prev[result._id],
                              proof_url: e.target.value,
                              proof_note: prev[result._id]?.proof_note ?? result.proof_note ?? '',
                            }
                          }))}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Optional note"
                          value={proofDrafts[result._id]?.proof_note ?? result.proof_note ?? ''}
                          onChange={(e) => setProofDrafts((prev) => ({
                            ...prev,
                            [result._id]: {
                              ...prev[result._id],
                              proof_url: prev[result._id]?.proof_url ?? result.proof_url ?? '',
                              proof_note: e.target.value,
                            }
                          }))}
                        />
                        <button
                          type="button"
                          onClick={() => handleUploadProof(result._id)}
                          className="btn-primary"
                          disabled={uploading === result._id}
                        >
                          {uploading === result._id ? 'Submitting...' : 'Submit Proof'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
