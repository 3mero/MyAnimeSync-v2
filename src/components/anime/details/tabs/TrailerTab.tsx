'use client';

import { useTranslation } from '@/hooks/use-translation';

export function TrailerTab({ trailerId }: { trailerId: string | null | undefined }) {
  const { t } = useTranslation();
  
  if (trailerId) {
    return (
      <div>
        <div className="aspect-video">
          <iframe 
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${trailerId}`}
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }
  
  return <div className="text-center py-8 text-muted-foreground">{t('no_trailer_available')}</div>;
}
