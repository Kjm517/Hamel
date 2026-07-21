import { useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { hamelAssets } from '../data/hamelAssets';

interface ContactOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SocialLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-transform group-hover:scale-110">
      <img src={src} alt={alt} className="h-10 w-10 object-contain" />
    </div>
  );
}

export function ContactOptionsModal({ isOpen, onClose }: ContactOptionsModalProps) {
  const { settings, whatsappUrl, viberUrl, telHref, whatsappDisplay } = useStoreSettings();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#0EA5E9' }}>
              Talk to Our Team
            </h2>
            <p className="mt-1 text-sm text-gray-600">Choose your preferred platform</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <a
            href={settings.messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="flex items-center gap-4">
              <SocialLogo src={hamelAssets.social.messenger} alt="Messenger" />
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">Facebook Messenger</div>
                <div className="text-sm text-gray-600">Usually replies instantly</div>
              </div>
              <div className="text-gray-400 transition-colors group-hover:text-blue-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex items-center gap-4">
              <SocialLogo src={hamelAssets.social.whatsapp} alt="WhatsApp" />
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">WhatsApp</div>
                <div className="text-sm text-gray-600">{whatsappDisplay}</div>
              </div>
              <div className="text-gray-400 transition-colors group-hover:text-green-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a
            href={viberUrl}
            className="group block rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-purple-500 hover:bg-purple-50"
          >
            <div className="flex items-center gap-4">
              <SocialLogo src={hamelAssets.social.viber} alt="Viber" />
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">Viber</div>
                <div className="text-sm text-gray-600">{whatsappDisplay}</div>
              </div>
              <div className="text-gray-400 transition-colors group-hover:text-purple-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a
            href={telHref}
            className="group block rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-[#0EA5E9] hover:bg-blue-50"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                <Phone size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">Call Us</div>
                <div className="text-sm text-gray-600">
                  {settings.phoneDisplay || whatsappDisplay}
                </div>
              </div>
              <div className="text-gray-400 transition-colors group-hover:text-[#0EA5E9]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        <div className="rounded-b-2xl border-t bg-gray-50 p-6">
          <p className="whitespace-pre-line text-center text-sm text-gray-600">
            Our team is available {settings.businessHours}
          </p>
        </div>
      </div>
    </div>
  );
}
