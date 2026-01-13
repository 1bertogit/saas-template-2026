import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
