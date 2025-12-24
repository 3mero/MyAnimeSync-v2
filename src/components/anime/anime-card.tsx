'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Film, Tv, Video, Music, Sparkles, ChevronDown, ChevronUp, Copy, Bookmark, Calendar, List, X, Info, Languages, Undo2, Loader2, BookOpen, BookUser, Trash2, VideoIcon, Plus, Tags, ShieldAlert, Clock, Bell, Search } from 'lucide-react';
import type { Anime, BreadcrumbItem, UpdateInfo, JikanGenre } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { translations } from '@/i18n';
import { useAuth } from '@/hooks/use-auth';
import { translateTextServer } from '@/lib/translation';
import { GenreAnimeListDialog } from './list/genre-anime-list-dialog';
import { Progress } from '../ui/progress';
import { SceneSearchDialog } from './details/scene-search-dialog';
import { ReminderDialog } from '../notifications/reminder-dialog';


type WatchingStatus = 'watched' | 'in-progress';
type ReadingStatus = 'read' | 'in-progress';


const typeIcons: { [key: string]: React.ElementType } = {
  'TV': Tv,
  'MOVIE': Film,
  'OVA': Video,
  'SPECIAL': Sparkles,
  'ONA': Video,
  'MUSIC': Music,
  'PV': Tv,
  'CM': Tv,
  'MANGA': BookOpen,
  'NOVEL': BookOpen,
  'ONE_SHOT': BookOpen,
};

function SynopsisDialog({ synopsis, title }: { synopsis: string | null | undefined, title: string }) {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleTranslateToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    
    if (translatedSynopsis) {
      setShowTranslation(true);
      return;
    }

    if (!synopsis || synopsis === t('no_synopsis_available')) {
        toast({ variant: "destructive", title: t('toast_nothing_to_translate'), description: t('toast_no_synopsis_available_desc') });
        return;
    }

    setIsTranslating(true);
    const result = await translateTextServer(synopsis);
    if (result) {
      setTranslatedSynopsis(result);
      setShowTranslation(true);
    } else {
        toast({ variant: "destructive", title: t('toast_translation_failed_title'), description: t('toast_translation_failed_desc') });
    }
    setIsTranslating(false);
  };
  
  const synopsisText = (showTranslation && translatedSynopsis) ? translatedSynopsis : (synopsis || t('no_synopsis_available'));

  return (
      <Dialog>
          <DialogTrigger asChild>
              <Button variant="secondary" className="w-full">
                  <Info className="mr-2" /> {t('show_synopsis')}
              </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div className="flex items-center justify-end">
                      <Button variant="outline" size="sm" onClick={handleTranslateToggle} disabled={isTranslating}>
                          {isTranslating ? <Loader2 className="h-4 w-4 animate-spin"/> : showTranslation ? (
                          <>
                              <Undo2 className="mr-2 h-4 w-4" />
                              {t('original_text')}
                          </>
                          ) : (
                          <>
                              <Languages className="mr-2 h-4 w-4" />
                              {t('translate_to_arabic')}
                          </>
                          )}
                      </Button>
                  </div>
                  <p className={cn("text-foreground/80 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto", lang === 'ar' && showTranslation && "rtl")}>
                      {synopsisText}
                  </p>
              </div>
          </DialogContent>
      </Dialog>
  );
}


