import { apiFetch } from './api';

export type StorefrontChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatAssistResponse = {
  reply: string;
  provider?: string;
  model?: string;
  error?: string;
};

/** Call Hamel AI chat assist (Claude by default; Gemini when AI_PROVIDER=gemini). */
export async function sendChatAssist(input: {
  message: string;
  history: StorefrontChatMessage[];
}): Promise<ChatAssistResponse> {
  return apiFetch<ChatAssistResponse>('/api/chat', {
    method: 'POST',
    auth: false,
    body: {
      message: input.message,
      messages: input.history,
    },
  });
}
