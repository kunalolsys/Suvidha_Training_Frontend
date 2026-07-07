import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { downloadCSV } from '@/utils/csvExport';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import axios from 'axios';

type PeriodLabel = 'Last 30 Days' | 'Last 90 Days' | 'All Time';
type PeriodValue = '30' | '90' | 'all';

const periods: { label: PeriodLabel; value: PeriodValue }[] = [
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
  { label: 'All Time', value: 'all' },
];



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

function completionColor(pct: number): string {
  if (pct >= 80) return 'text-accent-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function completionBg(pct: number): string {
  if (pct >= 80) return 'bg-accent-100 text-accent-700';
  if (pct >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodValue>('30');
  const [performanceView, setPerformanceView] = useState<'designation' | 'store'>('designation');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const breakdownRef = useRef<HTMLDivElement>(null);
  const atRiskRef = useRef<HTMLDivElement>(null);
  const topPerfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false)
  const [loader, setLoader] = useState(false)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stats, setStats] = useState({
    overallCompletion: "0",
    employeesAt100: "0/0",
    firstTryPassRate: "0",
    totalQuizAttempts: 0,
    needAttention: 0
  })
  const [performanceBreakdown, setPerformanceBreakdown] = useState([])
  const [atRiskEmployee, setAtRiskEmployee] = useState([])
  const [topPerformer, setTopPerformer] = useState([])
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.REPORT}/stats`, {
        period
      });

      setStats(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchPerformanceBreakdown = async (currentView: any) => {
    try {
      setLoader(true);
      setPerformanceBreakdown([])
      const endpoint = currentView === "designation" ? "by-designation" : "by-store";

      // FIX: Pass params correctly inside the configuration object
      const res = await api.get(`${API.REPORT}/${endpoint}`, {
        period
      });

      if (res && res.data) {
        setPerformanceBreakdown(res.data);
      }
    } catch (err) {
      console.error("Error fetching performance breakdown:", err);
    } finally {
      setLoader(false);
    }
  };

  const fetchRiskemployee = async () => {
    try {
      setLoading(true);
      // FIX: Pass params correctly inside the configuration object
      const res = await api.get(`${API.REPORT}/at-risk`, {
        period
      });

      if (res && res.data) {
        setAtRiskEmployee(res.data);
      }
    } catch (err) {
      console.error("Error fetching risk employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformer = async () => {
    try {
      setLoading(true);
      // FIX: Pass params correctly inside the configuration object
      const res = await api.get(`${API.REPORT}/top-performers`, {
        period
      });

      if (res && res.data) {
        setTopPerformer(res.data);
      }
    } catch (err) {
      console.error("Error fetching top performers:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- SINGLE COMBINED EFFECT FOR INITIAL/PERIOD DATA SEEDING ---
  useEffect(() => {
    fetchStats();
    fetchRiskemployee();
    fetchTopPerformer();
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, [period]);

  // --- EFFECT FOR DYNAMIC TABLE VIEWS ---
  useEffect(() => {
    if (performanceView) {
      fetchPerformanceBreakdown(performanceView);
    }
  }, [performanceView, period]);

  function scrollToSection(ref: React.RefObject<HTMLDivElement | null>, sectionId: string) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightedSection(sectionId);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedSection((prev) => (prev === sectionId ? null : prev));
    }, 2500);
  }
  const [exportLoading, setExportLoading] = useState(false)
  const downloadReport = async (
    type: string,
    period: string,
    format = "xlsx"
  ) => {
    try {
      setExportLoading(true)
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API.EXPORT}/${type}?period=${period}&format=${format}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const blob = new Blob([res.data], {
        type: res.headers["content-type"],
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${type}-${period}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(false)
    }
  };
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

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
          {/* Page Header + Period Filter */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-1">Reports</h1>
              <p className="text-sm text-foreground-500">Training analytics across all stores and employees</p>
            </div>
            <div className="flex items-center gap-1 bg-background-100 rounded-full p-1 w-fit">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${period === p.value
                    ? 'bg-background-50 text-foreground-900'
                    : 'text-foreground-500 hover:text-foreground-700'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- KPI Summary Cards ---- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {/* ─── CARD 1: OVERALL COMPLETION ─── */}
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-primary-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                <i className="ri-pie-chart-line text-lg text-primary-600"></i>
              </div>

              <p className="text-2xl font-semibold text-foreground-900">{stats.overallCompletion}</p>

              <p className="text-xs text-foreground-500 mt-0.5">Overall Completion</p>
            </div>

            {/* ─── CARD 2: EMPLOYEES AT 100 ─── */}
            <div
              onClick={() => scrollToSection(topPerfRef, 'topperf')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-accent-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center mb-3 group-hover:bg-accent-200 transition-colors">
                <i className="ri-trophy-line text-lg text-accent-600"></i>
              </div>

              <p className="text-2xl font-semibold text-foreground-900">{stats.employeesAt100}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Employees at 100</p>
            </div>

            {/* ─── CARD 3: FIRST-TRY PASS RATE ─── */}
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-secondary-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center mb-3 group-hover:bg-secondary-200 transition-colors">
                <i className="ri-check-double-line text-lg text-secondary-600"></i>
              </div>

              <p className="text-2xl font-semibold text-foreground-900">{stats.firstTryPassRate}</p>
              <p className="text-xs text-foreground-500 mt-0.5">First-Try Pass Rate</p>
            </div>

            {/* ─── CARD 4: TOTAL QUIZ ATTEMPTS ─── */}
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-amber-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <i className="ri-refresh-line text-lg text-amber-600"></i>
              </div>

              <p className="text-2xl font-semibold text-foreground-900">{stats.totalQuizAttempts}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Total Quiz Attempts</p>
            </div>

            {/* ─── CARD 5: NEED ATTENTION ─── */}
            <div
              onClick={() => scrollToSection(atRiskRef, 'atrisk')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-red-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                <i className="ri-alert-line text-lg text-red-600"></i>
              </div>

              <p className="text-2xl font-semibold text-red-600">{stats.needAttention}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Need Attention</p>
            </div>
          </div>

          {/* ---- Performance Breakdown (Designation / Store toggle) ---- */}
          <div
            ref={breakdownRef}
            className={`bg-background-50 border border-background-200 rounded-xl overflow-hidden mb-10 transition-all duration-500 ${highlightedSection === 'breakdown' ? 'ring-2 ring-primary-300 border-primary-300' : ''}`}
          >
            <div className="px-5 py-3.5 bg-background-100 border-b border-background-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-medium text-foreground-900 text-sm">Performance Breakdown</h2>
                  <p className="text-xs text-foreground-500 mt-0.5">
                    {performanceView === 'designation'
                      ? 'Training completion by department across all stores'
                      : 'Training completion rates across all 12 Suvidha locations'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background-200/70 rounded-full p-1">
                  <button
                    onClick={() => setPerformanceView('designation')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${performanceView === 'designation'
                      ? 'bg-background-50 text-foreground-900'
                      : 'text-foreground-500 hover:text-foreground-700'
                      }`}
                  >
                    By Designation
                  </button>
                  <button
                    onClick={() => setPerformanceView('store')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${performanceView === 'store'
                      ? 'bg-background-50 text-foreground-900'
                      : 'text-foreground-500 hover:text-foreground-700'
                      }`}
                  >
                    By Store
                  </button>
                </div>
              </div>
              <button
                disabled={exportLoading}
                onClick={() =>
                  downloadReport(
                    performanceView === "designation"
                      ? "by-designation"
                      : "by-store",
                    period,
                    "xlsx"
                  )
                }
                className={`
    inline-flex items-center gap-2
    px-4 py-2
    rounded-xl
    text-sm font-semibold
    transition-all duration-200
    border border-primary-200
    bg-primary-500 text-white
    shadow-sm
    hover:bg-primary-600
    hover:shadow-lg
    hover:-translate-y-0.5
    active:translate-y-0
    disabled:opacity-60
    disabled:cursor-not-allowed
    disabled:hover:translate-y-0
    disabled:hover:shadow-sm
    whitespace-nowrap
  `}
                title="Download Excel Report"
              >
                {exportLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-base"></i>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-file-excel-2-line text-base"></i>
                    <span>Export Excel</span>
                  </>
                )}
              </button>
            </div>

            {performanceView === 'designation' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-background-200">
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Designation</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Employees</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Completion</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Best Store</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">At-Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-100">
                    {loader ?
                      Array.from({ length: 10 }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-center">
                            <div className="h-4 w-10 bg-gray-200 rounded mx-auto"></div>
                          </td>

                          <td className="px-5 py-3">
                            <div className="flex justify-center gap-2">
                              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                              <div className="h-4 w-12 bg-gray-200 rounded"></div>
                            </div>
                          </td>

                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gray-200"></div>
                              <div>
                                <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
                                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-center">
                            <div className="h-5 w-8 bg-gray-200 rounded-full mx-auto"></div>
                          </td>
                        </tr>
                      )) :
                      performanceBreakdown.map((des) => (
                        <tr key={des.designation} className="hover:bg-background-50/70 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${designationColors[des.designation] || 'bg-accent-100 text-accent-600'}`}>
                                <i className={`${designationIcons[des.designation] || 'ri-briefcase-line'} text-sm`}></i>
                              </div>
                              <p className="text-sm font-medium text-foreground-900">{des.designation}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">{des.employees}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${completionBg(des.completionPct)}`}>
                                {des.completionPct}%
                              </span>
                              <span className="text-xs text-foreground-400">{des.completionFrac}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {des.bestStore ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                                  <i className="ri-store-2-line text-xs text-accent-600"></i>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-foreground-700 truncate">{des.bestStore}</p>
                                  <p className="text-xs text-accent-600">{des.bestStorePct}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-foreground-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {des.atRisk > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {des.atRisk}
                              </span>
                            ) : (
                              <span className="text-xs text-foreground-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {performanceView === 'store' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-background-200">
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Store</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Employees</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Completion</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Total Attempts</th>
                      {/* <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Needs Attention</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-100">
                    {
                      loader ?
                        Array.from({ length: 10 }).map((_, index) => (
                          <tr key={index} className="animate-pulse">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                              </div>
                            </td>

                            <td className="px-5 py-3 text-center">
                              <div className="h-4 w-10 bg-gray-200 rounded mx-auto"></div>
                            </td>

                            <td className="px-5 py-3">
                              <div className="flex justify-center gap-2">
                                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                              </div>
                            </td>

                            <td className="px-5 py-3">
                              <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
                            </td>
                          </tr>
                        )) : performanceBreakdown.map((store) => (
                          <tr key={store.storeId} className="hover:bg-background-50/70 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                                  <i className="ri-store-2-line text-sm text-foreground-500"></i>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground-900">{store.store}</p>
                                  <p className="text-xs text-foreground-400 font-mono">{store.storeCode}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-foreground-700 text-center">{store.employees}</td>
                            <td className="px-5 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${completionBg(store.completionPct)}`}>
                                  {store.completionPct}%
                                </span>
                                <span className="text-xs text-foreground-400">{store.completionFrac}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {store.totalAttempts ? (
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm text-foreground-700 truncate">{store.totalAttempts}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-foreground-400">—</span>
                              )}
                            </td>
                            {/* <td className="px-5 py-3">
                          {store.atRisk ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {store.atRisk}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-400">—</span>
                          )}
                        </td> */}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---- Two-Column: At-Risk + Top Performers ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div
              ref={atRiskRef}
              className={`bg-background-50 border border-background-200 rounded-xl overflow-hidden transition-all duration-500 ${highlightedSection === 'atrisk' ? 'ring-2 ring-red-300 border-red-300' : ''}`}
            >
              <div className="px-5 py-3.5 bg-background-100 border-b border-background-200 flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground-900 text-sm">At-Risk Employees</h2>
                  <p className="text-xs text-foreground-500 mt-0.5">Staff who have failed quizzes and need intervention</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {atRiskEmployee.length}
                </span>
                {/* {atRiskEmployee.length > 0 && (
                  <button
                    onClick={exportAtRisk}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                    title="Download CSV"
                  >
                    <i className="ri-download-line text-xs"></i>
                  </button>
                )} */}
              </div>
              {atRiskEmployee.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-emotion-happy-line text-xl text-accent-600"></i>
                  </div>
                  <p className="text-sm font-medium text-foreground-900">All Clear</p>
                  <p className="text-xs text-foreground-500 mt-0.5">No employees are currently stuck on quizzes</p>
                </div>
              ) : (
                <div className="divide-y divide-background-100">
                  {atRiskEmployee.slice(0, 6).map((row) => (
                    <div key={row._id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-background-50/70 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {/* Generates initials (e.g., "DS" for "DEEPAK SAROHA") */}
                        {row.name ? row.name.split(' ').map(n => n[0]).join('').slice(0, 2) : ''}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground-900 truncate">{row.name}</p>
                          <span className="text-xs text-foreground-400 flex-shrink-0">{row.store}</span>
                        </div>

                        <p className="text-xs text-foreground-500 mb-1.5">
                          {row.completed} completed · {row.stuckVideos?.length || 0} {(row.stuckVideos?.length === 1) ? 'quiz' : 'quizzes'} stuck
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {/* Changed 'title' to 'videoObj' and mapped to 'videoObj.title' */}
                          {row.stuckVideos?.slice(0, 2).map((videoObj, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                              {videoObj.title || ""}
                            </span>
                          ))}

                          {/* Fixed to check against 'stuckVideos.length' instead of missing property */}
                          {row.stuckVideos?.length > 2 && (
                            <span className="text-xs text-foreground-400">+{row.stuckVideos.length - 2} more</span>
                          )}
                        </div>
                      </div>

                      {/* If completionPct doesn't exist on the API, fallback to passRate */}
                      <span className={`text-sm font-semibold mt-0.5 flex-shrink-0 ${typeof completionColor === 'function' ? completionColor(row.completionPct || parseInt(row.passRate)) : ''}`}>
                        {row.completionPct !== undefined ? `${row.completionPct}%` : row.passRate}
                      </span>
                    </div>
                  ))}

                  {atRiskEmployee.length > 6 && (
                    <div className="px-5 py-2.5 text-center">
                      <span className="text-xs text-foreground-400">+{atRiskEmployee.length - 6} more employees</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              ref={topPerfRef}
              className={`bg-background-50 border border-background-200 rounded-xl overflow-hidden transition-all duration-500 ${highlightedSection === 'topperf' ? 'ring-2 ring-accent-300 border-accent-300' : ''}`}
            >
              <div className="px-5 py-3.5 bg-background-100 border-b border-background-200 flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground-900 text-sm">Top Performers</h2>
                  <p className="text-xs text-foreground-500 mt-0.5">Employees with 100% training completion</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                  {topPerformer.length}
                </span>
                {/* {topPerformer.length > 0 && (
                  <button
                    onClick={exportTopPerformers}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                    title="Download CSV"
                  >
                    <i className="ri-download-line text-xs"></i>
                  </button>
                )} */}
              </div>
              {topPerformer.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-background-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-trophy-line text-xl text-foreground-400"></i>
                  </div>
                  <p className="text-sm font-medium text-foreground-900">No 100% Yet</p>
                  <p className="text-xs text-foreground-500 mt-0.5">Nobody has completed all their training in this period</p>
                </div>
              ) : (
                <div className="divide-y divide-background-100">
                  {topPerformer.map((row, idx) => {
                    // Safely extract completed and total from the "3/3" string format
                    const [completedCount, totalCount] = row.completed ? row.completed.split('/') : [0, 0];

                    return (
                      <div key={row._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-background-50/70 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {/* Fallback to initials if avatar doesn't exist on the root object */}
                          {row.avatar || (row.name ? row.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '')}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-foreground-900 truncate">{row.name}</p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary-100 text-secondary-700 flex-shrink-0">
                              {row.designation}
                            </span>
                          </div>

                          <p className="text-xs text-foreground-500">
                            {row.store} · {completedCount}/{totalCount} videos · {row.passRate} first-try pass
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {idx === 0 && <i className="ri-medal-fill text-lg text-amber-500"></i>}
                          {idx === 1 && <i className="ri-medal-fill text-lg text-foreground-300"></i>}
                          {idx === 2 && <i className="ri-medal-fill text-lg text-amber-700"></i>}
                          <i className="ri-checkbox-circle-fill text-lg text-accent-500"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom spacer for breathing room */}
          <div className="h-4"></div>
        </div>
      </main>
    </div>
  );
}