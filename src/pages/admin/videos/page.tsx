import { useState, useMemo, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import { useDebounce } from '@/common/Debounce';
import Pagination from '@/common/Pagination';
import { message, Select } from 'antd';

interface VideoForm {
  title: string;
  veedUrl: string;
  vimeoId: string;
  designation: [];
  sortOrder: number;
  // duration: string;
  thumbnail: string;
}

const defaultForm: VideoForm = {
  title: '',
  veedUrl: '',
  vimeoId: '',
  designation: [],
  sortOrder: 1,
  // duration: '10:00',
  thumbnail: '',
};

export default function AdminVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [search, setSearch] = useState('');
  const [filterDesignation, setFilterDesignation] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoForm, string>>>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const debouncedSearch = useDebounce(search);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.VIDEO}`, {
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        designation: filterDesignation
      });

      setVideos(res.data.videos);
      setPagination(res.data.pagination);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchDesignations = async () => {
    try {
      // setLoading(true);
      const res = await api.get(`${API.DESIGNATION}/all`, {});

      setDesignations(res.data.designations);

    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };
  // Cleanup timer on unmount
  useEffect(() => {
    fetchVideos();
    fetchDesignations();


    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, [page, debouncedSearch, filterDesignation]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterDesignation]);
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setShowDrawer(true);
  };

  const openEdit = (id: string) => {
    const v = videos.find((x) => x._id === id);
    if (!v) return;
    setEditingId(id);
    setForm({
      title: v.title,
      veedUrl: v.veedUrl,
      vimeoId: v.vimeoId,
      designation: v.designation.map((item) => item._id),
      sortOrder: v.sortOrder,
      // duration: v.duration,
      thumbnail: v.thumbnail,
    });
    setErrors({});
    setShowDrawer(true);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VideoForm, string>> = {};

    if (!form.title?.trim()) newErrors.title = 'Video title is required';

    // Check if designation is selected (handles both array and string checks safely)
    if (!form.designation || (Array.isArray(form.designation) && form.designation.length === 0)) {
      newErrors.designation = 'Designation is required';
    }

    // Require AT LEAST ONE: veedUrl OR vimeoId
    const hasVeed = Boolean(form.veedUrl?.trim());
    const hasVimeo = Boolean(form.vimeoId?.trim());

    if (!hasVeed && !hasVimeo) {
      newErrors.veedUrl = 'Provide either Video URL or Vimeo ID';
      newErrors.vimeoId = 'Provide either Video URL or Vimeo ID';
    }

    if (form.sortOrder < 1) newErrors.sortOrder = 'Sequence order must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (editingId) {
        const res = await api.put(`${API.VIDEO}/${editingId}`, form);
        message.success(res.message || "Video updated successfully.");
      } else {
        const res = await api.post(API.VIDEO, form);
        message.success(res.message || "Video added successfully.");
      }

      fetchVideos();
      setShowDrawer(false);
    } catch (err: any) {
      message.error(err.message || "Something went wrong.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`${API.VIDEO}/${id}`);
      message.success(res.message || "Video deleted successfully.");
      fetchVideos()
      setDeleteId(null);
    } catch (error) {
      message.error(error.message || "Something went wrong.");
    }
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

        <div className=" mx-auto px-4 md:px-6 py-6 lg:py-8">
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
            <Select
              value={filterDesignation || undefined}
              placeholder="All Designations"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(value) => setFilterDesignation(value || "")}
              className="w-64"
              options={[
                {
                  label: "All Designations",
                  value: "",
                },
                ...designations.map((d) => ({
                  label: d.name,
                  value: d._id,
                })),
              ]}
            />
          </div>

          {/* Table */}
          <div className="bg-background-50 border border-background-200 rounded-xl flex flex-col h-[700px]">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background-100 border-b border-background-200">
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Designations</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Order</th>
                    {/* <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Duration</th> */}
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {/* 1. Loading State Indicator */}
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-[450px] text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {/* Remix Icon Spinner (Agar Remix Icons missing hon to SVG fallback work karega) */}
                          <i className="ri-loader-4-line text-2xl text-primary-500 animate-spin"></i>
                          <span className="text-sm text-foreground-500 font-medium">Loading videos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* 2. Video List Mapping */}
                      {videos.map((v) => (
                        <tr key={v._id} className="hover:bg-background-100/50 transition-colors">
                          <td className="px-5 py-3 text-sm text-foreground-500 font-mono">{v.videoId}</td>
                          <td className="px-5 py-3 text-sm text-foreground-900 font-medium">{v.title}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                              {Array.isArray(v.designation) && v.designation.length > 0 ? (
                                <>
                                  {/* Render only the first 2 designations */}
                                  {v.designation.slice(0, 2).map((d) => (
                                    <span
                                      key={d._id}
                                      className="text-[10px] tracking-wide inline-block whitespace-nowrap px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium"
                                    >
                                      {d.name}
                                    </span>
                                  ))}

                                  {/* Counter bubble for remaining designations */}
                                  {v.designation.length > 2 && (
                                    <span
                                      title={v.designation.slice(2).map((d) => d.name).join(", ")}
                                      className="text-[10px] tracking-wide inline-block whitespace-nowrap px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold cursor-help"
                                    >
                                      +{v.designation.length - 2} More
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No Designations</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-600">{v.sortOrder}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(v._id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-200 text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
                              >
                                <i className="ri-pencil-line text-base"></i>
                              </button>
                              <button
                                onClick={() => setDeleteId(v._id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-foreground-500 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <i className="ri-delete-bin-line text-base"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* 3. Empty State Indicator */}
                      {videos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-sm text-foreground-500">
                            No videos found matching your search.
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-background-200 bg-background-50 px-6 py-4 shrink-0">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
              />
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
                  <label className="block text-sm font-medium text-foreground-700 mb-2">Vedio URL <span className="text-red-500">*</span></label>
                  <input
                    value={form.veedUrl}
                    onChange={(e) => updateField('veedUrl', e.target.value)}
                    placeholder=""
                    className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.veedUrl ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                  />
                  {errors.veedUrl && <p className="text-xs text-red-500 mt-1.5">{errors.veedUrl}</p>}
                </div>

                {/* ------ OR ------ Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-background-200 w-full"></div>
                  <span className="bg-background-50 px-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider absolute">
                    OR
                  </span>
                </div>

                {/* Vimeo Video ID */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-2">Vimeo Video ID</label>
                  <input
                    value={form.vimeoId || ''}
                    onChange={(e) => updateField('vimeoId', e.target.value)}
                    placeholder="e.g. 123456789"
                    className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.vimeoId ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                  />
                  {errors.vimeoId && <p className="text-xs text-red-500 mt-1.5">{errors.vimeoId}</p>}
                </div>

                {/* Designation + Sequence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2">Designation <span className="text-red-500">*</span></label>
                    <Select
                      mode="multiple" // Enables multi-select tag view
                      maxTagCount="responsive" // Dynamically collapses tags when they overflow row layout bounds
                      value={Array.isArray(form.designation) ? form.designation : []} // Fallback to an empty array if state is old string value
                      placeholder="Select Designations"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      onChange={(value) => updateField('designation', value)} // value will automatically pass as an array of IDs: ["id1", "id2"]

                      // Note: Removed full block paddings (px-3 py-2.5) because Ant Design multiple select manages 
                      // its internal tag layout height dynamically. Adding direct padding breaks tag styling alignments.
                      className="w-full text-sm border border-background-200 rounded-lg text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer min-h-[42px]"

                      options={designations.map((d) => ({
                        label: d.name,
                        value: d._id,
                      }))}
                    />
                    {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}
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
                <div className="">
                  {/* <div>
              <label className="block text-sm font-medium text-foreground-700 mb-2">Duration <span className="text-red-500">*</span></label>
              <input
                value={form.duration}
                onChange={(e) => updateField('duration', e.target.value)}
                placeholder="10:30"
                className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.duration ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div> */}
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