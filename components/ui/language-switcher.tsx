'use client';

import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { locales, localeNames, localeFlags, Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  currentLocale?: Locale;
}

export function LanguageSwitcher({ currentLocale = 'pt' }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = async (locale: Locale) => {
    // Set cookie via API
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });

    // Refresh the page to apply new locale
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version with flag only
export function LanguageSwitcherCompact({ currentLocale = 'pt' }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = async (locale: Locale) => {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <span className="text-lg">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-lg">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
