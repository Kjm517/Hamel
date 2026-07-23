import { Hono } from 'hono';
import {
  claimVoucherForAccount,
  listClaimsForAccount,
  mapClaimPublic,
} from '../voucher-claims';
import {
  requireCustomer,
  type CustomerAuthVariables,
} from '../middleware/customer-auth';

export const customerClaimRoutes = new Hono<{ Variables: CustomerAuthVariables }>();

customerClaimRoutes.get('/', requireCustomer, async (c) => {
  const account = c.get('account');
  const rows = await listClaimsForAccount(account.id);
  return c.json({ claims: rows.map(mapClaimPublic) });
});

customerClaimRoutes.post('/', requireCustomer, async (c) => {
  const account = c.get('account');
  const body = await c.req.json<{
    cardId?: string;
    title?: string;
    voucherCode?: string;
    source?: 'cool-deals';
  }>();

  const cardId = body.cardId?.trim() ?? '';
  const title = body.title?.trim() ?? '';
  if (!cardId) return c.json({ error: 'cardId is required.' }, 400);
  if (!title) return c.json({ error: 'title is required.' }, 400);

  const row = await claimVoucherForAccount({
    customerAccountId: account.id,
    cardId,
    title,
    voucherCode: body.voucherCode,
    source: body.source === 'cool-deals' ? 'cool-deals' : 'cool-deals',
  });

  return c.json({ ok: true, claim: mapClaimPublic(row) });
});
