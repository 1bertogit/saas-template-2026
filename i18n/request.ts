import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, Locale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (localeCookie && locales.includes(localeCookie)) {
    return {
      locale: localeCookie,
      messages: (await import(`../messages/${localeCookie}.json`)).default,
    };
  }

  // Fall back to Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');

  if (acceptLanguage) {
    const browserLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as Locale)) as Locale | undefined;

    if (browserLocale) {
      return {
        locale: browserLocale,
        messages: (await import(`../messages/${browserLocale}.json`)).default,
      };
    }
  }

  // Default locale
  return {
    locale: defaultLocale,
    messages: (await import(`../messages/${defaultLocale}.json`)).default,
  };
});
