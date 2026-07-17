import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
const token = env.match(/^MESSENGER_PAGE_ACCESS_TOKEN=(.*)$/m)?.[1]?.trim();
if (!token) throw new Error('no token');

const GRAPH = 'https://graph.facebook.com/v21.0';

async function main() {
  const me = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  console.log('me', await me.json());

  const conv = await fetch(
    `${GRAPH}/me/conversations?fields=participants,updated_time&limit=5&access_token=${encodeURIComponent(token)}`
  );
  const convJson = await conv.json();
  console.log('conversations status', conv.status);
  console.log(JSON.stringify(convJson, null, 2).slice(0, 2500));

  const perms = await fetch(
    `${GRAPH}/me/permissions?access_token=${encodeURIComponent(token)}`
  );
  console.log('permissions', JSON.stringify(await perms.json(), null, 2).slice(0, 2000));
}

main().catch((e) => console.error(e));
