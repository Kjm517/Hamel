import { useEffect } from 'react';
import { GitCompare, X } from 'lucide-react';
import { Link } from 'react-router';

interface CompareLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxProducts: number;
}

export function CompareLimitModal({
  isOpen,
  onClose,
  maxProducts,
}: CompareLimitModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-limit-title"
    >
      <button
        type="button"
        aria-label="Close comparison limit message"
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7]">
          <GitCompare size={24} />
        </div>
        <h2 id="compare-limit-title" className="mt-4 text-xl font-bold text-gray-900">
          Compare list is full
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          You can compare up to {maxProducts} products at a time. Remove a product from your
          comparison list before adding another one.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Keep browsing
          </button>
          <Link
            to="/compare"
            onClick={onClose}
            className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0284C7]"
          >
            Manage comparison
          </Link>
        </div>
      </div>
    </div>
  );
}
