import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from '../lib/ops-api';
import { AdminToggle } from '../components/AdminToggle';
import { adminUi } from '../lib/admin-ui';

export function AdminStoreSettingsPage() {
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchStoreSettings().then(setForm);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await saveStoreSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent('hamel-store-settings-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-[#9aa7b5]">Loading settings…</p>;

  return (
    <div className="mx-auto max-w-[680px]">
      <p className="mb-[18px] text-[14px] leading-relaxed text-[#7a8899]">
        Store name, contact info, and which site features are turned on.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_2px_rgba(30,42,56,0.03)]"
      >
        <h3 className="mb-[18px] text-[15.5px] font-bold text-[#1e2a38]">Store contact</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#516171]">Store name</span>
            <input
              className={adminUi.input}
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">WhatsApp number</span>
            <input
              className={adminUi.input}
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Phone display</span>
            <input
              className={adminUi.input}
              value={form.phoneDisplay}
              onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Contact email</span>
            <input
              className={adminUi.input}
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#516171]">Business hours</span>
            <input
              className={adminUi.input}
              value={form.businessHours}
              onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#516171]">Messenger URL</span>
            <input
              className={adminUi.input}
              value={form.messengerUrl}
              onChange={(e) => setForm({ ...form, messengerUrl: e.target.value })}
              placeholder="https://m.me/..."
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#516171]">Address</span>
            <textarea
              className={adminUi.textarea}
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
        </div>

        <h3 className="mb-3.5 mt-6 text-[15.5px] font-bold text-[#1e2a38]">
          Site options
        </h3>
        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#eef3f8] px-3.5 py-3">
            <span className="text-[13.5px] font-semibold text-[#1e2a38]">
              Show AI chat on the website
            </span>
            <AdminToggle
              checked={form.showAiChat}
              onChange={(showAiChat) => setForm({ ...form, showAiChat })}
              label="Show AI chat"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#eef3f8] px-3.5 py-3">
            <span className="text-[13.5px] font-semibold text-[#1e2a38]">
              Show % icon beside Cool Deals in the menu
            </span>
            <AdminToggle
              checked={form.showCoolDealsNavIcon !== false}
              onChange={(showCoolDealsNavIcon) => setForm({ ...form, showCoolDealsNavIcon })}
              label="Show Cool Deals icon"
            />
          </label>
        </div>

        <div className="mt-[22px]">
          <button type="submit" disabled={saving} className={adminUi.btnPrimary}>
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
