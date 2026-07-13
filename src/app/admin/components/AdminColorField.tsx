import { hexForColorInput } from '../../lib/color-utils';

interface AdminColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  placeholder?: string;
}

export function AdminColorField({ label, value, onChange, placeholder = '#000000' }: AdminColorFieldProps) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexForColorInput(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      </div>
    </div>
  );
}
