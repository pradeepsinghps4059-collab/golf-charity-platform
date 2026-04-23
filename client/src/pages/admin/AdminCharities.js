import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../../components/shared/AppLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';
import { getCharityVisual } from '../../utils/charityPresentation';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  category: 'General',
  featured: false,
  events: '[]',
};

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCharities = () => {
    api.get('/charities')
      .then((response) => setCharities(response.data.charities))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCharities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      return toast.error('Name and description required');
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/charities/${editing}`, form);
        toast.success('Charity updated');
      } else {
        await api.post('/charities', form);
        toast.success('Charity created');
      }

      fetchCharities();
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (charity) => {
    setForm({
      name: charity.name,
      description: charity.description,
      image: charity.image || '',
      category: charity.category || 'General',
      featured: Boolean(charity.featured),
      events: JSON.stringify(charity.events || [], null, 2),
    });
    setEditing(charity._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this charity? It will be hidden from users.')) return;
    try {
      await api.delete(`/charities/${id}`);
      setCharities((prev) => prev.filter((item) => item._id !== id));
      toast.success('Charity deactivated');
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Charities</h1>
            <p className="text-charcoal-400 mt-1">Manage searchable listings, spotlight flags, and charity event profiles.</p>
          </div>
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (editing) cancelEdit();
            }}
            className="btn-primary"
          >
            {showForm && !editing ? 'Cancel' : 'Add Charity'}
          </button>
        </div>

        {showForm && (
          <div className="card border border-forest-800/40 animate-slide-up">
            <h2 className="section-title mb-5">{editing ? 'Edit Charity' : 'New Charity'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Charity Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Education, Health, Community"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Image URL</label>
                  <input
                    type="url"
                    className="input-field"
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 text-sm text-charcoal-300">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    />
                    Feature this charity on the homepage
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Events JSON</label>
                <textarea
                  className="input-field font-mono text-xs resize-none"
                  rows={8}
                  value={form.events}
                  onChange={(e) => setForm((prev) => ({ ...prev, events: e.target.value }))}
                  placeholder={'[{"title":"Golf Day","date":"2026-05-01","location":"Delhi","description":"Fundraising round"}]'}
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Charity' : 'Create Charity'}
                </button>
                {editing && (
                  <button type="button" onClick={cancelEdit} className="btn-outline">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : charities.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-charcoal-300 font-medium">No charities yet</p>
            <p className="text-charcoal-500 text-sm mt-1">Add the first charity using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {charities.map((charity) => {
              const { imageSrc, imageAlt } = getCharityVisual(charity);
              return (
                <div key={charity._id} className="card group">
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
                      <h3 className="font-display font-semibold leading-snug text-white">{charity.name}</h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-charcoal-500">{charity.category || 'General'}</p>
                    </div>
                    {charity.featured && <span className="badge-gold">Featured</span>}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-charcoal-400 line-clamp-3">{charity.description}</p>
                  <p className="mt-4 text-xs text-charcoal-500">Events: {charity.events?.length || 0}</p>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => startEdit(charity)}
                      className="flex-1 rounded-lg border border-charcoal-700 py-2 text-center text-xs font-medium text-charcoal-400 transition-all hover:border-forest-700 hover:text-forest-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(charity._id)}
                      className="flex-1 rounded-lg border border-red-900/40 py-2 text-center text-xs font-medium text-red-500 transition-all hover:bg-red-900/20"
                    >
                      Remove
                    </button>
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
