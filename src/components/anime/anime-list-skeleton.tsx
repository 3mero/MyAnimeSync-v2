'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnimeListSkeleton({ title, Icon }: { title: string, Icon?: React.ElementType }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        {Icon && <Skeleton className="h-8 w-8 rounded-full" />}
        <h2 className="text-3xl font-bold font-headline">{title}</h2>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="p-0">
              <Skeleton className="aspect-[2/3] w-full" />
            </CardHeader>
            <CardContent className="p-3">
              <Skeleton className="h-5 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
