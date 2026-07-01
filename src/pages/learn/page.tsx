import { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { videos as allVideos } from '@/mocks/videos';
import { questions as allQuestions } from '@/mocks/questions';
import { getVideoProgress, markVideoCompleted, recordAttempt, unlockNextVideo } from '@/mocks/progressStore';
import VideoPlayer from './components/VideoPlayer';
import MCQQuiz from './components/MCQQuiz';
import QuizResult from './components/QuizResult';

export default function LearnPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  const video = useMemo(() => allVideos.find((v) => v.id === videoId), [videoId]);
  const videoQuestions = useMemo(
    () => allQuestions.filter((q) => q.videoId === videoId).sort((a, b) => a.sortOrder - b.sortOrder),
    [videoId],
  );
  const progress = user && videoId ? getVideoProgress(user.id, videoId) : undefined;

  const nextVideo = useMemo(() => {
    if (!video) return undefined;
    return allVideos.find(
      (v) => v.designation === video.designation && v.sortOrder === video.sortOrder + 1,
    );
  }, [video]);

  const handleQuizSubmit = useCallback(
    (answers: Record<string, string>) => {
      if (!user || !videoId) return;
      let correct = 0;
      videoQuestions.forEach((q) => {
        if (answers[q.id] === q.correctOption) correct += 1;
      });
      setCorrectCount(correct);
      const passed = correct === videoQuestions.length;
      setQuizPassed(passed);
      setQuizSubmitted(true);
      recordAttempt(user.id, videoId, correct, videoQuestions.length, answers, passed);
      if (passed) {
        markVideoCompleted(user.id, videoId);
        unlockNextVideo(user.id, videoId);
      }
    },
    [user, videoId, videoQuestions],
  );

  const handleRetry = useCallback(() => {
    setQuizSubmitted(false);
    setQuizPassed(null);
    setCorrectCount(0);
    setVideoCompleted(false);
  }, []);

  const handleGoToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center">
            <i className="ri-video-off-line text-2xl text-foreground-400"></i>
          </div>
          <h2 className="font-heading text-xl text-foreground-900 mb-2">Video Not Found</h2>
          <p className="text-sm text-foreground-500 mb-6">This training video doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (progress && progress.status === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center">
            <i className="ri-lock-fill text-2xl text-foreground-400"></i>
          </div>
          <h2 className="font-heading text-xl text-foreground-900 mb-2">Video Locked</h2>
          <p className="text-sm text-foreground-500 mb-6">
            Complete the previous training video and quiz to unlock this one.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50">
      <header className="bg-background-50 border-b border-background-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-foreground-600 hover:text-foreground-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line text-lg"></i>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-600 hidden sm:inline">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700">{user.avatar}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-3">
            {video.designation}
          </span>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">{video.title}</h1>
          <div className="flex items-center gap-4 text-sm text-foreground-500">
            <span className="flex items-center gap-1">
              <i className="ri-time-line"></i> {video.duration}
            </span>
            {progress && progress.attempts > 0 && (
              <span className="flex items-center gap-1">
                <i className="ri-refresh-line"></i> Quiz attempt {progress.attempts + 1}
              </span>
            )}
          </div>
        </div>

        <VideoPlayer
          veedUrl={video.veedUrl}
          title={video.title}
          completed={videoCompleted}
          onComplete={() => setVideoCompleted(true)}
        />

        <div className="mt-10">
          {!videoCompleted ? (
            <div className="bg-background-50 border-2 border-dashed border-background-300 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center">
                <i className="ri-lock-unlock-line text-2xl text-foreground-400"></i>
              </div>
              <h3 className="font-heading text-lg text-foreground-800 mb-2">Quiz Locked</h3>
              <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                Watch the full training video above, then click <strong className="text-foreground-700">"I've Finished Watching"</strong> to unlock the knowledge check.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-foreground-400">
                <i className="ri-information-line"></i>
                <span>{videoQuestions.length} question{videoQuestions.length !== 1 ? 's' : ''} waiting</span>
              </div>
            </div>
          ) : videoQuestions.length > 0 ? (
            <MCQQuiz
              questions={videoQuestions}
              onSubmit={handleQuizSubmit}
              attempts={progress?.attempts ?? 0}
              disabled={quizSubmitted && quizPassed === true}
            />
          ) : (
            <div className="text-center py-12 bg-background-50 border border-background-200 rounded-2xl">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-background-100 flex items-center justify-center">
                <i className="ri-question-line text-2xl text-foreground-400"></i>
              </div>
              <p className="text-foreground-600 font-medium">No quiz questions available</p>
              <p className="text-sm text-foreground-500 mt-1">An administrator will add questions for this video.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-5 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      {quizSubmitted && quizPassed !== null && (
        <QuizResult
          passed={quizPassed}
          correctCount={correctCount}
          totalCount={videoQuestions.length}
          hasNextVideo={!!nextVideo}
          nextVideoId={nextVideo?.id}
          onRetry={handleRetry}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
}