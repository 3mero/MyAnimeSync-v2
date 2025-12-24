'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { LoggerProvider } from '@/hooks/use-logger';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LoggerProvider>
        <AuthProvider>{children}</AuthProvider>
    </LoggerProvider>
  );
}
