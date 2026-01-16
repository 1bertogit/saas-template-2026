import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { locales, Locale } from '@/i18n/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const locale = body.locale as Locale;

    if (!locale || !locales.includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('[Locale API]', error);
    return NextResponse.json(
      { error: 'Failed to set locale' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt';

  return NextResponse.json({ locale });
}
