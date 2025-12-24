'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Anime } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, Save, Trash2, ChevronsDown, PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { EditLinkDialog } from './EditLinkDialog';

export function CustomLinksDialog({ anime, children, isManga }: { anime: Anime, children?: React.ReactNode, isManga?: boolean }) {
  const { listData, setCustomEpisodeLinks } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const [totalUnits, setTotalUnits] = useState<number | string>('');
  const [episodeLinks, setEpisodeLinks] = useState<Record<string, string>>({});
  const [isOngoing, setIsOngoing] = useState(false);

  const unitTypePlural = isManga ? t('chapters') : t('episodes');
  const unitTypeSingular = isManga ? t('chapter') : t('episode');
  const mediaType = isManga ? t('manga') : t('anime');
  const defaultCount = isManga ? (anime.chapters || anime.volumes) : anime.episodes;
  const maxCount = isManga || anime.type !== 'Movie' ? 5000 : 50;

  useEffect(() => {
    if (open) {
      if (listData && listData.customEpisodeLinks) {
        const currentLinkInfo = listData.customEpisodeLinks[anime.id];
        if (currentLinkInfo && currentLinkInfo.template) {
          try {
              const parsedLinks = JSON.parse(currentLinkInfo.template);
              setEpisodeLinks(parsedLinks);
              setTotalUnits(Object.keys(parsedLinks).length || defaultCount || '');
          } catch (e) {
              console.error("Failed to parse episode links JSON:", e);
              setEpisodeLinks({});
              setTotalUnits(defaultCount || '');
          }
          setIsOngoing(currentLinkInfo.ongoing || false);
        } else {
          setEpisodeLinks({});
          setIsOngoing(false);
          setTotalUnits(defaultCount || '');
        }
      }
    }
  }, [open, listData, anime, defaultCount]);

  const handleGenerateList = () => {
    const count = Number(totalUnits);
    if (isNaN(count) || count <= 0) {
      toast({ variant: 'destructive', title: t('invalid_number_title'), description: t('invalid_number_desc', { unit: unitTypePlural }) });
      return;
    }
    if (count > maxCount) {
        toast({ variant: 'destructive', title: t('limit_exceeded_title'), description: t('limit_exceeded_desc', { count: String(maxCount), unit: unitTypeSingular }) });
        return;
    }
    const newLinks: Record<string, string> = {};
    for (let i = 1; i <= count; i++) {
        newLinks[String(i)] = episodeLinks[String(i)] || '';
    }
    setEpisodeLinks(newLinks);
  };
  
  const handleUpdateLink = (episodeNumber: number, link: string) => {
    setEpisodeLinks(prev => ({...prev, [String(episodeNumber)]: link}));
  }

  const handleDeleteLink = (episodeNumber: number) => {
    setEpisodeLinks(prev => {
        const newLinks = {...prev};
        delete newLinks[String(episodeNumber)];
        return newLinks;
    });
  }

  const handleFillDown = (startEpisode: number) => {
    const startUrl = episodeLinks[String(startEpisode)];
    if (!startUrl) {
      toast({ variant: 'destructive', title: t('no_link_to_start_from_title'), description: t('no_link_to_start_from_desc', { unit: unitTypeSingular }) });
      return;
    }
    
    // Regex to find the last number in the URL
    const match = startUrl.match(/^(.*?)(\d+)([^/]*)$/);
    if (!match) {
        toast({ variant: 'destructive', title: t('cannot_find_number_in_link_title'), description: t('cannot_find_number_in_link_desc') });
        return;
    }

    const [, prefix, numStr, suffix] = match;
    const startNum = parseInt(numStr, 10);

    const newLinks = { ...episodeLinks };
    const allEpisodeNumbers = Object.keys(episodeLinks).map(Number).sort((a,b) => a-b);

    for (let i = allEpisodeNumbers.indexOf(startEpisode) + 1; i < allEpisodeNumbers.length; i++) {
        const currentEpNum = allEpisodeNumbers[i];
        const nextNum = startNum + (currentEpNum - startEpisode);
        newLinks[String(currentEpNum)] = `${prefix}${nextNum}${suffix}`;
    }

    setEpisodeLinks(newLinks);
    toast({ title: t('autofill_successful_title') });
  };


  const handleSave = () => {
    const linkInfo = { template: JSON.stringify(episodeLinks), ongoing: isOngoing };
    setCustomEpisodeLinks(anime.id, linkInfo);
    toast({ title: t('custom_links_saved_title') });
    setOpen(false);
  };
  
  const handleClear = () => {
    setCustomEpisodeLinks(anime.id, { template: '{}', ongoing: false });
    setEpisodeLinks({});
    setTotalUnits(defaultCount || '');
    toast({ title: t('custom_links_removed_title') });
  };
  
  const generatedEpisodes = Object.keys(episodeLinks).map(Number).sort((a,b) => a-b);
  
  const triggerButton = children || (
     <Button variant="outline" className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        {t('create_units', { unit_plural: unitTypePlural })}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('create_edit_unit_links_title', { unit_plural: unitTypePlural })}</DialogTitle>
          <DialogDescription>
             {t('create_edit_unit_links_desc', { unit_plural: unitTypePlural, unit_singular: unitTypeSingular })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="py-4 space-y-6">
                <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="total-episodes" className="col-span-1">{t('total_number_of_units', { unit_plural: unitTypePlural })}</Label>
                    <Input
                        id="total-episodes"
                        name="total-episodes"
                        type="number"
                        value={totalUnits}
                        onChange={(e) => setTotalUnits(e.target.value)}
                        className="col-span-1"
                        placeholder={String(defaultCount || '12')}
                    />
                    <Button onClick={handleGenerateList} className="col-span-1">{t('generate_unit_list', { unit_plural: unitTypePlural })}</Button>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch id="ongoing-switch" checked={isOngoing} onCheckedChange={setIsOngoing} />
                <Label htmlFor="ongoing-switch">{t('is_this_media_ongoing', { media_type: mediaType })}</Label>
                </div>

                {generatedEpisodes.length > 0 && (
                    <div className="space-y-2">
                        {generatedEpisodes.map(epNumber => (
                            <div key={epNumber} className="grid grid-cols-[max-content_1fr_max-content] items-center gap-2 p-2 rounded-md bg-muted/50">
                                <span className="font-bold shrink-0">{unitTypeSingular} {epNumber}</span>
                                <div className="text-xs text-muted-foreground min-w-0" dir="ltr">
                                    <p className="truncate">
                                        {episodeLinks[String(epNumber)] || t('no_link')}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 flex items-center">
                                    <EditLinkDialog 
                                        episodeNumber={epNumber}
                                        currentLink={episodeLinks[String(epNumber)] || ''}
                                        onSave={(link) => handleUpdateLink(epNumber, link)}
                                        isManga={isManga}
                                    />
                                    {episodeLinks[String(epNumber)] && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleFillDown(epNumber)}>
                                            <ChevronsDown className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteLink(epNumber)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter className="justify-between pt-4 border-t">
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">{t('cancel')}</Button>
                </DialogClose>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-destructive hover:text-destructive">{t('clear_links')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('clear_links_warning', { media_type: mediaType })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClear}>{t('clear')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t('save_changes')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
