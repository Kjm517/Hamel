import { resolveImagePayload } from '../image';
import type { AiProvider, ChatCompletionInput, ChatCompletionResult } from '../types';

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

/** Gemini adapter — ready for client switch; set AI_PROVIDER=gemini + GEMINI_API_KEY. */
export function createGeminiProvider(opts: {
  apiKey: string;
  model: string;
}): AiProvider {
  return {
    name: 'gemini',
    async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent` +
        `?key=${encodeURIComponent(opts.apiKey)}`;

      const contents: Array<{ role: string; parts: GeminiPart[] }> = [];

      for (const msg of input.messages) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts: GeminiPart[] = [{ text: msg.content || 'Hello' }];
        if (msg.role === 'user' && msg.imageUrl) {
          const image = await resolveImagePayload(msg.imageUrl);
          if (image) {
            parts.unshift({
              inline_data: { mime_type: image.mediaType, data: image.base64 },
            });
          }
        }

        const prev = contents[contents.length - 1];
        if (prev && prev.role === role) {
          prev.parts.push(...parts);
        } else {
          contents.push({ role, parts });
        }
      }

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      const firstUser = contents.find((c) => c.role === 'user');
      if (firstUser) {
        const textPart = firstUser.parts.find((p): p is { text: string } => 'text' in p);
        if (textPart) {
          textPart.text = `${input.system}\n\n---\nCustomer message:\n${textPart.text}`;
        } else {
          firstUser.parts.unshift({
            text: `${input.system}\n\n---\nCustomer message:`,
          });
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      });

      const data = (await res.json()) as {
        error?: { message?: string };
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      if (!res.ok) {
        throw new Error(data.error?.message || `Gemini API error (${res.status})`);
      }

      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text || '')
        .join('')
        .trim();

      if (!text) throw new Error('Gemini returned an empty response');

      return { text, provider: 'gemini', model: opts.model };
    },
  };
}
