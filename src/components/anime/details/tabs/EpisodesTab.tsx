'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { Anime, AniListStreamingEpisode, ListData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ListVideo, Check, ArrowUp, ArrowDown, Trash2, CheckCheck, Film, ExternalLink, RefreshCcw, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useLogger } from '@/hooks/use-logger';
import { CustomLinksDialog } from './CustomLinksDialog';
import { useToast } from '@/hooks/use-toast';


function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

function generateEpisodesFromCustomLink(anime: Anime, linkInfo: { template: string }): Partial<AniListStreamingEpisode>[] {
  if (!linkInfo.template) return [];

  try {
    const episodeMap: Record<string, string> = JSON.parse(linkInfo.template);
    const episodeNumbers = Object.keys(episodeMap).map(Number).sort((a,b) => a-b);
    
    if (episodeNumbers.length === 0) return [];
    
    const episodes: Partial<AniListStreamingEpisode>[] = [];
    for (const epNumber of episodeNumbers) {
      const url = episodeMap[String(epNumber)];
      episodes.push({
        title: `Episode ${epNumber}`,
        thumbnail: anime.images.webp.large_image_url,
        url: url || '#', // Use '#' as a placeholder if URL is empty
        site: url ? 'Custom Link' : 'No Link', // Differentiate for rendering
      });
    }
    return episodes;

  } catch(e) {
      console.error("Failed to parse custom episode links JSON:", e);
      return [];
  }
}


