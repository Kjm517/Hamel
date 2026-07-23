import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Check,
  KeyRound,
  Mail,
  Phone,
  User,
  UserRoundPen,
  X,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
  changeCustomerEmail,
  changeCustomerPassword,
  resendCustomerCode,
  updateCustomerProfile,
  verifyCustomerEmail,
} from '../lib/customer-api';
import { ApiError } from '../lib/api';
import { LoyaltyBadge } from './LoyaltyBadge';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which panel to open first. */
  initialPanel?: Panel;
};

type Panel = 'menu' | 'profile' | 'password' | 'email' | 'verify-email';

export function AccountSettingsModal({
  open,
  onOpenChange,
  initialPanel = 'menu',
}: Props) {
  const { customer, refresh } = useCustomerAuth();
  const [panel, setPanel] = useState<Panel>(initialPanel);

  // Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !customer) return;
    setPanel(initialPanel);
    setName(customer.name);
    setPhone(customer.phone ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewEmail('');
    setEmailPassword('');
    setVerifyCode('');
    setDevCode(undefined);
    setError(null);
    setSuccess(null);
    setBusy(false);
    void refresh();
  }, [open, customer?.id, initialPanel, refresh]);

  if (!customer) return null;

  const goMenu = () => {
    setPanel('menu');
    setError(null);
    setSuccess(null);
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await updateCustomerProfile({
        name: name.trim(),
        phone: phone.trim() || null,
      });
      await refresh();
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      setBusy(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setBusy(false);
      return;
    }
    try {
      await changeCustomerPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await changeCustomerEmail({
        newEmail: newEmail.trim(),
        password: emailPassword,
      });
      await refresh();
      setVerifyEmail(res.email);
      setDevCode(res.devCode);
      setEmailPassword('');
      setPanel('verify-email');
      setSuccess('We sent a verification code to your new email.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change email.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await verifyCustomerEmail(verifyEmail, verifyCode.trim());
      await refresh();
      setSuccess('Email verified and updated.');
      setPanel('menu');
      setVerifyCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify email.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await resendCustomerCode(verifyEmail);
      setDevCode(res.devCode);
      setSuccess('A new code was sent.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.');
    } finally {
      setBusy(false);
    }
  };

  const title =
    panel === 'profile'
      ? 'Edit profile'
      : panel === 'password'
        ? 'Change password'
        : panel === 'email'
          ? 'Change email'
          : panel === 'verify-email'
            ? 'Verify new email'
            : 'Account settings';

  const subtitle =
    panel === 'menu'
      ? customer.email
      : panel === 'verify-email'
        ? `Enter the code sent to ${verifyEmail}`
        : 'Update your account details';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#12303f]/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_-30px_rgba(9,44,64,.55)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] px-6 pb-5 pt-6 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <UserRoundPen className="h-5 w-5" />
              </span>
              <div>
                <DialogPrimitive.Title className="m-0 text-lg font-bold leading-tight">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="m-0 mt-0.5 truncate text-[13px] text-white/85">
                  {subtitle}
                </DialogPrimitive.Description>
                {panel === 'menu' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {customer.customerCode ? (
                      <span className="rounded-lg bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                        {customer.customerCode}
                      </span>
                    ) : null}
                    <LoyaltyBadge tier={customer.loyaltyTier} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogPrimitive.Close
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-5">
            {error ? (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mb-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </p>
            ) : null}

            {panel === 'menu' ? (
              <div className="space-y-2">
                <MenuButton
                  icon={<User className="h-4 w-4" />}
                  label="Edit profile"
                  hint="Name and phone number"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setPanel('profile');
                  }}
                />
                <MenuButton
                  icon={<Mail className="h-4 w-4" />}
                  label="Change email"
                  hint={customer.email}
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setPanel('email');
                  }}
                />
                <MenuButton
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Change password"
                  hint="Update your sign-in password"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setPanel('password');
                  }}
                />
                <div className="mt-3 rounded-2xl border border-[#e1e9ef] bg-[#f6f9fb] px-3.5 py-3">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-[#93a9b6]">
                    Account
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="m-0 text-sm font-semibold text-[#12303f]">{customer.name}</p>
                    <LoyaltyBadge tier={customer.loyaltyTier} />
                  </div>
                  {customer.customerCode ? (
                    <p className="mt-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#93a9b6]">
                        Customer ID
                      </span>
                      <span className="mt-0.5 block font-mono text-[13px] font-bold text-[#0369A1]">
                        {customer.customerCode}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#5f7a8a]">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </p>
                  {customer.phone ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#5f7a8a]">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {panel === 'profile' ? (
              <form onSubmit={(e) => void saveProfile(e)} className="space-y-3">
                <Field label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    autoComplete="tel"
                    placeholder="09XXXXXXXXX"
                  />
                </Field>
                <FormActions busy={busy} onBack={goMenu} submitLabel="Save profile" />
              </form>
            ) : null}

            {panel === 'password' ? (
              <form onSubmit={(e) => void savePassword(e)} className="space-y-3">
                <Field label="Current password">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className={inputClass}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New password">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </Field>
                <FormActions busy={busy} onBack={goMenu} submitLabel="Update password" />
              </form>
            ) : null}

            {panel === 'email' ? (
              <form onSubmit={(e) => void saveEmail(e)} className="space-y-3">
                <p className="m-0 text-[13px] text-[#5f7a8a]">
                  Current email: <span className="font-semibold text-[#12303f]">{customer.email}</span>
                </p>
                <Field label="New email">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className={inputClass}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Confirm with password">
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                    className={inputClass}
                    autoComplete="current-password"
                  />
                </Field>
                <FormActions busy={busy} onBack={goMenu} submitLabel="Change email" />
              </form>
            ) : null}

            {panel === 'verify-email' ? (
              <form onSubmit={(e) => void confirmEmail(e)} className="space-y-3">
                <Field label="6-digit code">
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    pattern="\d{6}"
                    className={inputClass}
                    placeholder="000000"
                  />
                </Field>
                {devCode ? (
                  <p className="m-0 rounded-xl bg-[#FFF7ED] px-3 py-2 text-[12px] text-[#9A3412]">
                    Dev code: <strong>{devCode}</strong>
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={goMenu}
                    className="rounded-xl border border-[#d7e2ea] px-4 py-2.5 text-[13px] font-semibold text-[#5f7a8a] hover:bg-[#f6f9fb]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void resendCode()}
                    className="rounded-xl border border-[#BAE6FD] px-4 py-2.5 text-[13px] font-semibold text-[#0369A1] hover:bg-[#E0F2FE] disabled:opacity-60"
                  >
                    Resend code
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0284C7] disabled:opacity-60"
                  >
                    {busy ? 'Please wait…' : 'Verify email'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#d7e2ea] bg-white px-3 py-2.5 text-sm text-[#12303f] outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-[#5f7a8a]">{label}</span>
      {children}
    </label>
  );
}

function FormActions({
  busy,
  onBack,
  submitLabel,
}: {
  busy: boolean;
  onBack: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl border border-[#d7e2ea] px-4 py-2.5 text-[13px] font-semibold text-[#5f7a8a] hover:bg-[#f6f9fb]"
      >
        Back
      </button>
      <button
        type="submit"
        disabled={busy}
        className="flex-1 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0284C7] disabled:opacity-60"
      >
        {busy ? 'Please wait…' : submitLabel}
      </button>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#e1e9ef] bg-[#f6f9fb] px-3.5 py-3 text-left transition hover:border-[#BAE6FD] hover:bg-[#E0F2FE]/50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0EA5E9] shadow-sm">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#12303f]">{label}</span>
        <span className="mt-0.5 block truncate text-[12px] text-[#5f7a8a]">{hint}</span>
      </span>
    </button>
  );
}
