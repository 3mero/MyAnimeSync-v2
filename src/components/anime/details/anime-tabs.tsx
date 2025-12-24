'use client';

import { useState, useCallback } from 'react';
import type { Anime, JikanCharacter, JikanNewsArticle, JikanPicture, JikanReview, JikanStaff, JikanVideo } from '@/lib/types';
import { getAnimeStaff, getAnimeReviews, getAnimePictures, getAnimeVideos, getAnimeCharacters } from '@/lib/anilist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, ListVideo, Users, Film, Camera, Tv, UserCog, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useLogger } from '@/hooks/use-logger';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AnimeSynopsis } from './anime-synopsis';
import { EpisodesTab } from './tabs/EpisodesTab';
import { CharactersTab } from './tabs/CharactersTab';
import { TrailerTab } from './tabs/TrailerTab';
import { PicturesTab } from './tabs/PicturesTab';
import { VideosTab } from './tabs/VideosTab';
import { StaffTab } from './tabs/StaffTab';
import { ReviewsTab } from './tabs/ReviewsTab';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';


function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export function AnimeTabs({ anime }: { anime: Anime }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addLog } = useLogger();
  const { listData, toggleEpisodeWatched } = useAuth(); // Get listData and the function here

  const [activeTab, setActiveTab] = useState('synopsis');
  
  const [characterData, setCharacterData] = useState<{data: JikanCharacter[] | null, isLoading: boolean, error: string | null}>({ data: null, isLoading: false, error: null });

  const [additionalData, setAdditionalData] = useState({
      pictures: null as JikanPicture[] | null,
      videos: null as JikanVideo[] | null,
      staff: null as JikanStaff[] | null,
      reviews: null as JikanReview[] | null,
  });

  const handleTabChange = useCallback(async (tab: string) => {
      setActiveTab(tab);
      const anilistId = anime.id;
      const malId = anime.mal_id;
      if (!anilistId) return;
      
      addLog(`Changing to tab: ${tab} for anime ${anilistId}`);

      if (tab === 'characters') {
          if (characterData.data !== null) return;
          if (!malId) {
              setCharacterData({ data: [], isLoading: false, error: "MyAnimeList ID not found for this anime, cannot fetch characters." });
              return;
          }
          setCharacterData(prev => ({ ...prev, isLoading: true, error: null }));
          try {
            const data = await getAnimeCharacters(malId, addLog);
            setCharacterData({ data: data, isLoading: false, error: null });
          } catch(e: any) {
             setCharacterData({ data: [], isLoading: false, error: e.message || "Failed to load character data." });
          }
          return;
      }
      
      const handledTabs = ['synopsis', 'episodes', 'trailer'];
      if (handledTabs.includes(tab)) return;
      
      type AdditionalDataKey = keyof typeof additionalData;
      const key = tab as AdditionalDataKey;
      
      if (additionalData[key] !== null) {
          addLog(`Tab data for "${key}" already loaded.`);
          return;
      }
      
      addLog(`Fetching data for tab: "${key}"`);
      try {
        let data;
        switch(key) {
            case 'pictures': data = await getAnimePictures(anilistId, addLog); break;
            case 'videos': data = await getAnimeVideos(anilistId, addLog); break;
            case 'staff': data = await getAnimeStaff(anilistId, addLog); break;
            case 'reviews': data = await getAnimeReviews(anilistId, addLog); break;
        }
        setAdditionalData(prev => ({...prev, [key]: data || [] }));
        addLog(`Successfully fetched data for tab: "${key}"`);
      } catch (error: any) {
          addLog(`Failed to fetch data for tab: "${key}". Error: ${error}`, 'error');
          console.warn(`Failed to fetch ${key} for anime ${anilistId}:`, error);
          setAdditionalData(prev => ({...prev, [key]: [] as any }));
          toast({
              variant: 'destructive',
              title: t('toast_fetch_failed_title', { context: key }),
              description: t('toast_fetch_failed_desc', { context: key })
          });
      }
  }, [anime.id, anime.mal_id, additionalData, characterData, toast, addLog, t]);
  
  const TABS = [
      { value: 'synopsis', label: t('synopsis'), icon: Info, condition: true },
      { value: 'episodes', label: t('episodes'), icon: ListVideo, condition: true },
      { value: 'characters', label: t('characters'), icon: Users, condition: true },
      { value: 'trailer', label: t('trailer'), icon: Film, condition: !!anime.trailer?.youtube_id },
      { value: 'pictures', label: t('pictures'), icon: Camera, condition: true },
      { value: 'videos', label: t('videos'), icon: Tv, condition: true },
      { value: 'staff', label: t('staff'), icon: UserCog, condition: true },
      { value: 'reviews', label: t('reviews'), icon: MessageSquare, condition: true },
  ];
  
  const availableTabs = TABS.filter(tab => tab.condition);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 md:grid-cols-8 overflow-x-auto">
        {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="synopsis" className="py-4">
          <AnimeSynopsis synopsis={anime.synopsis} />
      </TabsContent>
      <TabsContent value="episodes" className="py-4">
          <EpisodesTab 
            anime={anime} 
            listData={listData} 
            toggleEpisodeWatched={toggleEpisodeWatched}
          />
      </TabsContent>
      <TabsContent value="characters" className="py-4">
          <CharactersTab characters={characterData.data} isLoading={characterData.isLoading} error={characterData.error} />
      </TabsContent>
      <TabsContent value="trailer" className="py-4">
          <TrailerTab trailerId={anime.trailer?.youtube_id} />
      </TabsContent>
      <TabsContent value="pictures" className="py-4">
        <PicturesTab pictures={additionalData.pictures} />
      </TabsContent>
      <TabsContent value="videos" className="py-4">
        <VideosTab videos={additionalData.videos} animeImage={anime.images.webp.large_image_url} />
      </TabsContent>
      <TabsContent value="staff" className="py-4">
        <StaffTab staff={additionalData.staff} />
      </TabsContent>
      <TabsContent value="reviews" className="py-4">
        <ReviewsTab reviews={additionalData.reviews} />
      </TabsContent>
    </Tabs>
  );
}
