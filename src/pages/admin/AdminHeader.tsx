import { useAuth } from '@/hooks/useAuth';

interface AdminHeaderProps {
    title?: string;
    subtitle?: string;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

export default function AdminHeader({
    title,
    subtitle,
    isMobileOpen,
    setIsMobileOpen,
}: AdminHeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-20 bg-background-50 border-b border-background-200">
            <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">

                {/* Left Side: Mobile Menu Button + Page Title */}
                <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Hamburger Button (< 768px) */}
                    <button
                        type="button"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="md:hidden p-2 rounded-lg text-foreground-600 hover:bg-background-100 transition-colors shrink-0 cursor-pointer"
                        aria-label="Toggle navigation"
                    >
                        <i className={`${isMobileOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl`}></i>
                    </button>

                    {/* Page Title & Subtitle */}
                    <div className="min-w-0">
                        {title && (
                            <h1 className="font-heading text-base sm:text-lg font-semibold text-foreground-900 truncate">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-xs text-foreground-500 truncate hidden sm:block">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side: User Profile Avatar */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-medium text-foreground-900 truncate max-w-[120px]">
                                {user?.name ?? 'Admin'}
                            </p>
                            <p className="text-[10px] text-foreground-500 truncate max-w-[120px]">
                                {user?.email ?? ''}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}