function GenresDialog({ genres, animeTitle }: { genres: JikanGenre[], animeTitle: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [translatedGenres, setTranslatedGenres] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Deduplicate genres before rendering
  const seen = new Set();
  const uniqueGenres = genres.filter(genre => {
    const duplicateKey = `${genre.type}-${genre.name}`;
    if (seen.has(duplicateKey)) {
      return false;
    } else {
      seen.add(duplicateKey);
      return true;
    }
  });


  const handleTranslate = async () => {
    setIsTranslating(true);
    const genresToTranslate = uniqueGenres.filter(g => !translatedGenres[g.name]);
    if (genresToTranslate.length === 0) {
      setIsTranslating(false);
      return;
    }

    try {
      const translationsPromises = genresToTranslate.map(g => translateTextServer(g.name));
      const results = await Promise.all(translationsPromises);
      
      const newTranslations: Record<string, string> = {};
      results.forEach((translatedName, index) => {
        const originalName = genresToTranslate[index].name;
        if (translatedName) {
          newTranslations[originalName] = translatedName;
        }
      });

      setTranslatedGenres(prev => ({ ...prev, ...newTranslations }));
    } catch (error) {
      toast({ variant: "destructive", title: t('toast_translation_failed_title'), description: "Could not translate genres." });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <p className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary">
          {genres?.map(g => g.name).join(', ') || t('n_a')}
        </p>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tags />{t('genres')} for {animeTitle}</DialogTitle>
          <DialogDescription>
            {t('explore_anime_by_genre')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="flex justify-end mb-4 border-b pb-4">
                 <Button variant="outline" size="sm" onClick={handleTranslate} disabled={isTranslating}>
                    {isTranslating ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                        <>
                            <Languages className="mr-2 h-4 w-4" />
                            {t('translate_to_arabic')}
                        </>
                    )}
                </Button>
            </div>
            <ScrollArea className="flex-grow pr-2">
              <div className="flex flex-wrap gap-3 py-4">
                {uniqueGenres.map(genre => (
                    <GenreAnimeListDialog
                        key={`${genre.type}-${genre.name}`}
                        genre={genre}
                        trigger={
                           <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer w-36 h-24 text-center">
                                <span className="font-semibold text-sm line-clamp-2">{genre.name}</span>
                                <span className="text-xs text-primary mt-1">{translatedGenres[genre.name] || '...'}</span>
                           </div>
                        }
                    />
                ))}
              </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}


interface AnimeCardProps {
  anime: Anime;
  currentTrail?: BreadcrumbItem[];
  disableTooltip?: boolean;
  listType?: 'watching' | 'plan-to-watch' | 'completed' | 'reading' | 'plan-to-read' | 'read';
  onRemove?: (itemId: number) => void;
}


export function AnimeCard({
  anime,
  currentTrail,
  disableTooltip = false,
  listType,
  onRemove,
}: AnimeCardProps) {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const { 
    authMode, 
    listData,
    togglePlanToWatch, isPlannedToWatch,
    toggleCurrentlyWatching, isCurrentlyWatching,
    togglePlanToRead, isPlannedToRead,
    toggleCurrentlyReading, isCurrentlyReading,
    updates,
  } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  const originalImageUrl = anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url;
  
  const isManga = anime.type === 'MANGA' || anime.type === 'NOVEL' || anime.type === 'ONE_SHOT';
  const basePath = isManga ? '/manga' : '/anime';
  const detailLink = `${basePath}/${anime.id || anime.mal_id}`;

  const animeUpdate = updates ? updates[anime.id] : undefined;

  let newTrail = `${anime.id || anime.mal_id}`;
  if (currentTrail && currentTrail.length > 0) {
    const trailPath = currentTrail.map(t => t.id).join(',');
    newTrail = `${trailPath},${anime.id}`;
  }

  const isFinished = anime.status === 'FINISHED';
  
  let typeKey = (anime.format || anime.type || 'tv').toUpperCase() as keyof typeof typeIcons;
  const TypeIcon = typeIcons[typeKey] || Tv;

  let translatedTypeKey = (anime.format || anime.type || 'tv').toLowerCase().replace(/ /g, '_').replace(/-/g, '_') as keyof typeof translations.ar;
  if (translatedTypeKey === 'one_shot') translatedTypeKey = 'one-shot';
  const translatedType = t(translatedTypeKey);

  // Unified status logic
  const { watchingStatus, readingStatus, progress } = useMemo(() => {
    if (authMode === 'none' || !listData) return { watchingStatus: undefined, readingStatus: undefined, progress: null };
    const animeIdStr = String(anime.id);
    let progressData = null;

    // Anime status
    const watchedEpsCount = listData.watchedEpisodes?.[animeIdStr]?.length || 0;
    let watchingStatus: WatchingStatus | undefined = undefined;
    if (listData.currentlyWatching?.includes(anime.id) || watchedEpsCount > 0) {
        watchingStatus = (anime.episodes && watchedEpsCount >= anime.episodes) ? 'watched' : 'in-progress';
    }
    if (watchingStatus && anime.episodes) {
        progressData = { current: watchedEpsCount, total: anime.episodes };
    }

    // Manga status
    const readChapsCount = listData.readChapters?.[animeIdStr]?.read?.length || 0;
    const totalChapters = anime.chapters || anime.volumes;
    let readingStatus: ReadingStatus | undefined = undefined;
    if (listData.currentlyReading?.includes(anime.id) || readChapsCount > 0) {
        readingStatus = (totalChapters && readChapsCount >= totalChapters) ? 'read' : 'in-progress';
    }
    if (readingStatus && totalChapters) {
        progressData = { current: readChapsCount, total: totalChapters };
    }

    return { watchingStatus, readingStatus, progress: progressData };
  }, [authMode, listData, anime]);
  
  const plannedToWatch = isPlannedToWatch(anime.id);
  const watching = isCurrentlyWatching(anime.id);
  const plannedToRead = isPlannedToRead(anime.id);
  const reading = isCurrentlyReading(anime.id);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (listType && onRemove) {
        onRemove(anime.id);
    }
  }

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(anime.title);
    toast({
        title: t('toast_copied_title'),
        description: t('toast_copied_desc'),
    });
  }
  
  const handleToggleCurrentlyWatching = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (authMode === 'none') return;
      toggleCurrentlyWatching(anime);
  }

  const handlePlanToWatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (authMode === 'none') return;
    togglePlanToWatch(anime);
    toast({
        title: plannedToWatch ? t('toast_removed_from_plan_to_watch_title') : t('toast_added_to_plan_to_watch_title'),
        description: `${anime.title}`,
    });
  }

  const handleToggleCurrentlyReading = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (authMode === 'none') return;
      toggleCurrentlyReading(anime);
  }

  const handlePlanToReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (authMode === 'none') return;
    togglePlanToRead(anime);
  }


  const renderStatusIndicators = () => {
    let personalStatusIndicator = null;
    let airingStatusIndicator = null;

    const currentStatus = isManga ? readingStatus : watchingStatus;

    if (currentStatus) {
      const isCompleted = currentStatus === 'watched' || currentStatus === 'read';
      const indicatorClass = cn(
        "absolute top-2 left-2 h-4 w-4 rounded-full border-2 border-background z-10",
        isCompleted ? (isManga ? "bg-green-500" : "bg-blue-500") : "bg-yellow-400"
      );
      let tooltipText = isCompleted 
        ? (isManga ? t('read') : t('status_watched'))
        : (isManga ? t('currently_reading') : t('status_in_progress'));
        
      personalStatusIndicator = (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={indicatorClass} />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    if (isFinished) {
       const indicatorClass = cn(
        "absolute top-2 h-3 w-3 rounded-full border-2 border-background z-10",
        isManga ? "bg-sky-400" : "bg-green-500",
        currentStatus ? "left-7" : "left-2"
      );
      const statusText = isManga ? t('finished_publishing') : t('finished_airing');

      airingStatusIndicator = (
         <Tooltip>
            <TooltipTrigger asChild>
                <div className={indicatorClass} />
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{statusText}</p>
            </TooltipContent>
        </Tooltip>
      );
    }

    if (!personalStatusIndicator && !airingStatusIndicator) return null;

    return (
      <TooltipProvider>
        {personalStatusIndicator}
        {airingStatusIndicator}
      </TooltipProvider>
    );
  };

  const cardContent = (
    <Card className="h-full w-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/20 group">
        <div className="relative aspect-[2/3] w-full">
            {showDetails ? (
                <div className="absolute inset-0 bg-card p-3 flex flex-col space-y-2 overflow-hidden">
                   <div className="flex items-start justify-between gap-2 border-b pb-2">
                        <p className="text-sm font-semibold line-clamp-2 flex-grow">{anime.title}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                           <Copy className="h-4 w-4" />
                           <span className="sr-only">{t('copy_title')}</span>
                        </Button>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground flex-grow">
                        <div className="flex items-center gap-2"><List className="h-3 w-3"/><span>{translatedType} &bull; {isManga ? `${anime.chapters || '?'} ch` : `${anime.episodes || '?'} ep`}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-3 w-3"/><span>{anime.year || t('n_a')}</span></div>
                        <div className="flex items-center gap-2"><Star className="h-3 w-3"/><span>{anime.score?.toFixed(2)} ({anime.scored_by?.toLocaleString()} {t('votes')})</span></div>
                    </div>
                    
                    <SynopsisDialog synopsis={anime.synopsis} title={anime.title} />

                    {authMode !== 'none' && (
                        isManga ? (
                            <>
                                <Button className="w-full" variant={reading ? "secondary" : "outline"} onClick={handleToggleCurrentlyReading}>
                                    <BookUser className={cn("w-4 h-4 mr-2", reading ? "text-green-400" : "text-muted-foreground")} />
                                    {reading ? t('currently_reading') : t('currently_reading')}
                                </Button>
                                <Button className="w-full" variant={plannedToRead ? "secondary" : "outline"} onClick={handlePlanToReadToggle}>
                                    <Bookmark className={cn("w-4 h-4 mr-2", plannedToRead ? "text-yellow-400" : "text-muted-foreground")} />
                                    {plannedToRead ? t('plan_to_read_manga') : t('plan_to_read_manga')}
                                </Button>
                                {(listType === 'reading' || listType === 'plan-to-read') && (
                                  <>
                                    <SceneSearchDialog animeId={anime.id} animeTitle={anime.title} posterImage={originalImageUrl} />
                                    <ReminderDialog anime={anime}>
                                      <Button variant="outline" className="w-full">
                                        <Bell className="text-purple-400" />
                                        {t('add_reminder')}
                                      </Button>
                                    </ReminderDialog>
                                  </>
                                )}
                            </>
                        ) : (
                            <>
                                <Button className="w-full" variant={watching ? "secondary" : "outline"} onClick={handleToggleCurrentlyWatching}>
                                    <VideoIcon className={cn("w-4 h-4 mr-2", watching ? "text-green-400" : "text-muted-foreground")} />
                                    {watching ? t('currently_watching') : t('currently_watching')}
                                </Button>
                                <Button className="w-full" variant={plannedToWatch ? "secondary" : "outline"} onClick={handlePlanToWatchToggle}>
                                    <Bookmark className={cn("w-4 h-4 mr-2", plannedToWatch ? "text-yellow-400" : "text-muted-foreground")} />
                                    {plannedToWatch ? t('planned') : t('plan_to_watch_btn')}
                                </Button>
                            </>
                        )
                    )}
                </div>
            ) : (
              <div className="relative h-full w-full">
                <Link href={detailLink} className="block h-full w-full">
                    {renderStatusIndicators()}
                    {animeUpdate && (animeUpdate.newEpisodes > 0 || animeUpdate.newChapters > 0) && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-green-500/90 text-white rounded-full px-2 py-1 text-xs font-bold">
                                        <Plus className="h-4 w-4" />
                                        <span>{isManga ? animeUpdate.newChapters : animeUpdate.newEpisodes}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isManga ? `New Chapters: ${animeUpdate.newChapters}` : `New Episodes: ${animeUpdate.newEpisodes}`}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    
                    {originalImageUrl ? (
                        <Image
                            src={originalImageUrl}
                            alt={`Poster for ${anime.title}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            data-ai-hint="anime poster"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                            <p className="text-xs text-muted-foreground">{t('no_image')}</p>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="flex items-center gap-1 bg-black/50 text-white backdrop-blur-sm">
                            <TypeIcon className="h-3 w-3" />
                            <span>{translatedType}</span>
                        </Badge>
                        {anime.year && (
                            <Badge variant="secondary" className="flex items-center gap-1 bg-black/50 text-white backdrop-blur-sm">
                                <Calendar className="h-3 w-3" />
                                <span>{anime.year}</span>
                            </Badge>
                        )}
                        {anime.score && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge
                                        variant="destructive"
                                        className="flex items-center gap-1 bg-black/50 text-white backdrop-blur-sm"
                                        >
                                        <Star className="h-3 w-3 text-amber-300" />
                                        <span>{anime.score.toFixed(2)}</span>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{anime.scored_by?.toLocaleString()} {t('votes')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </Link>
                 {listType && onRemove && authMode !== 'none' && !showDetails && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-black/60 hover:bg-destructive"
                                    onClick={(e) => { e.stopPropagation(); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently remove "{anime.title}" from your "{listType}" list.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemove}>
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
              </div>
            )}
        </div>
        <div className="p-3">
            <h3
                className={cn(
                    "font-bold group-hover:text-primary transition-colors cursor-pointer text-sm md:text-base",
                    !isTitleExpanded && "truncate"
                )}
                onClick={() => setIsTitleExpanded(!isTitleExpanded)}
            >
                {anime.title}
            </h3>

            {progress ? (
                <div className="mt-1.5 space-y-1">
                    <Progress value={(progress.current / progress.total) * 100} className="h-2"/>
                    <p className="text-xs text-muted-foreground font-mono text-center">
                        {progress.current} / {progress.total}
                    </p>
                </div>
            ) : (
                anime.latestUpdate?.timestamp ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3"/>
                        <span>{anime.latestUpdate.status} {anime.latestUpdate.progress}</span>
                        <span>&bull;</span>
                        <span>{formatDistanceToNow(new Date(anime.latestUpdate.timestamp * 1000), { addSuffix: true, locale: lang === 'ar' ? ar : undefined })}</span>
                    </div>
                ) : (
                    anime.genres && anime.genres.length > 0 ? (
                        <GenresDialog genres={anime.genres} animeTitle={anime.title} />
                    ) : (
                        <p className="text-xs text-muted-foreground truncate">{t('n_a')}</p>
                    )
                )
            )}

            <Button variant="ghost" size="sm" className="w-full justify-center h-auto py-1 mt-1 text-muted-foreground hover:text-foreground" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
        </div>
    </Card>
  );

  if (disableTooltip || showDetails) {
    return cardContent;
  }

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
            <TooltipContent className="bg-primary text-primary-foreground border-primary-foreground/20">
                <p>{anime.title}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
