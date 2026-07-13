import { env } from '../env';
import { createClaudeProvider } from './providers/claude';
import { createGeminiProvider } from './providers/gemini';
import type { AiProvider, AiProviderName, ChatCompletionInput, ChatCompletionResult } from './types';

export function getAiProvider(): AiProvider {
  const name = env.aiProvider();

  if (name === 'gemini') {
    const apiKey = env.geminiApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
    }
    return createGeminiProvider({ apiKey, model: env.geminiModel() });
  }

  const apiKey = env.anthropicApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=claude');
  }
  return createClaudeProvider({ apiKey, model: env.anthropicModel() });
}

export async function completeChat(
  input: ChatCompletionInput
): Promise<ChatCompletionResult> {
  return getAiProvider().complete(input);
}

export type { AiProviderName, ChatCompletionInput, ChatCompletionResult };
