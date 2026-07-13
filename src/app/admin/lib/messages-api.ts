import { apiFetch } from '../../lib/api';

export type MessageRow = {
  id: string;
  name: string;
  contact: string;
  channel: string;
  body: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
};

export async function fetchMessages(limit = 100): Promise<MessageRow[]> {
  const res = await apiFetch<{
    messages: Array<{
      id: string;
      name: string;
      contact: string;
      channel: string;
      body: string;
      status: string;
      created_at: string;
    }>;
  }>(`/api/messages?limit=${limit}`);

  return (res.messages ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    contact: m.contact,
    channel: m.channel,
    body: m.body,
    status: m.status as MessageRow['status'],
    createdAt: m.created_at,
  }));
}

export async function setMessageStatus(
  id: string,
  status: MessageRow['status']
): Promise<void> {
  await apiFetch(`/api/messages/${id}`, { method: 'PATCH', body: { status } });
}

export async function createMessage(input: {
  name: string;
  contact?: string;
  channel?: string;
  body: string;
}): Promise<void> {
  await apiFetch('/api/messages', {
    method: 'POST',
    body: input,
    auth: false,
  });
}
