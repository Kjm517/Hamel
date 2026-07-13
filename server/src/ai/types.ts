export type AiProviderName = 'claude' | 'gemini';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCompletionInput = {
  system: string;
  messages: ChatMessage[];
};

export type ChatCompletionResult = {
  text: string;
  provider: AiProviderName;
  model: string;
};

export interface AiProvider {
  name: AiProviderName;
  complete(input: ChatCompletionInput): Promise<ChatCompletionResult>;
}
