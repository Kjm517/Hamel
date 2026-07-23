import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ClipboardList, Wrench } from 'lucide-react';
import { fetchInquiries, type InquiryRow } from '../lib/inquiries-api';
import { adminUi } from '../lib/admin-ui';

const BOOKING_SOURCE = 'maintenance-booking';
const BOOKINGS_HREF = `/admin/inquiries?source=${BOOKING_SOURCE}`;

function isServiceBooking(row: InquiryRow) {
  return (
    row.source === BOOKING_SOURCE ||
    (row.product ?? '').toLowerCase().startsWith('maintenance —')
  );
}

export function AdminServicesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInquiries({ limit: 100 });
        if (!cancelled) setRows(data.filter(isServiceBooking));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load service bookings');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows]
  );
  const recent = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <div className="space-y-5">
      <p className={adminUi.pageIntro}>
        Aircon cleaning, repair & maintenance requests from the storefront Request a Service form.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={BOOKINGS_HREF}
          className={`${adminUi.card} group flex items-start gap-4 p-5 transition hover:border-sky-200 hover:bg-[#f8fcff]`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e0f2fe] text-[#0369a1]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-[#1e2a38]">Bookings</h2>
              <ArrowRight className="h-4 w-4 text-[#93a2b3] transition group-hover:translate-x-0.5 group-hover:text-[#0369a1]" />
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#7a8899]">
              Opens in Orders & Inquiries — manage status, contact customers, and complete jobs there.
            </p>
            <p className="mt-3 text-[13px] font-semibold text-[#0369a1]">
              {loading
                ? 'Loading…'
                : pendingCount > 0
                  ? `${pendingCount} pending booking${pendingCount === 1 ? '' : 's'}`
                  : `${rows.length} booking${rows.length === 1 ? '' : 's'} total`}
            </p>
          </div>
        </Link>

        <div className={`${adminUi.card} flex items-start gap-4 p-5`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0f9ff] text-[#0ea5e9]">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold text-[#1e2a38]">Storefront form</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#7a8899]">
              Customers book via the site header. New requests land here and in Orders & Inquiries with
              source <span className="font-semibold text-[#516171]">maintenance-booking</span>.
            </p>
          </div>
        </div>
      </div>

      <div className={adminUi.card}>
        <div className="flex items-center justify-between gap-3 border-b border-[#eef3f8] px-5 py-3.5">
          <h3 className="text-[13.5px] font-extrabold text-[#1e2a38]">Recent bookings</h3>
          <Link to={BOOKINGS_HREF} className="text-[12.5px] font-semibold text-[#0369a1] hover:underline">
            View all in Orders & Inquiries
          </Link>
        </div>
        {loading && <p className="px-5 py-6 text-sm text-[#9aa7b5]">Loading…</p>}
        {!loading && recent.length === 0 && (
          <p className="px-5 py-6 text-sm text-[#9aa7b5]">No service bookings yet.</p>
        )}
        {!loading && recent.length > 0 && (
          <ul className="divide-y divide-[#eef3f8]">
            {recent.map((row) => (
              <li key={row.id}>
                <Link
                  to={`${BOOKINGS_HREF}&open=${row.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 transition hover:bg-[#f9fbfd]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-[#1e2a38]">
                      {row.customerName}
                    </p>
                    <p className="truncate text-[12.5px] text-[#7a8899]">
                      {row.product || 'Service booking'}
                      {row.scheduleDate ? ` · ${row.scheduleDate}` : ''}
                      {row.scheduleTime ? ` · ${row.scheduleTime}` : ''}
                    </p>
                  </div>
                  <span
                    className={
                      row.status === 'pending'
                        ? adminUi.badgeAmber
                        : row.status === 'completed'
                          ? adminUi.badgeGreen
                          : adminUi.badgeGray
                    }
                  >
                    {row.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
