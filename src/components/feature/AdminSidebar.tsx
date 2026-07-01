import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { to: '/admin/videos', label: 'Videos', icon: 'ri-video-line' },
  { to: '/admin/questions', label: 'Questions', icon: 'ri-question-line' },
  { to: '/admin/employees', label: 'Employees', icon: 'ri-team-line' },
  { to: '/admin/reports', label: 'Reports', icon: 'ri-bar-chart-line' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-background-50 border-r border-background-200 h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-background-200">
        <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center mr-3">
          <i className="ri-graduation-cap-fill text-lg text-background-50"></i>
        </div>
        <div>
          <span className="font-heading text-lg text-foreground-900">STU</span>
          <span className="text-foreground-500 text-sm ml-2">Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary-200 text-primary-700' : 'bg-background-100 text-foreground-500'}`}>
                <i className={`${item.icon} text-lg`}></i>
              </div>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-background-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-foreground-900 truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-xs text-foreground-500 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-logout-box-r-line text-base"></i>
          Sign Out
        </button>
      </div>
    </aside>
  );
}