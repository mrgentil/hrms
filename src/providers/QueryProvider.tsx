"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique des devtools pour éviter les erreurs SSR
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })),
  { ssr: false }
);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps de cache par défaut : 5 minutes
            staleTime: 5 * 60 * 1000,
            // Temps avant garbage collection : 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry automatique en cas d'erreur
            retry: (failureCount, error: any) => {
              // Ne pas retry sur les erreurs 4xx
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              // Retry maximum 3 fois pour les autres erreurs
              return failureCount < 3;
            },
            // Refetch automatique quand la fenêtre reprend le focus
            refetchOnWindowFocus: false,
            // Refetch automatique à la reconnexion
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry automatique pour les mutations
            retry: (failureCount, error: any) => {
              // Ne pas retry sur les erreurs 4xx
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
