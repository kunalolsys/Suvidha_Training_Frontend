import { useState, useMemo, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import { message, Select } from 'antd';
import { useDebounce } from '@/common/Debounce';
import Pagination from '@/common/Pagination';
import ExcelImportWidget from './ImportQuestion';

interface QuestionForm {
  videoId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: 'a' | 'b' | 'c' | 'd' | 'e';
  sortOrder: number;
}

const defaultForm: QuestionForm = {
  videoId: '',
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  correctOption: 'a',
  sortOrder: 1,
};

export default function AdminQuestionsPage() {
  const { user } = useAuth();
  const [importMode, setImportMode] = useState("manual");
  const [questions, setQuestions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [filterVideo, setFilterVideo] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof QuestionForm, string>>>();
  const [visibleOptions, setVisibleOptions] = useState<Set<'a' | 'b' | 'c' | 'd' | 'e'>>(new Set(['a', 'b', 'c']));
  const [loading, setLoading] = useState(false)
  const [refetch, setRefetch] = useState(false)
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const debouncedSearch = useDebounce(search);
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.QUESTION}`, {
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        video: filterVideo
      });

      setQuestions(res.data.questions);
      setPagination(res.data.pagination);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.VIDEO}/all`,);

      setVideos(res.data.videos);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVideos();
    fetchQuestions();
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, [page, debouncedSearch, filterVideo, refetch]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterVideo]);

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...defaultForm, videoId: videos[0]?._id || '' });
    setErrors({});
    setVisibleOptions(new Set(['a', 'b', 'c']));
    setShowDrawer(true);
  };

  const openEdit = (id: string) => {
    setImportMode("manual")
    const q = questions.find((x) => x._id === id);
    if (!q) return;

    const correctIndex = q.options.findIndex((o: any) => o.isCorrect);

    setEditingId(id);

    setForm({
      videoId: q.video._id,
      questionText: q.question,
      optionA: q.options[0]?.option || "",
      optionB: q.options[1]?.option || "",
      optionC: q.options[2]?.option || "",
      optionD: q.options[3]?.option || "",
      optionE: q.options[4]?.option || "",
      correctOption:
        correctIndex !== -1
          ? (["a", "b", "c", "d", "e"][correctIndex] as
            | "a"
            | "b"
            | "c"
            | "d"
            | "e")
          : "a",
      sortOrder: q.sortOrder,
    });

    const vis = new Set<"a" | "b" | "c" | "d" | "e">(["a", "b", "c"]);

    if (q.options[3]) vis.add("d");
    if (q.options[4]) vis.add("e");

    setVisibleOptions(vis);
    setErrors({});
    setShowDrawer(true);
  };

  const addNextOption = () => {
    setVisibleOptions((prev) => {
      const next = new Set(prev);
      if (!next.has('d')) { next.add('d'); }
      else if (!next.has('e')) { next.add('e'); }
      return next;
    });
  };

  const removeOption = (opt: 'd' | 'e') => {
    setVisibleOptions((prev) => {
      const next = new Set(prev);
      next.delete(opt);
      return next;
    });
    setForm((f) => {
      const next = { ...f, [opt === 'd' ? 'optionD' : 'optionE']: '' };
      // If removing the currently selected correct answer, reset to A
      if (f.correctOption === opt) {
        next.correctOption = 'a';
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[opt === 'd' ? 'optionD' : 'optionE'];
      return next;
    });
  };

  const canAddMore = !visibleOptions.has('d') || !visibleOptions.has('e');

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof QuestionForm, string>> = {};
    if (!form.videoId) newErrors.videoId = 'Select a linked video';
    if (!form.questionText.trim()) newErrors.questionText = 'Enter the question text';
    if (!form.optionA.trim()) newErrors.optionA = 'Option A is required';
    if (!form.optionB.trim()) newErrors.optionB = 'Option B is required';
    if (!form.optionC.trim()) newErrors.optionC = 'Option C is required';
    if (visibleOptions.has('d') && !form.optionD.trim()) newErrors.optionD = 'Option D is required';
    if (form.sortOrder < 1) newErrors.sortOrder = 'Sequence order must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      video: form.videoId,
      question: form.questionText.trim(),
      sortOrder: Number(form.sortOrder),
      options: [
        {
          key: "a",
          option: form.optionA.trim(),
        },
        {
          key: "b",
          option: form.optionB.trim(),
        },
        {
          key: "c",
          option: form.optionC.trim(),
        },
        {
          key: "d",
          option: form.optionD.trim(),
        },
        {
          key: "e",
          option: form.optionE.trim(),
        },
      ]
        .filter((item) => item.option)
        .map((item) => ({
          option: item.option,
          isCorrect: form.correctOption === item.key,
        })),
    };

    try {
      if (editingId) {
        const res = await api.put(`${API.QUESTION}/${editingId}`, payload);

        message.success(res.message || "Question updated successfully.");
      } else {
        const res = await api.post(API.QUESTION, payload);

        message.success(res.message || "Question added successfully.");
      }

      fetchQuestions();
      setShowDrawer(false);
    } catch (err: any) {
      message.error(err.message || "Something went wrong.");
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`${API.QUESTION}/${id}`);
      message.success(res.message || "Question deleted successfully.");
      fetchQuestions()
      setDeleteId(null);
    } catch (error) {
      message.error(error.message || "Something went wrong.");
    }
  };



  const getVideoTitle = (videoId: string) => {
    return videos.find((v) => v._id === videoId)?.title || videoId;
  };

  const updateField = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
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
              <h1 className="font-heading text-2xl text-foreground-900 mb-1">Question Management</h1>
              <p className="text-sm text-foreground-500">Create and manage MCQ questions linked to videos</p>
            </div>
            <button onClick={openAdd} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
              <i className="ri-add-line text-lg"></i>
              Add Question
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
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
              />
            </div>
            <Select
              value={filterVideo || undefined}
              placeholder="All Videos"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(value) => setFilterVideo(value || "")}
              className="w-64"
              options={[
                {
                  label: "All Videos",
                  value: "",
                },
                ...videos.map((d) => ({
                  label: d.title,
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
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Video</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Question</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Options</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Correct</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600">Sequence Order</th>
                    <th className="px-5 py-3 text-xs font-semibold text-foreground-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {questions.map((q) => (
                    <tr key={q._id} className="hover:bg-background-100/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-foreground-500 font-mono">{q.questionId}</td>
                      <td className="px-5 py-3 text-sm text-foreground-600  truncate">{getVideoTitle(q.video.title)}</td>
                      <td className="px-5 py-3 text-sm text-foreground-900 font-medium max-w-[300px] truncate">{q.question}</td>
                      <td className="px-5 py-3 text-sm text-foreground-600">{q.options.filter(Boolean).length}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-medium uppercase">  {q.options.find((opt) => opt.isCorrect)?.option || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-medium uppercase">  {q.sortOrder || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(q._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-200 text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
                            <i className="ri-pencil-line text-base"></i>
                          </button>
                          <button onClick={() => setDeleteId(q._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-foreground-500 hover:text-red-500 transition-colors cursor-pointer">
                            <i className="ri-delete-bin-line text-base"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-foreground-500">
                        No questions found matching your search.
                      </td>
                    </tr>
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
                <h2 className="font-heading text-xl text-foreground-900">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
                <p className="text-sm text-foreground-500 mt-0.5">{editingId ? 'Update the question details below' : 'Fill in all required fields to create a new MCQ'}</p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-6 max-w-xl">

                {/* 1. Linked Video Selector (Shared by both workflows) */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-2">
                    Linked Video <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.videoId}
                    placeholder="Select video"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    onChange={(value) => updateField('videoId', value)}
                    className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer transition-colors ${errors.videoId ? 'border-red-300 bg-red-50/30' : 'border-background-200'
                      }`}
                    options={[
                      { label: "Select video", value: "" },
                      ...videos.map((d) => ({
                        label: d.title,
                        value: d._id,
                      })),
                    ]}
                  />
                  {errors.videoId && <p className="text-xs text-red-500 mt-1.5">{errors.videoId}</p>}
                </div>

                {/* 2. Mode Toggle Tabs */}
                {!editingId && <div className="flex border-b border-slate-200 p-0.5 bg-slate-100/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImportMode("manual")}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${importMode === "manual"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    Manual Creation
                  </button>
                  <button
                    type="button"
                    disabled={!form.videoId}
                    onClick={() => setImportMode("excel")}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${!form.videoId
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : importMode === "excel"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    Excel Bulk Import {!form.videoId && "(Select Video First)"}
                  </button>
                </div>}

                {/* 3. Conditional Workflow Switching */}
                {importMode === "excel" ? (
                  /* Excel Import Pathway */
                  <ExcelImportWidget videoId={form.videoId} setRefetch={setRefetch} />
                ) : (
                  /* Manual Input Pathway */
                  <>
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground-700 mb-2">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.questionText}
                        onChange={(e) => updateField('questionText', e.target.value)}
                        rows={4}
                        placeholder="e.g. What is the primary goal of consultative selling?"
                        className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 resize-none transition-colors ${errors.questionText ? 'border-red-300 bg-red-50/30' : 'border-background-200'
                          }`}
                      />
                      {errors.questionText && <p className="text-xs text-red-500 mt-1.5">{errors.questionText}</p>}
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-foreground-700 mb-3">Answer Options</label>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs text-foreground-500 mb-1.5">Option A <span className="text-red-500">*</span></label>
                          <input
                            value={form.optionA}
                            onChange={(e) => updateField('optionA', e.target.value)}
                            placeholder="Enter option A..."
                            className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.optionA ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                          />
                          {errors.optionA && <p className="text-xs text-red-500 mt-1">{errors.optionA}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-foreground-500 mb-1.5">Option B <span className="text-red-500">*</span></label>
                          <input
                            value={form.optionB}
                            onChange={(e) => updateField('optionB', e.target.value)}
                            placeholder="Enter option B..."
                            className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.optionB ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                          />
                          {errors.optionB && <p className="text-xs text-red-500 mt-1">{errors.optionB}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-foreground-500 mb-1.5">Option C <span className="text-red-500">*</span></label>
                          <input
                            value={form.optionC}
                            onChange={(e) => updateField('optionC', e.target.value)}
                            placeholder="Enter option C..."
                            className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.optionC ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                          />
                          {errors.optionC && <p className="text-xs text-red-500 mt-1">{errors.optionC}</p>}
                        </div>

                        {visibleOptions.has('d') && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs text-foreground-500">Option D <span className="text-red-500">*</span></label>
                              <button
                                type="button"
                                onClick={() => removeOption('d')}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={form.optionD}
                              onChange={(e) => updateField('optionD', e.target.value)}
                              placeholder="Enter option D..."
                              className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.optionD ? 'border-red-300 bg-red-50/30' : 'border-background-200'}`}
                            />
                            {errors.optionD && <p className="text-xs text-red-500 mt-1">{errors.optionD}</p>}
                          </div>
                        )}

                        {visibleOptions.has('e') && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs text-foreground-500">Option E (optional)</label>
                              <button
                                type="button"
                                onClick={() => removeOption('e')}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={form.optionE}
                              onChange={(e) => updateField('optionE', e.target.value)}
                              placeholder="Enter optional fifth option..."
                              className="w-full px-4 py-3 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                            />
                          </div>
                        )}
                      </div>

                      {canAddMore && (
                        <button
                          type="button"
                          onClick={addNextOption}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-add-line"></i>
                          Add Options
                        </button>
                      )}
                    </div>

                    {/* Correct + Sequence */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground-700 mb-2">Correct Option</label>
                        <div className="flex gap-2">
                          {(['a', 'b', 'c', 'd', 'e'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              disabled={!visibleOptions.has(opt)}
                              onClick={() => updateField('correctOption', opt)}
                              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer ${!visibleOptions.has(opt)
                                ? 'opacity-30 cursor-not-allowed bg-background-100 text-foreground-400'
                                : form.correctOption === opt
                                  ? 'bg-primary-500 text-background-50 shadow-sm'
                                  : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                                }`}
                            >
                              {opt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground-700 mb-2">
                          Sequence Order <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.sortOrder}
                          onChange={(e) => updateField('sortOrder', parseInt(e.target.value, 10) || 1)}
                          min={1}
                          className={`w-full px-4 py-3 bg-background-50 border rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors ${errors.sortOrder ? 'border-red-300 bg-red-50/30' : 'border-background-200'
                            }`}
                        />
                        {errors.sortOrder && <p className="text-xs text-red-500 mt-1">{errors.sortOrder}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </form>

            {/* Footer */}
            {importMode !== "excel" && <div className="px-8 py-5 border-t border-background-200 shrink-0 bg-background-50">
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowDrawer(false)} className="px-6 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors cursor-pointer">
                  {editingId ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </div>}
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
            <h3 className="font-heading text-lg text-foreground-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-foreground-500 mb-6">This will permanently remove this question. This action cannot be undone.</p>
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