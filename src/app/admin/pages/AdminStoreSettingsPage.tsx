import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from '../lib/ops-api';

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

  if (!form) return <p className="text-sm text-gray-500">Loading settings…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Store contact and feature flags (Neon). Used on the storefront.</p>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {(
          [
            ['storeName', 'Store name'],
            ['whatsappNumber', 'WhatsApp number (digits, country code)'],
            ['phoneDisplay', 'Phone display (landline / call-us text)'],
            ['contactEmail', 'Contact email'],
            ['businessHours', 'Business hours'],
            ['messengerUrl', 'Messenger URL (https://m.me/...)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={String(form[key] ?? '')}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Address</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.showAiChat}
            onChange={(e) => setForm({ ...form, showAiChat: e.target.checked })}
          />
          Show AI chat on storefront
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
