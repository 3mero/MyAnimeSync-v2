'use client';

import { useState } from 'react';
import type { JikanReview } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { translateTextServer } from '@/lib/translation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Star, ThumbsUp, ThumbsDown, Languages, Undo2, Loader2 } from 'lucide-react';

function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

function cleanReviewText(text: string) {
    if (!text) return '';
    return text
        .replace(/~|___/g, '')
        .replace(/#+\s*.*/g, '')
        .replace(/img\d+\(https?:\/\/[^\s)]+\)/g, '')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<hr\s*\/?>/gi, '\n---\n')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();
}

function ReviewCard({ review }: { review: JikanReview }) {
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedReview, setTranslatedReview] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const cleanText = cleanReviewText(review.review);

  const handleTranslateToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (!isExpanded) {
        setIsExpanded(true);
    }
    
    if (translatedReview) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    const result = await translateTextServer(cleanText);
    if (result) {
      setTranslatedReview(result);
      setShowTranslation(true);
    } else {
        toast({ variant: "destructive", title: "Translation Failed", description: "Could not translate the review." });
    }
    setIsTranslating(false);
  };

  const reviewText = showTranslation && translatedReview ? translatedReview : cleanText;

  return (
    <Card>
        <CardHeader>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Image src={review.user.images.webp.image_url} alt={review.user.username} width={40} height={40} className="rounded-full" />
                    <div>
                        <a href={review.user.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">{review.user.username}</a>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.date), 'dd MMM yyyy')}</p>
                    </div>
                </div>
                 <div className={cn("text-right space-y-2", lang === 'ar' ? 'text-left' : 'text-right')}>
                    <Badge variant={review.score > 6 ? "default" : review.score > 3 ? "secondary" : "destructive"} className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {review.score}/10
                    </Badge>
                     <Button size="sm" variant="outline" onClick={handleTranslateToggle} disabled={isTranslating}>
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
            </div>
        </CardHeader>
        <CardContent>
            <div className="relative">
                <p className={cn("text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed", !isExpanded && "line-clamp-6", lang === 'ar' && showTranslation && 'rtl')}>
                    {reviewText}
                </p>
                {cleanText.length > 300 && !isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card to-transparent" />
                )}
            </div>
            {cleanText.length > 300 && (
                <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto mt-2">
                    {isExpanded ? t('show_less') : t('show_more')}
                </Button>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {review.reactions.nice}</div>
                <div className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> {review.reactions.confusing}</div>
                {review.is_spoiler && <Badge variant="destructive">{t('spoiler')}</Badge>}
            </div>
        </CardContent>
    </Card>
  );
}

export function ReviewsTab({ reviews }: { reviews: JikanReview[] | null }) {
    const [showAll, setShowAll] = useState(false);
    const { t } = useTranslation();

    if (!reviews) return <TabLoading />;
    if (reviews.length === 0) return <div className="text-center py-8 text-muted-foreground">{t('no_reviews_found')}</div>;
    
    const displayedReviews = showAll ? reviews : reviews.slice(0, 10);

    return (
        <div className="space-y-6">
            {displayedReviews.map(review => (
                <ReviewCard key={review.mal_id} review={review} />
            ))}
            {!showAll && reviews.length > 10 && (
                <div className="text-center pt-4">
                    <Button onClick={() => setShowAll(true)} variant="secondary">
                        {t('show_more_reviews', { count: reviews.length - 10 })}
                    </Button>
                </div>
            )}
        </div>
    );
}
