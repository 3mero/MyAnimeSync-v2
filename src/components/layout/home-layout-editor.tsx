'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { defaultLayoutConfig } from '@/lib/config';
import type { LayoutConfigItem } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Flame, TrendingUp, BarChart, Tv, Clapperboard, Star, Calendar, Popcorn, Book, BookMarked, CalendarClock, GripVertical, Eye, EyeOff, Edit, Undo, Save, X, RotateCcw, PlusCircle } from 'lucide-react';
import { translations } from '@/lib/i18n';


const listIcons: { [key: string]: React.ElementType } = {
  latestAdditions: PlusCircle,
  airing: Tv,
  trending: Flame,
  topThisSeason: TrendingUp,
  upcoming: Calendar,
  top: Star,
  popular: BarChart,
  topMovies: Clapperboard,
  movies: Popcorn,
  releasingManga: BookMarked,
  trendingManga: Flame,
  upcomingManga: CalendarClock,
  popularManga: BarChart,
  topManga: Star,
};

function DraggableListItem({
  item,
  onDragStart,
  onDragEnter,
  onDragEnd,
  index,
  onVisibilityChange,
  onTitleChange,
  onResetTitle,
}: {
  item: LayoutConfigItem;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  index: number;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  onResetTitle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(item.customTitle || t(item.titleKey as keyof typeof translations.ar));
  const Icon = listIcons[item.id] || Star;
  const originalTitle = t(item.titleKey as keyof typeof translations.ar);

  useEffect(() => {
    setCurrentTitle(item.customTitle || t(item.titleKey as keyof typeof translations.ar));
  }, [item, t]);

  const handleTitleSave = () => {
    onTitleChange(item.id, currentTitle);
    setIsEditing(false);
  };

  const handleTitleReset = () => {
    onResetTitle(item.id);
    setCurrentTitle(originalTitle);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setCurrentTitle(item.customTitle || originalTitle);
    setIsEditing(false);
  }

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className="p-3 flex items-center gap-3 transition-shadow cursor-grab active:cursor-grabbing active:shadow-lg"
    >
      <GripVertical className="text-muted-foreground" />
      <Icon className="text-primary w-5 h-5 shrink-0" />
      <div className="flex-grow">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="h-8"
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            />
            <Button size="icon" className="h-8 w-8" onClick={handleTitleSave}><Save className="w-4 h-4" /></Button>
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={handleCancel}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <p className="font-semibold">{currentTitle}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsEditing(!isEditing)}>
        <Edit className="w-4 h-4" />
      </Button>
       {item.customTitle && !isEditing && (
         <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleTitleReset}>
            <Undo className="w-4 h-4" />
        </Button>
       )}
      <Switch
        checked={item.visible}
        onCheckedChange={(checked) => onVisibilityChange(item.id, checked)}
        aria-label={item.visible ? 'Hide section' : 'Show section'}
      />
    </Card>
  );
}


export function HomeLayoutEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { layoutConfig, updateLayoutConfig } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [internalLayout, setInternalLayout] = useState<LayoutConfigItem[]>(layoutConfig);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    // When the dialog is opened, sync its state with the global context
    if (open) {
      setInternalLayout(layoutConfig);
    }
  }, [layoutConfig, open]);

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const newLayout = [...internalLayout];
        const dragItemContent = newLayout.splice(dragItem.current, 1)[0];
        newLayout.splice(dragOverItem.current, 0, dragItemContent);
        setInternalLayout(newLayout);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleVisibilityChange = (id: string, visible: boolean) => {
    setInternalLayout(prev =>
      prev.map(item => (item.id === id ? { ...item, visible } : item))
    );
  };
  
  const handleTitleChange = (id: string, newTitle: string) => {
    setInternalLayout(prev =>
      prev.map(item => (item.id === id ? { ...item, customTitle: newTitle } : item))
    );
  };

  const handleResetTitle = (id: string) => {
     setInternalLayout(prev =>
      prev.map(item => {
        if (item.id === id) {
          const { customTitle, ...rest } = item;
          return rest;
        }
        return item;
      })
    );
  }

  const handleSaveChanges = () => {
    updateLayoutConfig(internalLayout);
    toast({ title: t('toast_layout_saved_title'), description: t('toast_layout_saved_desc') });
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    setInternalLayout(layoutConfig); // Reset to original state from context
    onOpenChange(false);
  }

  const handleResetToDefault = () => {
    setInternalLayout(defaultLayoutConfig);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعديل عرض الواجهة الرئيسية</DialogTitle>
          <DialogDescription>
            قم بسحب وإفلات الأقسام لإعادة ترتيبها. يمكنك أيضًا تعديل العناوين أو إخفاء الأقسام.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-3">
              {internalLayout.map((item, index) => (
                <DraggableListItem
                  key={item.id}
                  item={item}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  onVisibilityChange={handleVisibilityChange}
                  onTitleChange={handleTitleChange}
                  onResetTitle={handleResetTitle}
                />
              ))}
            </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw className="mr-2" />
                  {t('reset_to_default')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('reset_layout_confirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefault}>
                    {t('reset_to_default')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2" />
              حفظ التغييرات
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
