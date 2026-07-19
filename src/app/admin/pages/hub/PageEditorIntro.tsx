import { ExternalLink, GripVertical } from 'lucide-react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';

type SaveMode = 'manual' | 'auto';

type PageEditorIntroProps = {
  title: string;
  description: string;
  saveMode: SaveMode;
  previewHref?: string;
  previewLabel?: string;
  showDragTip?: boolean;
  actions?: ReactNode;
};

export function PageEditorIntro({
  title,
  description,
  saveMode,
  previewHref,
  previewLabel = 'Preview on site',
  showDragTip = false,
  actions,
}: PageEditorIntroProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {previewHref ? (
            <Link
              to={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
            >
              <ExternalLink size={14} />
              {previewLabel}
            </Link>
          ) : null}
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            saveMode === 'auto'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-amber-50 text-amber-900'
          }`}
        >
          {saveMode === 'auto' ? 'Auto-saves while you edit' : 'Click Save when you’re done'}
        </span>
        {showDragTip ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
            <GripVertical size={12} />
            Drag to reorder
          </span>
        ) : null}
      </div>
    </div>
  );
}
