import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import {
  AdminAuthShell,
  adminAuthFieldClass,
  adminAuthLabelClass,
} from '../components/AdminAuthShell';
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
        err instanceof Error
          ? err.message
          : 'Sign in failed. Check your email or username and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminAuthShell
      title="Sign in"
      subtitle="Welcome back. Use your Hamel admin account to access the dashboard."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-[18px]">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className={adminAuthLabelClass()}>Email or username</span>
          <input
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={adminAuthFieldClass()}
            placeholder="manager or you@hamel.example"
          />
        </label>

        <label className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className={adminAuthLabelClass()}>Password</span>
            <Link
              to="/admin/forgot-password"
              className="text-[12.5px] font-semibold text-[#1795d1] hover:text-[#1279b0]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${adminAuthFieldClass()} pr-12`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b3] transition-colors hover:bg-[#eef4f9] hover:text-[#4a5866]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <label className="-mt-0.5 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-[17px] w-[17px] cursor-pointer accent-[#17abee]"
          />
          <span className="text-sm text-[#4a5866]">Keep me signed in</span>
        </label>

        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-1 h-[50px] w-full rounded-xl border-0 bg-gradient-to-b from-[#ffc62b] to-[#f6b50c] text-[15.5px] font-bold tracking-[0.01em] text-[#3a2c00] shadow-[0_8px_18px_-8px_rgba(246,181,12,0.7)] transition-[transform,box-shadow] hover:shadow-[0_10px_22px_-8px_rgba(246,181,12,0.85)] active:translate-y-px disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AdminAuthShell>
  );
}
