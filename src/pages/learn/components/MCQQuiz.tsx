import { useState } from 'react';
interface MCQQuizProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  attempts: number;
  disabled: boolean;
}
interface Question {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOption: string;
}

interface MCQQuizProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  attempts: number;
  disabled: boolean;
}

export default function MCQQuiz({
  questions,
  onSubmit,
  attempts,
  disabled,
}: MCQQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted || disabled) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  const handleSubmit = () => {
    if (!allAnswered || submitted || disabled) return;

    setSubmitted(true);
    onSubmit(answers);
  };

  const optionLabels = ["A", "B", "C", "D", "E"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl text-foreground-900">
          Knowledge Check
        </h2>

        <span className="text-sm text-foreground-500">
          {questions.length} Questions · Attempt {attempts + 1}
        </span>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-background-50 border border-background-200 rounded-xl p-5"
          >
            <p className="text-sm font-medium text-foreground-900 mb-4">
              <span className="text-primary-500 font-semibold mr-2">
                Q{qIndex + 1}.
              </span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((option, index) => {
                const isSelected = answers[q.id] === option.id;

                let borderClass = "border-background-200";
                let bgClass = "bg-background-50";

                if (submitted) {
                  if (isSelected) {
                    borderClass = "border-secondary-400";
                    bgClass = "bg-secondary-50";
                  }
                } else if (isSelected) {
                  borderClass = "border-primary-400";
                  bgClass = "bg-primary-50";
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(q.id, option.id)}
                    disabled={submitted || disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${borderClass} ${bgClass} ${submitted || disabled
                      ? "cursor-default"
                      : "hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer"
                      }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isSelected
                        ? submitted
                          ? "bg-secondary-500 text-white"
                          : "bg-primary-500 text-white"
                        : "bg-background-200 text-foreground-500"
                        }`}
                    >
                      {optionLabels[index]}
                    </span>

                    <span className="text-sm flex-1 text-foreground-800 whitespace-normal">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || disabled}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            Submit Answers
          </button>
        ) : (
          <div className="px-5 py-3 rounded-full bg-secondary-50 text-secondary-700 font-medium flex items-center gap-2">
            <i className="ri-check-double-line"></i>
            Answers Submitted
          </div>
        )}
      </div>

      {!allAnswered && !submitted && (
        <p className="text-center text-xs text-foreground-400 mt-4">
          Please answer all questions before submitting.
        </p>
      )}
    </div>
  );
}