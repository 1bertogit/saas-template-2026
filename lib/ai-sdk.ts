import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as generateTextAI, streamText, CoreMessage } from 'ai';

// Lazy initialization to avoid issues during build
let openrouterClient: ReturnType<typeof createOpenAI> | null = null;
let anthropicClient: ReturnType<typeof createAnthropic> | null = null;

function getOpenRouterClient() {
  if (!openrouterClient) {
    openrouterClient = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template 2026',
      },
    });
  }
  return openrouterClient;
}

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

type AIProvider = 'openrouter' | 'anthropic';

function getModel(provider: AIProvider, modelId: string) {
  switch (provider) {
    case 'anthropic': {
      const client = getAnthropicClient();
      if (!client) throw new Error('Anthropic API key not configured');
      return client(modelId.replace('anthropic/', ''));
    }
    case 'openrouter':
    default:
      return getOpenRouterClient()(modelId);
  }
}

export async function generateText({
  prompt,
  model = DEFAULT_MODEL,
  maxTokens = 800,
  temperature = 0.7,
  provider = 'openrouter',
}: {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider;
}) {
  const { text } = await generateTextAI({
    model: getModel(provider, model),
    prompt,
    maxTokens,
    temperature,
  });

  return text;
}

export async function generateTextStream({
  messages,
  model = DEFAULT_MODEL,
  maxTokens = 800,
  temperature = 0.7,
  provider = 'openrouter',
  onFinish,
}: {
  messages: CoreMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider;
  onFinish?: (result: { text: string; usage: { promptTokens: number; completionTokens: number } }) => void;
}) {
  const result = streamText({
    model: getModel(provider, model),
    messages,
    maxTokens,
    temperature,
    onFinish,
  });

  return result;
}

export { streamText, generateTextAI };
