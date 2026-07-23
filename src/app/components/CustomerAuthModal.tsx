import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
  loginCustomer,
  registerCustomer,
  resendCustomerCode,
  verifyCustomerEmail,
} from '../lib/customer-api';
import { useAuthScreen } from '../hooks/useAuthScreen';
import type { AuthScreenConfig } from '../data/auth-screen';
import { hamelAssets } from '../data/hamelAssets';
import { resolveStorageImageUrl } from '../lib/storage';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCatalog } from '../context/CatalogContext';
import { getProductDisplayPrices } from '../lib/product-promos';

type Step = 'login' | 'signup' | 'verify';

const BLUE = '#1ba0db';

const fieldClass =
  'w-full rounded-[14px] border border-[#e1e9ef] bg-[#f6f9fb] py-3.5 pl-11 pr-4 text-[14.5px] text-[#12303f] outline-none transition placeholder:text-[#93a9b6] focus:border-[#1ba0db] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,160,219,.18)]';

function PrimaryButton({
  children,
  disabled,
  loading,
  type = 'submit',
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: 'submit' | 'button';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[30px] bg-[#1ba0db] text-[15px] font-semibold text-white shadow-[0_14px_26px_-12px_#1ba0db] transition-colors hover:bg-[#1187bd] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {children}
    </button>
  );
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a9b6]">
      {children}
    </span>
  );
}

function SocialButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[#e1e9ef] bg-white text-[#12303f] transition-colors hover:border-[#1ba0db] hover:bg-[#eef3f7] hover:text-[#1ba0db]"
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.5.4-2.4 1.9C5.3 19.5 8.4 21.5 12 21.5c2.3 0 4.3-.8 5.8-2.1l-3.1-2.4c-.8.6-1.9.9-2.7.9-2.1 0-3.9-1.4-4.5-3.3z"
      />
      <path
        fill="#4A90E2"
        d="M3.7 7.4C3.3 8.3 3 9.4 3 10.5s.2 2.2.7 3.1l2.9-2.3c-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5L3.7 7.4z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.1c1.3 0 2.4.4 3.3 1.3l2.5-2.5C16.3 2.5 14.3 1.5 12 1.5 8.4 1.5 5.3 3.5 3.7 6.6l2.9 2.3C7.1 6.9 9.4 5.1 12 5.1z"
      />
    </svg>
  );
}

