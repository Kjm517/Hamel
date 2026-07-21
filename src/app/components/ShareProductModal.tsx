import { useEffect, useState, type ReactNode } from 'react';
import { Link2, X } from 'lucide-react';
import { copyTextToClipboard, openShareUrl } from '../lib/product-actions';

type ShareProductModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  text?: string;
};

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17V22l3.45-1.89c.98.27 2.01.42 3.41.42 5.64 0 10-4.13 10-9.83S17.64 2 12 2zm1.01 13.24-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.4V9.85c0-2.37 1.4-3.69 3.56-3.69 1.03 0 2.12.19 2.12.19v2.33h-1.2c-1.18 0-1.55.74-1.55 1.49v1.79h2.64l-.42 2.9h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.56l-5.14-6.71L5.2 22H1.94l8.03-9.17L1.5 2h6.72l4.64 6.15L18.244 2zm-1.15 18h1.81L7.01 3.94H5.07L17.094 20z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.4 0C9.4.05 5.4.42 3.1 2.72.9 4.92.4 8.2.36 9.9c-.1 2.9.1 6.6 1.9 9.7L.5 24l4.6-1.5c2.8 1.5 5.7 1.8 8.1 1.8h.1c5.4 0 10.1-3.5 10.6-9.9.2-2.5.1-5.7-1.8-8.4C20.3 3.2 16.4.1 11.4 0zm.2 20.7h-.1c-2.1 0-4.7-.5-7.1-1.9l-.4-.2-2.6.8.8-2.5-.3-.4c-1.7-2.7-2.1-6.1-2-8.6.1-1.4.5-4 2.2-5.7 1.8-1.8 4.8-2.2 6.9-2.3 4.1.1 7.3 2.5 8.7 4.7 1.5 2.2 1.6 4.9 1.5 6.9-.4 5.1-4.2 8.2-7.7 8.2zm4.4-6.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-1.4-.7-2.4-1.2-3.3-2.8-.3-.4.3-.4.7-1.4.1-.2 0-.3-.1-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

type ShareAction = {
  id: string;
  label: string;
  bg: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
};

/** Abenson-style product share sheet. */
export function ShareProductModal({ open, onClose, title, url, text }: ShareProductModalProps) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setHint(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const shareText = text?.trim() || `Check out ${title}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText}\n${url}`);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(null), 2500);
  };

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      showHint('Could not copy link');
    }
  };

  const actions: ShareAction[] = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      bg: '#38BDF8',
      icon: <Link2 className="h-6 w-6 text-white" strokeWidth={2.25} />,
      onClick: () => void handleCopy(),
    },
    {
      id: 'messenger',
      label: 'Messenger',
      bg: 'linear-gradient(135deg, #00B2FF 0%, #006AFF 100%)',
      icon: <MessengerIcon className="h-6 w-6 text-white" />,
      onClick: () => {
        if (isMobile) {
          window.location.href = `fb-messenger://share/?link=${encodedUrl}`;
        } else {
          openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
        }
      },
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bg: '#1877F2',
      icon: <FacebookIcon className="h-6 w-6 text-white" />,
      onClick: () => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      id: 'twitter',
      label: 'Twitter',
      bg: '#111111',
      icon: <TwitterIcon className="h-5 w-5 text-white" />,
      onClick: () =>
        openShareUrl(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`
        ),
    },
    {
      id: 'viber',
      label: 'Viber',
      bg: '#7360F2',
      icon: <ViberIcon className="h-6 w-6 text-white" />,
      onClick: async () => {
        if (isMobile) {
          window.location.href = `viber://forward?text=${encodedText}`;
          return;
        }
        const ok = await copyTextToClipboard(`${shareText}\n${url}`);
        showHint(ok ? 'Link copied — paste it in Viber' : 'Could not copy link for Viber');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close share dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-product-title"
        className="relative w-full max-w-[340px] rounded-2xl bg-white px-5 pb-6 pt-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2
          id="share-product-title"
          className="mb-5 text-center text-lg font-bold text-gray-900"
        >
          Share
        </h2>

        <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3 px-0.5">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => void action.onClick()}
              className="flex w-[58px] flex-col items-center gap-2 rounded-lg p-1 transition hover:bg-gray-50"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full shadow-sm"
                style={{ background: action.bg }}
              >
                {action.icon}
              </span>
              <span className="text-center text-[11px] font-medium leading-tight text-gray-700">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {hint ? (
          <p className="mt-4 text-center text-xs font-medium text-emerald-600">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
