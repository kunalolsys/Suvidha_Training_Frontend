import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { to: '/admin/videos', label: 'Videos', icon: 'ri-video-line' },
  { to: '/admin/questions', label: 'Questions', icon: 'ri-question-line' },
  { to: '/admin/employees', label: 'Employees', icon: 'ri-team-line' },
  { to: '/admin/reports', label: 'Reports', icon: 'ri-bar-chart-line' },
  { to: '/admin/profile', label: 'Profile', icon: 'ri-user-settings-line' },
];

export default function AdminSidebar({
  isMobileOpen = false,
  setIsMobileOpen
}: AdminSidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768 && width < 1280) {
        setIsCollapsed(true);
      } else if (width >= 1280) {
        setIsCollapsed(false);
      }
      if (width >= 768) {
        // 👈 Use optional chaining ?. to prevent the TypeError crash!
        setIsMobileOpen?.(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileOpen]);

  const handleLogout = async () => {
    const isAdminRoute = location.pathname.startsWith('/admin') || user?.role === 'Admin';
    const redirectPath = isAdminRoute ? '/admin' : '/';

    try {
      if (logout) {
        await logout();
      }
      localStorage.removeItem('stu_emp');
      sessionStorage.clear();
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      sessionStorage.clear();
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen bg-background-50 border-r border-background-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:w-20' : 'md:w-64'
          } ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div className={`h-14 sm:h-16 flex items-center border-b border-background-200 transition-all duration-300 ${isCollapsed ? 'md:justify-center md:px-0' : 'justify-between px-4'
          }`}>
          {/* Logo & Text Container */}
          <div className="flex items-center min-w-0">
            {/* Cap Icon (Acts as toggle button when collapsed) */}
            <button
              type="button"
              onClick={() => isCollapsed && setIsCollapsed(false)}
              title={isCollapsed ? "Expand Sidebar" : undefined}
              className={`w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 transition-transform ${isCollapsed ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
            >
              <i className="ri-graduation-cap-fill text-lg text-background-50"></i>
            </button>

            {/* Brand Text (Hidden when collapsed) */}
            <div
              className={`flex items-baseline transition-all duration-300 overflow-hidden ${isCollapsed
                  ? 'md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none'
                  : 'opacity-100 max-w-[140px] ml-3'
                }`}
            >
              <span className="font-heading text-lg text-foreground-900 font-semibold whitespace-nowrap">
                STU
              </span>
              <span className="text-foreground-500 text-xs ml-1.5 whitespace-nowrap">
                Admin
              </span>
            </div>
          </div>

          {/* Collapse Toggle Button (Shown ONLY when sidebar is expanded) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex w-8 h-8 rounded-lg text-foreground-500 hover:text-foreground-900 hover:bg-background-100 items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              title="Collapse Sidebar"
            >
              <i className="ri-layout-left-line text-lg"></i>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
                  } ${isCollapsed ? 'md:justify-center' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive
                    ? 'bg-primary-200 text-primary-700'
                    : 'bg-background-100 text-foreground-500'
                    }`}
                >
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-background-200">
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <div
              className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center text-sm font-semibold shrink-0"
              title={isCollapsed ? user?.name : undefined}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className={`overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <p className="text-sm font-medium text-foreground-900 truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-foreground-500 truncate">{user?.email ?? ''}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${isCollapsed ? 'md:justify-center' : 'justify-center'
              }`}
          >
            <i className="ri-logout-box-r-line text-base shrink-0"></i>
            <span className={isCollapsed ? 'md:hidden' : 'block'}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}