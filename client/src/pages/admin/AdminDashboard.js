import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/shared/AppLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const StatCard = ({ label, value, icon, color = 'text-white' }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className={`font-display text-2xl md:text-3xl font-bold leading-none ${color} break-words`}>{value}</div>
        <div className="stat-label mt-3 leading-snug">{label}</div>
      </div>
      <span className="shrink-0 text-lg opacity-60">{icon}</span>
    </div>
  </div>
);

const COLORS = ['#3d8b3d', '#c9a20d', '#4a4f5b', '#e57b3d', '#7a5f09'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((response) => setStats(response.data.stats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center mt-20"><LoadingSpinner size="lg" text="Loading analytics..." /></div>
      </AppLayout>
    );
  }

  const subData = stats.subscriptionBreakdown.map((item) => ({
    name: item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 'Unknown',
    value: item.count,
  }));

  const charityTotals = stats.charityContributionTotals || [];
  const charityData = charityTotals.map((item) => ({
    name: item.charity_name.split(' ').slice(0, 2).join(' '),
    total: item.combined_total_inr,
  }));

  const modeData = (stats.drawModeBreakdown || []).map((item) => ({
    name: item._id || 'unknown',
    value: item.count,
  }));

  const tierData = (stats.winnerTierBreakdown || []).map((item) => ({
    name: item._id || 'unknown',
    winners: item.count,
    totalPrize: item.totalPrize,
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="text-charcoal-400 mt-1">User management, draw controls, charity operations, and analytics.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon="Users" />
          <StatCard label="Active Subs" value={stats.activeSubscribers} icon="Subs" color="text-forest-400" />
          <StatCard label="Total Draws" value={stats.totalDraws} icon="Draws" />
          <StatCard label="Published" value={stats.publishedDraws} icon="Live" color="text-gold-400" />
          <StatCard label="Winners" value={stats.totalWinners} icon="Wins" color="text-gold-400" />
          <StatCard label="Charities" value={stats.totalCharities} icon="Care" color="text-forest-400" />
          <StatCard label="Prize Pool" value={`Rs ${stats.totalPrizePool || 0}`} icon="Pool" color="text-gold-400" />
          <StatCard label="Rollovers" value={stats.jackpotRolloverCount || 0} icon="Carry" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-6">Subscription Plans</h2>
            {subData.length === 0 ? (
              <p className="text-charcoal-500 text-sm text-center py-8">No active subscriptions</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={subData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {subData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid #3d414b', borderRadius: '8px', fontFamily: 'DM Sans' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="section-title mb-6">Draw Mode Breakdown</h2>
            {modeData.length === 0 ? (
              <p className="text-charcoal-500 text-sm text-center py-8">No draw data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={modeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333740" />
                  <XAxis dataKey="name" tick={{ fill: '#9fa3ab', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <YAxis tick={{ fill: '#9fa3ab', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid #3d414b', borderRadius: '8px', fontFamily: 'DM Sans' }} />
                  <Bar dataKey="value" fill="#3d8b3d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-6">Charity Contribution Totals</h2>
            {charityData.length === 0 ? (
              <p className="text-charcoal-500 text-sm text-center py-8">No charity contribution totals available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charityData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333740" />
                  <XAxis dataKey="name" tick={{ fill: '#9fa3ab', fontSize: 10, fontFamily: 'DM Sans' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#9fa3ab', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid #3d414b', borderRadius: '8px', fontFamily: 'DM Sans' }} />
                  <Bar dataKey="total" fill="#c9a20d" radius={[4, 4, 0, 0]} name="INR Total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="section-title mb-6">Winner Tier Analytics</h2>
            {tierData.length === 0 ? (
              <p className="text-charcoal-500 text-sm text-center py-8">No winner data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tierData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333740" />
                  <XAxis dataKey="name" tick={{ fill: '#9fa3ab', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <YAxis tick={{ fill: '#9fa3ab', fontSize: 11, fontFamily: 'DM Sans' }} />
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid #3d414b', borderRadius: '8px', fontFamily: 'DM Sans' }} />
                  <Bar dataKey="winners" fill="#4a4f5b" radius={[4, 4, 0, 0]} name="Winners" />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 space-y-2 text-sm text-charcoal-400">
              {tierData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="capitalize">{item.name}</span>
                  <span>Rs {item.totalPrize || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Manage Users', desc: 'View and edit user profiles, subscriptions, and scores', href: '/admin/users' },
            { label: 'Draw Management', desc: 'Configure draw logic, run simulations, and publish results', href: '/admin/draws' },
            { label: 'Winners Management', desc: 'Verify submissions and mark payouts as completed', href: '/admin/winners' },
            { label: 'Charity Management', desc: 'Add, edit, delete charities and manage content/media', href: '/admin/charities' },
          ].map((item) => (
            <a key={item.href} href={item.href} className="card-hover transition-all">
              <h3 className="font-display font-semibold text-white mb-1">{item.label}</h3>
              <p className="text-xs text-charcoal-500">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
