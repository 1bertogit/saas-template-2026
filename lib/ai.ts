import OpenAI from 'openai';

// Lazy initialization to avoid throwing during build
let aiClient: OpenAI | null = null;

function getAIClient(): OpenAI {
  if (!aiClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    aiClient = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template 2026',
      },
    });
  }
  return aiClient;
}

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

export async function generateText({
  prompt,
  model = DEFAULT_MODEL,
  maxTokens = 800,
  temperature = 0.7,
}: {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const ai = getAIClient();
  const completion = await ai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });

  return completion.choices[0]?.message?.content ?? '';
}
