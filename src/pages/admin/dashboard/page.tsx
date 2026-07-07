import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import Pagination from '@/common/Pagination';
import DesignationGrid from '@/common/DesignationCard';
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const [dashboardRecord, setDashboardRecord] = useState(null)
  const [employeeProgress, setEmployeeProgress] = useState([])
  const [videosByDesg, setVideosByDesg] = useState([])
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const fetchStats = async () => {
    try {
      // setLoading(true);
      const res = await api.get(`${API.DASHBOARD}/stats`,);

      setDashboardRecord(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };
  const fetchEmpProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.DASHBOARD}/employee-progress`, {
        page,
        limit: pagination.limit,
      });

      setEmployeeProgress(res.data);
      setPagination(res.pagination);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchVideoByDesignation = async () => {
    try {
      // setLoading(true);
      const res = await api.get(`${API.DASHBOARD}/videos-by-designation`,);

      setVideosByDesg(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };
  useEffect(() => {
    fetchStats();
    fetchEmpProgress();
    fetchVideoByDesignation();
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, [page]);
  useEffect(() => {
    setPage(1);
  }, []);

  const designationIcons = {
    // ─── ACCOUNTS & FINANCE ───────────────────────────────────────
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

    // ─── RETAIL & VISUAL MERCHANDISING ────────────────────────────
    "CCE": "ri-customer-service-line",            // Customer Care Executive
    "CCE (Brand)": "ri-service-line",
    "Customer Care": "ri-customer-service-2-line",
    "Promoter": "ri-megaphone-line",
    "Promoter (Brand)": "ri-award-line",
    "VM": "ri-t-shirt-air-line",                   // Visual Merchandiser

    // ─── STORE MANAGEMENT & OPERATIONS ────────────────────────────
    "DM": "ri-building-4-line",                    // District/Department Manager
    "DM (POS)": "ri-bubble-chart-line",
    "OM": "ri-briefcase-line",                     // Operations Manager
    "Operations Head": "ri-briefcase-fill",       // Alternative: 'ri-briefcase-fill'
    "SM": "ri-store-3-line",                       // Store Manager
    "Management": "ri-vip-crown-2-line",

    // ─── CRM & ADMIN ──────────────────────────────────────────────
    "CRM": "ri-shake-hands-line",
    "Data Entry": "ri-keyboard-line",
    "HR": "ri-user-shared-line",
    "HR Head": "ri-user-star-line",

    // ─── TECHNOLOGY (HO & LOCATIONS) ──────────────────────────────
    "IT (HO)": "ri-computer-line",
    "IT (Locations)": "ri-router-line",
    "IT (Warehouse)": "ri-server-line",
    "IT Head": "ri-terminal-window-line",

    // ─── WAREHOUSE, LOGISTICS & MERCHANDISING ─────────────────────
    "Head merchandiser": "ri-shirt-line",
    "Merchandiser": "ri-scissors-line",
    "PC HO": "ri-hotel-line",                      // Product Coordinator / Procurement
    "Picker": "ri-hand-heart-line",
    "Scanning": "ri-barcode-box-line",
    "Tagger": "ri-price-tag-2-line",
    "Warehouse Head": "ri-archive-stack-line",

    // ─── SERVICES, FACILITIES & TRADES ────────────────────────────
    "Driver": "ri-steering-2-line",
    "Electrician": "ri-flashlight-line",
    "House Keeping": "ri-home-gear-line",
    "House Keeping Head": "ri-home-smile-line",
    "Operator": "ri-equalizer-line",
    "Security": "ri-shield-user-line",
    "Services (POS)": "ri-terminal-box-line",
    "Tailor": "ri-scissors-2-line",

    // ─── DEFAULT FALLBACK ─────────────────────────────────────────
    "Default": "ri-video-line",
  };

  const designationColors: Record<string, string> = {
    'Sales': 'bg-primary-100 text-primary-600',
    'Operations': 'bg-secondary-100 text-secondary-600',
    'HR': 'bg-accent-100 text-accent-600',
    'IT': 'bg-primary-100 text-primary-600',
    'Finance': 'bg-accent-100 text-accent-600',
    'Front Desk': 'bg-secondary-100 text-secondary-600',
    'Housekeeping': 'bg-accent-100 text-accent-600',
    'Management': 'bg-primary-100 text-primary-600',
    'Kitchen Staff': 'bg-secondary-100 text-secondary-600',
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

        <div className="mx-auto px-4 md:px-6 py-6 lg:py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-1">Admin Dashboard</h1>
            <p className="text-sm text-foreground-500">Overview of your training portal</p>
          </div>

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
            <div className="px-5 py-3.5 bg-background-100 border-b border-background-200 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground-900 text-sm">Employee Training Progress</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Track completion rates and quiz attempts across your workforce</p>
              </div>
              <button
                onClick={() => navigate('/admin/employees')}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer whitespace-nowrap"
              >
                View All
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-background-200">
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Store</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Designation</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Videos</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Completed</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Attempts</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {loading ? Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <div className="h-4 w-10 bg-gray-200 rounded mx-auto"></div>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <div>
                          <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <div className="h-5 w-8 bg-gray-200 rounded-full mx-auto"></div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="h-5 w-8 bg-gray-200 rounded-full mx-auto"></div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="h-5 w-8 bg-gray-200 rounded-full mx-auto"></div>
                      </td>
                    </tr>
                  ))
                    : employeeProgress
                      .map((ep) => {
                        return (
                          <tr key={ep._id} className="hover:bg-background-50/70 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                                  {getInitials(ep.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground-900">{ep.name}</p>
                                  <p className="text-xs text-foreground-500">{ep.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {/* <span className="text-xs text-foreground-400 font-mono">{ep.employee.storeId}</span> */}
                              <p className="text-sm text-foreground-700">{ep.store}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                                {ep.designation}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-foreground-700 text-center">{ep.videos}</td>
                            <td className="px-5 py-3 text-sm text-foreground-700 text-center">
                              <span className={`font-medium ${ep.videos > 0 ? 'text-accent-600' : 'text-foreground-700'}`}>
                                {ep.completed}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-foreground-700 text-center">{ep.attempts}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-sm font-medium ${ep.passRateNum >= 70 ? 'text-accent-600' : ep.passRateNum >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                {ep.passRate}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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