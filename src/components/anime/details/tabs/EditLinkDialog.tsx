'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function EditLinkDialog({
  episodeNumber,
  currentLink,
  onSave,
  isManga,
}: {
  episodeNumber: number;
  currentLink: string;
  onSave: (link: string) => void;
  isManga?: boolean;
}) {
  const { t } = useTranslation();
  const [link, setLink] = useState(currentLink);
  const [isOpen, setIsOpen] = useState(false);

  const unitText = isManga ? t('chapter') : t('episode');

  useEffect(() => {
    if (isOpen) {
        setLink(currentLink);
    }
  }, [isOpen, currentLink])

  const handleSave = () => {
    onSave(link);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="w-4 h-4" />
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{t('edit_link_for_unit', { unit_singular: unitText, number: String(episodeNumber) })}</DialogTitle>
                <DialogDescription>
                    {t('enter_full_link_for_unit', { unit_singular: unitText })}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input
                    id={`link-input-${episodeNumber}`}
                    name={`link-input-${episodeNumber}`}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com/manga/chapter/1"
                    dir="ltr"
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        {t('cancel')}
                    </Button>
                </DialogClose>
                 <Button type="button" onClick={handleSave}>
                    {t('save_link')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
