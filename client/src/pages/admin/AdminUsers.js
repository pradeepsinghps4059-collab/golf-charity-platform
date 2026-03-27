import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../../components/shared/AppLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userScores, setUserScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/charities')])
      .then(([usersResponse, charitiesResponse]) => {
        setUsers(usersResponse.data.users);
        setCharities(charitiesResponse.data.charities);
      })
      .finally(() => setLoading(false));
  }, []);

  const openUser = async (user) => {
    setSelectedUser(user);
    setProfileForm({
      name: user.name,
      email: user.email,
      plan: user.plan || '',
      subscription_status: user.subscription_status || 'inactive',
      role: user.role || 'user',
      charity_id: user.charity_id?._id || '',
      charity_percentage: user.charity_percentage || 10,
    });

    setScoresLoading(true);
    try {
      const response = await api.get(`/admin/users/${user._id}/scores`);
      setUserScores(response.data.scores);
    } finally {
      setScoresLoading(false);
    }
  };

  const saveScore = async (scoreId) => {
    if (!editVal || editVal < 1 || editVal > 45) {
      return toast.error('Score must be 1-45');
    }

    try {
      await api.put(`/admin/scores/${scoreId}`, { score: Number(editVal) });
      setUserScores((prev) => prev.map((score) => (
        score._id === scoreId ? { ...score, score: Number(editVal) } : score
      )));
      setEditingScore(null);
      toast.success('Score updated');
    } catch {
      toast.error('Failed to update score');
    }
  };

  const saveProfile = async () => {
    if (!selectedUser || !profileForm) return;

    setSavingProfile(true);
    try {
      const response = await api.put(`/admin/users/${selectedUser._id}/profile`, profileForm);
      const updatedUser = response.data.user;
      setUsers((prev) => prev.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
      setSelectedUser(updatedUser);
      toast.success('User profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const filtered = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const subBadge = (status) => {
    if (status === 'active') return 'badge-active';
    if (status === 'cancelled') return 'bg-red-900/30 border border-red-700/40 text-red-400 text-xs px-2 py-0.5 rounded-full';
    return 'badge-inactive';
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="text-charcoal-400 mt-1">{users.length} registered players</p>
          </div>
          <input
            type="text"
            className="input-field max-w-xs"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-charcoal-800/60">
                  <tr>
                    <th className="table-header">User</th>
                    <th className="table-header">Plan</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Charity</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="py-12 text-center"><LoadingSpinner /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-charcoal-500">No users found</td></tr>
                  ) : filtered.map((user) => (
                    <tr
                      key={user._id}
                      className={`table-row cursor-pointer ${selectedUser?._id === user._id ? 'bg-forest-900/20' : ''}`}
                      onClick={() => openUser(user)}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-xs font-bold text-forest-300 shrink-0">
                            {user.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{user.name}</div>
                            <div className="text-charcoal-500 text-xs truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell capitalize">{user.plan || '-'}</td>
                      <td className="table-cell">
                        <span className={subBadge(user.subscription_status)}>{user.subscription_status}</span>
                      </td>
                      <td className="table-cell text-xs truncate max-w-[100px]">
                        {user.charity_id?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedUser || !profileForm ? (
              <div className="card text-center py-12">
                <p className="text-charcoal-400 text-sm">Click a user to view and edit details.</p>
              </div>
            ) : (
              <div className="card space-y-5">
                <div>
                  <div className="font-semibold text-white">{selectedUser.name}</div>
                  <div className="text-xs text-charcoal-500">{selectedUser.email}</div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input
                      className="input-field"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input-field"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Plan</label>
                      <select
                        className="input-field"
                        value={profileForm.plan}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, plan: e.target.value }))}
                      >
                        <option value="">None</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select
                        className="input-field"
                        value={profileForm.subscription_status}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, subscription_status: e.target.value }))}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Role</label>
                      <select
                        className="input-field"
                        value={profileForm.role}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Charity %</label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        className="input-field"
                        value={profileForm.charity_percentage}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, charity_percentage: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Charity</label>
                    <select
                      className="input-field"
                      value={profileForm.charity_id}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, charity_id: e.target.value }))}
                    >
                      <option value="">None</option>
                      {charities.map((charity) => (
                        <option key={charity._id} value={charity._id}>{charity.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button onClick={saveProfile} className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>

                <div>
                  <p className="label">Scores</p>
                  {scoresLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : userScores.length === 0 ? (
                    <p className="text-charcoal-500 text-xs">No scores</p>
                  ) : (
                    <div className="space-y-2">
                      {userScores.map((score) => (
                        <div key={score._id} className="flex items-center gap-2 p-2.5 rounded-lg bg-charcoal-800/40">
                          {editingScore === score._id ? (
                            <>
                              <input
                                type="number"
                                className="input-field py-1 px-2 text-sm w-20"
                                value={editVal}
                                onChange={(e) => setEditVal(e.target.value)}
                                min="1"
                                max="45"
                                autoFocus
                              />
                              <button onClick={() => saveScore(score._id)} className="text-xs text-forest-400 hover:text-forest-300 font-medium">Save</button>
                              <button onClick={() => setEditingScore(null)} className="text-xs text-charcoal-500 hover:text-charcoal-300">Cancel</button>
                            </>
                          ) : (
                            <>
                              <div className="score-bubble bg-charcoal-700 text-charcoal-300 w-9 h-9 text-xs">{score.score}</div>
                              <div className="flex-1">
                                <div className="text-xs text-white">{score.score} pts</div>
                                <div className="text-xs text-charcoal-500">{format(new Date(score.date), 'MMM d, yyyy')}</div>
                              </div>
                              <button
                                onClick={() => { setEditingScore(score._id); setEditVal(score.score); }}
                                className="text-xs text-charcoal-500 hover:text-charcoal-300 p-1"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-charcoal-800/60 text-xs text-charcoal-600">
                  Joined {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
