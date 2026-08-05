import React, { useState } from "react";

interface OptionSnapshot {
    optionText: string;
    isCorrect: boolean;
}

interface QuestionSnapshot {
    questionId: string;
    questionText: string;
    options: OptionSnapshot[];
    selectedOptionIndex: number;
    isCorrect: boolean;
}

interface Attempt {
    _id?: string;
    score: number; // e.g. 80 for 80%
    totalQuestions: number;
    passed: boolean;
    attemptedAt: string;
    snapshot?: QuestionSnapshot[];
}

interface ProgressRecord {
    _id: string;
    status: "locked" | "unlocked" | "completed";
    attempts: number;
    completedAt?: string;
    videoSnapshot?: {
        title: string;
        sortOrder: number;
        duration: string;
    };
    video?: {
        _id: string;
        title: string;
    };
    history: Attempt[];
}
interface Props {
    progressList: ProgressRecord[];
    activeVideoIds?: Set<string>; // <-- Added prop
}

export default function TrainingHistoryView({ progressList, activeVideoIds }: Props) {
    // Currently selected attempt for deep-dive snapshot view
    const [selectedAttempt, setSelectedAttempt] = useState<{
        videoTitle: string;
        attemptNumber: number;
        attempt: Attempt;
    } | null>(null);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const activeProgressRecords = progressList.filter(
        (p) => p.history && p.history.length > 0
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-background-200">
                <div>
                    <h2 className="font-heading text-xl font-bold text-foreground-900">
                        Training & Quiz History
                    </h2>
                    <p className="text-xs text-foreground-500 mt-0.5">
                        View your attempt records, scores, and exam question snapshots.
                    </p>
                </div>
                <div className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold">
                    {activeProgressRecords.length} Modules Attempted
                </div>
            </div>

            {activeProgressRecords.length === 0 ? (
                <div className="text-center py-12 bg-background-50 border border-dashed border-background-300 rounded-2xl">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-background-100 flex items-center justify-center">
                        <i className="ri-history-line text-2xl text-foreground-400"></i>
                    </div>
                    <p className="text-sm font-medium text-foreground-700">No attempts recorded yet</p>
                    <p className="text-xs text-foreground-500 mt-1">
                        Complete training videos and quizzes to see your historical timeline here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeProgressRecords.map((prog) => {
                        // Freeze title fallback: prefers videoSnapshot title over dynamic video title
                        const title =
                            prog.videoSnapshot?.title ||
                            prog.video?.title ||
                            "Training Module";
                        const videoId = prog.video?._id ? prog.video._id.toString() : prog.video?.toString();
                        const isDeleted = activeVideoIds && videoId ? !activeVideoIds.has(videoId) : (!prog.video && !prog.videoSnapshot);
                        return (
                            <div
                                key={prog._id}
                                className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden shadow-sm"
                            >
                                {/* Module Header */}
                                <div className="px-5 py-3.5 bg-background-100/70 border-b border-background-200 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${prog.status === "completed"
                                                ? "bg-accent-100 text-accent-700 border border-accent-200"
                                                : "bg-primary-100 text-primary-700 border border-primary-200"
                                                }`}
                                        >
                                            {prog.status === "completed" ? "Completed" : "In Progress"}
                                        </span>
                                        <h3 className="font-heading font-semibold text-foreground-900 text-sm md:text-base">
                                            {title}
                                        </h3>
                                    </div>
                                    {isDeleted && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                            <i className="ri-delete-bin-line text-xs"></i>
                                            Deleted by Admin
                                        </span>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-foreground-500">
                                        {prog.completedAt && (
                                            <span>
                                                Passed: <strong className="text-foreground-700">{formatDate(prog.completedAt)}</strong>
                                            </span>
                                        )}
                                        <span>
                                            {prog.history.length} Attempt{prog.history.length > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                {/* Attempts Table */}
                                <div className="divide-y divide-background-100">
                                    {prog.history.map((attempt, idx) => (
                                        <div
                                            key={attempt._id || idx}
                                            className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-background-100/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-medium text-foreground-500 w-20">
                                                    Attempt #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-sm font-bold ${attempt.passed ? "text-accent-600" : "text-rose-600"
                                                            }`}
                                                    >
                                                        {attempt.score}%
                                                    </span>
                                                    <span
                                                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${attempt.passed
                                                            ? "bg-accent-50 text-accent-700 border border-accent-200"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                                            }`}
                                                    >
                                                        {attempt.passed ? "Passed" : "Failed"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-foreground-400 font-mono">
                                                    {formatDate(attempt.attemptedAt)}
                                                </span>

                                                {/* View Question Audit Snapshot Button */}
                                                {attempt.snapshot && attempt.snapshot.length > 0 && (
                                                    <button
                                                        onClick={() =>
                                                            setSelectedAttempt({
                                                                videoTitle: title,
                                                                attemptNumber: idx + 1,
                                                                attempt,
                                                            })
                                                        }
                                                        className="px-3 py-1 bg-background-50 hover:bg-background-200 border border-background-300 text-foreground-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <i className="ri-file-search-line"></i>
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Snapshot Audit Detail Modal */}
            {selectedAttempt && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-background-50 border border-background-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-background-200 flex items-center justify-between bg-background-100/50">
                            <div>
                                <h3 className="font-heading font-bold text-foreground-900 text-base">
                                    {selectedAttempt.videoTitle}
                                </h3>
                                <p className="text-xs text-foreground-500">
                                    Attempt #{selectedAttempt.attemptNumber} Audit Snapshot &middot;{" "}
                                    {formatDate(selectedAttempt.attempt.attemptedAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedAttempt(null)}
                                className="p-1.5 rounded-lg text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>

                        {/* Modal Score Overview */}
                        <div className="px-6 py-3 bg-background-100/30 border-b border-background-200 flex items-center justify-between text-xs">
                            <span className="text-foreground-600">
                                Score: <strong className="text-foreground-900">{selectedAttempt.attempt.score}%</strong>
                            </span>
                            <span
                                className={`font-semibold px-2.5 py-0.5 rounded-full ${selectedAttempt.attempt.passed
                                    ? "bg-accent-100 text-accent-700"
                                    : "bg-rose-100 text-rose-700"
                                    }`}
                            >
                                {selectedAttempt.attempt.passed ? "PASSED" : "FAILED"}
                            </span>
                        </div>

                        {/* Questions Snapshot Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {selectedAttempt.attempt.snapshot?.map((q, qIdx) => (
                                <div
                                    key={qIdx}
                                    className="p-4 rounded-xl border border-background-200 bg-background-50 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground-900">
                                            <span className="font-bold mr-1">{qIdx + 1}.</span> {q.questionText}
                                        </p>
                                        <span
                                            className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${q.isCorrect
                                                ? "bg-accent-100 text-accent-700"
                                                : "bg-rose-100 text-rose-700"
                                                }`}
                                        >
                                            {q.isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                    </div>

                                    {/* Options List */}
                                    <div className="space-y-1.5 pt-1">
                                        {q.options.map((opt, oIdx) => {
                                            const isSelected = Number(q.selectedOptionIndex) === oIdx;
                                            const isCorrect = opt.isCorrect;

                                            let style = "bg-background-100 border-background-200 text-foreground-700";

                                            if (isSelected && isCorrect) {
                                                style = "bg-accent-50 border-accent-300 text-accent-800 font-medium";
                                            } else if (isSelected && !isCorrect) {
                                                style = "bg-rose-50 border-rose-300 text-rose-800 font-medium";
                                            } else if (isCorrect) {
                                                style = "bg-emerald-50/50 border-emerald-300 text-emerald-800 font-medium";
                                            }

                                            return (
                                                <div
                                                    key={oIdx}
                                                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${style}`}
                                                >
                                                    <span>
                                                        <strong className="mr-2">{String.fromCharCode(65 + oIdx)}.</strong>
                                                        {opt.optionText}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                                                            (Your Answer)
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3 border-t border-background-200 bg-background-100/50 flex justify-end">
                            <button
                                onClick={() => setSelectedAttempt(null)}
                                className="px-4 py-2 bg-foreground-900 text-background-50 hover:bg-foreground-800 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}