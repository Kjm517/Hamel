import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import {
  AdminAuthShell,
  adminAuthFieldClass,
  adminAuthLabelClass,
} from '../components/AdminAuthShell';
import { resetAdminPasswordWithToken, updateAdminPassword } from '../lib/admin-auth';
import { useAdminAuth } from '../context/AdminAuthContext';

const ctaClass =
  'mt-1 h-[50px] w-full rounded-xl border-0 bg-gradient-to-b from-[#ffc62b] to-[#f6b50c] text-[15.5px] font-bold tracking-[0.01em] text-[#3a2c00] shadow-[0_8px_18px_-8px_rgba(246,181,12,0.7)] transition-[transform,box-shadow] hover:shadow-[0_10px_22px_-8px_rgba(246,181,12,0.85)] active:translate-y-px disabled:opacity-60';

export function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token')?.trim() ?? '';
  const { session, loading, refreshSession } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (tokenFromUrl || session) setReady(true);
  }, [tokenFromUrl, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (tokenFromUrl) {
        await resetAdminPasswordWithToken(tokenFromUrl, password);
        await refreshSession();
      } else {
        await updateAdminPassword(password);
      }
      setDone(true);
      setTimeout(() => navigate('/admin/dashboard', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && done && session) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminAuthShell
      title="Set new password"
      subtitle="Choose a new password for your admin account."
      footer={
        <Link to="/admin/login" className="font-semibold text-[#1795d1] hover:text-[#1279b0]">
          ← Back to sign in
        </Link>
      }
    >
      {!ready && !loading ? (
        <div className="space-y-4">
          <p className="text-sm text-[#64748b]">
            Open the reset link from the forgot-password flow to continue. Links expire after one
            hour.
          </p>
          <Link
            to="/admin/forgot-password"
            className="block text-center text-sm font-semibold text-[#1795d1] hover:text-[#1279b0]"
          >
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          Password updated. Redirecting to dashboard…
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-[18px]">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className={adminAuthLabelClass()}>New password</span>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${adminAuthFieldClass()} pr-12`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b3] transition-colors hover:bg-[#eef4f9] hover:text-[#4a5866]"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className={adminAuthLabelClass()}>Confirm password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={adminAuthFieldClass()}
              placeholder="Re-enter password"
            />
          </label>

          <button type="submit" disabled={submitting} className={ctaClass}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
