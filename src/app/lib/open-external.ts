import { buildMessengerUrl, buildWhatsAppUrl } from './store-contact';
import { DEFAULT_STORE } from '../admin/lib/ops-api';

const MESSENGER_CHAT_URL = DEFAULT_STORE.messengerUrl;

export function openUrlBlank(url: string): void {
  if (!/^https:\/\//i.test(url)) {
    return;
  }
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) {
    win.opener = null;
  }
}

export function openWhatsAppPrefilled(
  message: string,
  whatsappNumber: string = DEFAULT_STORE.whatsappNumber
): void {
  openUrlBlank(buildWhatsAppUrl(whatsappNumber, message));
}

export function openMessengerChat(
  messengerUrl: string = MESSENGER_CHAT_URL,
  opts?: { message?: string; ref?: string }
): void {
  openUrlBlank(buildMessengerUrl(messengerUrl, opts));
}
