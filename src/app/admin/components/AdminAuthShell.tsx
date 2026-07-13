import { Link } from 'react-router';
import type { ReactNode } from 'react';

export function AdminAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#E0F2FE] to-[#F9FAFB] px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="text-2xl font-bold text-[#0EA5E9]">
          ❄️ HAMEL
        </Link>
        <p className="mt-1 text-sm text-gray-500">Admin</p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
