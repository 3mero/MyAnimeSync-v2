'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { JikanGenericRecommendation } from '@/lib/types';
import { ArrowRight, MessageSquare, User, Languages, Undo2, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateTextServer } from '@/lib/translation';
import { useTranslation } from '@/hooks/use-translation';


export function LatestRecommendationCard({ rec }: { rec: JikanGenericRecommendation }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const { toast } = useToast();
    const { t, lang } = useTranslation();

    if (!rec || rec.entry.length < 2) return null;

    const [anime1, anime2] = rec.entry;
    
    const handleTranslateToggle = async () => {
        if (showTranslation) {
          setShowTranslation(false);
          return;
        }
        
        // Always expand when translating or showing translation
        if (!isExpanded) setIsExpanded(true);

        if (translatedContent) {
          setShowTranslation(true);
          return;
        }

        setIsTranslating(true);
        const result = await translateTextServer(rec.content);
        if (result) {
          setTranslatedContent(result);
          setShowTranslation(true);
        } else {
          toast({ variant: "destructive", title: t('translation_failed'), description: t('could_not_translate_recommendation') });
        }
        setIsTranslating(false);
    };

    const contentText = showTranslation && translatedContent ? translatedContent : rec.content;
    const isLongContent = rec.content.length > 150;

    const renderAnimeCard = (anime: any) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={`/anime/${anime.mal_id}`} className="group">
                    <div className="relative aspect-[2/3] w-full mb-2">
                        <Image
                            src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url || `https://picsum.photos/seed/${anime.mal_id}/400/600`}
                            alt={`Poster for ${anime.title}`}
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 768px) 40vw, 20vw"
                        />
                    </div>
                    <h3 className="font-bold text-sm text-center truncate group-hover:text-primary transition-colors">
                        {anime.title}
                    </h3>
                </Link>
            </TooltipTrigger>
            <TooltipContent className="bg-primary text-primary-foreground border-primary-foreground/20">
                <p>{anime.title}</p>
            </TooltipContent>
        </Tooltip>
    );

    return (
        <TooltipProvider>
            <Card className="w-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/20 flex flex-col">
                <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="grid grid-cols-11 gap-2 md:gap-4 items-center">
                        <div className="col-span-5 relative">
                            {renderAnimeCard(anime1)}
                        </div>
                        
                        <div className="col-span-1 flex justify-center items-center">
                            <ArrowRight className="h-6 w-6 text-primary shrink-0" />
                        </div>

                        <div className="col-span-5 relative">
                            {renderAnimeCard(anime2)}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex-grow flex flex-col">
                         <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <MessageSquare className="w-4 h-4" />
                                {t('community_reason')}
                            </h4>
                            <Button variant="outline" size="sm" onClick={handleTranslateToggle} disabled={isTranslating}>
                                {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : showTranslation ? (
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
                        
                        <div className="relative flex-grow">
                             <p dir={showTranslation ? "rtl" : "ltr"} className={cn("text-sm text-foreground/80 italic leading-relaxed", !isExpanded && "line-clamp-3", showTranslation && "rtl")}>
                                &quot;{contentText}&quot;
                            </p>
                            {!isExpanded && isLongContent && (
                                 <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent" />
                            )}
                        </div>

                        {isLongContent && (
                           <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto self-start mt-1">
                             {isExpanded ? t('show_less') : t('show_more')}
                           </Button>
                        )}
                        
                        <div className="flex-grow"></div>

                        <p className="text-xs text-right text-muted-foreground mt-2 flex items-center justify-end gap-1 pt-2 border-t">
                            <User className="w-3 h-3" />
                            {t('recommended_by')} {rec.user.username}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
