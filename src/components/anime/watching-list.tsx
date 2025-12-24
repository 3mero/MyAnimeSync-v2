'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { Anime } from '@/lib/types';
import { AnimeListSkeleton } from './anime-list-skeleton';
import { AnimeCard } from './anime-card';
import { useHydration } from '@/hooks/use-hydration';
import { Tv, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';

export function WatchingList() {
  const { authMode, getCurrentlyWatchingAnime, listData } = useAuth();
  const { t } = useTranslation();
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isHydrated = useHydration();
  
  useEffect(() => {
    if (!isHydrated || authMode === 'none') {
        setIsLoading(false);
        return;
    };

    const fetchWatchingAnime = async () => {
      setIsLoading(true);
      const list = await getCurrentlyWatchingAnime();
      setAnimeList(list);
      setIsLoading(false);
    };

    fetchWatchingAnime();
  }, [authMode, getCurrentlyWatchingAnime, isHydrated]);

  const sortedAnimeList = useMemo(() => {
    const unseenUpdates = listData.notifications?.filter(n => n.type === 'news' && !n.seen) || [];
    const updateTimestamps = new Map<number, number>();
    
    unseenUpdates.forEach(update => {
        const existingTimestamp = updateTimestamps.get(update.mediaId) || 0;
        const newTimestamp = new Date(update.timestamp).getTime();
        if (newTimestamp > existingTimestamp) {
            updateTimestamps.set(update.mediaId, newTimestamp);
        }
    });

    return [...animeList].sort((a, b) => {
        const aTime = updateTimestamps.get(a.id) || 0;
        const bTime = updateTimestamps.get(b.id) || 0;
        return bTime - aTime; // Sort descending by timestamp
    });
  }, [animeList, listData.notifications]);


  if (!isHydrated || authMode === 'none') {
    return null;
  }
  
  if (isLoading) {
      return <AnimeListSkeleton title={t('my_watching_list')} />;
  }

  if (sortedAnimeList.length === 0) {
    return null;
  }

  const animesToDisplay = sortedAnimeList.slice(0, 5); // Always show the top 5 sorted
  const hasFullPage = sortedAnimeList.length > 0;

  return (
    <section>
       <Link href={`/list/watching`}>
        <h2 className="text-3xl font-bold font-headline mb-4 hover:text-primary transition-colors inline-flex items-center gap-2">
            <Tv /> {t('my_watching_list')}
        </h2>
      </Link>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animesToDisplay.map((anime, index) => (
              <AnimeCard 
                key={anime.id} 
                anime={anime} 
                disableTooltip={true} 
              />
          ))}
      </div>
      {hasFullPage && (
        <div className="flex justify-center items-center gap-4 mt-4">
           <Button asChild>
                <Link href="/list/watching">
                    {t('view_all')} <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
      )}
    </section>
  );
}
