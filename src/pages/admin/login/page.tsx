import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // If already logged in as admin, redirect
  if (user && user.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email.trim());
    if (!success) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    // Check if user is admin
    const stored = localStorage.getItem('stu_emp');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        setError('You do not have admin access.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
            <i className="ri-graduation-cap-fill text-3xl text-background-50"></i>
          </div>
          <h1 className="font-heading text-2xl text-foreground-900 mb-1">STU Admin Portal</h1>
          <p className="text-sm text-foreground-500">Suvidha Training University</p>
        </div>

        <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
          <h2 className="font-heading text-lg text-foreground-900 mb-5">Administrator Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-foreground-700 mb-1.5">Email Address or Employee code</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@suvidha.com"
                className="w-full px-4 py-3 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <i className="ri-error-warning-line text-base"></i>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-lg"></i>
              ) : (
                <i className="ri-login-box-line text-lg"></i>
              )}
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
            >
              Back to Employee Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}