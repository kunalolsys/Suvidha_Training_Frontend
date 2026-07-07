import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const role = location.pathname === "/admin" ? "Admin" : "Employee";
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => {
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    // Simulate brief network delay
    const res = await login(email.trim(), "Employee");
    if (!res.success) {
      setError(res.message || 'No account found with this email or code. Please check and try again.');
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-500 flex items-center justify-center">
            <i className="ri-graduation-cap-fill text-3xl text-background-50"></i>
          </div>
          <h1 className="font-heading text-3xl text-foreground-900 mb-2">Suvidha Training University</h1>
          <p className="text-foreground-600 text-sm">Sign in to access your training portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-background-50 border border-background-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground-700 mb-2">
                Work Email or Employee code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-foreground-400 text-lg"></i>
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@suvidha.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-background-100 border border-background-200 rounded-xl text-foreground-900 text-sm placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                <i className="ri-error-warning-line text-base flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 font-medium rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-lg"></i>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <i className="ri-arrow-right-line text-lg"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-background-200">
            <p className="text-xs text-foreground-500 text-center">
              Use your Suvidha company email or employee code to sign in.
              <br />
              Contact HR if you need access.
            </p>
          </div>
        </div>

        {/* Demo hints */}
        {/* <p className="mt-6 text-xs text-foreground-400 text-center space-y-1">
          <span>Demo — Employee: <span className="text-foreground-600 font-medium">rajesh.kumar@suvidha.com</span> (Sales)</span>
          <br />
          <span>Demo — Admin: <span className="text-foreground-600 font-medium">admin@suvidha.com</span> (Admin)</span>
        </p> */}
      </div>
    </div>
  );
}