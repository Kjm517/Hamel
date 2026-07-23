import { useEffect, useState, type FormEvent } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { updateMyProfile } from '../lib/employees-api';
import { updateAdminPassword } from '../lib/admin-auth';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import { normalizeStoragePathForDb, resolveStorageImageUrl } from '../../lib/storage';
import { adminUi } from '../lib/admin-ui';

export function AdminProfilePage() {
  const { employee, employeeLoading, refreshEmployee } = useAdminAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);
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
    setAvatarBroken(false);
  }, [employee]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);
    setError(null);
    try {
      const storedAvatar = (() => {
        const raw = avatarUrl.trim();
        if (!raw) return null;

        return normalizeStoragePathForDb(raw) ?? raw;
      })();
      await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: storedAvatar,
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
    return <p className="text-sm text-[#9aa7b5]">Loading profile…</p>;
  }

  if (!employee) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load your profile. Try signing in again.
      </div>
    );
  }

  const initials = (fullName.trim() || employee.email || 'AD').slice(0, 2).toUpperCase();
  const avatarSrc = resolveStorageImageUrl(avatarUrl || undefined);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-[18px]">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void onSaveProfile(e)}
        className="rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_2px_rgba(30,42,56,0.03)]"
      >
        <h3 className="mb-[18px] text-[15.5px] font-bold text-[#1e2a38]">Profile details</h3>

        <div className="mb-5 flex items-center gap-4">
          {avatarSrc && !avatarBroken ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-[68px] w-[68px] shrink-0 rounded-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[#0ea5e9] text-2xl font-extrabold text-white">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <ImageUrlOrUploadField
              label="Upload photo"
              value={avatarUrl}
              onChange={(next) => {
                setAvatarBroken(false);
                setAvatarUrl(next);
              }}
              hint="PNG, JPG, or WebP, up to 25 MB. Upload a photo, then save."
              sizeGuide={IMAGE_SIZE_GUIDES.profileAvatar}
              remoteUpload={{
                getObjectPath: (file) => {
                  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                  const safe = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
                  return `employee-avatars/${employee.id}-${Date.now()}.${safe}`;
                },
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#516171]">Full name</span>
            <input
              className={adminUi.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Contact number</span>
            <input
              className={adminUi.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXXX"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Role</span>
            <input
              className={`${adminUi.input} bg-[#eef3f8] text-[#7a8899]`}
              value={employee.role}
              readOnly
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Email</span>
            <input
              className={`${adminUi.input} bg-[#eef3f8] text-[#7a8899]`}
              value={employee.email}
              readOnly
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Username</span>
            <input
              className={`${adminUi.input} bg-[#eef3f8] text-[#7a8899]`}
              value={employee.username ?? '—'}
              readOnly
            />
          </label>
        </div>

        <button type="submit" disabled={saving} className={`mt-[18px] ${adminUi.btnPrimary}`}>
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save profile'}
        </button>
      </form>

      <form
        onSubmit={(e) => void onChangePassword(e)}
        className="rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_2px_rgba(30,42,56,0.03)]"
      >
        <h3 className="m-0 mb-1 text-[15.5px] font-bold text-[#1e2a38]">Change password</h3>
        <p className="mb-4 text-[12.5px] text-[#9aa7b5]">Use at least 8 characters.</p>

        {pwError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {pwError}
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">New password</span>
            <input
              type="password"
              className={adminUi.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Confirm password</span>
            <input
              type="password"
              className={adminUi.input}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pwSaving || !password}
          className={`mt-[18px] h-11 rounded-[11px] border border-[#e4ebf2] bg-white px-[22px] text-[14px] font-bold text-[#1e2a38] hover:bg-[#f7fafd] disabled:opacity-60`}
        >
          {pwSaving ? 'Updating…' : pwSaved ? 'Password updated' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
