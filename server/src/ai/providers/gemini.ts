import type { AiProvider, ChatCompletionInput, ChatCompletionResult } from '../types';

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

      // Gemini uses alternating user/model turns; fold system into first user message.
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const msg of input.messages) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const prev = contents[contents.length - 1];
        if (prev && prev.role === role) {
          prev.parts[0].text += `\n\n${msg.content}`;
        } else {
          contents.push({ role, parts: [{ text: msg.content }] });
        }
      }

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      // Prepend system guidance to the first user turn
      const firstUser = contents.find((c) => c.role === 'user');
      if (firstUser) {
        firstUser.parts[0].text = `${input.system}\n\n---\nCustomer message:\n${firstUser.parts[0].text}`;
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
