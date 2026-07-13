import type { AiProvider, ChatCompletionInput, ChatCompletionResult } from '../types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export function createClaudeProvider(opts: {
  apiKey: string;
  model: string;
}): AiProvider {
  return {
    name: 'claude',
    async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: opts.model,
          max_tokens: 1024,
          system: input.system,
          messages: input.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await res.json()) as {
        error?: { message?: string };
        content?: Array<{ type?: string; text?: string }>;
      };

      if (!res.ok) {
        throw new Error(data.error?.message || `Claude API error (${res.status})`);
      }

      const text = (data.content ?? [])
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text)
        .join('\n')
        .trim();

      if (!text) throw new Error('Claude returned an empty response');

      return { text, provider: 'claude', model: opts.model };
    },
  };
}
