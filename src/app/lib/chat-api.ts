import { ApiError, apiFetch, getApiBase } from './api';

export type StorefrontChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
};

export type ChatAssistResponse = {
  reply: string;
  provider?: string;
  model?: string;
  locale?: string;
  error?: string;
};

/** Call Hamel AI chat assist (Claude by default; Gemini when AI_PROVIDER=gemini). */
export async function sendChatAssist(input: {
  message: string;
  history: StorefrontChatMessage[];
  imageUrl?: string;
}): Promise<ChatAssistResponse> {
  const res = await fetch(`${getApiBase()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input.message,
      messages: input.history,
      imageUrl: input.imageUrl,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as ChatAssistResponse & { error?: string };
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export async function uploadChatRoomPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append(
    'path',
    `chat-rooms/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48)}`
  );
  const res = await apiFetch<{ url: string }>('/api/uploads/public', {
    method: 'POST',
    formData: form,
    auth: false,
  });
  return res.url;
}
