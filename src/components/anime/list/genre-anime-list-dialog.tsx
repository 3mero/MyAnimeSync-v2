'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Anime, JikanGenre } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Copy } from 'lucide-react';
import { AnimeCard } from '../anime-card';
import { deduplicateAnime } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { searchMediaGraphQL } from '@/lib/anilist';
import { useLogger } from '@/hooks/use-logger';
import { mapAniListMediaToAnime } from '@/lib/anilist/utils';


interface SearchResults {
  data: Anime[];
  hasNextPage: boolean;
}

const PAGE_SIZE = 20;

function LoadingSkeleton() {
    const gridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-5 w-4/5 mt-2" />
          </div>
        ))}
      </div>
    );
}

function DebugConsole({ error, requestUrl }: { error: string | null, requestUrl: string | null }) {
    const { toast } = useToast();
    if (!requestUrl) return null;

    const handleCopy = () => {
        const textToCopy = `Request URL: ${requestUrl || 'N/A'}\n\nServer Error: ${error || 'No server error, but no results were found for the query.'}`;
        navigator.clipboard.writeText(textToCopy);
        toast({ title: 'Debug info copied!' });
    };

    return (
        <Card className="mt-8 bg-muted/50 border-border text-left">
            <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>
                   Details about the data request for this genre.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-48 overflow-y-auto">
                <div>
                    <h4 className="font-semibold text-sm">Request URL:</h4>
                    <pre className="text-xs bg-black/50 p-2 rounded-md overflow-x-auto">
                        {requestUrl || 'Not available'}
                    </pre>
                </div>
                {error && (
                    <div>
                        <h4 className="font-semibold text-sm">Server Error:</h4>
                        <pre className="text-xs bg-black/50 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                            {error}
                        </pre>
                    </div>
                )}
                 {!error && (
                     <p className="text-xs">The request was successful.</p>
                 )}
                <Button onClick={handleCopy} size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Debug Info
                </Button>
            </CardContent>
        </Card>
    );
}


export function GenreAnimeListDialog({ genre, trigger }: { genre: JikanGenre, trigger: React.ReactNode }) {
    const { t } = useTranslation();
    const { addLog } = useLogger();
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Anime[]>([]);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRequestUrl, setLastRequestUrl] = useState<string | null>(null);


    const fetchAnimes = useCallback(async (page: number, append: boolean = false) => {
        if (!append) {
            setIsLoading(true);
            setResults([]);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);
        
        const variables: any = {
            sort: 'POPULARITY_DESC',
            page: page,
            perPage: PAGE_SIZE,
        };

        if (genre.type === 'genre') {
            variables.genre_in = [genre.name];
        } else { // 'tag'
            variables.tag_in = [genre.name];
        }

        setLastRequestUrl(`Genre/Tag search for: "${genre.name}", page: ${page}, type: ${genre.type}`);

        try {
            const data = await searchMediaGraphQL(variables, addLog);
            
            if (!data || !data.media || data.media.length === 0) {
                 setError("The server returned no results for this genre. It might be a niche category or data is unavailable.");
            } else {
                const mappedData = data.media.map(mapAniListMediaToAnime);
                setResults(prev => {
                    const combined = append ? [...prev, ...mappedData] : mappedData;
                    return deduplicateAnime(combined);
                });
                setHasNextPage(data.pageInfo.hasNextPage);
                setCurrentPage(page);
            }

        } catch (err: any) {
             setError(err.message || 'An unexpected error occurred while fetching data.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [genre.name, genre.type, addLog]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setCurrentPage(1);
            setHasNextPage(false);
            fetchAnimes(1, false);
        }
    }

    const handleLoadMore = () => {
        if (hasNextPage && !isLoadingMore) {
            fetchAnimes(currentPage + 1, true);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {t('anime')} - {genre.name}
                    </DialogTitle>
                    <DialogDescription>
                        {t('explore_anime_by_genre')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-6">
                        {isLoading ? <LoadingSkeleton /> :
                         results.length === 0 ? (
                            <div className="text-center py-16">
                                {error && (
                                    <Alert variant="destructive" className="max-w-md mx-auto">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>No Results Found</AlertTitle>
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                         ) :
                         (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {results.map(anime => (
                                        <AnimeCard key={anime.id} anime={anime} />
                                    ))}
                                </div>
                            </>
                         )
                        }

                        {hasNextPage && (
                            <div className="text-center mt-6">
                                <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                                    {isLoadingMore ? <Loader2 className="animate-spin mr-2"/> : t('view_more')}
                                </Button>
                            </div>
                        )}
                        
                        {!isLoading && (
                            <div className="mt-8">
                                <DebugConsole error={error} requestUrl={lastRequestUrl} />
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
