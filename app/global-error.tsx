'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Algo deu errado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-4">
                ID do erro: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
