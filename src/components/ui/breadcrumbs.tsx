'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Breadcrumbs({ trail }: { trail: BreadcrumbItem[] }) {
  const router = useRouter();

  const handleBreadcrumbClick = (index: number) => {
    const stepsBack = trail.length - 1 - index;
    if (stepsBack > 0) {
      // This is a workaround for router.back() not being synchronous in some cases.
      // A simple loop might not work as expected. Instead, we use history.go().
      window.history.go(-stepsBack);
    }
  };


  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm text-muted-foreground">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          
          return (
            <li key={item.id} className="flex items-center">
              <Button
                variant="link"
                onClick={() => handleBreadcrumbClick(index)}
                disabled={isLast}
                className={cn(
                  'truncate max-w-[100px] md:max-w-[200px] transition-colors p-0 h-auto',
                  isLast
                    ? 'font-semibold text-foreground pointer-events-none'
                    : 'hover:text-foreground'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.title}
              </Button>
              {!isLast && (
                <ChevronRight className="h-4 w-4 shrink-0 mx-1" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
