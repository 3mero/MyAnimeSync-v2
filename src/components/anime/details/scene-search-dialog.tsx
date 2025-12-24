'use client';

import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { MouseEvent } from 'react';

export function SceneSearchDialog({ animeId, animeTitle, posterImage }: { animeId: number, animeTitle: string, posterImage: string | null }) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const lensUrl = posterImage ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(posterImage)}` : '';

    const handleSearchClick = (e: MouseEvent<HTMLAnchorElement>) => {
        if (!lensUrl) {
            e.preventDefault();
            toast({
                variant: "destructive",
                title: t('search_failed'),
                description: t('no_image'),
            });
        }
    };

    return (
        <a
            href={lensUrl || '#'}
            target={lensUrl ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={handleSearchClick}
            aria-disabled={!lensUrl}
            className={!lensUrl ? 'pointer-events-none' : ''}
        >
            <Button 
                variant="outline" 
                className="w-full flex-wrap"
                disabled={!lensUrl}
            >
                <Search className="text-blue-400" />
                {t('search_with_google_lens')}
            </Button>
        </a>
    );
}
