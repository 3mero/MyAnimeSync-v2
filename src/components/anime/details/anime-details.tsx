'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { Anime } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Tv, Calendar, Tag, Bookmark, Search, GitMerge, Check, Video, ListOrdered, Bell, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { translations } from '@/lib/i18n';
import { SceneSearchDialog } from './scene-search-dialog';
import { cn } from '@/lib/utils';
import { ReminderDialog } from '@/components/notifications/reminder-dialog';
import { useState } from 'react';


export const AnimeDetails = ({ anime }: { anime: Anime }) => {
  const { authMode, isPlannedToWatch, togglePlanToWatch, isCurrentlyWatching, toggleCurrentlyWatching } = useAuth();
  const { t } = useTranslation();
  
  const planned = isPlannedToWatch(anime.id);
  const watching = isCurrentlyWatching(anime.id);

  const translatedStatus = t(anime.status.toLowerCase().replace(/ /g, '_').replace(/-/g, '_') as keyof typeof translations.ar || 'unknown');
  
  const ratingKey = `rating_${anime.rating?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown'}` as keyof typeof translations.ar;
  const translatedRating = t(ratingKey);

  const n_a = t('n_a');
  const translatedType = t(anime.type?.toLowerCase().replace(/ /g, '_') as keyof typeof translations.ar || 'tv');

  const posterImage = anime.images.webp.large_image_url || anime.images.jpg.large_image_url;


  return (
    <Card className="overflow-hidden sticky top-20">
      <CardHeader className="p-0 relative">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={posterImage || `https://picsum.photos/seed/${anime.id}/400/600`}
            alt={`Poster for ${anime.title}`}
            fill
            className={cn("object-cover")}
            sizes="(max-width: 768px) 100vw, 33vw"
            data-ai-hint="anime poster"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
         
         {anime.score && (
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg">{anime.score.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">({anime.scored_by?.toLocaleString()} {t('votes')})</span>
          </div>
         )}

        <div className="flex flex-col gap-2 pt-2">
             {authMode !== 'none' && (
                <Button 
                    className="w-full flex-wrap"
                    variant={watching ? "secondary" : "outline"}
                    onClick={() => toggleCurrentlyWatching(anime)}
                >
                    <Video className={cn(watching ? "text-green-400" : "text-muted-foreground")} />
                    {watching ? t('watching') : t('currently_watching')}
                </Button>
            )}
            {authMode !== 'none' && (
                <Button 
                  className="w-full flex-wrap"
                  variant={planned ? "secondary" : "outline"}
                  onClick={() => togglePlanToWatch(anime)}
                >
                  <Bookmark className={cn(planned ? "text-yellow-400" : "text-muted-foreground")} />
                  {planned ? t('planned') : t('plan_to_watch_btn')}
                </Button>
            )}
            {anime.id && (
                  <SceneSearchDialog 
                    animeId={anime.id} 
                    animeTitle={anime.title}
                    posterImage={posterImage}
                  />
             )}
             {authMode !== 'none' && (
                <ReminderDialog anime={anime}>
                    <Button variant="outline" className="w-full flex-wrap">
                        <Bell className="text-purple-400" />
                        {t('add_reminder')}
                    </Button>
                </ReminderDialog>
            )}
        </div>


         <div className="flex items-center gap-2 text-sm">
            <Tv className="w-4 h-4 text-muted-foreground"/>
            <span>{translatedType} &bull; {anime.episodes || n_a} {t('episodes_count')}</span>
         </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground"/>
            <span>{anime.year || n_a} &bull; {translatedStatus}</span>
         </div>
         <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-muted-foreground"/>
            <span>{t('rating')}: {translatedRating || n_a}</span>
         </div>
      </CardContent>
    </Card>
  );
}
