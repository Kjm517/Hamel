/** Page titles / crumbs for the redesigned admin header. */

export type AdminPageMeta = {
  title: string;
  crumb: string;
};

const EXACT: Record<string, AdminPageMeta> = {
  '/admin/dashboard': { title: 'Dashboard', crumb: 'Main' },
  '/admin/products': { title: 'Products', crumb: 'Catalog' },
  '/admin/products/new': { title: 'Add product', crumb: 'Catalog / Products' },
  '/admin/pages': { title: 'Website pages', crumb: 'Catalog' },
  '/admin/banners': { title: 'Banners', crumb: 'Catalog' },
  '/admin/promo-event': { title: 'Promo events', crumb: 'Marketing' },
  '/admin/promo-popup': { title: 'Promo pop-ups', crumb: 'Marketing' },
  '/admin/auth-screen': { title: 'Sign-in screen', crumb: 'Marketing' },
  '/admin/promo-pages': { title: 'Promo pages', crumb: 'Marketing' },
  '/admin/tags': { title: 'Tags', crumb: 'Marketing' },
  '/admin/installments': { title: 'Installments', crumb: 'Payments' },
  '/admin/vouchers': { title: 'Vouchers', crumb: 'Marketing' },
  '/admin/testimonials': { title: 'Reviews', crumb: 'Marketing' },
  '/admin/inquiries': { title: 'Orders & Inquiries', crumb: 'Sales' },
  '/admin/services': { title: 'Services', crumb: 'Sales' },
  '/admin/customers': { title: 'Customers', crumb: 'Sales' },
  '/admin/messages': { title: 'Messages', crumb: 'Sales' },
  '/admin/analytics': { title: 'Analytics', crumb: 'Insights' },
  '/admin/promos': { title: 'Promotions', crumb: 'Marketing' },
  '/admin/employees': { title: 'Team members', crumb: 'System' },
  '/admin/settings': { title: 'Settings', crumb: 'System' },
  '/admin/profile': { title: 'My profile', crumb: 'System' },
};

export function getAdminPageMeta(pathname: string, search = ''): AdminPageMeta {
  if (pathname.startsWith('/admin/products/') && pathname.includes('/edit')) {
    return { title: 'Edit product', crumb: 'Catalog / Products' };
  }
  if (pathname === '/admin/pages') {
    const tab = new URLSearchParams(search).get('tab');
    if (tab === 'home') return { title: 'Home page', crumb: 'Catalog / Website pages' };
    if (tab === 'headers') return { title: 'Page headers', crumb: 'Catalog / Website pages' };
    if (tab === 'brands') return { title: 'Brands page', crumb: 'Catalog / Website pages' };
    if (tab === 'cool-deals') return { title: 'Cool Deals', crumb: 'Catalog / Website pages' };
    if (tab === 'promo') return { title: 'Custom pages', crumb: 'Catalog / Website pages' };
  }
  return EXACT[pathname] ?? { title: 'Admin', crumb: 'Hamel' };
}
