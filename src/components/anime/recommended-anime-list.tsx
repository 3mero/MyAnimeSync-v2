'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PlusCircle } from 'lucide-react';
import type { Anime, BreadcrumbItem, JikanGenre } from '@/lib/types';
import { AnimeCard } from './anime-card';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '../ui/button';

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;
const RECOMMENDATION_LIMIT = 20; // We typically get more than 9 recommendations

interface RecommendedAnimeListProps {
  animes: Anime[];
  animeId: number; // This should be anilistId now
  currentTrail: BreadcrumbItem[];
  title?: string;
}

export function RecommendedAnimeList({ animes, animeId, currentTrail, title }: RecommendedAnimeListProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const filteredAnimes = animes;

  if (!filteredAnimes || filteredAnimes.length === 0) {
    return null;
  }
  
  const displayAnimes = filteredAnimes.slice(0, visibleCount);
  
  const finalTitle = title || t('similar_anime');

  const hasMoreToLoad = visibleCount < filteredAnimes.length && visibleCount < RECOMMENDATION_LIMIT;
  
  return (
    <section>
        <h2 className="text-3xl font-bold font-headline mb-4 hover:text-primary transition-colors inline-block">
            {finalTitle}
        </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayAnimes.map((anime) => (
              <AnimeCard 
                key={anime.id} 
                anime={anime} 
                currentTrail={currentTrail}
              />
          ))}
      </div>

       {hasMoreToLoad && (
        <div className="flex justify-center items-center gap-4 mt-4">
            <Button variant="outline" onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}>
                <PlusCircle className="mr-2" /> {t('show_more')}
            </Button>
        </div>
      )}
    </section>
  );
}
