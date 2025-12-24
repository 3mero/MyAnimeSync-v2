'use client';

import { useState, useMemo } from "react";
import { searchCharacters, getCharacter, getAnimeRecommendations, searchMediaGraphQL, getMultipleAnimeFromAniList } from "@/lib/anilist";
import type { Anime } from '@/lib/types';
import { AnimeCard } from "./anime-card";
import { useTranslation } from "@/hooks/use-translation";
import { useLogger } from "@/hooks/use-logger";
import { deduplicateAnime } from "@/lib/utils";
import { RecommendationsDialog } from "./details/recommendations-dialog";
import { translateTextServer } from '@/lib/translation';
import { HomeLayoutEditor } from '@/components/layout/home-layout-editor';
import { useRouter } from "next/navigation";


import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, Wand2, X, AlertCircle, Languages, ArrowRight, Palette, Film, Book } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { mapAniListMediaToAnime } from "@/lib/anilist/utils";


// This function is kept for cases where a full Anime object is needed from a partial one.
// However, the main logic now fetches full details directly.
function normalizeToAnime(item: any): Anime {
    const isJikan = !!item.mal_id;

    let title = 'Unknown';
    if (isJikan) {
        title = item.title;
    } else if (item.title) {
        title = item.title.english || item.title.romaji;
    }

    let image = item.coverImage?.large || item.images?.webp?.large_image_url || 'https://picsum.photos/seed/placeholder/400/600';

    const genres = (item.genres || []).map((g: any) => ({ name: typeof g === 'string' ? g : g.name, type: 'genre' }));
    const tags = (item.tags || []).map((tag: { name: string }) => ({ name: tag.name, type: 'tag' }));


    return {
        id: item.id || item.mal_id,
        mal_id: item.mal_id,
        title: title,
        title_english: item.title?.english,
        title_japanese: item.title?.native,
        images: {
            jpg: { large_image_url: image, image_url: image, small_image_url: image },
            webp: { large_image_url: image, image_url: image, small_image_url: image },
        },
        type: item.type,
        format: item.format,
        synopsis: item.description || item.synopsis || '',
        url: '',
        trailer: { youtube_id: null, url: null, embed_url: null },
        source: item.source || '',
        episodes: item.episodes,
        chapters: item.chapters,
        volumes: item.volumes,
        status: item.status || '',
        airing: false,
        score: item.averageScore ? item.averageScore / 10 : null,
        scored_by: item.popularity,
        rank: null,
        popularity: item.popularity,
        year: item.seasonYear || item.startDate?.year,
        broadcast: { day: null, time: null, timezone: null, string: null },
        rating: null,
        genres: [...genres, ...tags],
        studios: [],
    };
}


