import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface QuestionSummary {
  _id?: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizResultProps {
  passed: boolean;
  correctCount: number;
  totalCount: number;
  hasNextVideo: boolean;
  nextVideoId?: string;
  minPassPercentage?: number; // Default 70%
  questionSummaries?: QuestionSummary[];
  onRetry: () => void;
  onGoToDashboard: () => void;
}

export default function QuizResult({
  passed,
  correctCount,
  totalCount,
  hasNextVideo,
  nextVideoId,
  minPassPercentage = 70,
  questionSummaries = [],
  onRetry,
  onGoToDashboard,
}: QuizResultProps) {
  const navigate = useNavigate();

  // 🎯 State to control the Wrong Answers Modal
  const [isWrongAnswersModalOpen, setIsWrongAnswersModalOpen] = useState(false);

  // Calculate percentage
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPassed = percentage >= minPassPercentage;

  // 🎯 Filter ONLY wrong questions
  const wrongQuestions = questionSummaries.filter((q) => !q.isCorrect);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/60 backdrop-blur-sm px-4 py-6">

      {/* Main Result Card */}
      <div className="bg-background-50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl relative">
        {isPassed ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-4xl text-accent-600"></i>
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground-900 mb-1">
              Congratulations!
            </h2>

            <p className="text-foreground-600 text-sm mb-1">
              You scored <strong className="text-accent-600">{correctCount}/{totalCount} ({percentage}%)</strong> and passed!
            </p>
            <p className="text-xs text-foreground-500 mb-4">
              Passing requirement: <span className="font-semibold">{minPassPercentage}%</span>
            </p>

            {hasNextVideo && (
              <p className="text-xs text-accent-700 bg-accent-50 border border-accent-200 rounded-lg px-4 py-2 inline-block mb-4">
                <i className="ri-lock-unlock-line mr-1"></i>
                Next training video is now unlocked!
              </p>
            )}

            {/* 🎯 Button to Open Wrong Answers Modal (Visible if score >= 70% and there are wrong answers) */}
            {wrongQuestions.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setIsWrongAnswersModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                >
                  <i className="ri-eye-line text-sm"></i>
                  View {wrongQuestions.length} Wrong Answer{wrongQuestions.length > 1 ? 's' : ''} & Correct Solutions
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <i className="ri-close-circle-line text-4xl text-red-500"></i>
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground-900 mb-1">
              Not Quite There
            </h2>

            <p className="text-foreground-600 text-sm mb-1">
              You scored <strong className="text-red-600">{correctCount}/{totalCount} ({percentage}%)</strong>.
            </p>
            <p className="text-xs text-foreground-500 mb-4">
              You need at least <strong className="text-foreground-700">{minPassPercentage}%</strong> to pass.
            </p>

            <p className="text-xs text-foreground-500 bg-secondary-50 border border-secondary-200 rounded-lg px-4 py-2 inline-block mb-4">
              <i className="ri-information-line mr-1"></i>
              Please review the training video again and retake the quiz.
            </p>
          </>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-background-200">
          {isPassed ? (
            <>
              {hasNextVideo && nextVideoId && (
                <button
                  onClick={() => navigate(`/learn/${nextVideoId}`)}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  Continue to Next Video
                  <i className="ri-arrow-right-line text-lg"></i>
                </button>
              )}
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-dashboard-line text-lg"></i>
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRetry}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <i className="ri-refresh-line text-lg"></i>
                Retake Quiz
              </button>
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 bg-background-100 hover:bg-background-200 text-foreground-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-dashboard-line text-lg"></i>
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🎯 WRONG ANSWERS MODAL */}
      {isWrongAnswersModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-foreground-950/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-background-50 rounded-2xl max-w-lg w-full shadow-2xl border border-background-200 flex flex-col max-h-[85vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-background-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <i className="ri-error-warning-line text-lg"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground-900">
                    Incorrect Answers
                  </h3>
                  <p className="text-[11px] text-foreground-500">
                    Review your mistake{wrongQuestions.length > 1 ? 's' : ''} and correct solution{wrongQuestions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWrongAnswersModalOpen(false)}
                className="text-foreground-400 hover:text-foreground-700 p-1.5 rounded-lg hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Modal Body - Scrollable wrong list */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {wrongQuestions.map((q, idx) => (
                <div
                  key={q._id || idx}
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 space-y-2 text-xs"
                >
                  <p className="font-semibold text-foreground-900">
                    {idx + 1}. {q.questionText}
                  </p>

                  <div className="space-y-1 pt-1">
                    {/* User's Wrong Answer */}
                    <div className="flex items-start gap-1.5 text-red-600 bg-red-100/60 p-2 rounded-lg">
                      <i className="ri-close-circle-fill text-sm mt-0.5 shrink-0"></i>
                      <div>
                        <span className="font-medium">Your Choice: </span>
                        <span>{q.userAnswer || 'Not Answered'}</span>
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="flex items-start gap-1.5 text-emerald-700 bg-emerald-100/60 p-2 rounded-lg">
                      <i className="ri-checkbox-circle-fill text-sm mt-0.5 shrink-0"></i>
                      <div>
                        <span className="font-medium">Correct Answer: </span>
                        <span className="font-bold">{q.correctAnswer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Explanation */}
                  {q.explanation && (
                    <div className="text-[11px] text-foreground-600 bg-background-50 p-2 rounded-lg border border-background-200 italic mt-1">
                      <strong className="not-italic">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-background-200 flex justify-end">
              <button
                onClick={() => setIsWrongAnswersModalOpen(false)}
                className="px-4 py-2 bg-foreground-900 hover:bg-foreground-800 text-background-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}