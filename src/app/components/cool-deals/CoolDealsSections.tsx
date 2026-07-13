import { Link } from 'react-router';
import {
  Award,
  ArrowRight,
  Check,
  CheckCircle,
  Headset,
  Info,
  MessageCircle,
  Package,
  Phone,
  Shield,
  Truck,
  Wrench,
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { hamelAssets, hamelBrandLogos } from '../../data/hamelAssets';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import {
  type CoolDealsCardGridSection,
  type CoolDealsCardItem,
  type CoolDealsDealCardItem,
  type CoolDealsPageConfig,
  type CoolDealsSection,
} from '../../data/cool-deals-page';
import { DealTileSurface } from './DealTileSurface';

function SectionHeading({
  title,
  subtitle,
  light,
  titleColor,
  subtitleColor,
}: {
  title: string;
  subtitle?: string;
  light?: boolean;
  titleColor?: string;
  subtitleColor?: string;
}) {
  return (
    <div className="text-center mb-10">
      <h2
        className={`text-xl md:text-2xl font-black tracking-wide uppercase ${light && !titleColor ? 'text-white' : ''}`}
        style={titleColor ? { color: titleColor } : light ? undefined : { color: '#0C4A6E' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-2 text-sm max-w-xl mx-auto ${subtitleColor ? '' : light ? 'text-blue-100' : 'text-gray-500'}`}
          style={subtitleColor ? { color: subtitleColor } : undefined}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function VoucherCard({ title, color, imageUrl, body }: CoolDealsCardItem) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base mb-3" style={{ color }}>
          {title}
        </h3>
        <div className="rounded-xl bg-gray-100 border border-gray-100 h-36 overflow-hidden mb-4">
          <ImageWithFallback src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{body}</p>
      </div>
    </div>
  );
}

function DealCard({ card }: { card: CoolDealsDealCardItem }) {
  const { href } = card;
  return (
    <Link to={href} className="block rounded-2xl overflow-hidden hover:opacity-95 transition-opacity">
      <DealTileSurface card={card} />
    </Link>
  );
}

function CardGridSection({ section }: { section: CoolDealsCardGridSection }) {
  const bg = section.background === 'gray' ? 'bg-[#F4F8FC]' : 'bg-white';
  const hasCards =
    section.variant === 'voucher' ? section.cards.length > 0 : (section.dealCards ?? []).length > 0;

  return (
    <section className={`py-14 md:py-16 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          title={section.headingTitle}
          subtitle={section.headingSubtitle}
          titleColor={section.headingColor}
          subtitleColor={section.headingSubtitleColor}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.variant === 'voucher'
            ? section.cards.map((c) => <VoucherCard key={c.id} {...c} />)
            : (section.dealCards ?? []).map((c) => <DealCard key={c.id} card={c} />)}
        </div>
        {!hasCards && (
          <p className="text-center text-sm text-gray-400">No cards in this section yet.</p>
        )}
      </div>
    </section>
  );
}

function ProductMatrixSection({
  section,
}: {
  section: Extract<CoolDealsSection, { type: 'product-matrix' }>;
}) {
  return (
    <section className="py-14 md:py-16 bg-[#F4F8FC]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading title={section.headingTitle} subtitle={section.headingSubtitle} />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {section.columns.map((col) => (
              <div key={col.id} className="text-center">
                <div className="h-24 md:h-28 rounded-lg bg-gray-50 overflow-hidden mb-3 mx-1">
                  <ImageWithFallback src={col.imageUrl} alt={col.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-sm text-[#0EA5E9] leading-snug">{col.name}</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-4">{col.sub}</p>
                <ul className="space-y-2 text-left max-w-[180px] mx-auto">
                  {col.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle size={14} className="shrink-0 text-green-500 fill-green-50" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {(section.footnote || section.mechanicsLinkText) && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-500">
              {section.footnote && (
                <>
                  <Info size={16} className="shrink-0 text-[#0EA5E9]" />
                  <span>{section.footnote}</span>
                </>
              )}
              {section.mechanicsLinkText && (
                <Link
                  to={section.mechanicsLinkHref || '/contact'}
                  className="inline-flex items-center gap-1 font-semibold text-[#0EA5E9] hover:underline whitespace-nowrap"
                >
                  {section.mechanicsLinkText} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const TRUST_ICONS = [
  { icon: <Award size={28} />, label: '100% Authentic' },
  { icon: <Wrench size={28} />, label: 'Professional Installation' },
  { icon: <Shield size={28} />, label: 'Warranty Coverage' },
  { icon: <Truck size={28} />, label: 'Nationwide Support' },
  { icon: <Package size={28} />, label: 'Flexible Payment' },
  { icon: <Headset size={28} />, label: 'After Sales Support' },
];

const BRAND_LOGOS = [
  { name: 'Panasonic', src: hamelBrandLogos.Panasonic },
  { name: 'Daikin', src: hamelBrandLogos.Daikin },
  { name: 'Midea', src: hamelBrandLogos.Midea },
  { name: 'LG', src: hamelBrandLogos.LG },
  { name: 'Samsung', src: hamelBrandLogos.Samsung },
  { name: 'Carrier', src: hamelBrandLogos.Carrier },
];

function renderSection(section: CoolDealsSection, onContact: () => void, telHref: string) {
  if (!section.enabled) return null;

  switch (section.type) {
    case 'card-grid':
      return <CardGridSection key={section.id} section={section} />;
    case 'product-matrix':
      return <ProductMatrixSection key={section.id} section={section} />;
    case 'trust-bar':
      return (
        <section key={section.id} className="py-12 md:py-14 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-10 md:gap-14 lg:gap-16">
              {TRUST_ICONS.map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3 text-center w-[120px] sm:w-[140px]">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-[#0EA5E9] bg-[#E0F2FE] shadow-sm">
                    {icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 leading-snug">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case 'cta':
      return (
        <section key={section.id} className="py-12 md:py-14 bg-[#0EA5E9]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <ImageWithFallback
                src={hamelAssets.mascot.cta}
                alt="Hamel mascot"
                className="w-28 md:w-32 h-auto shrink-0 object-contain"
              />
              <div className="flex-1 text-center md:text-left text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{section.title}</h2>
                <p className="text-blue-100 text-sm md:text-base max-w-lg">{section.subtitle}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-white font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    <Phone size={16} />
                    Call Us Now
                  </a>
                  <button
                    type="button"
                    onClick={onContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-white font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    <MessageCircle size={16} />
                    Message Us on Messenger
                  </button>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#FFC107] text-gray-900 hover:opacity-90 transition-opacity"
                  >
                    Book a Free Site Survey
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    case 'stats-brands':
      return (
        <section key={section.id} className="py-14 bg-[#F4F8FC]">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
              {[
                { n: '2,000+', l: 'Satisfied Customers' },
                { n: '500+', l: 'Projects Completed' },
                { n: '8+', l: 'Years in Service' },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div className="text-2xl md:text-4xl font-black text-[#0EA5E9]">{n}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{l}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
              Authorized Dealer of Top Brands
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-10">
              {BRAND_LOGOS.map((brand) =>
                brand.src ? (
                  <ImageWithFallback
                    key={brand.name}
                    src={brand.src}
                    alt={brand.name}
                    className="h-9 md:h-11 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <span key={brand.name} className="text-sm font-bold text-gray-400">
                    {brand.name}
                  </span>
                )
              )}
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm bg-[#0EA5E9] text-white hover:opacity-90 transition-opacity shadow-md"
            >
              Shop Aircon Units <Check size={16} />
            </Link>
          </div>
        </section>
      );
    default:
      return null;
  }
}

interface CoolDealsSectionsProps {
  config: CoolDealsPageConfig;
  onContact: () => void;
}

export function CoolDealsSections({ config, onContact }: CoolDealsSectionsProps) {
  const { telHref } = useStoreSettings();
  return <>{config.sections.map((section) => renderSection(section, onContact, telHref))}</>;
}
