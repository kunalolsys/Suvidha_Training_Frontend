import { useState } from 'react';
import type { Question } from '@/mocks/questions';

interface MCQQuizProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  attempts: number;
  disabled: boolean;
}

export default function MCQQuiz({ questions, onSubmit, attempts, disabled }: MCQQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionId: string, optionKey: string) => {
    if (submitted || disabled) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  const handleSubmit = () => {
    if (!allAnswered || submitted || disabled) return;
    setSubmitted(true);
    onSubmit(answers);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl text-foreground-900">Knowledge Check</h2>
        <span className="text-sm text-foreground-500">
          {questions.length} questions &middot; Attempt {attempts + 1}
        </span>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIdx) => {
          const options = [
            { key: 'a', text: q.optionA },
            { key: 'b', text: q.optionB },
            { key: 'c', text: q.optionC },
            { key: 'd', text: q.optionD },
            ...(q.optionE ? [{ key: 'e' as const, text: q.optionE }] : []),
          ];

          return (
            <div key={q.id} className="bg-background-50 border border-background-200 rounded-xl p-5">
              <p className="text-sm font-medium text-foreground-900 mb-4">
                <span className="text-primary-500 font-semibold mr-2">Q{qIdx + 1}.</span>
                {q.questionText}
              </p>
              <div className="space-y-2">
                {options.map((opt) => {
                  const isSelected = answers[q.id] === opt.key;

                  let borderClass = 'border-background-200';
                  let bgClass = 'bg-background-50';

                  if (submitted) {
                    if (isSelected) {
                      borderClass = 'border-secondary-400';
                      bgClass = 'bg-secondary-50';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-primary-400';
                    bgClass = 'bg-primary-50';
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelect(q.id, opt.key)}
                      disabled={submitted || disabled}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all whitespace-nowrap cursor-pointer ${borderClass} ${bgClass} ${
                        submitted || disabled ? 'cursor-default' : 'hover:border-primary-300 hover:bg-primary-50/50'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        isSelected
                          ? submitted
                            ? 'bg-secondary-500 text-background-50'
                            : 'bg-primary-500 text-background-50'
                          : 'bg-background-200 text-foreground-500'
                      }`}>
                        {optionLabels[options.indexOf(opt)]}
                      </span>
                      <span className="text-sm flex-1 text-foreground-800">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || disabled}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-background-50 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-check-line text-lg"></i>
            Submit Answers
          </button>
        ) : (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary-50 text-secondary-700 rounded-full text-sm font-medium">
            <i className="ri-check-double-line text-lg"></i>
            <span>Answers submitted</span>
          </div>
        )}
      </div>

      {!allAnswered && !submitted && (
        <p className="text-center text-xs text-foreground-400 mt-3">
          Answer all questions to submit
        </p>
      )}
    </div>
  );
}