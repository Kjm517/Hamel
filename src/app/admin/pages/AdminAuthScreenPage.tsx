import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import {
  defaultAuthScreen,
  emptyAuthDealProduct,
  loadAuthScreen,
  resetAuthScreen,
  saveAuthScreen,
  type AuthScreenConfig,
  type AuthScreenDealProduct,
  type AuthScreenLayout,
} from '../../data/auth-screen';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { AdminToggle } from '../components/AdminToggle';
import { AdminSaveBar } from '../components/AdminSaveBar';
import { useAdminConfirm } from '../components/AdminConfirmDialog';
import { mediaPathFor } from '../../lib/storage';
import { adminUi } from '../lib/admin-ui';
import { useCatalog } from '../../context/CatalogContext';
import { getProductDisplayPrices } from '../../lib/product-promos';
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import type { Product } from '../../data/products';

function Section({
  title,
  hint,
  badge,
  children,
}: {
  title: string;
  hint?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[#e3ebf1] bg-white p-6 shadow-[0_1px_2px_rgba(18,48,63,.04)]">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-[#12303f]">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-[#eef3f7] px-2.5 py-0.5 text-[11px] text-[#93a9b6]">
            {badge}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mb-4 mt-0 text-[13.5px] text-[#5f7a8a]">{hint}</p> : null}
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-semibold text-[#12303f]">{children}</label>;
}

const inputClass =
  'w-full rounded-xl border border-[#e3ebf1] bg-[#f6f9fb] px-3.5 py-2.5 text-sm text-[#12303f] outline-none focus:border-[#1ba0db] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,160,219,.18)]';

function dealFieldsFromProduct(product: Product): Partial<AuthScreenDealProduct> {
  const prices = getProductDisplayPrices(product);
  const sale = prices.saleStart > 0 ? prices.saleStart : prices.listStart;
  const list = prices.listStart;
  const off =
    list > 0 && sale > 0 && sale < list ? Math.round(((list - sale) / list) * 100) : 0;
  return {
    productId: product.id,
    name: `${product.brand} ${product.model}`.trim(),
    price: Math.round(sale || 0).toLocaleString('en-PH'),
    oldPrice: list > sale ? Math.round(list).toLocaleString('en-PH') : '',
    offPercent: String(off),
    imageUrl: product.image || '',
  };
}

export function AdminAuthScreenPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const { products: catalog } = useCatalog();
  const activeCatalog = catalog.filter((p) => p.isActive !== false);
  const [config, setConfig] = useState<AuthScreenConfig>(() => defaultAuthScreen);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const skipAutoSave = useRef(true);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    let cancelled = false;
    void loadAuthScreen().then((next) => {
      if (cancelled) return;
      setConfig(next);
      setLoading(false);
      skipAutoSave.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistNow = useCallback(() => {
    void saveAuthScreen(configRef.current).then(() => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    });
  }, []);

  const queuePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(persistNow, 450);
  }, [persistNow]);

  useEffect(() => {
    if (loading) return;
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    queuePersist();
  }, [config, loading, queuePersist]);

  const patch = (partial: Partial<AuthScreenConfig>) => {
    setConfig((c) => ({ ...c, ...partial }));
  };

  const patchProduct = (id: string, partial: Partial<AuthScreenDealProduct>) => {
    setConfig((c) => ({
      ...c,
      products: c.products.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
  };

  const pickCatalogProduct = (rowId: string, productId: string) => {
    const product = activeCatalog.find((p) => p.id === productId);
    if (!product) {
      patchProduct(rowId, { productId: undefined });
      return;
    }
    patchProduct(rowId, dealFieldsFromProduct(product));
  };

  const setLayout = (layout: AuthScreenLayout) => patch({ layout });

  if (loading) {
    return <p className="text-gray-600">Loading sign-in screen…</p>;
  }

  return (
    <div className="pb-24">
      {confirmDialog}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#93a9b6]">Storefront · Authentication</p>
          <h1 className="m-0 text-[22px] font-bold text-[#12303f]">Sign-in screen</h1>
          <p className={`${adminUi.pageIntro} mt-1`}>
            Control layout, promo media, welcome voucher, and featured catalog deals.
            Changes apply to the customer login / sign-up modal.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#e3ebf1] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#12303f] hover:bg-[#eef3f7]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open storefront
        </a>
      </div>

      <div className="mx-auto flex max-w-[920px] flex-col gap-6">
        <Section title="Layout" hint="Choose how the sign-in screen appears to customers.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  id: 'single' as const,
                  label: 'Centered card',
                  hint: 'Form only',
                  preview: (
                    <span className="flex h-11 w-14 items-center justify-center rounded-md border border-[#e3ebf1] bg-white">
                      <span className="h-7 w-[22px] rounded-[3px] border border-[#e3ebf1] bg-[#eef3f7]" />
                    </span>
                  ),
                },
                {
                  id: 'split' as const,
                  label: 'Split promo',
                  hint: 'Promo + form',
                  preview: (
                    <span className="flex h-11 w-14 overflow-hidden rounded-md border border-[#e3ebf1] bg-white">
                      <span className="w-1/2 bg-gradient-to-br from-[#1ba0db] to-[#1187bd]" />
                      <span className="flex w-1/2 items-center justify-center">
                        <span className="h-[22px] w-4 rounded-[3px] bg-[#eef3f7]" />
                      </span>
                    </span>
                  ),
                },
              ] as const
            ).map((opt) => {
              const active = config.layout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`relative flex items-center gap-3.5 rounded-[14px] border bg-[#f6f9fb] p-4 text-left ${
                    active ? 'border-[#1ba0db]' : 'border-[#e3ebf1]'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-[14px] border-2 border-[#1ba0db] pointer-events-none" />
                  )}
                  {opt.preview}
                  <span>
                    <span className="block text-sm font-semibold text-[#12303f]">{opt.label}</span>
                    <span className="block text-xs text-[#5f7a8a]">{opt.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Brand & copy">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Brand name</FieldLabel>
              <input
                className={inputClass}
                value={config.brandName}
                onChange={(e) => patch({ brandName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Tagline</FieldLabel>
              <input
                className={inputClass}
                value={config.brandTagline}
                onChange={(e) => patch({ brandTagline: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-in title</FieldLabel>
              <input
                className={inputClass}
                value={config.loginTitle}
                onChange={(e) => patch({ loginTitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-up title</FieldLabel>
              <input
                className={inputClass}
                value={config.signupTitle}
                onChange={(e) => patch({ signupTitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-in subtitle</FieldLabel>
              <input
                className={inputClass}
                value={config.loginSubtitle}
                onChange={(e) => patch({ loginSubtitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-up subtitle</FieldLabel>
              <input
                className={inputClass}
                value={config.signupSubtitle}
                onChange={(e) => patch({ signupSubtitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-in button</FieldLabel>
              <input
                className={inputClass}
                value={config.loginCta}
                onChange={(e) => patch({ loginCta: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Sign-up button</FieldLabel>
              <input
                className={inputClass}
                value={config.signupCta}
                onChange={(e) => patch({ signupCta: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Terms line (sign-up)</FieldLabel>
              <input
                className={inputClass}
                value={config.termsText}
                onChange={(e) => patch({ termsText: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-5 space-y-4 border-t border-[#e3ebf1] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#12303f]">Require confirm password</div>
                <div className="text-xs text-[#5f7a8a]">Second password field on sign-up</div>
              </div>
              <AdminToggle
                checked={config.requireConfirmPassword}
                onChange={(v) => patch({ requireConfirmPassword: v })}
                label="Confirm password"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#12303f]">Keep me signed in</div>
                <div className="text-xs text-[#5f7a8a]">Show the persistence option</div>
              </div>
              <AdminToggle
                checked={config.showKeepSignedIn}
                onChange={(v) => patch({ showKeepSignedIn: v })}
                label="Keep signed in"
              />
            </div>
          </div>
        </Section>

        <Section title="Social sign-in" hint="Show Google, Apple, and Facebook buttons on the login modal.">
          {(
            [
              { key: 'google' as const, title: 'Google', hint: 'One-tap OAuth (coming soon)' },
              { key: 'apple' as const, title: 'Apple', hint: 'Sign in with Apple (coming soon)' },
              {
                key: 'facebook' as const,
                title: 'Facebook',
                hint: 'Social login (coming soon)',
              },
            ] as const
          ).map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between border-t border-[#e3ebf1] py-4 first:border-t-0 first:pt-0"
            >
              <div>
                <div className="text-sm font-semibold text-[#12303f]">{row.title}</div>
                <div className="text-xs text-[#5f7a8a]">{row.hint}</div>
              </div>
              <AdminToggle
                checked={config.providers[row.key]}
                onChange={(v) =>
                  patch({ providers: { ...config.providers, [row.key]: v } })
                }
                label={row.title}
              />
            </div>
          ))}
        </Section>

        <Section
          title="Promo panel"
          hint="Shown on the left side when Split promo layout is selected."
          badge="Split layout only"
        >
          <div className="mb-4 grid gap-4">
            <div>
              <FieldLabel>Promo title</FieldLabel>
              <input
                className={inputClass}
                value={config.promoTitle}
                onChange={(e) => patch({ promoTitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Promo subtitle</FieldLabel>
              <textarea
                className={`${inputClass} min-h-[72px]`}
                value={config.promoSubtitle}
                onChange={(e) => patch({ promoSubtitle: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <ImageUrlOrUploadField
              label="Promo image"
              value={config.promoImageUrl || ''}
              onChange={(v) => patch({ promoImageUrl: v })}
              remoteUpload={{ getObjectPath: mediaPathFor('auth-screen') }}
              sizeGuide={IMAGE_SIZE_GUIDES.authPromoImage}
            />
            <div>
              <FieldLabel>
                Video URL <span className="font-medium text-[#93a9b6]">(optional)</span>
              </FieldLabel>
              <input
                type="url"
                className={inputClass}
                value={config.promoVideoUrl || ''}
                onChange={(e) => patch({ promoVideoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=…"
              />
              <p className="mt-2 text-xs text-[#93a9b6]">
                If a video URL is set it plays in place of the image.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Social rating</FieldLabel>
                  <input
                    className={inputClass}
                    value={config.socialProofRating}
                    onChange={(e) => patch({ socialProofRating: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Social proof text</FieldLabel>
                  <input
                    className={inputClass}
                    value={config.socialProofText}
                    onChange={(e) => patch({ socialProofText: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Welcome voucher" hint="Reward shown to new sign-ups on the promo panel.">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#12303f]">Show voucher ticket</span>
            <AdminToggle
              checked={config.voucherEnabled}
              onChange={(v) => patch({ voucherEnabled: v })}
              label="Welcome voucher"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div>
              <FieldLabel>Amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-[#5f7a8a]">
                  ₱
                </span>
                <input
                  className={`${inputClass} pl-8`}
                  value={config.voucherAmount}
                  onChange={(e) => patch({ voucherAmount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Label</FieldLabel>
              <input
                className={inputClass}
                value={config.voucherLabel}
                onChange={(e) => patch({ voucherLabel: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Hint line</FieldLabel>
            <input
              className={inputClass}
              value={config.voucherHint}
              onChange={(e) => patch({ voucherHint: e.target.value })}
            />
          </div>
        </Section>

        <Section title="Featured products" hint="Pick catalog products for the promo panel (up to 2 shown).">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                patch({ products: [...config.products, emptyAuthDealProduct()] })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ebf1] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1187bd] hover:bg-[#eef3f7]"
            >
              <Plus className="h-3 w-3" /> Add product
            </button>
          </div>
          {config.products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#e3ebf1] bg-[#f6f9fb] px-4 py-6 text-center text-sm text-[#5f7a8a]">
              No featured products yet. Click Add product and choose from your catalog.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {config.products.map((p) => {
                const linked = p.productId
                  ? activeCatalog.find((c) => c.id === p.productId)
                  : undefined;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-[14px] border border-[#e3ebf1] bg-[#f6f9fb] p-3 sm:flex-row sm:items-center"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e3ebf1] bg-white">
                      {p.imageUrl || linked?.image ? (
                        <img
                          src={p.imageUrl || linked?.image}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[#93a9b6]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <FieldLabel>Catalog product</FieldLabel>
                        <select
                          className={`${inputClass} bg-white font-semibold`}
                          value={p.productId || ''}
                          onChange={(e) => pickCatalogProduct(p.id, e.target.value)}
                        >
                          <option value="">— Choose a product —</option>
                          {activeCatalog.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.brand} {c.model}
                            </option>
                          ))}
                        </select>
                      </div>
                      {p.productId ? (
                        <div className="text-[12.5px] text-[#5f7a8a]">
                          <span className="font-semibold text-[#12303f]">₱{p.price}</span>
                          {p.oldPrice ? (
                            <span className="ml-2 line-through opacity-60">₱{p.oldPrice}</span>
                          ) : null}
                          {p.offPercent && Number(p.offPercent) > 0 ? (
                            <span className="ml-2 font-semibold text-[#1187bd]">
                              -{p.offPercent}%
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() =>
                        patch({ products: config.products.filter((x) => x.id !== p.id) })
                      }
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-[10px] border border-[#e3ebf1] bg-white text-[#5f7a8a] hover:border-[#e0526a] hover:bg-[#fff5f6] hover:text-[#e0526a] sm:self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={() => persistNow()}
        onReset={() => {
          void confirm({
            title: 'Reset sign-in screen?',
            description: 'This restores the default layout, copy, and deals.',
            confirmLabel: 'Reset',
            tone: 'danger',
          }).then((ok) => {
            if (!ok) return;
            void resetAuthScreen().then((next) => {
              skipAutoSave.current = true;
              setConfig(next);
              setSaved(true);
            });
          });
        }}
        resetLabel="Reset to defaults"
      />
    </div>
  );
}
