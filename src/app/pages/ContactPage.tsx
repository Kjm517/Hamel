import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { PageBanner } from '../components/PageBanner';
import { useBanner } from '../hooks/useBanner';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { createMessage } from '../admin/lib/messages-api';

export function ContactPage() {
  const contactBanner = useBanner('contact');
  const { settings, whatsappUrl, viberUrl, telHref, whatsappDisplay } = useStoreSettings();
  const addressLines = settings.address.split('\n').filter(Boolean);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitOk(false);
    try {
      const contact = [formData.email, formData.phone].filter(Boolean).join(' · ');
      await createMessage({
        name: formData.name.trim(),
        contact,
        channel: 'contact',
        body: formData.message.trim(),
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitOk(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageBanner config={contactBanner} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0EA5E9' }}>
              Send us a Message
            </h2>
            {submitOk && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Thank you! Your message was sent. We will get back to you soon.
              </div>
            )}
            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {submitError}
              </div>
            )}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  placeholder="Juan dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  placeholder="0912-345-6789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Your Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent resize-none"
                  placeholder="Tell us what you need help with..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full font-bold hover:opacity-90 transition-opacity text-gray-900 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#FFC107' }}
              >
                <Send size={20} />
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#0EA5E9' }}>
                Contact Information
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E0F2FE' }}>
                    <MapPin size={24} style={{ color: '#0EA5E9' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Visit Our Showroom</div>
                    <div className="text-gray-700 whitespace-pre-line">{settings.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E0F2FE' }}>
                    <Phone size={24} style={{ color: '#0EA5E9' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Call Us</div>
                    <div className="text-gray-700">
                      {settings.phoneDisplay ? (
                        <>
                          <a href={telHref} className="hover:underline">{settings.phoneDisplay}</a>
                          <br />
                        </>
                      ) : null}
                      Mobile: <a href={whatsappUrl()} className="hover:underline">{whatsappDisplay}</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E0F2FE' }}>
                    <Mail size={24} style={{ color: '#0EA5E9' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Email Us</div>
                    <div className="text-gray-700">
                      <a href={`mailto:${settings.contactEmail}`} className="hover:underline">
                        {settings.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E0F2FE' }}>
                    <Clock size={24} style={{ color: '#0EA5E9' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Business Hours</div>
                    <div className="text-gray-700 whitespace-pre-line">{settings.businessHours}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#0EA5E9' }}>
                Connect with Us
              </h3>
              <p className="text-gray-700 mb-4 text-sm">
                For faster response, chat with us directly!
              </p>

              <div className="space-y-3">
                <a
                  href={settings.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    f
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Messenger</div>
                    <div className="text-sm text-gray-600">Usually replies instantly</div>
                  </div>
                </a>

                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-green-50 transition-colors border border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">WhatsApp</div>
                    <div className="text-sm text-gray-600">Chat with us anytime</div>
                  </div>
                </a>

                <a
                  href={viberUrl}
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Viber</div>
                    <div className="text-sm text-gray-600">Message us on Viber</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#0EA5E9' }}>
                Location Map
              </h3>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin size={48} className="mx-auto mb-2" />
                  <p className="text-sm whitespace-pre-line">{addressLines.join(', ') || 'Map coming soon'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0EA5E9' }}>
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How long does delivery take?</h4>
              <p className="text-gray-700 text-sm">Typically 3-5 business days within Metro Cebu after order confirmation.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is installation included?</h4>
              <p className="text-gray-700 text-sm">Yes! Professional installation by TESDA-certified technicians is FREE with every purchase.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer warranty?</h4>
              <p className="text-gray-700 text-sm">All units have official manufacturer warranty - 1 year parts & labor, up to 5 years on compressor.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I visit your showroom?</h4>
              <p className="text-gray-700 text-sm">
                Yes! Visit us during {settings.businessHours}. We recommend calling ahead for availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
