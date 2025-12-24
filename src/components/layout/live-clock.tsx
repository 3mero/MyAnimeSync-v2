'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { ar } from 'date-fns/locale';

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { lang } = useTranslation();

  useEffect(() => {
    // Set the initial time on the client
    setCurrentTime(new Date());
    
    // Then set up the interval to update it
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (!currentTime) {
      return (
        <Card className="hidden md:flex flex-col items-center justify-center p-2 px-4 w-[170px] h-[60px] border-primary/20 bg-background/50">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-28 mt-1" />
        </Card>
      )
  }

  // Always use en-US for time string to ensure consistent numerals
  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="hidden md:flex flex-col items-center justify-center p-2 px-4 border-primary/20 bg-background/50">
        <p className="font-mono text-lg font-bold text-primary tabular-nums tracking-wider">
            {timeString}
        </p>
        <p className="text-xs text-muted-foreground">
            {dateString}
        </p>
    </Card>
  );
}
