import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { getAllEmployees } from '@/mocks/employeeStore';
import { getAllVideos } from '@/mocks/videoStore';
import { getAllEmployeeProgress } from '@/mocks/progressStore';
import { downloadCSV } from '@/utils/csvExport';
import type { Employee } from '@/mocks/employees';
import type { EmployeeProgress } from '@/mocks/progress';

type PeriodLabel = 'Last 30 Days' | 'Last 90 Days' | 'All Time';
type PeriodValue = '30d' | '90d' | 'all';

const periods: { label: PeriodLabel; value: PeriodValue }[] = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function filterByPeriod(progress: EmployeeProgress[], period: PeriodValue): EmployeeProgress[] {
  if (period === 'all') return progress;
  const cutoff = daysAgo(period === '30d' ? 30 : 90);
  return progress.map((p) => {
    const filteredHistory = p.attemptHistory.filter((a) => new Date(a.timestamp) >= cutoff);
    // Recalculate attempts and status based on filtered history
    const lastPassed = [...filteredHistory].reverse().find((a) => a.passed);
    const statusFromHistory = lastPassed
      ? 'completed' as const
      : filteredHistory.length > 0
        ? 'unlocked' as const
        : p.status;
    return {
      ...p,
      attempts: filteredHistory.length,
      attemptHistory: filteredHistory,
      status: statusFromHistory,
    };
  });
}

interface StoreReportRow {
  storeId: string;
  storeName: string;
  employeeCount: number;
  totalAssignments: number;
  completedCount: number;
  completionPct: number;
  bestEmployee: { name: string; avatar: string; pct: number } | null;
  needsAttention: { name: string; avatar: string; pct: number } | null;
}

interface DesignationReportRow {
  designation: string;
  employeeCount: number;
  totalAssignments: number;
  completedCount: number;
  completionPct: number;
  bestStore: { storeName: string; pct: number } | null;
  atRiskCount: number;
}

interface AtRiskRow {
  employee: Employee;
  stuckCount: number;
  totalVideos: number;
  completed: number;
  completionPct: number;
  stuckVideoTitles: string[];
}

interface TopPerformerRow {
  employee: Employee;
  storeName: string;
  completed: number;
  total: number;
  avgPassRate: number;
}

