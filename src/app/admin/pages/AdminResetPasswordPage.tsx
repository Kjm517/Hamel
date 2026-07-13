import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { AdminAuthShell } from '../components/AdminAuthShell';
import { resetAdminPasswordWithToken, updateAdminPassword } from '../lib/admin-auth';
import { useAdminAuth } from '../context/AdminAuthContext';

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
    >
      {!ready && !loading ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Open the reset link from the forgot-password flow to continue. Links expire after one hour.
          </p>
          <Link
            to="/admin/forgot-password"
            className="block text-center text-sm font-medium text-[#0EA5E9] hover:underline"
          >
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
          Password updated. Redirecting to dashboard…
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">New password</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Confirm password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-amber-400 py-3 font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
