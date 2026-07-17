import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  AdminAuthShell,
  adminAuthFieldClass,
  adminAuthLabelClass,
} from '../components/AdminAuthShell';
import { sendPasswordResetEmail } from '../lib/admin-auth';

const ctaClass =
  'mt-1 h-[50px] w-full rounded-xl border-0 bg-gradient-to-b from-[#ffc62b] to-[#f6b50c] text-[15.5px] font-bold tracking-[0.01em] text-[#3a2c00] shadow-[0_8px_18px_-8px_rgba(246,181,12,0.7)] transition-[transform,box-shadow] hover:shadow-[0_10px_22px_-8px_rgba(246,181,12,0.85)] active:translate-y-px disabled:opacity-60';

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
      subtitle="Enter your email and we'll send a reset link to your admin account."
      footer={
        <Link to="/admin/login" className="font-semibold text-[#1795d1] hover:text-[#1279b0]">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            {resetUrl ? (
              <>
                Reset link for <strong>{sentToEmail ?? identifier}</strong> (SMTP not configured —
                use this link):
                <a
                  href={resetUrl}
                  className="mt-2 block break-all font-semibold text-[#1795d1] hover:text-[#1279b0]"
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
        </div>
      ) : (
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

          <button type="submit" disabled={submitting} className={ctaClass}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
