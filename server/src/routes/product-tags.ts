import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const productTagRoutes = new Hono<{ Variables: AuthVariables }>();

const DEFAULT_TAGS = [
  {
    id: 'tag-flash-15',
    name: '15% OFF',
    style: 'flash-sale',
    placement: 'promo',
    auto_rule: null,
    icon_emoji: '⚡',
    sort_order: 1,
  },
  {
    id: 'tag-free-install',
    name: 'FREE AUTHORIZED',
    style: 'free-install',
    placement: 'promo',
    auto_rule: null,
    icon_emoji: '✓',
    subtitle: 'INSTALLATION',
    sort_order: 2,
  },
  {
    id: 'tag-5000-off',
    name: '₱5,000 OFF',
    style: 'discount',
    placement: 'promo',
    auto_rule: null,
    icon_emoji: '★',
    sort_order: 3,
  },
  {
    id: 'tag-cool-cash',
    name: 'COOL CASH',
    style: 'cash-deal',
    placement: 'promo',
    auto_rule: null,
    icon_emoji: '₱',
    subtitle: 'per month',
    sort_order: 4,
  },
  {
    id: 'tag-bundle',
    name: 'BUNDLE DEAL',
    style: 'bundle',
    placement: 'promo',
    auto_rule: null,
    icon_emoji: '🎁',
    sort_order: 5,
  },
  {
    id: 'corner-sale',
    name: 'SALE',
    style: 'flash-sale',
    placement: 'corner',
    auto_rule: 'flash-sale',
    icon_emoji: null,
    sort_order: 6,
  },
  {
    id: 'corner-inv',
    name: 'INV',
    style: 'free-install',
    placement: 'corner',
    auto_rule: 'inverter',
    icon_emoji: null,
    sort_order: 7,
  },
  {
    id: 'corner-top',
    name: 'TOP',
    style: 'discount',
    placement: 'corner',
    auto_rule: 'best-seller',
    icon_emoji: null,
    sort_order: 8,
  },
] as Array<{
  id: string;
  name: string;
  style: string;
  placement: string;
  auto_rule: string | null;
  icon_emoji: string | null;
  subtitle?: string;
  sort_order: number;
}>;

productTagRoutes.get('/', async (c) => {
  const sql = getSql();
  const rows = await sql`
    select
      id, name, style, placement, auto_rule, icon_url, icon_emoji,
      icon_bg_color, text_bg_color, subtitle, description, sort_order, is_active
    from product_tags
    order by sort_order asc, name asc
  `;
  return c.json({ tags: rows });
});

productTagRoutes.put('/', requireAuth, async (c) => {
  const body = await c.req.json<{ tags?: Record<string, unknown>[] }>();
  const tags = body.tags ?? [];
  if (!Array.isArray(tags)) {
    return c.json({ error: 'tags array required' }, 400);
  }

  const sql = getSql();
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const id = String(tag.id ?? '');
    if (!id) continue;
    const name = String(tag.name ?? id);
    const style = String(tag.style ?? 'flash-sale');
    const placement = String(tag.placement ?? (id.startsWith('corner-') ? 'corner' : 'promo'));
    const autoRule =
      tag.autoApply != null
        ? String(tag.autoApply)
        : tag.auto_rule != null
          ? String(tag.auto_rule)
          : null;
    const iconUrl =
      tag.iconUrl != null ? String(tag.iconUrl) : tag.icon_url != null ? String(tag.icon_url) : null;
    const iconEmoji =
      tag.iconEmoji != null
        ? String(tag.iconEmoji)
        : tag.icon_emoji != null
          ? String(tag.icon_emoji)
          : null;
    const iconBg =
      tag.iconBgColor != null
        ? String(tag.iconBgColor)
        : tag.icon_bg_color != null
          ? String(tag.icon_bg_color)
          : null;
    const textBg =
      tag.textBgColor != null
        ? String(tag.textBgColor)
        : tag.text_bg_color != null
          ? String(tag.text_bg_color)
          : null;
    const subtitle = tag.subtitle != null ? String(tag.subtitle) : null;
    const description =
      tag.description != null && String(tag.description).trim()
        ? String(tag.description).trim()
        : null;
    const sortOrder = i + 1;

    await sql`
      insert into product_tags (
        id, name, style, placement, auto_rule, icon_url, icon_emoji,
        icon_bg_color, text_bg_color, subtitle, description, sort_order, is_active, updated_at
      ) values (
        ${id}, ${name}, ${style}, ${placement}, ${autoRule}, ${iconUrl}, ${iconEmoji},
        ${iconBg}, ${textBg}, ${subtitle}, ${description}, ${sortOrder}, true, now()
      )
      on conflict (id) do update set
        name = excluded.name,
        style = excluded.style,
        placement = excluded.placement,
        auto_rule = excluded.auto_rule,
        icon_url = excluded.icon_url,
        icon_emoji = excluded.icon_emoji,
        icon_bg_color = excluded.icon_bg_color,
        text_bg_color = excluded.text_bg_color,
        subtitle = excluded.subtitle,
        description = excluded.description,
        sort_order = excluded.sort_order,
        is_active = true,
        updated_at = now()
    `;
  }

  return c.json({ ok: true });
});

productTagRoutes.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  await sql`delete from product_tags where id = ${id}`;
  return c.json({ ok: true });
});

productTagRoutes.post('/reset', requireAuth, async (c) => {
  const sql = getSql();
  const existing = (await sql`select id from product_tags`) as { id: string }[];
  const keep = new Set<string>(DEFAULT_TAGS.map((t) => t.id));
  for (const row of existing) {
    if (!keep.has(row.id)) {
      await sql`delete from product_tags where id = ${row.id}`;
    }
  }

  for (const tag of DEFAULT_TAGS) {
    const subtitle = tag.subtitle ?? null;
    await sql`
      insert into product_tags (
        id, name, style, placement, auto_rule, icon_emoji, subtitle, sort_order, is_active, updated_at
      ) values (
        ${tag.id}, ${tag.name}, ${tag.style}, ${tag.placement}, ${tag.auto_rule},
        ${tag.icon_emoji}, ${subtitle}, ${tag.sort_order}, true, now()
      )
      on conflict (id) do update set
        name = excluded.name,
        style = excluded.style,
        placement = excluded.placement,
        auto_rule = excluded.auto_rule,
        icon_emoji = excluded.icon_emoji,
        subtitle = excluded.subtitle,
        sort_order = excluded.sort_order,
        is_active = true,
        updated_at = now()
    `;
  }

  const rows = await sql`
    select
      id, name, style, placement, auto_rule, icon_url, icon_emoji,
      icon_bg_color, text_bg_color, subtitle, description, sort_order, is_active
    from product_tags
    order by sort_order asc
  `;
  return c.json({ tags: rows });
});
