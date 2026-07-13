import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import {
  ensurePageBlocks,
  getPromoPageBySlug,
  loadPromoPages,
  type PageBlock,
  type PromoPage,
} from '../data/promo-pages';
import { hamelAssets } from '../data/hamelAssets';
import { PageBanner } from '../components/PageBanner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

function ActionLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  if (!href || !label) return null;
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

function renderTextBody(body: string) {
  const blocks = body.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter(Boolean);
    const isList = lines.every((l) => /^[•\-*]\s/.test(l.trim()));
    if (isList) {
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 text-gray-700">
          {lines.map((line, j) => (
            <li key={j}>{line.replace(/^[•\-*]\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-line">
        {block}
      </p>
    );
  });
}

function BlockView({ block }: { block: PageBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <PageBanner
          config={{
            imageUrl: block.imageUrl || hamelAssets.promo.saleBanner,
            imageAlt: block.title,
            tag: block.tag,
            title: block.title,
            subtitle: block.subtitle,
            ctaLabel: block.buttonLabel,
            ctaHref: block.buttonHref,
            overlayColor:
              'linear-gradient(to right, rgba(14,165,233,0.92) 0%, rgba(14,165,233,0.65) 55%, rgba(14,165,233,0.2) 100%)',
            height: 'md',
            textAlign: 'left',
          }}
        />
      );
    case 'text':
      return (
        <section className="max-w-3xl mx-auto px-4 py-8">
          {block.heading ? (
            <h2 className="text-xl font-bold text-gray-900 mb-3">{block.heading}</h2>
          ) : null}
          <div className="space-y-4 text-base">{renderTextBody(block.body)}</div>
        </section>
      );
    case 'image':
      if (!block.imageUrl) return null;
      return (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <ImageWithFallback
            src={block.imageUrl}
            alt={block.caption || ''}
            className="w-full rounded-xl object-cover max-h-[420px]"
          />
          {block.caption ? (
            <p className="mt-2 text-center text-sm text-gray-500">{block.caption}</p>
          ) : null}
        </section>
      );
    case 'cta':
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl bg-[#0EA5E9] px-6 py-8 text-center text-white">
            <h2 className="text-2xl font-bold">{block.title}</h2>
            {block.subtitle ? <p className="mt-2 text-blue-50">{block.subtitle}</p> : null}
            <ActionLink
              href={block.buttonHref}
              label={block.buttonLabel}
              className="mt-5 inline-flex rounded-full bg-[#FFC107] px-6 py-3 text-sm font-bold text-gray-900 hover:opacity-90"
            />
          </div>
        </section>
      );
    case 'faq':
      return (
        <section className="max-w-3xl mx-auto px-4 py-8">
          {block.heading ? (
            <h2 className="text-xl font-bold text-gray-900 mb-4">{block.heading}</h2>
          ) : null}
          <div className="space-y-4">
            {block.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="font-semibold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

export function PromoLandingPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<PromoPage | null | undefined>(() => getPromoPageBySlug(slug));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPromoPages().then(() => {
      if (cancelled) return;
      setPage(getPromoPageBySlug(slug) ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && page === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading page…
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">This page may have been removed or is not published yet.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm"
          style={{ backgroundColor: '#FFC107', color: '#111' }}
        >
          <ChevronLeft size={16} />
          Back to home
        </Link>
      </div>
    );
  }

  const blocks = ensurePageBlocks(page);
  const hasHero = blocks.some((b) => b.type === 'hero');

  return (
    <div className="bg-white min-h-screen pb-12">
      {!hasHero && (
        <div className="max-w-3xl mx-auto px-4 pt-10">
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          {page.summary ? <p className="mt-2 text-gray-600">{page.summary}</p> : null}
        </div>
      )}

      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}

      <div className="max-w-3xl mx-auto px-4 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0EA5E9] hover:underline">
          <ChevronLeft size={16} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
