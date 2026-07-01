import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { designations } from '@/mocks/designations';
import type { Designation } from '@/mocks/designations';
import { getAllVideos, addVideo, updateVideo, deleteVideo, getNextVideoId } from '@/mocks/videoStore';

interface VideoForm {
  title: string;
  veedUrl: string;
  designation: Designation;
  sortOrder: number;
  duration: string;
  thumbnail: string;
}

const defaultForm: VideoForm = {
  title: '',
  veedUrl: '',
  designation: 'Sales',
  sortOrder: 1,
  duration: '10:00',
  thumbnail: '',
};

export default function AdminVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState(getAllVideos());
  const [search, setSearch] = useState('');
  const [filterDesignation, setFilterDesignation] = useState<string>('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoForm, string>>>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return videos
      .filter((v) => {
        const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
          v.designation.toLowerCase().includes(search.toLowerCase());
        const matchDes = filterDesignation === 'All' || v.designation === filterDesignation;
        return matchSearch && matchDes;
      })
      .sort((a, b) => {
        if (a.designation !== b.designation) return a.designation.localeCompare(b.designation);
        return a.sortOrder - b.sortOrder;
      });
  }, [videos, search, filterDesignation]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setShowDrawer(true);
  };

  const openEdit = (id: string) => {
    const v = videos.find((x) => x.id === id);
    if (!v) return;
    setEditingId(id);
    setForm({
      title: v.title,
      veedUrl: v.veedUrl,
      designation: v.designation,
      sortOrder: v.sortOrder,
      duration: v.duration,
      thumbnail: v.thumbnail,
    });
    setErrors({});
    setShowDrawer(true);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VideoForm, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Video title is required';
    if (!form.veedUrl.trim()) newErrors.veedUrl = 'Veed.io URL is required';
    if (!form.duration.trim()) newErrors.duration = 'Duration is required';
    if (form.sortOrder < 1) newErrors.sortOrder = 'Sequence order must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editingId) {
      updateVideo(editingId, form);
    } else {
      const newId = getNextVideoId();
      addVideo({ id: newId, ...form });
    }
    setVideos(getAllVideos());
    setShowDrawer(false);
  };

  const handleDelete = (id: string) => {
    deleteVideo(id);
    setVideos(getAllVideos());
    setDeleteId(null);
  };

  const updateField = <K extends keyof VideoForm>(key: K, value: VideoForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors?.[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex">
      <AdminSidebar />

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background-50 border-b border-background-200 sticky top-0 z-30">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-graduation-cap-fill text-sm text-background-50"></i>
              </div>
              <span className="font-heading text-base text-foreground-900">STU Admin</span>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-2xl text-foreground-900 mb-1">Video Management</h1>
              <p className="text-sm text-foreground-500">Manage training videos and assign them to designations</p>
            </div>
            <button onClick={openAdd} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
              <i className="ri-add-line text-lg"></i>
              Add Video
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
              />
            </div>
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className="px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
            >
              <option value="All">All Designations</option>
              {designations.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background-100 border-b border-background-200">
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Designation</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Order</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Duration</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-background-100/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-foreground-500 font-mono">{v.id}</td>
                      <td className="px-5 py-3 text-sm text-foreground-900 font-medium">{v.title}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">{v.designation}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground-600">{v.sortOrder}</td>
                      <td className="px-5 py-3 text-sm text-foreground-600">{v.duration}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(v.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-200 text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
                            <i className="ri-pencil-line text-base"></i>
                          </button>
                          <button onClick={() => setDeleteId(v.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-foreground-500 hover:text-red-500 transition-colors cursor-pointer">
                            <i className="ri-delete-bin-line text-base"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-foreground-500">
                        No videos found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDrawer(false)}
          />
          {/* Panel */}
          <div className="relative ml-auto w-full max-w-2xl h-full bg-background-50 shadow-2xl flex flex-col animate-slideInRight">
            {/* Header */}
            <div className="px-8 py-5 border-b border-background-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-heading text-xl text-foreground-900">{editingId ? 'Edit Video' : 'Add New Video'}</h2>
                <p className="text-sm text-foreground-500 mt-0.5">{editingId ? 'Update the video details below' : 'Fill in all required fields to add a training video'}</p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-6 max-w-xl">
                {/* Video Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-2">Video Title <span className="text-red-500">*</span></label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Consultative Selling Fundamentals"
                    className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.title ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1.5">{errors.title}</p>}
                </div>

                {/* Veed.io URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-2">Veed.io URL <span className="text-red-500">*</span></label>
                  <input
                    value={form.veedUrl}
                    onChange={(e) => updateField('veedUrl', e.target.value)}
                    placeholder="https://www.veed.io/embed/..."
                    className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.veedUrl ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                  />
                  {errors.veedUrl && <p className="text-xs text-red-500 mt-1.5">{errors.veedUrl}</p>}
                </div>

                {/* Designation + Sequence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2">Designation <span className="text-red-500">*</span></label>
                    <select
                      value={form.designation}
                      onChange={(e) => updateField('designation', e.target.value as Designation)}
                      className="w-full px-4 py-3 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                    >
                      {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2">Sequence Order <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => updateField('sortOrder', parseInt(e.target.value, 10) || 1)}
                      min={1}
                      className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.sortOrder ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                    />
                    {errors.sortOrder && <p className="text-xs text-red-500 mt-1">{errors.sortOrder}</p>}
                  </div>
                </div>

                {/* Duration + Thumbnail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2">Duration <span className="text-red-500">*</span></label>
                    <input
                      value={form.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      placeholder="10:30"
                      className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.duration ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                    />
                    {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2">Thumbnail URL</label>
                    <input
                      value={form.thumbnail}
                      onChange={(e) => updateField('thumbnail', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-background-200 shrink-0 bg-background-50">
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowDrawer(false)} className="px-6 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors cursor-pointer">
                  {editingId ? 'Save Changes' : 'Add Video'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/60 backdrop-blur-sm px-4">
          <div className="bg-background-50 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <i className="ri-delete-bin-line text-xl text-red-500"></i>
            </div>
            <h3 className="font-heading text-lg text-foreground-900 mb-2">Delete Video?</h3>
            <p className="text-sm text-foreground-500 mb-6">This will permanently remove this video and unlink any questions. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}