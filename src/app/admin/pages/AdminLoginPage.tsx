import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { AdminAuthShell } from '../components/AdminAuthShell';
import { useAdminAuth } from '../context/AdminAuthContext';
import { signInAdmin } from '../lib/admin-auth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, refreshSession } = useAdminAuth();
  const from =
    (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInAdmin(identifier.trim(), password, rememberMe);
      await refreshSession();
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign in failed. Check your email or username and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminAuthShell
      title="Sign in"
      subtitle="Use your Hamel admin account to access the dashboard."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email or username</span>
          <input
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
            placeholder="manager or you@hamel.example"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9] focus:ring-[#0EA5E9]"
            />
            Remember me
          </label>
          <Link
            to="/admin/forgot-password"
            className="text-sm font-medium text-[#0EA5E9] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full rounded-md bg-amber-400 py-3 font-bold text-gray-900 transition-colors hover:bg-amber-500 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AdminAuthShell>
  );
}
