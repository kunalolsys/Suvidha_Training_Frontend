import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSidebar from '@/components/feature/AdminSidebar';
import { getAllEmployees, getEmployeeCount } from '@/mocks/employeeStore';
import { getAllVideos } from '@/mocks/videoStore';
import { getAllQuestions } from '@/mocks/questionStore';
import { getAllProgressForAdmin, getAllEmployeeProgress } from '@/mocks/progressStore';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const [dashboardRecord, setDashboardRecord] = useState(null)
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.REPORT}/dashboard`,);

      setDashboardRecord(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRecord();
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);
  const allProgress = getAllProgressForAdmin();
  const completedCount = allProgress.filter((p) => p.status === 'completed').length;
  const totalAttempts = allProgress.reduce((acc, p) => acc + p.attempts, 0);

  const passRate = totalAttempts > 0
    ? Math.round(
      (allProgress.filter((p) => p.attemptHistory.some((a) => a.passed)).length /
        allProgress.filter((p) => p.attempts > 0).length) *
      100,
    )
    : 0;

  const employeeProgressData = getAllEmployeeProgress();

  const designationVideoCounts = useMemo(() => {
    const vids = getAllVideos();
    const counts: Record<string, number> = {};
    vids.forEach((v) => {
      counts[v.designation] = (counts[v.designation] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  const designationEmployeeCounts = useMemo(() => {
    const emps = getAllEmployees();
    const counts: Record<string, number> = {};
    emps.forEach((e) => {
      if (e.role === 'employee') {
        counts[e.designation] = (counts[e.designation] || 0) + 1;
      }
    });
    return counts;
  }, []);

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
      value: dashboardRecord.completedVideos,
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
      value: `${passRate}%`,
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
                  {employeeProgressData
                    .filter((ep) => ep.employee.role === 'employee')
                    .map((ep) => {
                      const totalVideos = ep.progress.length;
                      const completed = ep.progress.filter((p) => p.status === 'completed').length;
                      const attempts = ep.progress.reduce((acc, p) => acc + p.attempts, 0);
                      const passed = ep.progress.filter(
                        (p) => p.attemptHistory.length > 0 && p.attemptHistory[p.attemptHistory.length - 1].passed,
                      ).length;
                      const personalPassRate = attempts > 0 ? Math.round((passed / ep.progress.filter((p) => p.attempts > 0).length) * 100) : 0;

                      return (
                        <tr key={ep.employee.id} className="hover:bg-background-50/70 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                                {ep.employee.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground-900">{ep.employee.name}</p>
                                <p className="text-xs text-foreground-500">{ep.employee.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs text-foreground-400 font-mono">{ep.employee.storeId}</span>
                            <p className="text-sm text-foreground-700">{ep.employee.storeName}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                              {ep.employee.designation}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">{totalVideos}</td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">
                            <span className={`font-medium ${completed === totalVideos && totalVideos > 0 ? 'text-accent-600' : 'text-foreground-700'}`}>
                              {completed}/{totalVideos}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-700 text-center">{attempts}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-sm font-medium ${personalPassRate >= 70 ? 'text-accent-600' : personalPassRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                              {personalPassRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designationVideoCounts.map(([designation, videoCount]) => {
                const employeeCount = designationEmployeeCounts[designation] || 0;
                return (
                  <div
                    key={designation}
                    className="bg-background-50 border border-background-200 rounded-xl p-5 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${designationColors[designation] || 'bg-accent-100 text-accent-600'}`}>
                        <i className={`${designationIcons[designation] || 'ri-video-line'} text-xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground-900 truncate">{designation}</h4>
                        <p className="text-xs text-foreground-500 mt-0.5">
                          {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-background-100 rounded-lg px-3 py-2.5">
                        <p className="text-lg font-semibold text-foreground-900">{videoCount}</p>
                        <p className="text-xs text-foreground-500">training videos</p>
                      </div>
                      <div className="flex-1 bg-background-100 rounded-lg px-3 py-2.5">
                        <p className="text-lg font-semibold text-foreground-900">{employeeCount}</p>
                        <p className="text-xs text-foreground-500">{employeeCount === 1 ? 'employee' : 'employees'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}