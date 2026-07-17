import { ShieldCheck } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';

const effectiveDate = 'July 17, 2026';

export function PrivacyPolicyPage() {
  const { settings } = useStoreSettings();
  const storeName = settings.storeName || 'Hamel Trading';
  const contactEmail = settings.contactEmail || 'info@hameltrading.com';

  return (
    <div className="bg-slate-50">
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <ShieldCheck size={26} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-600">
            Effective date: {effectiveDate}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12 text-slate-700">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-8 leading-7">
            <section>
              <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
              <p className="mt-2">
                {storeName} respects your privacy. This policy explains how we collect, use,
                store, and protect information when you browse our website, submit an inquiry,
                or contact us through Messenger, WhatsApp, phone, or email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">2. Information we collect</h2>
              <p className="mt-2">Depending on how you contact us, we may collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Your name, phone number, email address, and delivery or service address</li>
                <li>Product, room, installation, schedule, and payment-preference details</li>
                <li>Messages and inquiry details you send through our website or messaging channels</li>
                <li>Basic website usage information, such as pages visited and device/browser data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">3. How we use your information</h2>
              <p className="mt-2">We use your information to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Respond to inquiries, prepare quotations, and arrange consultations or installation</li>
                <li>Send follow-ups about your inquiry through your chosen contact channel</li>
                <li>Improve our products, services, website, and customer support</li>
                <li>Meet legal, accounting, fraud-prevention, and record-keeping obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">4. Messenger and other third-party services</h2>
              <p className="mt-2">
                If you choose to continue an inquiry in Messenger, WhatsApp, or another
                third-party service, that service&apos;s own privacy policy also applies. We use
                Messenger to send inquiry confirmations and respond to customer messages. We do
                not sell your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">5. Sharing and retention</h2>
              <p className="mt-2">
                We share personal information only with staff and service providers who need it
                to provide our services, operate our website, or comply with the law. We retain
                inquiry and transaction records only as long as reasonably needed for these
                purposes, unless a longer period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">6. Your choices and data requests</h2>
              <p className="mt-2">
                You may request access to, correction of, or deletion of your personal
                information, subject to applicable legal requirements. To make a request, contact
                us using the details below. We may need to verify your identity before completing
                a request.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">7. Security</h2>
              <p className="mt-2">
                We use reasonable administrative, technical, and organizational safeguards to
                protect personal information. No method of internet transmission or storage is
                completely secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">8. Updates to this policy</h2>
              <p className="mt-2">
                We may update this policy when our practices or legal obligations change. The
                effective date at the top of this page shows when it was last updated.
              </p>
            </section>

            <section className="rounded-xl bg-sky-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">9. Contact us</h2>
              <p className="mt-2">
                For privacy questions or data requests, contact {storeName} at{' '}
                <a className="font-medium text-sky-700 underline" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
