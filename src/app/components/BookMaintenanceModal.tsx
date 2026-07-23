import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Wrench,
  ShieldCheck,
  MapPin,
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { createInquiry } from '../admin/lib/inquiries-api';
import { openUrlBlank } from '../lib/open-external';

interface BookMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_TYPES = [
  'General Cleaning',
  'Repair / Troubleshooting',
  'Freon / Refrigerant Recharge',
  'Check-up / Diagnostics',
  'Preventive Maintenance Plan',
] as const;

const AC_TYPES = [
  'Window Type',
  'Wall-Mounted Split',
  'Cassette / Ceiling',
  'Floor Standing',
  'Not sure',
] as const;

const TIME_SLOTS = [
  'Morning (8AM – 12PM)',
  'Afternoon (1PM – 5PM)',
] as const;

const BENEFITS = [
  { icon: ShieldCheck, label: 'Certified technicians' },
  { icon: MapPin, label: 'Serving Metro Cebu' },
  { icon: CalendarClock, label: 'Fast scheduling' },
];

const EMPTY = {
  name: '',
  phone: '',
  serviceType: SERVICE_TYPES[0] as string,
  acType: AC_TYPES[1] as string,
  units: '1',
  date: '',
  time: TIME_SLOTS[0] as string,
  address: '',
  notes: '',
};

export function BookMaintenanceModal({ isOpen, onClose }: BookMaintenanceModalProps) {
  const { whatsappUrl, messengerUrl, settings } = useStoreSettings();
  const [form, setForm] = useState({ ...EMPTY });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Reset to a clean form whenever the modal is re-opened.
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY });
      setStatus('idle');
    }
  }, [isOpen]);

  const canSubmit =
    form.name.trim() !== '' &&
    form.phone.trim() !== '' &&
    form.serviceType !== '' &&
    form.address.trim() !== '';

  const summaryMessage = useMemo(() => {
    const lines = [
      "Hi Hamel Trading! I'd like to book an aircon maintenance service:",
      '',
      `Service: ${form.serviceType}`,
      `Aircon type: ${form.acType}`,
      `Units: ${form.units}`,
      form.date ? `Preferred date: ${form.date}` : '',
      `Preferred time: ${form.time}`,
      `Name: ${form.name}`,
      `Contact: ${form.phone}`,
      `Address: ${form.address}`,
      form.notes ? `Notes: ${form.notes}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }, [form]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!canSubmit || status === 'submitting') return;
    setStatus('submitting');
    try {
      await createInquiry({
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        productLabel: `Maintenance — ${form.serviceType}`,
        quantity: form.units,
        address: form.address.trim(),
        propertyType: form.acType,
        scheduleDate: form.date || undefined,
        scheduleTime: form.time,
        notes: form.notes.trim() || undefined,
        source: 'maintenance-booking',
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#0EA5E9] transition-colors';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5';
  const req = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-[#0EA5E9] to-[#0C4A6E] px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Wrench size={24} />
            </span>
            <div>
              <h2 className="text-xl font-bold leading-tight">Request a Service</h2>
              <p className="mt-0.5 text-sm text-blue-100">
                Aircon cleaning, repair & maintenance — booked in a minute.
              </p>
            </div>
          </div>
        </div>

        {status === 'success' ? (
          /* ---------------- Success ---------------- */
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={36} />
            </span>
            <h3 className="mt-4 text-xl font-bold text-gray-900">Booking request sent!</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              Thanks, {form.name.split(' ')[0] || 'there'}! Our team will contact you at{' '}
              <span className="font-semibold text-gray-800">{form.phone}</span> to confirm your{' '}
              <span className="font-semibold text-gray-800">{form.serviceType.toLowerCase()}</span> schedule.
            </p>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => openUrlBlank(messengerUrl({ message: summaryMessage }))}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-[#0EA5E9] transition-colors hover:bg-blue-50"
              >
                <MessageCircle size={18} /> Confirm on Messenger
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg bg-[#FFC107] px-4 py-2.5 text-sm font-bold text-gray-900 transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Benefits strip */}
            <div className="flex shrink-0 flex-wrap justify-center gap-x-5 gap-y-2 border-b border-gray-100 bg-[#F4F8FC] px-6 py-3">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs font-semibold text-[#0C4A6E]">
                  <Icon size={15} className="text-[#0EA5E9]" />
                  {label}
                </span>
              ))}
            </div>

            {/* Form */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full name {req}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Mobile number {req}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Service needed {req}</label>
                  <select
                    value={form.serviceType}
                    onChange={(e) => set('serviceType', e.target.value)}
                    className={inputClass}
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Aircon type</label>
                  <select
                    value={form.acType}
                    onChange={(e) => set('acType', e.target.value)}
                    className={inputClass}
                  >
                    {AC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Number of units</label>
                  <input
                    type="number"
                    min="1"
                    value={form.units}
                    onChange={(e) => set('units', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Preferred date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Preferred time</label>
                  <select
                    value={form.time}
                    onChange={(e) => set('time', e.target.value)}
                    className={inputClass}
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Service address {req}</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Barangay, City (Metro Cebu)"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Unit brand, issue you're noticing, gate/parking info, etc."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {status === 'error' && (
                <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                  Something went wrong sending your request. Please try again, or book directly via
                  Messenger / WhatsApp below.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 space-y-3 border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                disabled={!canSubmit || status === 'submitting'}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-base font-bold text-gray-900 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#FFC107' }}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <CalendarClock size={20} /> Request booking
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">or book directly</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openUrlBlank(messengerUrl({ message: summaryMessage }))}
                  className="flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50"
                  style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
                >
                  <MessageCircle size={18} /> Messenger
                </button>
                <button
                  type="button"
                  onClick={() => openUrlBlank(whatsappUrl(summaryMessage))}
                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 px-4 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50"
                >
                  <Send size={18} /> WhatsApp
                </button>
              </div>

              {settings.businessHours && (
                <p className="text-center text-xs text-gray-500">
                  Team available {settings.businessHours}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