const designationIcons: Record<string, string> = {
  'Sales': 'ri-line-chart-line',
  'Operations': 'ri-settings-3-line',
  'HR': 'ri-user-heart-line',
  'IT': 'ri-terminal-box-line',
  'Finance': 'ri-bank-line',
  'Front Desk': 'ri-customer-service-2-line',
  'Housekeeping': 'ri-home-gear-line',
  'Management': 'ri-vip-crown-line',
  'Kitchen Staff': 'ri-restaurant-line',
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
  const [period, setPeriod] = useState<PeriodValue>('30d');
  const [performanceView, setPerformanceView] = useState<'designation' | 'store'>('designation');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const breakdownRef = useRef<HTMLDivElement>(null);
  const atRiskRef = useRef<HTMLDivElement>(null);
  const topPerfRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allVideos = useMemo(() => getAllVideos(), []);
  const allEmployees = useMemo(() => getAllEmployees().filter((e) => e.role === 'employee'), []);
  const rawEmployeeProgress = useMemo(() => getAllEmployeeProgress(), []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const employeeProgress = useMemo(
    () =>
      rawEmployeeProgress.map((ep) => ({
        employee: ep.employee,
        progress: filterByPeriod(ep.progress, period),
      })),
    [rawEmployeeProgress, period],
  );

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

  // ---- Store Report ----
  const storeReport = useMemo((): StoreReportRow[] => {
    const storeMap = new Map<string, { storeId: string; storeName: string; employees: { emp: Employee; progress: EmployeeProgress[] }[] }>();
    employeeProgress.forEach((ep) => {
      const sid = ep.employee.storeId;
      if (!storeMap.has(sid)) {
        storeMap.set(sid, { storeId: sid, storeName: ep.employee.storeName, employees: [] });
      }
      storeMap.get(sid)!.employees.push({ emp: ep.employee, progress: ep.progress });
    });

    return Array.from(storeMap.values())
      .map((store) => {
        let totalAssignments = 0;
        let completedCount = 0;
        const empPcts: { name: string; avatar: string; pct: number }[] = [];

        store.employees.forEach(({ emp, progress }) => {
          progress.forEach((p) => {
            totalAssignments++;
            if (p.status === 'completed') completedCount++;
          });
          const empTotal = progress.length;
          const empCompleted = progress.filter((p) => p.status === 'completed').length;
          empPcts.push({
            name: emp.name,
            avatar: emp.avatar,
            pct: empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0,
          });
        });

        const sorted = [...empPcts].sort((a, b) => b.pct - a.pct);
        return {
          storeId: store.storeId,
          storeName: store.storeName,
          employeeCount: store.employees.length,
          totalAssignments,
          completedCount,
          completionPct: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
          bestEmployee: sorted.length > 0 ? sorted[0] : null,
          needsAttention:
            sorted.length > 0 && sorted[sorted.length - 1].pct < 50
              ? sorted[sorted.length - 1]
              : null,
        };
      })
      .sort((a, b) => a.storeName.localeCompare(b.storeName));
  }, [employeeProgress]);

  // ---- At-Risk Employees ----
  const atRiskEmployees = useMemo((): AtRiskRow[] => {
    const rows: AtRiskRow[] = [];
    employeeProgress.forEach((ep) => {
      const stuck = ep.progress.filter((p) => p.status !== 'completed' && p.attempts > 0);
      if (stuck.length > 0) {
        const total = ep.progress.length;
        const completed = ep.progress.filter((p) => p.status === 'completed').length;
        rows.push({
          employee: ep.employee,
          stuckCount: stuck.length,
          totalVideos: total,
          completed,
          completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
          stuckVideoTitles: stuck.map((s) => {
            const vid = allVideos.find((v) => v.id === s.videoId);
            return vid ? vid.title : s.videoId;
          }),
        });
      }
    });
    return rows.sort((a, b) => a.completionPct - b.completionPct);
  }, [employeeProgress, allVideos]);

  // ---- Top Performers ----
  const topPerformers = useMemo((): TopPerformerRow[] => {
    return employeeProgress
      .filter((ep) => {
        const total = ep.progress.length;
        const completed = ep.progress.filter((p) => p.status === 'completed').length;
        return total > 0 && completed === total;
      })
      .map((ep) => {
        const total = ep.progress.length;
        const attemptsWithHistory = ep.progress.filter((p) => p.attemptHistory.length > 0);
        const sumPassRate = attemptsWithHistory.reduce((acc, p) => {
          const last = p.attemptHistory[p.attemptHistory.length - 1];
          return acc + (last?.passed ? 1 : 0);
        }, 0);
        return {
          employee: ep.employee,
          storeName: ep.employee.storeName,
          completed: total,
          total,
          avgPassRate:
            attemptsWithHistory.length > 0
              ? Math.round((sumPassRate / attemptsWithHistory.length) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.avgPassRate - a.avgPassRate);
  }, [employeeProgress]);

  // ---- Designation Report (depends on atRiskEmployees, must come after) ----
  const designationReport = useMemo((): DesignationReportRow[] => {
    const desMap = new Map<string, {
      employees: { emp: Employee; progress: EmployeeProgress[] }[];
      stores: Map<string, { completed: number; total: number }>;
      atRisk: number;
    }>();

    employeeProgress.forEach((ep) => {
      const des = ep.employee.designation;
      if (!desMap.has(des)) {
        desMap.set(des, { employees: [], stores: new Map(), atRisk: 0 });
      }
      const entry = desMap.get(des)!;
      entry.employees.push({ emp: ep.employee, progress: ep.progress });

      const sid = ep.employee.storeId;
      if (!entry.stores.has(sid)) {
        entry.stores.set(sid, { completed: 0, total: 0 });
      }
      const storeStats = entry.stores.get(sid)!;
      ep.progress.forEach((p) => {
        storeStats.total++;
        if (p.status === 'completed') storeStats.completed++;
      });
    });

    const atRiskEmpIds = new Set(atRiskEmployees.map((r) => r.employee.id));

    return Array.from(desMap.entries())
      .map(([designation, data]) => {
        let totalAssignments = 0;
        let completedCount = 0;
        data.employees.forEach(({ progress }) => {
          progress.forEach((p) => {
            totalAssignments++;
            if (p.status === 'completed') completedCount++;
          });
        });

        let atRiskCount = 0;
        data.employees.forEach(({ emp }) => {
          if (atRiskEmpIds.has(emp.id)) atRiskCount++;
        });

        let bestStore: { storeName: string; pct: number } | null = null;
        data.stores.forEach((stats, storeId) => {
          const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          if (!bestStore || pct > bestStore.pct) {
            const emp = data.employees.find((e) => e.emp.storeId === storeId);
            bestStore = { storeName: emp?.emp.storeName ?? storeId, pct };
          }
        });

        return {
          designation,
          employeeCount: data.employees.length,
          totalAssignments,
          completedCount,
          completionPct: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
          bestStore,
          atRiskCount,
        };
      })
      .sort((a, b) => b.completionPct - a.completionPct);
  }, [employeeProgress, atRiskEmployees]);

  // ---- KPI Stats ----
  const kpiStats = useMemo(() => {
    let totalAssignments = 0;
    let totalCompleted = 0;
    let totalAttempts = 0;
    let totalPassedFirstTry = 0;
    let totalWithAttempts = 0;

    const allFilteredProgress = employeeProgress.flatMap((ep) => ep.progress);
    allFilteredProgress.forEach((p) => {
      totalAssignments++;
      if (p.status === 'completed') totalCompleted++;
      totalAttempts += p.attempts;
      if (p.attemptHistory.length > 0) {
        totalWithAttempts++;
        if (p.attemptHistory[0].passed) totalPassedFirstTry++;
      }
    });

    return {
      overallCompletionPct: totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0,
      employeesAt100: topPerformers.length,
      totalEmployees: allEmployees.length,
      totalAttempts,
      firstTryPassRate: totalWithAttempts > 0 ? Math.round((totalPassedFirstTry / totalWithAttempts) * 100) : 0,
      atRiskCount: atRiskEmployees.length,
    };
  }, [employeeProgress, allEmployees, topPerformers, atRiskEmployees]);

  // ---- CSV Export Handlers ----
  const exportStoreReport = useCallback(() => {
    downloadCSV(
      `store-performance-${period}.csv`,
      ['Store ID', 'Store Name', 'Employees', 'Total Assignments', 'Completed', 'Completion %', 'Top Employee', 'Top Employee %', 'Needs Attention', 'At-Risk %'],
      storeReport.map((s) => [
        s.storeId,
        s.storeName,
        String(s.employeeCount),
        String(s.totalAssignments),
        String(s.completedCount),
        `${s.completionPct}%`,
        s.bestEmployee?.name ?? '',
        s.bestEmployee ? `${s.bestEmployee.pct}%` : '',
        s.needsAttention?.name ?? '',
        s.needsAttention ? `${s.needsAttention.pct}%` : '',
      ]),
    );
  }, [storeReport, period]);

  const exportAtRisk = useCallback(() => {
    downloadCSV(
      `at-risk-employees-${period}.csv`,
      ['Employee Name', 'Store', 'Designation', 'Completed', 'Total Videos', 'Completion %', 'Stuck Quizzes', 'Stuck Video Titles'],
      atRiskEmployees.map((r) => [
        r.employee.name,
        r.employee.storeName,
        r.employee.designation,
        String(r.completed),
        String(r.totalVideos),
        `${r.completionPct}%`,
        String(r.stuckCount),
        r.stuckVideoTitles.join('; '),
      ]),
    );
  }, [atRiskEmployees, period]);

  const exportTopPerformers = useCallback(() => {
    downloadCSV(
      `top-performers-${period}.csv`,
      ['Employee Name', 'Store', 'Designation', 'Videos Completed', 'Total Videos', 'First-Try Pass Rate'],
      topPerformers.map((r) => [
        r.employee.name,
        r.storeName,
        r.employee.designation,
        String(r.completed),
        String(r.total),
        `${r.avgPassRate}%`,
      ]),
    );
  }, [topPerformers, period]);

  const exportDesignationReport = useCallback(() => {
    downloadCSV(
      `designation-performance-${period}.csv`,
      ['Designation', 'Employees', 'Total Assignments', 'Completed', 'Completion %', 'Best Store', 'Best Store %', 'At-Risk Count'],
      designationReport.map((d) => [
        d.designation,
        String(d.employeeCount),
        String(d.totalAssignments),
        String(d.completedCount),
        `${d.completionPct}%`,
        d.bestStore?.storeName ?? '',
        d.bestStore ? `${d.bestStore.pct}%` : '',
        String(d.atRiskCount),
      ]),
    );
  }, [designationReport, period]);

  if (!user || user.role !== 'admin') {
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

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 lg:py-8">
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    period === p.value
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
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-primary-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                <i className="ri-pie-chart-line text-lg text-primary-600"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{kpiStats.overallCompletionPct}%</p>
              <p className="text-xs text-foreground-500 mt-0.5">Overall Completion</p>
            </div>
            <div
              onClick={() => scrollToSection(topPerfRef, 'topperf')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-accent-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center mb-3 group-hover:bg-accent-200 transition-colors">
                <i className="ri-trophy-line text-lg text-accent-600"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">
                {kpiStats.employeesAt100}<span className="text-sm font-normal text-foreground-500">/{kpiStats.totalEmployees}</span>
              </p>
              <p className="text-xs text-foreground-500 mt-0.5">Employees at 100%</p>
            </div>
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-secondary-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center mb-3 group-hover:bg-secondary-200 transition-colors">
                <i className="ri-check-double-line text-lg text-secondary-600"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{kpiStats.firstTryPassRate}%</p>
              <p className="text-xs text-foreground-500 mt-0.5">First-Try Pass Rate</p>
            </div>
            <div
              onClick={() => scrollToSection(breakdownRef, 'breakdown')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-amber-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <i className="ri-refresh-line text-lg text-amber-600"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{kpiStats.totalAttempts}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Total Quiz Attempts</p>
            </div>
            <div
              onClick={() => scrollToSection(atRiskRef, 'atrisk')}
              className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5 cursor-pointer hover:border-red-300 hover:bg-background-100/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                <i className="ri-alert-line text-lg text-red-600"></i>
              </div>
              <p className="text-2xl font-semibold text-red-600">{kpiStats.atRiskCount}</p>
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      performanceView === 'designation'
                        ? 'bg-background-50 text-foreground-900'
                        : 'text-foreground-500 hover:text-foreground-700'
                    }`}
                  >
                    By Designation
                  </button>
                  <button
                    onClick={() => setPerformanceView('store')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      performanceView === 'store'
                        ? 'bg-background-50 text-foreground-900'
                        : 'text-foreground-500 hover:text-foreground-700'
                    }`}
                  >
                    By Store
                  </button>
                </div>
              </div>
              <button
                onClick={performanceView === 'designation' ? exportDesignationReport : exportStoreReport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                title="Download CSV"
              >
                <i className="ri-download-line text-sm"></i>
                Export
              </button>
            </div>

            {/* Designation View */}
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
                    {designationReport.map((des) => (
                      <tr key={des.designation} className="hover:bg-background-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${designationColors[des.designation] || 'bg-accent-100 text-accent-600'}`}>
                              <i className={`${designationIcons[des.designation] || 'ri-briefcase-line'} text-sm`}></i>
                            </div>
                            <p className="text-sm font-medium text-foreground-900">{des.designation}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground-700 text-center">{des.employeeCount}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${completionBg(des.completionPct)}`}>
                              {des.completionPct}%
                            </span>
                            <span className="text-xs text-foreground-400">{des.completedCount}/{des.totalAssignments}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {des.bestStore ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                                <i className="ri-store-2-line text-xs text-accent-600"></i>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground-700 truncate">{des.bestStore.storeName}</p>
                                <p className="text-xs text-accent-600">{des.bestStore.pct}%</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {des.atRiskCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {des.atRiskCount}
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

            {/* Store View */}
            {performanceView === 'store' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-background-200">
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Store</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Employees</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center">Completion</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Top Employee</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Needs Attention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-100">
                    {storeReport.map((store) => (
                      <tr key={store.storeId} className="hover:bg-background-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                              <i className="ri-store-2-line text-sm text-foreground-500"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground-900">{store.storeName}</p>
                              <p className="text-xs text-foreground-400 font-mono">{store.storeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground-700 text-center">{store.employeeCount}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${completionBg(store.completionPct)}`}>
                              {store.completionPct}%
                            </span>
                            <span className="text-xs text-foreground-400">{store.completedCount}/{store.totalAssignments}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {store.bestEmployee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {store.bestEmployee.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground-700 truncate">{store.bestEmployee.name}</p>
                                <p className="text-xs text-accent-600">{store.bestEmployee.pct}%</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {store.needsAttention ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {store.needsAttention.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground-700 truncate">{store.needsAttention.name}</p>
                                <p className="text-xs text-red-600">{store.needsAttention.pct}%</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---- Two-Column: At-Risk + Top Performers ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* At-Risk Employees */}
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
                  {atRiskEmployees.length}
                </span>
                {atRiskEmployees.length > 0 && (
                  <button
                    onClick={exportAtRisk}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                    title="Download CSV"
                  >
                    <i className="ri-download-line text-xs"></i>
                  </button>
                )}
              </div>
              {atRiskEmployees.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-emotion-happy-line text-xl text-accent-600"></i>
                  </div>
                  <p className="text-sm font-medium text-foreground-900">All Clear</p>
                  <p className="text-xs text-foreground-500 mt-0.5">No employees are currently stuck on quizzes</p>
                </div>
              ) : (
                <div className="divide-y divide-background-100">
                  {atRiskEmployees.slice(0, 6).map((row) => (
                    <div key={row.employee.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-background-50/70 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {row.employee.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground-900 truncate">{row.employee.name}</p>
                          <span className="text-xs text-foreground-400 flex-shrink-0">{row.employee.storeId}</span>
                        </div>
                        <p className="text-xs text-foreground-500 mb-1.5">
                          {row.completed}/{row.totalVideos} completed · {row.stuckCount} {row.stuckCount === 1 ? 'quiz' : 'quizzes'} stuck
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {row.stuckVideoTitles.slice(0, 2).map((title, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                              {title.length > 28 ? title.slice(0, 28) + '...' : title}
                            </span>
                          ))}
                          {row.stuckVideoTitles.length > 2 && (
                            <span className="text-xs text-foreground-400">+{row.stuckVideoTitles.length - 2} more</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-semibold mt-0.5 flex-shrink-0 ${completionColor(row.completionPct)}`}>
                        {row.completionPct}%
                      </span>
                    </div>
                  ))}
                  {atRiskEmployees.length > 6 && (
                    <div className="px-5 py-2.5 text-center">
                      <span className="text-xs text-foreground-400">+{atRiskEmployees.length - 6} more employees</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top Performers */}
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
                  {topPerformers.length}
                </span>
                {topPerformers.length > 0 && (
                  <button
                    onClick={exportTopPerformers}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                    title="Download CSV"
                  >
                    <i className="ri-download-line text-xs"></i>
                  </button>
                )}
              </div>
              {topPerformers.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-background-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-trophy-line text-xl text-foreground-400"></i>
                  </div>
                  <p className="text-sm font-medium text-foreground-900">No 100% Yet</p>
                  <p className="text-xs text-foreground-500 mt-0.5">Nobody has completed all their training in this period</p>
                </div>
              ) : (
                <div className="divide-y divide-background-100">
                  {topPerformers.map((row, idx) => (
                    <div key={row.employee.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-background-50/70 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {row.employee.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground-900 truncate">{row.employee.name}</p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary-100 text-secondary-700 flex-shrink-0">
                            {row.employee.designation}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-500">{row.storeName} · {row.completed}/{row.total} videos · {row.avgPassRate}% first-try pass</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {idx === 0 && <i className="ri-medal-fill text-lg text-amber-500"></i>}
                        {idx === 1 && <i className="ri-medal-fill text-lg text-foreground-300"></i>}
                        {idx === 2 && <i className="ri-medal-fill text-lg text-amber-700"></i>}
                        <i className="ri-checkbox-circle-fill text-lg text-accent-500"></i>
                      </div>
                    </div>
                  ))}
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