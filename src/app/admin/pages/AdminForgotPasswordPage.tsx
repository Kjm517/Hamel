import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AdminAuthShell } from '../components/AdminAuthShell';
import { sendPasswordResetEmail } from '../lib/admin-auth';

export function AdminForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await sendPasswordResetEmail(identifier.trim());
      setSentToEmail(result.email);
      setResetUrl(result.resetUrl ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminAuthShell
      title="Forgot password"
      subtitle="Create a password reset link for your admin account."
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
            {resetUrl ? (
              <>
                Reset link for <strong>{sentToEmail ?? identifier}</strong> (SMTP not configured —
                use this link):
                <a
                  href={resetUrl}
                  className="mt-2 block break-all font-medium text-[#0EA5E9] hover:underline"
                >
                  {resetUrl}
                </a>
              </>
            ) : (
              <>
                If an account exists for <strong>{sentToEmail ?? identifier}</strong>, a reset token
                was created. Check the API server console for the link.
              </>
            )}
          </div>
          <Link
            to="/admin/login"
            className="block text-center text-sm font-medium text-[#0EA5E9] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-amber-400 py-3 font-bold text-gray-900 transition-colors hover:bg-amber-500 disabled:opacity-60"
          >
            {submitting ? 'Creating link…' : 'Create reset link'}
          </button>

          <Link
            to="/admin/login"
            className="block text-center text-sm font-medium text-[#0EA5E9] hover:underline"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AdminAuthShell>
  );
}
