'use client';

import type { JikanPicture } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export function PicturesTab({ pictures }: { pictures: JikanPicture[] | null }) {
    const { t } = useTranslation();
    if (!pictures) return <TabLoading />;
    if (pictures.length === 0) return <div className="text-center py-8 text-muted-foreground">{t('no_pictures_found')}</div>;
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pictures.map((pic, index) => (
                <a href={pic.jpg.image_url} target="_blank" rel="noopener noreferrer" key={index}>
                    <Card className="overflow-hidden group">
                        <div className="relative aspect-video">
                            <Image src={pic.webp?.image_url || pic.jpg.image_url} alt={`Anime Picture ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-110" sizes="(max-width: 768px) 50vw, 25vw" />
                        </div>
                    </Card>
                </a>
            ))}
        </div>
    );
}
