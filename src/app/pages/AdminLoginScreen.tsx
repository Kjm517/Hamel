import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { signInAdmin, sendPasswordResetEmail } from '../admin/lib/admin-auth';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface AdminLoginScreenProps {
  onSuccess: () => void;
}

export function AdminLoginScreen({ onSuccess }: AdminLoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResetSent(null);
    try {
      await signInAdmin(identifier.trim(), password, rememberMe);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign in failed. Check your email or username and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetSent(null);
    if (!identifier.trim()) {
      setError('Enter your email or username above, then click Forgot password.');
      return;
    }
    try {
      const email = await sendPasswordResetEmail(identifier.trim());
      setResetSent(`Password reset link sent to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0EA5E9' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <ImageWithFallback
            src={hamelAssets.branding.soloLogo}
            alt="Hamel"
            className="h-11 w-auto object-contain"
          />
          <div>
            <div className="font-bold text-gray-900 text-lg">Hamel Admin</div>
            <div className="text-xs text-gray-500">Banner Management</div>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {resetSent}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email or username</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="manager or you@hamel.example"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9] focus:ring-[#0EA5E9]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              className="text-sm font-medium text-[#0EA5E9] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full font-bold text-gray-900 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#FFC107' }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <Link to="/" className="block text-center text-xs text-gray-500 hover:text-gray-700 mt-4">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
