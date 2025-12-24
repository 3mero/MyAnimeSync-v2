'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { Anime } from '@/lib/types';
import { AnimeListSkeleton } from './anime-list-skeleton';
import { AnimeCard } from './anime-card';
import { useHydration } from '@/hooks/use-hydration';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';


export function ReadingList() {
  const { authMode, getCurrentlyReadingManga, listData } = useAuth();
  const { t } = useTranslation();
  const [mangaList, setMangaList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated || authMode === 'none') {
        setIsLoading(false);
        return;
    };

    const fetchReadingManga = async () => {
      setIsLoading(true);
      const list = await getCurrentlyReadingManga();
      setMangaList(list);
      setIsLoading(false);
    };

    fetchReadingManga();
  }, [authMode, getCurrentlyReadingManga, isHydrated]);

  const sortedMangaList = useMemo(() => {
    const unseenUpdates = listData.notifications?.filter(n => n.type === 'news' && !n.seen && n.isManga) || [];
    const updateTimestamps = new Map<number, number>();
    
    unseenUpdates.forEach(update => {
        const existingTimestamp = updateTimestamps.get(update.mediaId) || 0;
        const newTimestamp = new Date(update.timestamp).getTime();
        if (newTimestamp > existingTimestamp) {
            updateTimestamps.set(update.mediaId, newTimestamp);
        }
    });

    return [...mangaList].sort((a, b) => {
        const aTime = updateTimestamps.get(a.id) || 0;
        const bTime = updateTimestamps.get(b.id) || 0;
        return bTime - aTime; // Sort descending by timestamp
    });
  }, [mangaList, listData.notifications]);


  if (!isHydrated || authMode === 'none') {
    return null;
  }
  
  if (isLoading) {
      return <AnimeListSkeleton title={t('currently_reading')} Icon={BookOpen} />;
  }

  if (sortedMangaList.length === 0) {
    return null;
  }

  const animesToDisplay = sortedMangaList.slice(0, 5);
  const hasFullPage = sortedMangaList.length > 0;

  return (
    <section>
       <Link href={`/list/reading`}>
        <h2 className="text-3xl font-bold font-headline mb-4 hover:text-primary transition-colors inline-flex items-center gap-2">
            <BookOpen /> {t('currently_reading')}
        </h2>
      </Link>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animesToDisplay.map((anime, index) => (
              <AnimeCard 
                key={`${anime.mal_id}-${index}`} 
                anime={anime} 
                disableTooltip={true} 
              />
          ))}
      </div>
      {hasFullPage && (
        <div className="flex justify-center items-center gap-4 mt-4">
           <Button asChild>
                <Link href="/list/reading">
                    {t('view_all')} <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
      )}
    </section>
  );
}