function PromoPanel({ config }: { config: AuthScreenConfig }) {
  const { products: catalog } = useCatalog();
  const video = config.promoVideoUrl?.trim();
  const image = resolveStorageImageUrl(config.promoImageUrl?.trim() || '') || config.promoImageUrl;

  const deals = config.products.slice(0, 2).map((deal) => {
    const linked = deal.productId
      ? catalog.find((p) => p.id === deal.productId && p.isActive !== false)
      : undefined;
    if (!linked) return deal;
    const prices = getProductDisplayPrices(linked);
    const sale = prices.saleStart > 0 ? prices.saleStart : prices.listStart;
    const list = prices.listStart;
    const off =
      list > 0 && sale > 0 && sale < list ? Math.round(((list - sale) / list) * 100) : 0;
    return {
      ...deal,
      name: `${linked.brand} ${linked.model}`.trim(),
      price: Math.round(sale || 0).toLocaleString('en-PH'),
      oldPrice: list > sale ? Math.round(list).toLocaleString('en-PH') : '',
      offPercent: String(off),
      imageUrl: linked.image || deal.imageUrl,
    };
  });

  return (
    <div className="relative flex h-full flex-col gap-3.5 bg-[radial-gradient(120%_90%_at_15%_0%,#2bb4e6_0%,#1187bd_45%,#0d6a97_100%)] px-6 py-6 text-white lg:px-7 lg:py-7">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_-10px_rgba(9,44,64,.55)]">
          <ImageWithFallback
            src={hamelAssets.branding.soloLogo}
            alt=""
            className="h-6 w-6 object-contain"
          />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="text-[16px] font-extrabold tracking-[0.06em]">
            {config.brandName}
          </div>
          <div className="mt-0.5 text-[11.5px] font-medium text-white/80">
            {config.brandTagline}
          </div>
        </div>
      </div>

      <div>
        <h2 className="m-0 mb-1 text-[22px] font-bold leading-[1.18] lg:text-[24px]">{config.promoTitle}</h2>
        <p className="m-0 text-[13px] leading-snug text-white/80">{config.promoSubtitle}</p>
      </div>

      <div className="relative h-[120px] shrink-0 overflow-hidden rounded-[14px] border border-white/20 bg-black/10 lg:h-[132px]">
        {video ? (
          /youtube\.com|youtu\.be|vimeo\.com/i.test(video) ? (
            <iframe
              title="Promo video"
              src={
                video.includes('embed')
                  ? video
                  : video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
              }
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={video} className="h-full w-full object-cover" autoPlay muted loop playsInline />
          )
        ) : image ? (
          <ImageWithFallback src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[12px] text-white/60">
            Promo image or video
          </div>
        )}
      </div>

      {config.voucherEnabled && (
        <div className="flex shrink-0 overflow-hidden rounded-[14px] border border-dashed border-white/45 bg-white/12">
          <div className="flex flex-col justify-center border-r border-dashed border-white/40 px-4 py-3">
            <div className="text-[22px] font-bold leading-none">₱{config.voucherAmount}</div>
            <div className="text-[11px] tracking-[0.12em] opacity-85">OFF</div>
          </div>
          <div className="flex flex-col justify-center px-3.5 py-3">
            <div className="text-[13px] font-semibold">{config.voucherLabel}</div>
            <div className="text-[11.5px] opacity-80">{config.voucherHint}</div>
          </div>
        </div>
      )}

      {deals.length > 0 && (
        <div className="min-h-0 shrink">
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/70">
            Member deals
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {deals.map((p) => {
              const img = resolveStorageImageUrl(p.imageUrl?.trim() || '') || p.imageUrl;
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-1.5 rounded-[14px] border border-white/18 bg-white/10 p-2"
                >
                  <div className="relative aspect-[4/3] max-h-[72px] overflow-hidden rounded-[9px] bg-black/10">
                    {img ? (
                      <ImageWithFallback src={img} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                    {p.offPercent && Number(p.offPercent) > 0 ? (
                      <span className="absolute left-1.5 top-1.5 z-[2] rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#1187bd]">
                        -{p.offPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="line-clamp-2 text-[11.5px] font-semibold leading-snug">{p.name}</div>
                    <div className="text-xs">
                      <b>₱{p.price}</b>{' '}
                      {p.oldPrice ? (
                        <span className="text-[10.5px] line-through opacity-60">₱{p.oldPrice}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto flex shrink-0 items-center gap-2 text-[12px] text-white/85">
        <Star className="h-3.5 w-3.5 fill-[#ffd45e] text-[#ffd45e]" />
        <b>{config.socialProofRating}</b>
        <span className="opacity-70">· {config.socialProofText}</span>
      </div>
    </div>
  );
}

export function CustomerAuthModal() {
  const {
    modalOpen,
    modalView,
    modalReason,
    closeAuth,
    setModalView,
    onAuthenticated,
  } = useCustomerAuth();
  const config = useAuthScreen();

  const [step, setStep] = useState<Step>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setCode('');
    setError(null);
    setNotice(null);
    setDevCode(null);
    setShowPassword(false);
  };

  const openedRef = useRef(false);
  useEffect(() => {
    if (modalOpen && !openedRef.current) {
      openedRef.current = true;
      setStep(modalView);
      resetForm();
      setEmail('');
    } else if (!modalOpen) {
      openedRef.current = false;
    }
  }, [modalOpen, modalView]);

  const switchTab = (next: 'login' | 'signup') => {
    setModalView(next);
    setStep(next);
    setError(null);
    setNotice(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await loginCustomer(email.trim(), password);
      if ('customer' in res) {
        onAuthenticated(res.customer);
      } else {
        setDevCode(res.devCode ?? null);
        setNotice('Please verify your email to finish signing in. We sent you a new code.');
        setStep('verify');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (config.requireConfirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setDevCode(res.devCode ?? null);
      setNotice('Almost there! Enter the 6-digit code we emailed you.');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const customer = await verifyCustomerEmail(email.trim(), code.trim());
      onAuthenticated(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify your email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    try {
      const res = await resendCustomerCode(email.trim());
      setDevCode(res.devCode ?? null);
      setNotice('A new code is on its way to your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    }
  };

  const socialSoon = () => {
    setError(null);
    setNotice('Social sign-in is coming soon. Please use email for now.');
  };

  const heading = useMemo(() => {
    if (step === 'verify') return 'Verify your email';
    return step === 'login' ? config.loginTitle : config.signupTitle;
  }, [step, config.loginTitle, config.signupTitle]);

  const subheading = useMemo(() => {
    if (step === 'verify') return `We sent a 6-digit code to ${email}.`;
    if (modalReason) return modalReason;
    return step === 'login' ? config.loginSubtitle : config.signupSubtitle;
  }, [step, email, modalReason, config.loginSubtitle, config.signupSubtitle]);

  const showPromo = config.layout === 'split' && step !== 'verify';
  const anyProvider =
    config.providers.google || config.providers.apple || config.providers.facebook;

  const loginCta = config.loginCta.replace(/₱500/g, `₱${config.voucherAmount}`);
  const signupSubtitle = config.signupSubtitle.replace(/₱500/g, `₱${config.voucherAmount}`);

  return (
    <DialogPrimitive.Root open={modalOpen} onOpenChange={(o) => (o ? null : closeAuth())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#12303f]/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white font-[Poppins,sans-serif] shadow-[0_30px_70px_-30px_rgba(9,44,64,.55)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${
            showPromo
              ? 'max-h-[min(96vh,880px)] max-w-[960px]'
              : 'max-h-[min(96vh,720px)] max-w-[480px]'
          }`}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ ['--auth-blue' as string]: BLUE }}
        >
          <DialogPrimitive.Title className="sr-only">{heading}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{subheading}</DialogPrimitive.Description>

          <DialogPrimitive.Close
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-[#12303f]/80 transition-colors hover:bg-black/15 hover:text-[#12303f] md:right-4 md:top-4"
            aria-label="Close"
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </DialogPrimitive.Close>

          <div
            className={`grid min-h-0 ${
              showPromo ? 'lg:grid-cols-[1fr_1.05fr]' : 'grid-cols-1'
            }`}
          >
            {showPromo && (
              <div className="hidden min-h-0 lg:block">
                <PromoPanel config={config} />
              </div>
            )}

            <div className="flex flex-col gap-3.5 px-6 py-6 sm:gap-4 sm:px-8 sm:py-7">
              <div>
                <h2 className="m-0 mb-1 text-2xl font-bold tracking-tight text-[#12303f]">
                  {heading}
                </h2>
                <p className="m-0 text-sm text-[#5f7a8a]">
                  {step === 'signup' && !modalReason ? signupSubtitle : subheading}
                </p>
              </div>

              {step !== 'verify' && anyProvider && (
                <>
                  <div className="flex justify-center gap-3.5">
                    {config.providers.google && (
                      <SocialButton label="Continue with Google" onClick={socialSoon}>
                        <GoogleIcon />
                      </SocialButton>
                    )}
                    {config.providers.apple && (
                      <SocialButton label="Continue with Apple" onClick={socialSoon}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                          <path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.5zM14.5 6.4c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 0 2-.6 2.8-1.4z" />
                        </svg>
                      </SocialButton>
                    )}
                    {config.providers.facebook && (
                      <SocialButton label="Continue with Facebook" onClick={socialSoon}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                          <path
                            fill="#1877F2"
                            d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"
                          />
                        </svg>
                      </SocialButton>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#93a9b6]">
                    <span className="h-px flex-1 bg-[#e1e9ef]" />
                    or with email
                    <span className="h-px flex-1 bg-[#e1e9ef]" />
                  </div>
                </>
              )}

              {step !== 'verify' && (
                <div className="relative grid grid-cols-2 rounded-[13px] bg-[#eef3f7] p-1.5">
                  <span
                    className={`absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-[9px] bg-white shadow-[0_2px_6px_rgba(18,48,63,.14)] transition-all duration-200 ${
                      step === 'login' ? 'left-1.5' : 'left-[calc(50%+0px)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="relative z-[1] border-0 bg-transparent py-2.5 text-sm font-semibold text-[#12303f]"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="relative z-[1] border-0 bg-transparent py-2.5 text-sm font-semibold text-[#12303f]"
                  >
                    Sign up
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                  {error}
                </div>
              )}
              {notice && !error && (
                <div className="flex items-start gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2.5 text-[13px] text-[#0369A1]">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}
              {devCode && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                  Dev mode — your code is{' '}
                  <span className="font-bold tracking-widest">{devCode}</span>
                </div>
              )}

              {step === 'login' && (
                <form onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-[15px]">
                  <div className="relative">
                    <FieldIcon>
                      <Mail className="h-[15px] w-[15px]" />
                    </FieldIcon>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                      placeholder="Email address"
                    />
                  </div>
                  <div className="relative">
                    <FieldIcon>
                      <Lock className="h-[15px] w-[15px]" />
                    </FieldIcon>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${fieldClass} pr-12`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5f7a8a]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                    </button>
                  </div>
                  {config.showKeepSignedIn && (
                    <label className="flex items-center gap-2 text-[13px] text-[#5f7a8a]">
                      <input
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="h-4 w-4 rounded border-[#e1e9ef] text-[#1ba0db] focus:ring-[#1ba0db]"
                      />
                      Keep me signed in
                    </label>
                  )}
                  <div className="-mt-1 flex justify-end">
                    <span className="cursor-default text-[12.5px] font-semibold text-[#1ba0db]/70">
                      Forgot password?
                    </span>
                  </div>
                  <PrimaryButton disabled={submitting} loading={submitting}>
                    {submitting ? (
                      'Signing in…'
                    ) : (
                      <>
                        {loginCta} <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </PrimaryButton>
                </form>
              )}

              {step === 'signup' && (
                <form onSubmit={(e) => void handleSignup(e)} className="flex flex-col gap-3.5">
                  <div className="relative">
                    <FieldIcon>
                      <User className="h-[15px] w-[15px]" />
                    </FieldIcon>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={fieldClass}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="relative">
                    <FieldIcon>
                      <Mail className="h-[15px] w-[15px]" />
                    </FieldIcon>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                      placeholder="Email address"
                    />
                  </div>
                  <div className="relative">
                    <FieldIcon>
                      <Phone className="h-[14px] w-[14px]" />
                    </FieldIcon>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldClass}
                      placeholder="Phone (optional)"
                    />
                  </div>
                  <div className="relative">
                    <FieldIcon>
                      <Lock className="h-[15px] w-[15px]" />
                    </FieldIcon>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${fieldClass} pr-12`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5f7a8a]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                    </button>
                  </div>
                  {config.requireConfirmPassword && (
                    <div className="relative">
                      <FieldIcon>
                        <Lock className="h-[15px] w-[15px]" />
                      </FieldIcon>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={fieldClass}
                        placeholder="Confirm password"
                      />
                    </div>
                  )}
                  <PrimaryButton disabled={submitting} loading={submitting}>
                    {submitting ? (
                      'Creating account…'
                    ) : (
                      <>
                        {config.signupCta} <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </PrimaryButton>
                  <p className="m-0 text-center text-[11.5px] leading-relaxed text-[#93a9b6]">
                    {config.termsText}
                  </p>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={(e) => void handleVerify(e)} className="flex flex-col gap-4">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E0F2FE]">
                      <ShieldCheck className="h-7 w-7" style={{ color: BLUE }} />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-[14px] border border-[#e1e9ef] bg-[#f6f9fb] py-3.5 text-center text-[24px] font-bold tracking-[0.5em] text-[#12303f] outline-none focus:border-[#1ba0db] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,160,219,.18)]"
                      placeholder="••••••"
                    />
                  </div>
                  <PrimaryButton disabled={submitting || code.length !== 6} loading={submitting}>
                    {submitting ? 'Verifying…' : 'Verify & continue'}
                  </PrimaryButton>
                  <div className="flex items-center justify-center gap-1 text-[13px] text-[#5f7a8a]">
                    <span>Didn&apos;t get it?</span>
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      className="font-semibold text-[#1187bd] hover:underline"
                    >
                      Resend code
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="text-center text-[12.5px] text-[#93a9b6] hover:text-[#5f7a8a]"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
