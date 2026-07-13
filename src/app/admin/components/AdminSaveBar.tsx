import { Save, RotateCcw } from 'lucide-react';

interface AdminSaveBarProps {
  saved: boolean;
  onSave: () => void;
  onReset?: () => void;
  resetLabel?: string;
}

export function AdminSaveBar({ saved, onSave, onReset, resetLabel = 'Reset' }: AdminSaveBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-0 z-10 bg-[#F9FAFB]/95 backdrop-blur border-t border-gray-200 -mx-1 px-1 py-3 mt-6">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-white"
        >
          <RotateCcw size={14} />
          {resetLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold shadow-sm"
        style={{ backgroundColor: saved ? '#10B981' : '#FFC107', color: saved ? '#FFF' : '#111' }}
      >
        <Save size={14} />
        {saved ? 'Saved!' : 'Save changes'}
      </button>
    </div>
  );
}