export function EpisodesTab({ anime, listData, toggleEpisodeWatched }: { anime: Anime; listData: ListData; toggleEpisodeWatched: (anime: Anime, episodeId: string) => void; }) {
    const { authMode, unwatchAllEpisodes, watchAllEpisodes } = useAuth();
    const { t } = useTranslation();
    const { addLog } = useLogger();
    const animeIdStr = String(anime.id);

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    const isMovie = anime.type === 'Movie';

    const allEpisodes = useMemo(() => {
        if (isMovie) {
            return [{ title: anime.title, thumbnail: anime.images.webp.large_image_url, url: '#', site: 'Movie' }];
        }
        
        if (!listData || !listData.customEpisodeLinks) {
            return [];
        }
        
        const currentLinkInfo = listData.customEpisodeLinks[anime.id];
        if (currentLinkInfo && currentLinkInfo.template) {
             return generateEpisodesFromCustomLink(anime, currentLinkInfo);
        } else {
             return [];
        }
    }, [anime, isMovie, listData]);

    useEffect(() => {
        addLog(`Recalculating allEpisodes for anime ID: ${anime.id}. Found ${allEpisodes.length} episodes.`);
    }, [allEpisodes, anime.id, addLog]);

    const watchedSet = useMemo(() => {
        if (!listData || !listData.watchedEpisodes) return new Set<number>();
        const episodeNumbers = (listData.watchedEpisodes[animeIdStr] || []).map(Number);
        return new Set(episodeNumbers);
    }, [listData.watchedEpisodes, animeIdStr]);


    const sortedEpisodes = useMemo(() => {
        return [...allEpisodes].sort((a, b) => {
            const numA = parseInt(a.title?.match(/\d+/)?.[0] || '0', 10) || allEpisodes.indexOf(a) + 1;
            const numB = parseInt(b.title?.match(/\d+/)?.[0] || '0', 10) || allEpisodes.indexOf(b) + 1;

            if (sortOrder === 'asc') {
                return numA - numB;
            } else {
                return numB - numA;
            }
        });
    }, [allEpisodes, sortOrder]);
    
    const displayEpisodes = sortedEpisodes;

    const handleEpisodeClick = useCallback((episodeTitle: string | null, index: number) => {
        if (authMode === 'none' || !episodeTitle) return;
        
        let episodeNumber: number;
        if (isMovie) {
            episodeNumber = 1;
        } else {
             const episodeNumberMatch = episodeTitle.match(/\d+/);
             episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0], 10) : index + 1;
        }
        
        if (episodeNumber > 0) {
            toggleEpisodeWatched(anime, String(episodeNumber));
        }
    }, [authMode, anime, isMovie, toggleEpisodeWatched]);

    const handleUnwatchAll = () => {
        if (authMode === 'none' || watchedSet.size === 0) return;
        unwatchAllEpisodes(anime);
    };

    const handleWatchAll = () => {
        if (authMode === 'none' || allEpisodes.length === 0) return;
        watchAllEpisodes(anime);
    };

    const totalAvailableEpisodes = isMovie ? 1 : allEpisodes.length > 0 ? allEpisodes.length : (anime.episodes || 0);
    const allAreWatched = totalAvailableEpisodes > 0 && watchedSet.size >= totalAvailableEpisodes;
    const watchedCount = watchedSet.size;


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         {isMovie ? (
                            <div className="flex items-center gap-4">
                                <Film className="w-6 h-6 text-primary"/>
                                <span className="text-xl">{anime.title}</span>
                                {authMode !== 'none' && (
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="shrink-0"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEpisodeClick(anime.title || null, 0); }}
                                    >
                                        <Check className={cn("h-6 w-6", watchedSet.has(1) ? "text-primary" : "text-muted-foreground")} />
                                    </Button>
                                )}
                            </div>
                         ) : (
                            <>
                                <ListVideo className="w-6 h-6 text-primary"/>
                                {t('episodes')}
                                {totalAvailableEpisodes > 0 && (
                                    <Badge variant="secondary" className="text-sm">
                                        {watchedCount} / {totalAvailableEpisodes}
                                    </Badge>
                                )}
                            </>
                         )}
                    </div>
                     {!isMovie && displayEpisodes.length > 0 && (
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                                {sortOrder === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />}
                                فرز
                            </Button>
                            {!allAreWatched && authMode !== 'none' && (
                                <Button variant="outline" size="sm" onClick={handleWatchAll}>
                                    <CheckCheck className="mr-2 h-4 w-4"/> {t('watch_all')}
                                </Button>
                            )}
                            {watchedSet.size > 0 && authMode !== 'none' && (
                                <Button variant="destructive" size="sm" onClick={handleUnwatchAll}>
                                    <Trash2 className="mr-2 h-4 w-4"/> {t('unwatch_all')}
                                </Button>
                            )}
                        </div>
                     )}
                </CardTitle>
            </CardHeader>
             <CardContent>
                {displayEpisodes.length > 0 ? (
                    <ScrollArea className="h-96">
                        <div className="space-y-2 pr-4">
                            {displayEpisodes.map((ep, index) => {
                                const episodeNumberMatch = ep.title?.match(/\d+/);
                                const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0], 10) : index + 1;
                                
                                const episodesAired = anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes;
                                const isAired = episodesAired != null && episodeNumber <= episodesAired;

                                const isWatched = authMode !== 'none' && watchedSet.has(episodeNumber);
                                const hasLink = ep.url && ep.url !== '#';
                                
                                const content = (
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-md transition-colors",
                                            isWatched 
                                                ? 'bg-muted/50 text-muted-foreground' 
                                                : hasLink ? 'hover:bg-primary/10' : '',
                                            !isAired && !isWatched && 'opacity-60' // Dim if not aired AND not manually marked as watched
                                        )}
                                    >
                                        <div className="flex items-center gap-4 flex-grow overflow-hidden">
                                            {ep.thumbnail && (
                                            <div className="relative w-32 h-20 rounded-md overflow-hidden shrink-0">
                                                <Image src={ep.thumbnail} alt={ep.title || ''} fill className="object-cover" />
                                            </div>
                                            )}
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-semibold truncate">{ep.title?.replace('Episode', t('episode'))}</p>
                                                <div className="flex items-center gap-2">
                                                    {ep.site && ep.site === 'Custom Link' && (
                                                    <p className="text-xs text-blue-400 flex items-center gap-1">{t('custom_link')} <ExternalLink className="w-3 h-3" /></p>
                                                    )}
                                                    {!isAired && (
                                                        <p className="text-xs text-amber-400">({t('not_yet_aired_ep')})</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {authMode !== 'none' && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="shrink-0"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEpisodeClick(ep.title || null, index); }}
                                            >
                                                <Check className={cn("h-5 w-5", isWatched ? "text-primary" : "text-muted-foreground")} />
                                            </Button>
                                        )}
                                    </div>
                                );

                                if (hasLink) {
                                    return (
                                        <a
                                            key={index}
                                            href={ep.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {content}
                                        </a>
                                    );
                                }

                                return <div key={index} onClick={(e) => { e.preventDefault(); handleEpisodeClick(ep.title || null, index)}} className="cursor-pointer">{content}</div>;
                            })}
                        </div>
                    </ScrollArea>
                ) : null }
                {!isMovie && (
                    <div className="mt-4 text-center">
                        <CustomLinksDialog anime={anime} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
