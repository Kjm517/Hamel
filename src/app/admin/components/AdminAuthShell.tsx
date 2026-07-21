import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { hamelAssets } from '../../data/hamelAssets';

const fieldClass =
  'w-full h-12 rounded-xl border border-[#dbe4ee] bg-white px-[15px] text-base text-[#17222f] placeholder:text-[#a7b6c6] transition-[border-color,box-shadow] focus:border-[#17abee] focus:outline-none focus:shadow-[0_0_0_3px_rgba(23,171,238,0.18)]';

const labelClass = 'text-[13px] font-bold text-[#3a4756]';

export function adminAuthFieldClass() {
  return fieldClass;
}

export function adminAuthLabelClass() {
  return labelClass;
}

export function AdminAuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10 text-[#17222f]"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background:
          'radial-gradient(120% 90% at 50% -10%, #e4f1fd 0%, #edf5fc 46%, #f4f8fc 100%)',
      }}
    >
      <div className="flex w-full max-w-[428px] flex-col items-center gap-[26px]">
        <Link to="/" className="flex items-center gap-[11px]">
          <img
            src={hamelAssets.branding.soloLogo}
            alt="Hamel"
            className="block h-[38px] w-auto"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[21px] font-extrabold tracking-[0.04em] text-[#12a5e8]">
              HAMEL
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8aa0b5]">
              Admin
            </span>
          </div>
        </Link>

        <div
          className="w-full rounded-[20px] border border-[#e6edf4] bg-white px-[34px] py-9"
          style={{
            boxShadow:
              '0 1px 2px rgba(23,50,79,0.05), 0 18px 44px -22px rgba(23,50,79,0.28)',
            animation: 'hamel-admin-card-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="mb-[26px]">
            <h1 className="m-0 mb-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#17222f]">
              {title}
            </h1>
            {subtitle ? (
              <p className="m-0 text-[14.5px] leading-normal text-[#64748b]">{subtitle}</p>
            ) : null}
          </div>
          {children}
          {footer ? <div className="mt-6 text-center text-sm text-[#64748b]">{footer}</div> : null}
        </div>

        <p className="m-0 text-[12.5px] text-[#94a3b3]">
          Protected area · Authorized personnel only
        </p>
      </div>
    </div>
  );
}
