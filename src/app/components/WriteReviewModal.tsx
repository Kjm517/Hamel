import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Star, X } from 'lucide-react';
import type { Product } from '../data/products';
import { createReview, type CreateReviewInput } from '../lib/catalog-api';
import { apiFetch } from '../lib/api';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Awesome!',
};

const QUICK_TAGS = [
  'Recommended',
  'Excellent quality',
  'Quiet & efficient',
  'Easy installation',
] as const;

type WriteReviewModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product;
  productId: string;
  selectedHp?: string;
  onSubmitted: () => void;
};

async function uploadReviewImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  body.append('path', `reviews/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 40)}`);
  const res = await apiFetch<{ url: string }>('/api/uploads/public', {
    method: 'POST',
    formData: body,
    auth: false,
  });
  return res.url;
}

export function WriteReviewModal({
  open,
  onClose,
  product,
  productId,
  selectedHp,
  onSubmitted,
}: WriteReviewModalProps) {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setNickname('');
      setRating(5);
      setComment('');
      setTags([]);
      setAnonymous(false);
      setImages([]);
      setError(null);
      setSubmitting(false);
      setUploading(false);
    }
  }, [open]);

  const productLine = useMemo(() => {
    const bits = [product.brand, product.model];
    if (selectedHp) bits.push(selectedHp);
    return bits.filter(Boolean).join(' · ');
  }, [product.brand, product.model, selectedHp]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 5 - images.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of selected) {
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
          throw new Error('Images must be .jpg, .png, .gif, or .jpeg');
        }
        urls.push(await uploadReviewImage(file));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateReviewInput = {
        productId,
        name: anonymous ? 'Anonymous' : nickname.trim(),
        email: email.trim(),
        rating,
        comment: comment.trim(),
        tags,
        anonymous,
        images,
      };
      await createReview(payload);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-review-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[min(92vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="product-review-title" className="text-lg font-bold text-gray-900">
            Product Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={product.image}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{product.brand} {product.model}</p>
                <p className="text-sm text-gray-500">{productLine}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-0.5"
                      aria-label={`${value} stars`}
                    >
                      <Star
                        size={22}
                        className={
                          value <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-0.5 text-xs font-medium text-gray-600">
                  {RATING_LABELS[rating]}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Display email for this review"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/25"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                  Nickname<span className="text-red-500">*</span>
                </label>
                <input
                  required={!anonymous}
                  disabled={anonymous}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/25 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                What do you think of this product?<span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write review here"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/25"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Please note that your review will be moderated. Abusive comments will be deleted.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-50"
              >
                <Camera size={22} />
                <span className="text-xs font-medium">{uploading ? '…' : 'Upload'}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
                multiple
                className="hidden"
                onChange={(e) => void onPickFiles(e.target.files)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600">
                  You can add up to 5 images (.jpg, .png, .gif, .jpeg)
                </p>
                {images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {images.map((url) => (
                      <div key={url} className="relative h-14 w-14 overflow-hidden rounded-md border">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-auto space-y-3 border-t border-gray-100 px-5 py-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-gray-700">
              <span>Leave your review anonymously</span>
              <button
                type="button"
                role="switch"
                aria-checked={anonymous}
                onClick={() => setAnonymous((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  anonymous ? 'bg-[#0EA5E9]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    anonymous ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full rounded-full bg-[#0EA5E9] py-3 text-sm font-bold text-white hover:bg-[#0284C7] disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
