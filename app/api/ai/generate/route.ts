import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(userId, 'api');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  }

  const payload = await req.json().catch(() => null);
  const prompt: string | undefined = payload?.prompt;

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  try {
    const result = await generateText({ prompt });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI generate error', error);
    return NextResponse.json({ error: 'Failed to generate text' }, { status: 500 });
  }
}
