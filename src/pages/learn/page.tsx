import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import VideoPlayer from './components/VideoPlayer';
import MCQQuiz from './components/MCQQuiz';
import QuizResult from './components/QuizResult';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';

const getInitials = (name?: string) => {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
export default function LearnPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const [video, setVideo] = useState<any | null>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [progressList, setProgressList] = useState([]);

  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAllVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.VIDEO}/emp-videos`, {
        designation: user.designation._id
      });

      setAllVideos(res.data.videos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.VIDEO}/${videoId}`);
      setVideo(res.data.video);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.QUESTION}/${videoId}`);
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.PROGRESS}/my-dashboard`);

      setProgressList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVideos();
    fetchAllVideos();
    fetchQuestions();
    fetchProgress();


    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, [user, videoId]);
  const videoQuestions = useMemo(() => {
    return questions
      .filter((q) => q.video?._id === videoId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => ({
        id: q._id,
        question: q.question,

        options: q.options.map((opt: any, index: number) => ({
          id: String.fromCharCode(97 + index), // a,b,c,d,e
          text: opt.option,
        })),

        correctOption:
          q.options.findIndex((o: any) => o.isCorrect) >= 0
            ? String.fromCharCode(
              97 + q.options.findIndex((o: any) => o.isCorrect)
            )
            : "",
      }));
  }, [questions, videoId]);

  const progress = progressList.find(
    p => p.video._id === videoId
  );
  const nextVideo = useMemo(() => {
    if (!video || allVideos.length === 0) return null;

    return (
      allVideos.find(
        (v: any) =>
          String(v.designation?._id) === String(video.designation?._id) &&
          v.sortOrder === video.sortOrder + 1 &&
          v.isActive
      ) || null
    );
  }, [video, allVideos]);
  const handleQuizSubmit = useCallback(
    async (answers: Record<string, string>) => {
      if (!user || !videoId) return;

      let correct = 0;

      videoQuestions.forEach((q) => {
        if (answers[q.id] === q.correctOption) {
          correct++;
        }
      });

      const passed = correct === videoQuestions.length;

      setCorrectCount(correct);
      setQuizPassed(passed);
      setQuizSubmitted(true);

      try {
        await api.post(`${API.PROGRESS}/submit-quiz`, {
          videoId,
          score: correct,
          totalQuestions: videoQuestions.length,
          passed,
          answers: Object.entries(answers).map(([questionId, selected]) => ({
            question: questionId,
            selectedOption: ["a", "b", "c", "d", "e"].indexOf(selected),
          })),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [user, videoId, videoQuestions]
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
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
              <span className="text-xs font-semibold text-primary-700"> {getInitials(user.name)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-3">
            {video.designation ? video.designation.name : ""}
          </span>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">{video.title}</h1>
          <div className="flex items-center gap-4 text-sm text-foreground-500">
            {/* <span className="flex items-center gap-1">
              <i className="ri-time-line"></i> {video.duration}
            </span> */}
            {progress && progress.attempts > 0 && (
              <span className="flex items-center gap-1">
                <i className="ri-refresh-line"></i> Quiz attempt {progress.attempts + 1}
              </span>
            )}
          </div>
        </div>

        <VideoPlayer
          videoUrl={video.veedUrl}
          // videoUrl={"https://veed.io/view/3cb0a71c-f9e1-466b-a9da-3a796615585a"}
          title={video.title}
          completed={videoCompleted}
          onComplete={async () => {
            setVideoCompleted(true);

            try {
              await api.patch(`${API.PROGRESS}/update-status`, {
                videoId,
                status: "unlocked",
              });
            } catch (err) {
              console.error(err);
            }
          }}
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