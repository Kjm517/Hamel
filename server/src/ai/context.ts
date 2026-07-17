import { getSql } from '../db';

export type CatalogProductRow = {
  id: string;
  brand?: string;
  model?: string;
  category?: string;
  priceStart?: number;
  priceEnd?: number;
  hp?: string[];
  features?: string[];
  tier?: string;
  isActive?: boolean;
};

export type StoreSettingsRow = {
  storeName?: string;
  address?: string;
  phoneDisplay?: string;
  contactEmail?: string;
  businessHours?: string;
  messengerUrl?: string;
  whatsappNumber?: string;
};

export async function loadCatalogProducts(limit = 60): Promise<CatalogProductRow[]> {
  const sql = getSql();
  const productRows = (await sql`
    select id, data
    from products
    order by id asc
    limit ${limit}
  `) as { id: string; data: Record<string, unknown> }[];

  return productRows.map((row) => {
    const d = row.data ?? {};
    return {
      id: row.id,
      brand: typeof d.brand === 'string' ? d.brand : undefined,
      model: typeof d.model === 'string' ? d.model : undefined,
      category: typeof d.category === 'string' ? d.category : undefined,
      priceStart: Number(d.priceStart) || 0,
      priceEnd: Number(d.priceEnd) || Number(d.priceStart) || 0,
      hp: Array.isArray(d.hp) ? d.hp.map(String) : [],
      features: Array.isArray(d.features) ? d.features.map(String) : [],
      tier: typeof d.tier === 'string' ? d.tier : undefined,
      isActive: d.isActive !== false,
    };
  });
}

export async function loadStoreSettings(): Promise<StoreSettingsRow | null> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select data from site_settings where key = 'store' limit 1
    `) as { data: Record<string, unknown> }[];
    return (rows[0]?.data as StoreSettingsRow) ?? null;
  } catch {
    return null;
  }
}
