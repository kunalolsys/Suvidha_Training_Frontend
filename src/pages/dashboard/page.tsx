import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import noThumbnail from '@/assets/noThumbnail.png';

const getInitials = (name?: string) => {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
function getStatusIcon(status: any) {
  switch (status) {
    case 'completed':
      return <i className="ri-checkbox-circle-fill text-accent-500 text-xl"></i>;
    case 'unlocked':
      return <i className="ri-play-circle-fill text-primary-500 text-xl"></i>;
    case 'locked':
    default:
      return <i className="ri-lock-fill text-foreground-300 text-xl"></i>;
  }
}

function getStatusBadge(status: any) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
          <i className="ri-check-line text-xs"></i> Completed
        </span>
      );
    case 'unlocked':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium whitespace-nowrap">
          <i className="ri-play-line text-xs"></i> Ready
        </span>
      );
    case 'locked':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-200 text-foreground-500 text-xs font-medium whitespace-nowrap">
          <i className="ri-lock-line text-xs"></i> Locked
        </span>
      );
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState([]);
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchProgress = async () => {
    try {
      const res = await api.get(`${API.PROGRESS}/my-dashboard`);
      setProgress(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.VIDEO}/emp-videos`, {
        designation: user.designation._id
      });

      setVideos(res.data.videos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!user) return;

    fetchVideos();
    fetchProgress();
  }, [user]);
  const designationVideos = videos ?? [];
  const videoProgressMap = new Map();

  progress.forEach((p: any) => {
    videoProgressMap.set(p.video._id, p);
  });
  const completedCount = progress.filter(
    (p: any) => p.status === "completed"
  ).length;
  const totalCount = designationVideos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Redirect admin users to admin dashboard
  if (user.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return (
    <div className="min-h-screen bg-background-50">
      {/* Top Navigation */}
      <header className="bg-background-50 border-b border-background-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <i className="ri-graduation-cap-fill text-lg text-background-50"></i>
            </div>
            <div className="hidden sm:block">
              <span className="font-heading text-lg text-foreground-900">STU</span>
              <span className="text-foreground-500 text-sm ml-2">Training Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground-900">{user.name}</p>
                <p className="text-xs text-foreground-500">{user.designation?.name || ""}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700"> {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-primary-700">
                    {getInitials(user.name)}
                  </span>
                )}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-logout-box-r-line text-base"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome + Progress */}
        <div className="mb-10">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-foreground-600 text-sm">
            {user.designation.name} Training Program &middot; {completedCount} of {totalCount} videos completed
          </p>

          {/* Progress Bar */}
          <div className="mt-5 flex items-center gap-4">
            <div className="flex-1 h-2 bg-background-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground-700 whitespace-nowrap">{progressPercent}%</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <i className="ri-play-circle-fill text-xl text-primary-600"></i>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground-900">{totalCount}</p>
                <p className="text-xs text-foreground-500">Total Videos</p>
              </div>
            </div>
          </div>
          <div className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <i className="ri-checkbox-circle-fill text-xl text-accent-600"></i>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground-900">{completedCount}</p>
                <p className="text-xs text-foreground-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-background-50 border border-background-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                <i className="ri-hourglass-line text-xl text-secondary-600"></i>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground-900">{totalCount - completedCount}</p>
                <p className="text-xs text-foreground-500">Remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video List */}
        <div>
          <h2 className="font-heading text-xl text-foreground-900 mb-5">
            {user.designation.name} Training Videos
          </h2>

          <div className="space-y-3">
            {designationVideos.map((video: any, idx) => {
              // 1. Get progress for the current video
              const prog = videoProgressMap.get(video._id?.toString());

              // 2. Get progress for the PREVIOUS video (if this isn't the first one)
              const prevVideo = idx > 0 ? designationVideos[idx - 1] : null;
              const prevProg = prevVideo ? videoProgressMap.get(prevVideo._id?.toString()) : null;

              let status = "locked";

              if (prog) {
                status = prog.status; // 'completed' or 'unlocked' from database
              } else if (idx === 0) {
                // First video is always unlocked if no progress document exists yet
                status = "unlocked";
              } else if (prevProg && prevProg.status === "completed") {
                // Sequential Unlock: Unlock this video ONLY if the previous one is fully completed
                status = "unlocked";
              }

              // Check if it's already completed to prevent retaking the quiz
              const isAlreadyCompleted = status === 'completed';

              return (
                <div
                  key={video._id}
                  className={`bg-background-50 border rounded-xl p-4 md:p-5 flex items-center gap-4 transition-all ${status === 'locked' || isAlreadyCompleted
                    ? 'border-background-200 opacity-70 cursor-not-allowed'
                    : 'border-background-200 hover:border-primary-300 cursor-pointer'
                    }`}
                  onClick={() => {
                    // Guard clause: Only navigate if unlocked AND not already completed
                    if (status === 'unlocked' && !isAlreadyCompleted) {
                      navigate(`/learn/${video._id}`);
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status === 'completed'
                    ? 'bg-accent-100'
                    : status === 'unlocked'
                      ? 'bg-primary-100'
                      : 'bg-background-200'
                    }`}>
                    <span className={`text-sm font-semibold ${status === 'completed'
                      ? 'text-accent-700'
                      : status === 'unlocked'
                        ? 'text-primary-700'
                        : 'text-foreground-400'
                      }`}>
                      {idx + 1}
                    </span>
                  </div>

                  <div className="w-28 h-16 md:w-36 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-background-200">
                    <img
                      src={video.thumbnail || noThumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-foreground-900 text-sm md:text-base truncate">
                        {video.title}
                      </h3>
                      <div className="flex-shrink-0">{getStatusBadge(status)}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-500">
                      {/* <span className="flex items-center gap-1">
                        <i className="ri-time-line"></i> {video.duration}
                      </span> */}
                      {prog && prog.attempts > 0 && (
                        <span className="flex items-center gap-1">
                          <i className="ri-refresh-line"></i> {prog.attempts} attempt{prog.attempts > 1 ? 's' : ''}
                        </span>
                      )}
                      {isAlreadyCompleted && (
                        <span className="text-accent-600 font-medium bg-accent-50/50 px-1.5 py-0.5 rounded">
                          Quiz Locked (Passed)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {/* Custom lock icon display if completed */}
                    {isAlreadyCompleted ? (
                      <i className="ri-checkbox-circle-fill text-accent-500 text-xl" title="Completed - Quiz Locked"></i>
                    ) : (
                      getStatusIcon(status)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {loading ? (
            <div className="text-center py-16 bg-background-50 border border-background-200 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center">
                <i className="ri-loader-4-line text-2xl text-primary-500 animate-spin"></i>
              </div>
              <p className="text-foreground-600 font-medium">Loading training videos...</p>
              <p className="text-sm text-foreground-500 mt-1">
                Please wait while we fetch your assigned modules.
              </p>
            </div>
          ) : !Array.isArray(designationVideos) || designationVideos.length === 0 ? (
            <div className="text-center py-16 bg-background-50 border border-background-200 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center">
                <i className="ri-video-line text-2xl text-foreground-400"></i>
              </div>
              <p className="text-foreground-600 font-medium">No training videos assigned yet</p>
              <p className="text-sm text-foreground-500 mt-1">
                Your administrator will assign videos for your designation.
              </p>
            </div>
          ) : null}
        </div>
        {/* Training History */}
        <div className="mt-12">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mb-5 text-sm font-medium text-foreground-700 hover:text-foreground-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            {showHistory ? (
              <i className="ri-arrow-down-s-line text-lg"></i>
            ) : (
              <i className="ri-arrow-right-s-line text-lg"></i>
            )}
            <span className="font-heading text-lg">Training History</span>
            <span className="text-xs text-foreground-500 font-normal">
              ({progress.reduce(
                (acc: number, p: any) => acc + p.history.length,
                0
              )} total attempts)
            </span>
          </button>

          {showHistory && (
            <div className="space-y-4">
              {designationVideos.map((video) => {
                const prog = videoProgressMap.get(video._id);
                if (!prog || prog.history.length === 0) return null;

                return (
                  <div key={video._id} className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-background-100 border-b border-background-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${prog.status === 'completed'
                          ? 'bg-accent-100 text-accent-700'
                          : prog.status === 'unlocked'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-background-200 text-foreground-500'
                          }`}>
                          {prog.status === 'completed' ? 'Passed' : 'In Progress'}
                        </span>
                        <h3 className="text-sm font-medium text-foreground-900 truncate">{video.title}</h3>
                      </div>
                      <span className="text-xs text-foreground-500">{prog.history.length} attempt{prog.history.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="divide-y divide-background-100">
                      {prog.history.map((attempt: any, index: number) => (
                        <div key={index + 1} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-foreground-500 w-20">Attempt #{index + 1}</span>
                            <span className={`text-sm font-semibold ${attempt.passed ? 'text-accent-600' : 'text-red-500'
                              }`}>
                              {attempt.score}/{attempt.totalQuestions}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${attempt.passed
                              ? 'bg-accent-50 text-accent-700'
                              : 'bg-red-50 text-red-600'
                              }`}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                          <span className="text-xs text-foreground-400">{formatDate(attempt.attemptedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {progress.reduce(
                (acc: number, p: any) => acc + p.history.length,
                0
              ) === 0 && (
                  <div className="text-center py-10 bg-background-50 border border-dashed border-background-300 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-background-100 flex items-center justify-center">
                      <i className="ri-history-line text-xl text-foreground-400"></i>
                    </div>
                    <p className="text-sm text-foreground-600">No quiz attempts yet</p>
                    <p className="text-xs text-foreground-500 mt-1">Your quiz history will appear here after you start taking assessments.</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}