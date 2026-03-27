import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../../components/shared/AppLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';

const generationModes = [
  {
    id: 'random',
    label: 'Random',
    description: 'Standard lottery-style draw.',
  },
  {
    id: 'algorithmic',
    label: 'Algorithmic',
    description: 'Weighted by least frequent user scores.',
  },
];

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [generationMode, setGenerationMode] = useState('random');

  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchDraws = () => {
    api.get('/draws/all')
      .then((r) => setDraws(r.data.draws))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDraws();
  }, []);

  const handleRunDraw = async () => {
    if (!window.confirm(`Run the ${currentMonth} draw now using ${generationMode} mode?`)) return;

    setRunning(true);
    try {
      const r = await api.post('/draws/run', { generationMode });
      const rolloverNote = r.data.jackpot_rollover_eligible ? ' Jackpot rollover has been carried forward.' : '';
      toast.success(`Draw generated. ${r.data.winners_count} winner(s) found.${rolloverNote}`);
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run draw');
    } finally {
      setRunning(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this draw? Winners will become visible to users.')) return;

    setPublishing(id);
    try {
      await api.put(`/draws/${id}/publish`);
      setDraws((prev) => prev.map((draw) => (
        draw._id === id ? { ...draw, status: 'published' } : draw
      )));
      toast.success('Draw published.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <h1 className="page-title">Draw System</h1>
            <p className="text-charcoal-400 mt-1">
              Run simulation drafts as often as needed, publish when ready, and roll over the jackpot when there is no 5-match winner.
            </p>
          </div>

          <div className="card border border-charcoal-800/70 bg-charcoal-900/50 w-full lg:w-[360px] space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-charcoal-500 mb-2">Generation Mode</div>
              <div className="grid grid-cols-1 gap-2">
                {generationModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGenerationMode(mode.id)}
                    className={`text-left rounded-xl border px-4 py-3 transition-all ${
                      generationMode === mode.id
                        ? 'border-forest-600 bg-forest-900/30 text-white'
                        : 'border-charcoal-800 bg-charcoal-900/40 text-charcoal-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">{mode.label}</div>
                    <div className="text-sm mt-1 text-inherit opacity-80">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunDraw}
              disabled={running}
              className="btn-gold w-full"
            >
              {running ? 'Running Simulation...' : 'Run Simulation Draw'}
            </button>
          </div>
        </div>

        <div className="card border border-charcoal-700/40 bg-charcoal-800/20">
          <h3 className="text-sm font-semibold text-charcoal-300 mb-3">Prize Pool Logic</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-charcoal-400">
            <div>5-match share: 40% with rollover</div>
            <div>4-match share: 35%</div>
            <div>3-match share: 25%</div>
          </div>
          <div className="text-xs text-charcoal-500 mt-4">
            Draft draws function as simulation mode until you publish them.
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : draws.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-charcoal-300 font-medium">No draws yet</p>
            <p className="text-charcoal-500 text-sm mt-1">Run the first draw using the controls above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {draws.map((draw) => (
              <div
                key={draw._id}
                className={`card ${
                  draw.status === 'published' ? 'border-forest-800/40' : 'border-gold-800/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-semibold text-white text-lg">
                        Draw {draw.month}
                      </h3>
                      <span className={draw.status === 'published' ? 'badge-active' : 'badge-gold'}>
                        {draw.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      <span className="badge-inactive capitalize">{draw.generation_mode || 'random'} mode</span>
                      {draw.jackpot_rollover_eligible && (
                        <span className="badge-gold">Jackpot rollover active</span>
                      )}
                    </div>

                    <div className="text-sm text-charcoal-400">
                      Generated {format(new Date(draw.date), 'MMMM d, yyyy h:mm a')}
                      {draw.triggered_by && ` by ${draw.triggered_by.name}`}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {draw.draw_numbers.map((number) => (
                        <div
                          key={`${draw._id}-${number}`}
                          className="draw-number bg-charcoal-800 border-charcoal-600 text-charcoal-200 w-10 h-10"
                        >
                          {number}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-charcoal-500">
                      <div>Total pool: Rs {draw.prize_pool_total || 0}</div>
                      <div>Gold: Rs {draw.gold_pool_amount || 0}</div>
                      <div>Silver: Rs {draw.silver_pool_amount || 0}</div>
                      <div>Bronze: Rs {draw.bronze_pool_amount || 0}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {draw.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(draw._id)}
                        disabled={publishing === draw._id}
                        className="btn-gold text-sm"
                      >
                        {publishing === draw._id ? 'Publishing...' : 'Publish Draw'}
                      </button>
                    ) : (
                      <span className="text-sm text-forest-400 font-medium">Results live</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
