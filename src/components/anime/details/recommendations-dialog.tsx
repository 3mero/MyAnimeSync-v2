'use client';

import { useState } from 'react';
import type { Anime } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimeCard } from '../anime-card';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';

interface RecommendationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBack?: () => void;
    initialRecommendations: Anime[];
    relatedMedia: Anime[];
    isLoading: boolean;
    error: string | null;
    animeTitle: string;
}

function RecommendationsGrid({ animes }: { animes: Anime[] }) {
    if (!animes || animes.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <p>No items to display in this category.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {animes.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
            ))}
        </div>
    );
}

export function RecommendationsDialog({
  open,
  onOpenChange,
  onBack,
  initialRecommendations,
  relatedMedia,
  isLoading,
  error,
  animeTitle,
}: RecommendationsDialogProps) {
  const { t } = useTranslation();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return (
      <Tabs defaultValue="related" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="related">{t('related_works')}</TabsTrigger>
          <TabsTrigger value="similar">{t('similar_recommendations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="related" className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <RecommendationsGrid animes={relatedMedia} />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="similar" className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <RecommendationsGrid animes={initialRecommendations} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
           <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-grow">
              <DialogTitle className="text-2xl">{animeTitle}</DialogTitle>
              <DialogDescription>
                  {t('anime_advisor_desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
