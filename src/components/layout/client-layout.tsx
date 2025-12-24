'use client';

import { ReactNode } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Cairo } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useHydration } from '@/hooks/use-hydration';
import { Header } from './header';


const cairo = Cairo({ subsets: ['arabic', 'latin'] });

export function ClientLayout({ children }: { children: ReactNode }) {
  const { lang } = useTranslation();
  const { authMode } = useAuth();
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
        <div className="min-h-screen grow flex items-center justify-center">
            {/* You can add a loading spinner here */}
        </div>
    );
  }

  return (
     <TooltipProvider>
      <div className={cn("min-h-screen grow", lang === 'ar' && cairo.className)}>
         <div className="flex flex-col min-h-screen">
            {authMode !== 'none' && <Header />}
            <main className="flex-1">
                {children}
            </main>
         </div>
      </div>
    </TooltipProvider>
  );
}
