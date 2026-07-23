import type { PromoBannerItem } from '../../data/banners';
import { ImageUrlOrUploadField } from './ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import { BannerLinkDestinationField } from './BannerLinkDestinationField';
import { hexForColorInput } from '../../lib/color-utils';
import { mediaPathFor } from '../../lib/storage';

interface FieldEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

function FieldEditor({ label, value, onChange, placeholder, rows }: FieldEditorProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      )}
    </div>
  );
}

interface PromoSideBannerEditorProps {
  label: string;
  badgeNumber: number;
  item: PromoBannerItem;
  onChange: (patch: Partial<PromoBannerItem>) => void;
}

export function PromoSideBannerEditor({ label, badgeNumber, item, onChange }: PromoSideBannerEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-black"
          style={{ backgroundColor: '#0EA5E9' }}
        >
          {badgeNumber}
        </span>
        {label}
      </div>
      <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700">
        <input
          type="checkbox"
          checked={item.enabled !== false}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Show on homepage
      </label>
      <div className="h-10 rounded-lg mb-3 flex items-center px-3 gap-2" style={{ backgroundColor: item.bgColor }}>
        <span className="text-sm font-black" style={{ color: item.textColor }}>
          {item.title}{' '}
        </span>
        <span className="text-sm font-black" style={{ color: item.accentColor }}>
          {item.titleAccent}
        </span>
      </div>
      <BannerLinkDestinationField fields={item} onChange={onChange} />
      <div className="grid md:grid-cols-2 gap-x-4">
        <div>
          <FieldEditor label="Title (line 1)" value={item.title} onChange={(v) => onChange({ title: v })} placeholder="e.g. SAME DAY" />
          <FieldEditor
            label="Title accent (line 2)"
            value={item.titleAccent || ''}
            onChange={(v) => onChange({ titleAccent: v })}
            placeholder="e.g. DELIVERY"
          />
          <FieldEditor
            label="Subtitle"
            value={item.subtitle || ''}
            onChange={(v) => onChange({ subtitle: v })}
            placeholder="Supporting text"
            rows={2}
          />
          <FieldEditor label="Badge label" value={item.badge || ''} onChange={(v) => onChange({ badge: v })} placeholder="e.g. Metro Cebu" />
        </div>
        <div>
          <FieldEditor label="Button text on banner (optional)" value={item.ctaLabel || ''} onChange={(v) => onChange({ ctaLabel: v })} placeholder="e.g. Learn more" />
          <ImageUrlOrUploadField
            label="Background image"
            value={item.imageUrl || ''}
            onChange={(v) => onChange({ imageUrl: v })}
            remoteUpload={{ getObjectPath: mediaPathFor('promo-banners') }}
            sizeGuide={IMAGE_SIZE_GUIDES.promoSideBanner}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">BG</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={hexForColorInput(item.bgColor)}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={item.bgColor}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Text</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={hexForColorInput(item.textColor)}
                  onChange={(e) => onChange({ textColor: e.target.value })}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={item.textColor}
                  onChange={(e) => onChange({ textColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Accent</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={hexForColorInput(item.accentColor)}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={item.accentColor}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">
        Short text on the banner; use <strong>Page</strong> for full promo copy, or <strong>Link</strong> for Products, Contact, etc.
      </p>
    </div>
  );
}
