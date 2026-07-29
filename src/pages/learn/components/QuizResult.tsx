import { useNavigate } from 'react-router-dom';

interface QuizResultProps {
  passed: boolean;
  correctCount: number;
  totalCount: number;
  hasNextVideo: boolean;
  nextVideoId?: string;
  minPassPercentage?: number; // Optional prop, defaults to 60%
  onRetry: () => void;
  onGoToDashboard: () => void;
}

export default function QuizResult({
  passed,
  correctCount,
  totalCount,
  hasNextVideo,
  nextVideoId,
  minPassPercentage = 60,
  onRetry,
  onGoToDashboard,
}: QuizResultProps) {
  const navigate = useNavigate();

  // 🎯 Calculate score percentage
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/60 backdrop-blur-sm px-4">
      <div className="bg-background-50 rounded-2xl p-8 max-w-md w-full text-center">
        {passed ? (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-accent-100 flex items-center justify-center">
              <i className="ri-check-line text-3xl text-accent-600"></i>
            </div>
            <h2 className="font-heading text-2xl text-foreground-900 mb-2">Congratulations!</h2>
            
            {/* 🎯 Displays score count, percentage, and minimum required percentage */}
            <p className="text-foreground-600 text-sm mb-2">
              You scored <strong className="text-accent-600">{correctCount}/{totalCount} ({percentage}%)</strong> and passed the quiz!
            </p>
            <p className="text-xs text-foreground-500 mb-4">
              Minimum passing score required: <span className="font-semibold">{minPassPercentage}%</span>
            </p>

            {hasNextVideo && (
              <p className="text-xs text-accent-700 bg-accent-50 border border-accent-200 rounded-lg px-4 py-2 inline-block mb-6">
                <i className="ri-lock-unlock-line mr-1"></i>
                Next training video is now unlocked!
              </p>
            )}

            <div className="flex flex-col gap-3 mt-6">
              {hasNextVideo && nextVideoId && (
                <button
                  onClick={() => navigate(`/learn/${nextVideoId}`)}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  Continue to Next Video
                  <i className="ri-arrow-right-line text-lg"></i>
                </button>
              )}
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-dashboard-line text-lg"></i>
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
              <i className="ri-close-line text-3xl text-red-500"></i>
            </div>
            <h2 className="font-heading text-2xl text-foreground-900 mb-2">Not Quite There</h2>
            
            {/* 🎯 Displays actual percentage vs required percentage for failure state */}
            <p className="text-foreground-600 text-sm mb-2">
              You scored <strong className="text-red-600">{correctCount}/{totalCount} ({percentage}%)</strong>.
            </p>
            <p className="text-xs text-foreground-500 mb-4">
              You need at least <strong className="text-foreground-700">{minPassPercentage}%</strong> to pass this quiz.
            </p>

            <p className="text-xs text-foreground-500 bg-secondary-50 border border-secondary-200 rounded-lg px-4 py-2 inline-block mb-6">
              <i className="ri-information-line mr-1"></i>
              Please review the training video again, then retake the quiz to unlock the next module.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={onRetry}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line text-lg"></i>
                Retake Quiz
              </button>
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-dashboard-line text-lg"></i>
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}