export function CharacterRecommender() {
    const { t, lang } = useTranslation();
    const { addLog } = useLogger();
    const router = useRouter();
    const [query, setQuery] = useState("");
    
    const [characterSearchResults, setCharacterSearchResults] = useState<any[]>([]);
    const [animeSearchResults, setAnimeSearchResults] = useState<Anime[]>([]);
    const [mangaSearchResults, setMangaSearchResults] = useState<Anime[]>([]);

    const [isSearching, setIsSearching] = useState(false);
    
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
    const [mediaData, setMediaData] = useState<{similar: Anime[], related: Anime[]}>({ similar: [], related: [] });
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
    const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
    const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
    
    const defaultTab = useMemo(() => {
        if (animeSearchResults.length > 0) return 'anime';
        if (characterSearchResults.length > 0) return 'characters';
        if (mangaSearchResults.length > 0) return 'manga';
        return 'anime';
    }, [animeSearchResults, characterSearchResults, mangaSearchResults]);


    const handleSearch = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        setIsSearching(true);
        setError(null);
        setCharacterSearchResults([]);
        setAnimeSearchResults([]);
        setMangaSearchResults([]);
        setIsSearchDialogOpen(true);
        setTranslatedQuery(null);

        let queryToSearch = trimmedQuery;
        const isArabic = /[\u0600-\u06FF]/.test(trimmedQuery);

        if (isArabic) {
            addLog(`Arabic query detected: "${trimmedQuery}". Translating...`);
            try {
                const translated = await translateTextServer(trimmedQuery, 'en');
                if (translated) {
                    queryToSearch = translated;
                    setTranslatedQuery(translated);
                    addLog(`Translation successful: "${trimmedQuery}" -> "${queryToSearch}"`);
                }
            } catch (err: any) {
                addLog(`Translation failed during search, proceeding with original query. Error: ${err.message}`, 'warn');
            }
        }
        
        try {
            addLog(`Searching for: "${queryToSearch}"`);
            
            const charPromise = searchCharacters(queryToSearch, addLog);
            const animePromise = searchMediaGraphQL({ search: queryToSearch, type: 'ANIME', page: 1, perPage: 5 }, addLog);
            const mangaPromise = searchMediaGraphQL({ search: queryToSearch, type: 'MANGA', page: 1, perPage: 5 }, addLog);

            const [charResults, animeResults, mangaResults] = await Promise.allSettled([
                charPromise,
                animePromise,
                mangaPromise
            ]);
            
            let foundResults = false;

            if (charResults.status === 'fulfilled' && charResults.value.length > 0) {
                setCharacterSearchResults(charResults.value);
                foundResults = true;
            }
            if (animeResults.status === 'fulfilled' && animeResults.value.media.length > 0) {
                setAnimeSearchResults(animeResults.value.media.map(mapAniListMediaToAnime));
                foundResults = true;
            }
             if (mangaResults.status === 'fulfilled' && mangaResults.value.media.length > 0) {
                setMangaSearchResults(mangaResults.value.media.map(mapAniListMediaToAnime));
                foundResults = true;
            }

            if (!foundResults) {
                setError(`لم يتم العثور على نتائج لـ "${queryToSearch}".`);
            }
      
        } catch (err: any) {
            addLog(`Search failed: ${err.message}`, 'error', { searchQuery: queryToSearch });
            setError(err.message || `An unknown error occurred while searching.`);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleMediaSelect = (media: Anime) => {
        setIsSearchDialogOpen(false);
        const path = media.type === 'MANGA' ? `/manga/${media.id}` : `/anime/${media.id}`;
        router.push(path);
    };

    const handleCharacterSelect = async (character: any) => {
        setIsSearchDialogOpen(false);
        setIsMediaDialogOpen(true);
        setIsLoadingMedia(true);
        setSelectedCharacter(character);
        setMediaData({ similar: [], related: [] });
        setError(null);
        addLog(`Fetching media for character ID: ${character.id} (${character.name.full})`);
        
        try {
             const characterId = character.id;
             if (!characterId) {
                 throw new Error("Could not find a valid ID to fetch media.");
             }

             const res = await getCharacter(characterId, "anilist");
             if (!res || !res.media || !res.media.edges || res.media.edges.length === 0) {
                throw new Error(`لم يتم العثور على أعمال لـ ${character.name.full}.`);
            }
            
            // Get IDs of related media
            const relatedMediaIds = res.media.edges.map((e: any) => e.node.id).filter(Boolean);

            if (relatedMediaIds.length > 0) {
                 // Fetch full details for all related media at once
                 const relatedMediaFull = await getMultipleAnimeFromAniList(relatedMediaIds, addLog);
                 const sortedRelatedMedia = deduplicateAnime(relatedMediaFull);

                 if (sortedRelatedMedia.length > 0) {
                    const primaryMedia = sortedRelatedMedia[0];
                    const similarMedia = await getAnimeRecommendations(primaryMedia.id, addLog);
                    
                    const relatedIdsSet = new Set(sortedRelatedMedia.map(m => m.id));
                    const filteredSimilar = similarMedia.filter(m => !relatedIdsSet.has(m.id));

                    setMediaData({
                        similar: filteredSimilar,
                        related: sortedRelatedMedia
                    });
                 } else {
                     setMediaData({ similar: [], related: [] });
                     setError(`No media found for ${character.name.full} to base recommendations on.`);
                 }
            } else {
                 setMediaData({ similar: [], related: [] });
                 setError(`No media found for ${character.name.full} to base recommendations on.`);
            }

        } catch (err: any) {
            addLog(`Failed to fetch media for character: ${err.message}`, 'error', { characterId: character?.id });
            console.error("Failed to fetch character media:", err);
            setError(err.message || `An unknown error occurred.`);
        } finally {
            setIsLoadingMedia(false);
        }
    };
    
    const handleBackToSearch = () => {
        setIsMediaDialogOpen(false);
        setIsSearchDialogOpen(true);
    }
    
    const renderSearchResults = () => {
        if (isSearching) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Alert variant="destructive" className="mt-4 text-left max-w-lg mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>خطأ في البحث</AlertTitle>
                        <AlertDescription className="font-mono text-sm">
                            {error}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }
        return (
            <Tabs defaultValue={defaultTab} className="w-full flex-grow flex flex-col overflow-hidden" dir="ltr">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="characters" disabled={characterSearchResults.length === 0}>{t('characters')}</TabsTrigger>
                    <TabsTrigger value="anime" disabled={animeSearchResults.length === 0}>{t('anime')}</TabsTrigger>
                    <TabsTrigger value="manga" disabled={mangaSearchResults.length === 0}>{t('manga')}</TabsTrigger>
                </TabsList>
                <div className="flex-grow overflow-hidden mt-4">
                    <TabsContent value="characters" className="m-0 h-full">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="space-y-2">
                                {characterSearchResults.map(char => (
                                    <div key={char.id} onClick={() => handleCharacterSelect(char)} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer">
                                        <Image src={char.image.large} alt={char.name.full} width={60} height={90} className="rounded-md" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{char.name.full}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="anime" className="m-0 h-full">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="space-y-2">
                                {animeSearchResults.map(anime => (
                                    <div key={anime.id} onClick={() => handleMediaSelect(anime)} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer">
                                        <Image src={anime.images.webp.large_image_url} alt={anime.title} width={60} height={90} className="rounded-md object-cover" />
                                        <span className="font-semibold">{anime.title}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="manga" className="m-0 h-full">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="space-y-2">
                                {mangaSearchResults.map(manga => (
                                    <div key={manga.id} onClick={() => handleMediaSelect(manga)} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer">
                                        <Image src={manga.images.webp.large_image_url} alt={manga.title} width={60} height={90} className="rounded-md object-cover" />
                                        <span className="font-semibold">{manga.title}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
             <h1 className="text-4xl font-bold font-headline text-center flex items-center justify-center gap-3 text-primary">
                <Wand2 className="w-10 h-10"/>
                {t('anime_advisor')}
             </h1>
            
             <Card className="p-4 bg-background/80 backdrop-blur-sm">
                 <div className="flex flex-col md:flex-row gap-4">
                    <Input 
                        placeholder={t('search_for_character_placeholder')}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-grow text-base py-6 rounded-full"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />

                    <Button onClick={handleSearch} size="lg" className="rounded-full" disabled={isSearching || !query.trim()}>
                         {isSearching && <Loader2 className="animate-spin mr-2" />}
                         <Search className="mr-2" />
                         {t('search')}
                    </Button>
                </div>
                <div className="mt-4 flex items-center justify-center">
                    <Button onClick={() => setIsLayoutEditorOpen(true)} variant="outline" size="sm">
                        <Palette className="mr-2" />
                        {t('edit_layout')}
                    </Button>
                </div>
             </Card>
             
            {/* Search Results Dialog */}
            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col" dir={lang}>
                    <DialogHeader>
                        <DialogTitle>
                           {t('search_results_for', { query: `"${query}"` })}
                           {translatedQuery && <span className="text-sm text-muted-foreground"> (searched for "{translatedQuery}")</span>}
                        </DialogTitle>
                    </DialogHeader>
                    {renderSearchResults()}
                </DialogContent>
            </Dialog>

            {/* Media Results Dialog */}
            {selectedCharacter &&
                <RecommendationsDialog
                    open={isMediaDialogOpen}
                    onOpenChange={setIsMediaDialogOpen}
                    onBack={handleBackToSearch}
                    initialRecommendations={mediaData.similar}
                    relatedMedia={mediaData.related}
                    isLoading={isLoadingMedia}
                    error={error}
                    animeTitle={`${t('recommendations_for')} ${selectedCharacter?.name.full}`}
                />
            }
            
            <HomeLayoutEditor open={isLayoutEditorOpen} onOpenChange={setIsLayoutEditorOpen} />
        </div>
    );
}
