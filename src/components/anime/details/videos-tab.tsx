'use client';

import type { JikanVideo } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlayCircle } from 'lucide-react';
import Image from 'next/image';

function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

function extractYouTubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];

    match = url.match(/\/embed\/([^?]+)/);
    if (match) return match[1];

    return null;
}

export function VideosTab({ videos, animeImage }: { videos: JikanVideo[] | null, animeImage: string }) {
    const { t } = useTranslation();
    if (!videos) return <TabLoading />;
    
    const playableVideos = videos.map(v => ({
        ...v,
        youtube_id: v.trailer?.youtube_id || extractYouTubeId(v.trailer?.embed_url)
    })).filter(v => v.youtube_id);
    
    if (playableVideos.length === 0) return <div className="text-center py-8 text-muted-foreground">{t('no_videos_found')}</div>;

    return (
         <div className="grid md:grid-cols-2 gap-6">
            {playableVideos.map((video, index) => (
                <Dialog key={`${video.title}-${index}`}>
                    <DialogTrigger asChild>
                        <Card className="overflow-hidden group cursor-pointer">
                            <div className="relative aspect-video">
                                <Image 
                                    src={video.trailer.images.maximum_image_url || video.trailer.images.large_image_url || animeImage || `https://picsum.photos/seed/${video.youtube_id || index}/1280/720`} 
                                    alt={video.title} 
                                    fill 
                                    className="object-cover transition-transform group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="w-16 h-16 text-white" />
                                    <p className="text-white font-bold text-center p-2 mt-2">{video.title}</p>
                                </div>
                            </div>
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                         <DialogHeader className="p-4">
                            <DialogTitle>{video.title}</DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    );
}
