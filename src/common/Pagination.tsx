import React from "react";
import {
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
}: PaginationProps) {
    if (totalPages < 1) return null;

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const getPages = (): (number | string)[] => {
        const pages: (number | string)[] = [];

        // Show all pages if there are few pages
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Beginning
        if (page <= 4) {
            return [1, 2, 3, 4, 5, "...", totalPages];
        }

        // End
        if (page >= totalPages - 3) {
            return [
                1,
                "...",
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        // Middle
        return [
            1,
            "...",
            page - 1,
            page,
            page + 1,
            "...",
            totalPages,
        ];
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-background-200 pt-4">
            <p className="text-sm text-foreground-500">
                Showing <span className="font-semibold">{start}</span>–
                <span className="font-semibold">{end}</span> of{" "}
                <span className="font-semibold">{total}</span> records
            </p>

            <div className="flex items-center gap-1">
                {/* First */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page === 1}
                    className="h-9 w-9 rounded-lg border border-background-200 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronsLeft size={16} className="mx-auto" />
                </button>

                {/* Previous */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="h-9 w-9 rounded-lg border border-background-200 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft size={16} className="mx-auto" />
                </button>

                {/* Pages */}
                {getPages().map((item, index) =>
                    item === "..." ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="w-9 text-center text-foreground-400 select-none"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={`page-${item}`}
                            onClick={() => onPageChange(item as number)}
                            className={`h-9 w-9 rounded-lg text-sm font-medium transition ${page === item
                                    ? "bg-primary-500 text-white"
                                    : "border border-background-200 hover:bg-background-100"
                                }`}
                        >
                            {item}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="h-9 w-9 rounded-lg border border-background-200 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight size={16} className="mx-auto" />
                </button>

                {/* Last */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages}
                    className="h-9 w-9 rounded-lg border border-background-200 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    <ChevronsRight size={16} className="mx-auto" />
                </button>
            </div>
        </div>
    );
}