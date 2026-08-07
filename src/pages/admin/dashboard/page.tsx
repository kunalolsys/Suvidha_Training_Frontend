import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import Pagination from '@/common/Pagination';
import DesignationGrid from '@/common/DesignationCard';

const getInitials = (name: string) => {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dashboardRecord, setDashboardRecord] = useState(null);
  const [employeeProgress, setEmployeeProgress] = useState([]);
  const [videosByDesg, setVideosByDesg] = useState([]);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchStats = async () => {
    try {
      const res = await api.get(`${API.DASHBOARD}/stats`);
      setDashboardRecord(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmpProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.DASHBOARD}/employee-progress`, {
        page,
        limit: pagination.limit,
        search, // 👈 Send search query to backend
      });

      setEmployeeProgress(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoByDesignation = async () => {
    try {
      const res = await api.get(`${API.DASHBOARD}/videos-by-designation`);
      setVideosByDesg(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 📥 Handle CSV Export with Active Search Query
  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.append('search', search.trim());

      // Request CSV blob from API endpoint with search filters
      const response = await api.get(
        `${API.DASHBOARD}/export-emp-progress?${queryParams.toString()}`,
        {
          responseType: 'blob',
        }
      );

      const blobData = response.data || response;
      const blob = new Blob([blobData], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `employee_training_progress_${new Date().toISOString().slice(0, 10)}.csv`
      );

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Fetch Stats & Designation data on mount
  useEffect(() => {
    fetchStats();
    fetchVideoByDesignation();
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  // Fetch Employee Progress when page or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmpProgress();
    }, 300); // Debounce search requests by 300ms

    return () => clearTimeout(timer);
  }, [page, search]);

  const designationIcons = {
    "Accounts": "ri-calculator-line",
    "Auditor": "ri-file-shield-2-line",
    "Bank Reconcilation": "ri-exchange-funds-line",
    "Cashier": "ri-hand-coin-line",
    "Debit/Credit notes": "ri-file-list-3-line",
    "Outright accounts": "ri-refund-2-line",
    "Petty Expense": "ri-coins-line",
    "Purchase invoice": "ri-bill-line",
    "SOR Accounts": "ri-refund-line",
    "Stock Reco": "ri-git-commit-line",
    "CCE": "ri-customer-service-line",
    "CCE (Brand)": "ri-service-line",
    "Customer Care": "ri-customer-service-2-line",
    "Promoter": "ri-megaphone-line",
    "Promoter (Brand)": "ri-award-line",
    "VM": "ri-t-shirt-air-line",
    "DM": "ri-building-4-line",
    "DM (POS)": "ri-bubble-chart-line",
    "OM": "ri-briefcase-line",
    "Operations Head": "ri-briefcase-fill",
    "SM": "ri-store-3-line",
    "Management": "ri-vip-crown-2-line",
    "CRM": "ri-shake-hands-line",
    "Data Entry": "ri-keyboard-line",
    "HR": "ri-user-shared-line",
    "HR Head": "ri-user-star-line",
    "IT (HO)": "ri-computer-line",
    "IT (Locations)": "ri-router-line",
    "IT (Warehouse)": "ri-server-line",
    "IT Head": "ri-terminal-window-line",
    "Head merchandiser": "ri-shirt-line",
    "Merchandiser": "ri-scissors-line",
    "PC HO": "ri-hotel-line",
    "Picker": "ri-hand-heart-line",
    "Scanning": "ri-barcode-box-line",
    "Tagger": "ri-price-tag-2-line",
    "Warehouse Head": "ri-archive-stack-line",
    "Driver": "ri-steering-2-line",
    "Electrician": "ri-flashlight-line",
    "House Keeping": "ri-home-gear-line",
    "House Keeping Head": "ri-home-smile-line",
    "Operator": "ri-equalizer-line",
    "Security": "ri-shield-user-line",
    "Services (POS)": "ri-terminal-box-line",
    "Tailor": "ri-scissors-2-line",
    "Default": "ri-video-line",
  };

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  const stats = dashboardRecord ? [
    {
      label: 'Employees',
      value: dashboardRecord.totalEmployees,
      icon: 'ri-team-line',
      color: 'bg-primary-100 text-primary-600',
      path: '/admin/employees',
    },
    {
      label: 'Training Videos',
      value: dashboardRecord.totalVideos,
      icon: 'ri-video-line',
      color: 'bg-accent-100 text-accent-600',
      path: '/admin/videos',
    },
    {
      label: 'Quiz Questions',
      value: dashboardRecord.totalQuestions,
      icon: 'ri-question-line',
      color: 'bg-secondary-100 text-secondary-600',
      path: '/admin/questions',
    },
    {
      label: 'Completions',
      value: dashboardRecord.completions,
      icon: 'ri-checkbox-circle-line',
      color: 'bg-accent-100 text-accent-600',
      path: null,
    },
    {
      label: 'Total Attempts',
      value: dashboardRecord.totalAttempts,
      icon: 'ri-refresh-line',
      color: 'bg-primary-100 text-primary-600',
      path: null,
    },
    {
      label: 'Avg Pass Rate',
      value: `${dashboardRecord.avgPassRate}%`,
      icon: 'ri-bar-chart-line',
      color: 'bg-secondary-100 text-secondary-600',
      path: null,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-background-50 flex">
      {/* <AdminSidebar /> */}

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        {/* <header className="lg:hidden bg-background-50 border-b border-background-200 sticky top-0 z-30">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-graduation-cap-fill text-sm text-background-50"></i>
              </div>
              <span className="font-heading text-base text-foreground-900">STU Admin</span>
            </div>
          </div>
        </header> */}

        <div className="mx-auto px-4 md:px-6 py-6 lg:py-8">
          {/* Page Title */}
          {/* <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-1">Admin Dashboard</h1>
            <p className="text-sm text-foreground-500">Overview of your training portal</p>
          </div> */}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => stat.path && navigate(stat.path)}
                disabled={!stat.path}
                className={`text-left bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 transition-all ${stat.path ? 'hover:border-primary-300 cursor-pointer' : 'cursor-default'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <i className={`${stat.icon} text-xl`}></i>
                </div>
                <p className="text-2xl font-semibold text-foreground-900">{stat.value}</p>
                <p className="text-xs text-foreground-500 mt-0.5">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div
              onClick={() => navigate('/admin/videos')}
              className="bg-background-50 border border-background-200 rounded-xl p-6 flex items-center gap-4 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <i className="ri-video-add-line text-2xl text-primary-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Manage Videos</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Add, edit, or remove training videos and assign them to designations</p>
              </div>
              <i className="ri-arrow-right-line text-xl text-foreground-400 ml-auto"></i>
            </div>
            <div
              onClick={() => navigate('/admin/questions')}
              className="bg-background-50 border border-background-200 rounded-xl p-6 flex items-center gap-4 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                <i className="ri-questionnaire-line text-2xl text-secondary-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Manage Questions</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Create and edit MCQ questions linked to specific videos</p>
              </div>
              <i className="ri-arrow-right-line text-xl text-foreground-400 ml-auto"></i>
            </div>
            <div
              onClick={() => navigate('/admin/employees')}
              className="bg-background-50 border border-background-200 rounded-xl p-6 flex items-center gap-4 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                <i className="ri-user-add-line text-2xl text-accent-600"></i>
              </div>
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Manage Employees</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Add, edit, or remove employees and view their training progress</p>
              </div>
              <i className="ri-arrow-right-line text-xl text-foreground-400 ml-auto"></i>
            </div>
          </div>

          {/* Employee Training Progress - Full Width */}
          <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden mb-10">
            <div className="px-5 py-3.5 bg-background-100 border-b border-background-200 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Employee Training Progress</h3>
                <p className="text-xs text-foreground-500 mt-0.5">
                  Track completion rates and quiz attempts across your workforce
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* 🔍 Search Input (Name, Email, Employee Code) */}
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-xs"></i>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset page on new search
                    }}
                    placeholder="Search name, code..."
                    className="pl-8 pr-8 py-2 text-xs bg-background-50 border border-background-200 rounded-lg text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 w-44 md:w-56"
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 text-xs"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>

                {/* 📥 CSV Export Button */}
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground-700 bg-background-50 border border-background-200 hover:bg-background-200/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                >
                  {exporting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="ri-download-2-line text-sm"></i>
                      Export CSV
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/admin/employees')}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer whitespace-nowrap"
                >
                  View All
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-background-200">
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Code</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Store</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Designation</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Videos</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Completed</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Attempts</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0"></div>
                            <div className="space-y-1">
                              <div className="h-4 w-28 bg-gray-200 rounded"></div>
                              <div className="h-3 w-36 bg-gray-100 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : !employeeProgress || employeeProgress.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm text-foreground-500">
                        {search ? `No employees matching "${search}"` : 'No employee training records found.'}
                      </td>
                    </tr>
                  ) : (
                    employeeProgress.map((ep: any) => {
                      const completedCountVal = ep?.completedCount ?? String(ep?.completed ?? '0').split('/')[0];
                      const passNum = typeof ep?.passRateNum === 'number' ? ep.passRateNum : 0;

                      return (
                        <tr key={ep?._id || Math.random()} className="hover:bg-background-50/70 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                                {getInitials(ep?.name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground-900">{ep?.name || '—'}</p>
                                {/* <p className="text-xs text-foreground-500">{ep?.email || '—'}</p> */}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-mono font-medium text-foreground-600">
                            {ep?.code || '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700">
                            {ep?.store || '—'}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                              {ep?.designation || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">
                            {ep?.videos ?? 0}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">
                            <span className={`font-medium ${ep?.videos > 0 ? 'text-accent-600' : 'text-foreground-700'}`}>
                              {completedCountVal}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">
                            {ep?.attempts ?? 0}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`text-sm font-medium ${passNum >= 70
                                  ? 'text-accent-600'
                                  : passNum >= 40
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}
                            >
                              {ep?.passRate || '0%'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="border-t border-background-200 bg-background-50 px-6 py-4 shrink-0">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>

          {/* Videos by Designation - Full Width Card Grid */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Videos by Designation</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Training content distribution across roles</p>
              </div>
              <button
                onClick={() => navigate('/admin/videos')}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer whitespace-nowrap"
              >
                Manage Videos
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
            <DesignationGrid
              videosByDesg={videosByDesg}
              designationIcons={designationIcons}
            />
          </div>
        </div>
      </main>
    </div>
  );
}