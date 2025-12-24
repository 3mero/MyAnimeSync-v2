'use client';

import type { Anime } from '@/lib/types';
import { AnimeCard } from './anime-card';
import { PaginationControls } from '../ui/pagination-controls';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

function LoadingSkeleton() {
    const gridClass = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6';
    return (
        <div className={gridClass}>
            {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
                <CardHeader className="p-0">
                    <Skeleton className="aspect-[2/3] w-full" />
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-5 w-4/5" />
                </CardContent>
            </Card>
            ))}
        </div>
    )
}

interface PaginatedAnimeGridProps {
    animes: Anime[];
    title: string;
    basePath: string;
    currentPage: number;
    hasNextPage: boolean;
    isLoading?: boolean;
    searchParams?: string;
}

export function PaginatedAnimeGrid({ animes, title, basePath, currentPage, hasNextPage, isLoading, searchParams }: PaginatedAnimeGridProps) {
    const { t } = useTranslation();

    return (
        <div>
            {title && !isLoading && animes.length === 0 ? (
                 <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">{t('no_anime_found_for_category').replace('{{category}}', title)}</p>
                </div>
            ) : isLoading ? (
                 <LoadingSkeleton />
            ) : animes.length === 0 ? (
                 <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">{t('no_anime_found_for_category').replace('{{category}}', title)}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {animes.map((anime, index) => (
                            <AnimeCard 
                                key={anime.id} 
                                anime={anime}
                            />
                        ))}
                    </div>
                    {searchParams !== undefined && (
                         <PaginationControls 
                            basePath={basePath}
                            currentPage={currentPage}
                            hasNextPage={hasNextPage}
                            searchParams={searchParams}
                        />
                    )}
                </>
            )}
        </div>
    )
}
