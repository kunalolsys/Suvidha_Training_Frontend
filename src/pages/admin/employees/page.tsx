import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import type { Employee } from '@/mocks/employees';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import Pagination from '@/common/Pagination';
import { useDebounce } from '@/common/Debounce';
import { message, Select } from 'antd';
import EmployeeImportModal from '@/common/csvUpload';

// ── TYPES ─────────────────────────────────────────────────────────────
interface QuestionOption {
  optionText: string;
  isCorrect: boolean;
}

interface QuestionSnapshot {
  questionId: string;
  questionText: string;
  options: QuestionOption[];
  selectedOptionIndex: number;
  isCorrect: boolean;
}

interface AttemptHistory {
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string;
  snapshot?: QuestionSnapshot[];
}

interface ProgressRecord {
  _id: string;
  employee: string;
  status: 'completed' | 'unlocked' | 'locked';
  attempts: number;
  completedAt?: string;
  createdAt?: string;
  videoSnapshot?: {
    title: string;
    sortOrder?: number;
    duration?: string;
    designationName?: string;
  };
  video?: {
    _id: string;
    title: string;
    veedUrl?: string;
    isActive?: boolean;
  };
  designation?: {
    _id: string;
    name: string;
  };
  history?: AttemptHistory[];
}

export default function AdminEmployeesPage() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState([]);
  const [stores, setStores] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formStoreId, setFormStoreId] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // ── PROGRESS MODAL STATES ─────────────────────────────────────────────
  const [progressModalEmployee, setProgressModalEmployee] = useState<Employee | null>(null);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [progressLoading, setProgressLoading] = useState<boolean>(false);
  
  const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);
  const [viewingQuizSnapshot, setViewingQuizSnapshot] = useState<{
    moduleTitle: string;
    attempt: AttemptHistory;
  } | null>(null);

  const syncEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.post(`${API.USER}/sync-stu-employees`);
      setSyncResult(res);
      setLastSyncTime(new Date());
      setTimeout(() => {
        setSyncResult(null);
      }, 10000);
      await fetchEmployees();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.USER}`, {
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        designation: designationFilter,
        store: storeFilter,
      });

      setEmployees(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await api.get(`${API.DESIGNATION}/all`, {});
      setDesignations(res.data.designations);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get(`${API.STORE}/all`, {});
      setStores(res.data.stores);
    } catch (err) {
      console.error(err);
    }
  };

  const openProgressModal = async (emp: Employee) => {
    setProgressModalEmployee(emp);
    setProgressLoading(true);
    setProgressRecords([]);
    setActiveModuleTab(null);
    setViewingQuizSnapshot(null);

    try {
      const res = await api.get(`${API.PROGRESS}/${emp._id}`);
      const list: ProgressRecord[] = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray(res.data?.data) 
        ? res.data.data 
        : [];

      setProgressRecords(list);
      if (list.length > 0) {
        setActiveModuleTab(list[0]._id);
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
      message.error("Failed to fetch employee training records.");
    } finally {
      setProgressLoading(false);
    }
  };

  const closeProgressModal = () => {
    setProgressModalEmployee(null);
    setProgressRecords([]);
    setViewingQuizSnapshot(null);
  };

  useEffect(() => {
    const init = async () => {
      fetchEmployees();
      fetchStores();
      fetchDesignations();
    };

    init();

    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedSearch, designationFilter, storeFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, designationFilter, storeFilter]);

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormDesignation("");
    setFormStoreId('');
    setFormStoreName('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingId(employee._id);
    setFormName(employee.name);
    setFormEmail(employee.email);
    setFormDesignation(employee.designation._id);
    setFormStoreId("");
    setFormStoreName(employee.store._id);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const name = (formName ?? '').trim();

    if (!name || !formDesignation) {
      setFormError('Please fill in all required fields (Name and Designation).');
      return;
    }

    const email = (formEmail ?? '').trim();
    const storeName = (formStoreName ?? '').trim();

    if (editingId) {
      const res = await api.put(`${API.USER}/${editingId}`, {
        name,
        email: email || undefined,
        designation: formDesignation,
        store: storeName || undefined,
      });
      if (res.success) {
        setFormSuccess(res.message || 'Employee updated successfully.');
      } else {
        setFormError(res.message || 'Something went wrong.');
      }
    }
    fetchEmployees();
    modalTimerRef.current = setTimeout(() => closeModal(), 800);
  };

  const handleDelete = async (id: string) => {
    const res = await api.delete(`${API.USER}/${id}`);
    if (res.success) {
      message.success(res.message || "Employee deleted successfully.");
    } else {
      message.error(res.message || "Something went wrong.");
    }
    fetchEmployees();
    setDeleteConfirmId(null);
  };

  const getInitials = (name: string) => {
    if (!name) return "EM";
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "-"
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  return (
    <div className="min-h-screen bg-background-50 flex">
      <AdminSidebar />

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background-50 border-b border-background-200 sticky top-0 z-20">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-graduation-cap-fill text-sm text-background-50"></i>
              </div>
              <span className="font-heading text-base text-foreground-900">STU Admin</span>
            </div>
          </div>
        </header>

        <div className="mx-auto px-4 md:px-6 py-6 lg:py-8">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-xl md:text-2xl text-foreground-900">Employees</h1>
              <p className="text-sm text-foreground-500 mt-0.5">Manage your workforce and training assignments</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-background-200 bg-background-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground-900">
                  Employee Synchronization
                </h3>
                <p className="mt-1 text-xs text-foreground-500">
                  Sync employees from the STU master database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {lastSyncTime && (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <div className="text-xs">
                      <p className="font-medium text-emerald-700">Last Sync</p>
                      <p className="text-emerald-600">
                        {lastSyncTime.toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={syncEmployees}
                  disabled={loading}
                  className={`group inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-300
                    ${loading
                      ? "cursor-not-allowed bg-slate-300 text-white"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow hover:shadow-md hover:-translate-y-0.5"
                    }`}
                >
                  <i
                    className={`text-base ${loading
                      ? "ri-loader-4-line animate-spin"
                      : "ri-refresh-line transition-transform duration-500 group-hover:rotate-180"
                      }`}
                  />
                  <span>{loading ? "Syncing..." : "Sync"}</span>
                </button>

                <EmployeeImportModal />
              </div>
            </div>
          </div>

          {syncResult && !loading && (
            <div className="mb-6 rounded-xl border border-green-200 bg-white shadow-sm">
              <div className="border-b border-green-100 bg-green-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <i className="ri-checkbox-circle-fill text-xl text-green-600"></i>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Employee Synchronization Completed
                      </h3>
                      <p className="text-sm text-gray-500">
                        {syncResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary-50 px-4 py-2 text-center">
                    <div className="text-xl font-bold text-primary-600">
                      {syncResult.totalFromSTU}
                    </div>
                    <div className="text-xs text-gray-500">
                      STU Employees
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-5">
                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResult.created}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Created</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncResult.updated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Updated</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-amber-600">
                    {syncResult.skipped}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Duplicates & Skipped</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-emerald-600">
                    {syncResult.activated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Activated</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {syncResult.deactivated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Deactivated</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-foreground-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-50 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            <Select
              value={designationFilter || undefined}
              placeholder="All Designations"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(value) => setDesignationFilter(value || "")}
              className="w-64"
              options={[
                {
                  label: "All Designations",
                  value: "",
                },
                ...designations.map((d: any) => ({
                  label: d.name,
                  value: d._id,
                })),
              ]}
            />
            <Select
              showSearch
              allowClear
              size="large"
              placeholder="All Stores"
              value={storeFilter || undefined}
              onChange={(value) => setStoreFilter(value || "")}
              options={stores.map((s: any) => ({
                label: s.name,
                value: s._id,
              }))}
              optionFilterProp="label"
              className="min-w-[220px] w-full sm:w-auto"
            />
          </div>

          {/* Table */}
          <div className="bg-background-50 border border-background-200 rounded-xl flex flex-col h-[700px] relative z-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                {/* Fixed z-index on table header */}
                <thead className="sticky top-0 bg-background-100 z-10">
                  <tr className="border-b border-background-200">
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Employee Code</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-background-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="h-[450px] text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <i className="ri-loader-4-line text-2xl text-primary-500 animate-spin"></i>
                          <span className="text-sm text-foreground-500 font-medium">Loading employees...</span>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-[450px] text-center text-sm text-foreground-400"
                      >
                        <i className="ri-team-line text-2xl mb-2 block text-foreground-300"></i>
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr
                        key={emp.employeeId || emp._id}
                        className="hover:bg-background-50/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                              {getInitials(emp.name)}
                            </div>
                            <span className="text-sm font-medium text-foreground-900">
                              {emp.name || ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-600">
                          {emp.employeeId || ""}
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground-700">
                            {emp.store?.name || ""}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                            {emp.designation?.name || ""}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openProgressModal(emp)}
                              title="View Progress Details"
                              className="p-2 text-foreground-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <i className="ri-bar-chart-box-line text-lg"></i>
                            </button>

                            <button
                              onClick={() => openEditModal(emp)}
                              title="Edit Employee"
                              className="p-2 text-foreground-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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

      {/* ── HIGH-END PROGRESS MODAL (z-[100]) ───────────────────────────── */}
      {progressModalEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background-50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-background-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-background-200 flex items-center justify-between bg-background-100/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base shadow-sm">
                  {getInitials(progressModalEmployee.name)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground-900 text-base">
                    {progressModalEmployee.name}
                  </h3>
                  <p className="text-xs text-foreground-500 flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-foreground-700">{progressModalEmployee.designation?.name || "Employee"}</span>
                    <span>&middot;</span>
                    <span>{progressModalEmployee.store?.name || "Store"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeProgressModal}
                className="p-2 rounded-xl text-foreground-400 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {progressLoading ? (
                <div className="py-20 text-center">
                  <i className="ri-loader-4-line text-3xl text-primary-500 animate-spin mb-2 block"></i>
                  <p className="text-sm font-medium text-foreground-600">Loading training logs...</p>
                </div>
              ) : progressRecords.length === 0 ? (
                <div className="py-16 text-center bg-background-100/40 rounded-2xl border border-dashed border-background-300 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-background-200 flex items-center justify-center mx-auto mb-3 text-foreground-400">
                    <i className="ri-history-line text-2xl"></i>
                  </div>
                  <h4 className="text-base font-semibold text-foreground-800">No Training Progress Found</h4>
                  <p className="text-xs text-foreground-500 mt-1 max-w-sm mx-auto">
                    This employee has not completed or attempted any assigned training videos yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Stats Overview */}
                  {(() => {
                    const total = progressRecords.length;
                    const completed = progressRecords.filter((p) => p.status === 'completed').length;
                    const passRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const totalAttempts = progressRecords.reduce((acc, curr) => acc + (curr.attempts || 0), 0);

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-background-100/70 border border-background-200 rounded-xl p-4">
                            <p className="text-xs text-foreground-500 font-medium">Assigned Videos</p>
                            <p className="text-2xl font-bold text-foreground-900 mt-1">{total}</p>
                          </div>
                          <div className="bg-accent-50/50 border border-accent-200 rounded-xl p-4">
                            <p className="text-xs text-accent-700 font-medium">Videos Completed</p>
                            <p className="text-2xl font-bold text-accent-700 mt-1">{completed}</p>
                          </div>
                          <div className="bg-primary-50/50 border border-primary-200 rounded-xl p-4">
                            <p className="text-xs text-primary-700 font-medium">Completion Rate</p>
                            <p className="text-2xl font-bold text-primary-700 mt-1">{passRate}%</p>
                          </div>
                          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs text-amber-800 font-medium">Total Attempts</p>
                            <p className="text-2xl font-bold text-amber-800 mt-1">{totalAttempts}</p>
                          </div>
                        </div>

                        {/* Overall Progress Bar */}
                        <div className="bg-background-100/50 p-3.5 rounded-xl border border-background-200 space-y-2">
                          <div className="flex justify-between text-xs font-semibold text-foreground-700">
                            <span>Training Progress</span>
                            <span>{completed} of {total} Videos Completed ({passRate}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-background-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-500 rounded-full transition-all duration-500"
                              style={{ width: `${passRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Modules Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-500">
                      Detailed Video Breakdown
                    </h4>

                    <div className="space-y-3">
                      {progressRecords.map((item) => {
                        const title =
                          item.videoSnapshot?.title ||
                          item.video?.title ||
                          "Training Module";

                        const isCompleted = item.status === 'completed';
                        const desigName = item.videoSnapshot?.designationName || item.designation?.name;
                        const isExpanded = activeModuleTab === item._id;

                        return (
                          <div
                            key={item._id}
                            className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden shadow-xs"
                          >
                            {/* Module Header Bar */}
                            <div className="px-5 py-4 bg-background-100/50 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                                  isCompleted
                                    ? 'bg-accent-100 text-accent-700'
                                    : 'bg-primary-100 text-primary-700'
                                }`}>
                                  <i className={isCompleted ? 'ri-checkbox-circle-fill text-xl' : 'ri-play-circle-fill text-xl'}></i>
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-sm font-semibold text-foreground-900 truncate">
                                    {title}
                                  </h5>
                                  <p className="text-xs text-foreground-500 mt-0.5 flex items-center gap-2">
                                    <span>Designation: {desigName || "-"}</span>
                                    <span>&middot;</span>
                                    <span>{item.attempts || 0} Attempt{(item.attempts || 0) > 1 ? 's' : ''}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                  isCompleted
                                    ? 'bg-accent-100 text-accent-700 border-accent-200'
                                    : 'bg-primary-100 text-primary-700 border-primary-200'
                                }`}>
                                  {isCompleted ? 'Completed' : 'In Progress'}
                                </span>

                                <button
                                  onClick={() => setActiveModuleTab(isExpanded ? null : item._id)}
                                  className="p-1.5 text-foreground-500 hover:text-foreground-900 hover:bg-background-200 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center gap-1"
                                >
                                  <span>{isExpanded ? 'Hide History' : 'View Attempts'}</span>
                                  <i className={isExpanded ? 'ri-arrow-up-s-line text-base' : 'ri-arrow-down-s-line text-base'}></i>
                                </button>
                              </div>
                            </div>

                            {/* Attempt History List */}
                            {isExpanded && (
                              <div className="p-4 border-t border-background-200 bg-background-50/50 space-y-2">
                                {!item.history || item.history.length === 0 ? (
                                  <p className="text-xs text-foreground-400 py-2 italic text-center">
                                    No detailed quiz attempt snapshots logged yet.
                                  </p>
                                ) : (
                                  item.history.map((att, hIdx) => (
                                    <div
                                      key={hIdx}
                                      className="p-3 bg-background-100/60 border border-background-200 rounded-xl flex flex-wrap items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-foreground-600 w-16">
                                          Attempt #{hIdx + 1}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                          att.passed
                                            ? 'bg-accent-100 text-accent-700'
                                            : 'bg-rose-100 text-rose-700'
                                        }`}>
                                          Score: {att.score}%
                                        </span>
                                        <span className="text-xs text-foreground-400">
                                          ({att.totalQuestions} Questions)
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-foreground-400">
                                          {formatDate(att.attemptedAt)}
                                        </span>

                                        {att.snapshot && att.snapshot.length > 0 && (
                                          <button
                                            onClick={() =>
                                              setViewingQuizSnapshot({
                                                moduleTitle: title,
                                                attempt: att,
                                              })
                                            }
                                            className="px-2.5 py-1 bg-background-50 hover:bg-background-200 border border-background-300 text-foreground-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                          >
                                            <i className="ri-file-search-line"></i>
                                            Audit Answers
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-background-200 bg-background-100/50 flex justify-end">
              <button
                onClick={closeProgressModal}
                className="px-4 py-2 bg-foreground-900 text-background-50 hover:bg-foreground-800 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ SNAPSHOT AUDIT SUB-MODAL (z-[110] -> OPENS ON TOP) ──── */}
      {viewingQuizSnapshot && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-background-50 border border-background-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-background-200 flex items-center justify-between bg-background-100/80">
              <div>
                <h4 className="font-heading font-bold text-foreground-900 text-sm">
                  {viewingQuizSnapshot.moduleTitle}
                </h4>
                <p className="text-xs text-foreground-500">
                  Attempt Audit Log &middot; Score: {viewingQuizSnapshot.attempt.score}% ({viewingQuizSnapshot.attempt.passed ? 'PASSED' : 'FAILED'})
                </p>
              </div>
              <button
                onClick={() => setViewingQuizSnapshot(null)}
                className="p-1.5 rounded-lg text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {viewingQuizSnapshot.attempt.snapshot?.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-xl border border-background-200 bg-background-100/30 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground-900">
                      <span className="font-bold mr-1">{qIdx + 1}.</span> {q.questionText}
                    </p>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                      q.isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {q.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {q.options?.map((opt, oIdx) => {
                      const isSelected = Number(q.selectedOptionIndex) === oIdx;
                      const isCorrect = opt.isCorrect;

                      let style = "bg-background-50 border-background-200 text-foreground-700";

                      if (isSelected && isCorrect) {
                        style = "bg-accent-50 border-accent-300 text-accent-800 font-medium";
                      } else if (isSelected && !isCorrect) {
                        style = "bg-rose-50 border-rose-300 text-rose-800 font-medium";
                      } else if (isCorrect) {
                        style = "bg-emerald-50/50 border-emerald-300 text-emerald-800 font-medium";
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${style}`}
                        >
                          <span>
                            <strong className="mr-2">{String.fromCharCode(65 + oIdx)}.</strong>
                            {opt.optionText}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                              (Chosen Answer)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-background-200 bg-background-100/50 flex justify-end">
              <button
                onClick={() => setViewingQuizSnapshot(null)}
                className="px-4 py-2 bg-foreground-900 text-background-50 hover:bg-foreground-800 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal (z-[100]) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background-50 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
              <h3 className="font-medium text-foreground-900 text-sm">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button onClick={closeModal} className="p-1 text-foreground-400 hover:text-foreground-700 rounded cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formSuccess && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <i className="ri-checkbox-circle-line"></i>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <i className="ri-error-warning-line"></i>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Work Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rahul.verma@suvidha.com"
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Designation</label>
                <select
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
                >
                  {designations.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Store ID</label>
                  <input
                    type="text"
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    placeholder="e.g. ST-001"
                    className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Store Name</label>
                  <select
                    value={formStoreName}
                    onChange={(e) => setFormStoreName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
                  >
                    {stores.map((s: any) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-background-200 text-foreground-700 text-sm font-medium rounded-lg hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal (z-[100]) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background-50 rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <i className="ri-alert-line text-xl"></i>
              </div>
              <h3 className="font-medium text-foreground-900 text-sm">Delete Employee</h3>
            </div>
            <p className="text-sm text-foreground-600 mb-5">
              Are you sure you want to remove this employee? This will also clear their training progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border border-background-200 text-foreground-700 text-sm font-medium rounded-lg hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}