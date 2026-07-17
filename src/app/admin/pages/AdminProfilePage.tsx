import { useEffect, useState, type FormEvent } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { updateMyProfile } from '../lib/employees-api';
import { updateAdminPassword } from '../lib/admin-auth';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { normalizeStoragePathForDb } from '../../lib/storage';

export function AdminProfilePage() {
  const { employee, employeeLoading, refreshEmployee } = useAdminAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    setFullName(employee.fullName);
    setPhone(employee.phone ?? '');
    setAvatarUrl(employee.avatarUrl ?? '');
  }, [employee]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: normalizeStoragePathForDb(avatarUrl) ?? (avatarUrl.trim() || null),
      });
      await refreshEmployee();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (password.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await updateAdminPassword(password);
      setPassword('');
      setPasswordConfirm('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  if (employeeLoading && !employee) {
    return <p className="text-sm text-gray-500">Loading profile…</p>;
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load your profile. Try signing in again.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My profile</h2>
        <p className="text-gray-600">Update your name, contact number, and photo.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void onSaveProfile(e)}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <ImageUrlOrUploadField
          label="Profile picture"
          value={avatarUrl}
          onChange={setAvatarUrl}
          hint="PNG, JPG, or WebP up to 25 MB."
          remoteUpload={{
            getObjectPath: (file) => {
              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
              const safe = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
              return `employee-avatars/${employee.id}-${Date.now()}.${safe}`;
            },
          }}
        />

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Full name</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Contact number</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XXXXXXXXX"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
            value={employee.email}
            readOnly
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Username</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
            value={employee.username ?? '—'}
            readOnly
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Role</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
            value={employee.role}
            readOnly
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save profile'}
        </button>
      </form>

      <form
        onSubmit={(e) => void onChangePassword(e)}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Change password</h3>
          <p className="text-sm text-gray-500">Must be at least 8 characters.</p>
        </div>
        {pwError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {pwError}
          </div>
        )}
        <label className="block text-sm">
          <span className="font-medium text-gray-700">New password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Confirm password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <button
          type="submit"
          disabled={pwSaving || !password}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          {pwSaving ? 'Updating…' : pwSaved ? 'Password updated' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
