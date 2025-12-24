'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Anime, Reminder } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReminderCard } from './reminder-card';


import { Bell, Calendar as CalendarIcon, Plus, MoreHorizontal, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '../ui/scroll-area';


type ViewMode = 'list' | 'form';

interface ReminderFormProps {
    reminderToEdit?: Reminder | null;
    anime: Anime;
    onSave: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'mediaTitle' | 'mediaImage' | 'mediaType'>, id?: string) => void;
    onCancel: () => void;
}

function ReminderForm({ reminderToEdit, anime, onSave, onCancel }: ReminderFormProps) {
    const { t, lang } = useTranslation();
    const { trackedMedia } = useAuth();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [dateString, setDateString] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState('20:00');
    const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(new Set());
    const [autoStop, setAutoStop] = useState(false);

    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const currentMedia = reminderToEdit 
      ? trackedMedia.find(m => m.id === reminderToEdit.mediaId) || anime
      : anime;

    const totalUnits = currentMedia ? (currentMedia.type === 'MANGA' || currentMedia.type === 'NOVEL' ? (currentMedia.chapters || currentMedia.volumes) : currentMedia.episodes) : null;
    const canAutoStop = totalUnits !== null && totalUnits > 0;
    
    useEffect(() => {
        if (reminderToEdit) {
            setTitle(reminderToEdit.title);
            setNotes(reminderToEdit.notes);
            const start = new Date(reminderToEdit.startDateTime);
            setDate(start);
            setDateString(format(start, 'yyyy-MM-dd'));
            setTime(format(start, 'HH:mm'));
            setSelectedWeekDays(new Set(reminderToEdit.repeatOnDays || []));
            setAutoStop(reminderToEdit.autoStopOnCompletion || false);
        } else {
            setTitle(`${t('watch_episode_of')} ${anime.title}`);
            setNotes('');
            const today = new Date();
            setDate(today);
            setDateString(format(today, 'yyyy-MM-dd'));
            setTime('20:00');
            setSelectedWeekDays(new Set());
            setAutoStop(false);
        }
    }, [reminderToEdit, anime, t]);
    
    const handleDayToggle = (dayIndex: number) => {
        setSelectedWeekDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayIndex)) {
                newSet.delete(dayIndex);
            } else {
                newSet.add(dayIndex);
            }
            return newSet;
        });
    };
    
    const handleDateStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateString = e.target.value;
        setDateString(newDateString);
        try {
            const parsedDate = parseISO(newDateString);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
            }
        } catch (error) {
            // Ignore invalid date strings for now
        }
    };

    const handleSaveClick = () => {
         if (!title) {
            toast({ variant: 'destructive', title: t('title_is_required') });
            return;
        }
        if (!dateString) {
            toast({ variant: 'destructive', title: t('date_is_required') });
            return;
        }
        const [hours, minutes] = time.split(':').map(Number);
        const finalDate = new Date(dateString);
        finalDate.setHours(hours, minutes, 0, 0);

        if (isNaN(finalDate.getTime())) {
            toast({ variant: 'destructive', title: "Invalid Date", description: "Please enter a valid date in YYYY-MM-DD format." });
            return;
        }

        const reminderData: Omit<Reminder, 'id' | 'createdAt' | 'mediaTitle' | 'mediaImage' | 'mediaType'> = {
            mediaId: reminderToEdit?.mediaId || anime.id,
            title,
            notes,
            startDateTime: finalDate.toISOString(),
            repeatIntervalDays: 0,
            repeatOnDays: Array.from(selectedWeekDays),
            autoStopOnCompletion: canAutoStop && autoStop,
        };
        onSave(reminderData, reminderToEdit?.id);
    };

    return (
         <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
             <div className="space-y-1">
                <Label htmlFor="reminder-title">{t('title')}</Label>
                <Input id="reminder-title" name="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="reminder-notes">{t('notes')}</Label>
                <Textarea id="reminder-notes" name="reminder-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="reminder-date">{t('start_date')}</Label>
                     <Input type="date" id="reminder-date" name="reminder-date" value={dateString} onChange={handleDateStringChange} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="reminder-time">{t('time')}</Label>
                    <Input id="reminder-time" name="reminder-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>{t('or_repeat_weekly_on')}</Label>
                 <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                    {weekDays.map((day, index) => (
                        <Button
                            key={day}
                            variant={selectedWeekDays.has(index) ? "secondary" : "outline"}
                            className={cn("h-auto py-2 flex flex-col", selectedWeekDays.has(index) && "border-primary")}
                            onClick={() => handleDayToggle(index)}
                        >
                            <span className="text-xs">{t(day as any)}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {canAutoStop && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                    <Switch id="autostop-switch" checked={autoStop} onCheckedChange={setAutoStop} />
                    <Label htmlFor="autostop-switch">{t('auto_stop_reminder_on_completion')}</Label>
                </div>
            )}
             <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={handleSaveClick}>{t('save_reminder')}</Button>
            </div>
        </div>
    );
}

interface ReminderDialogProps {
  anime?: Anime;
  children: React.ReactNode;
  reminderToEdit?: Reminder | null;
}

export function ReminderDialog({ anime, children, reminderToEdit: initialReminderToEdit }: ReminderDialogProps) {
    const { addReminder, updateReminder, deleteReminder, reminders, trackedMedia } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<ViewMode>('list');
    const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);

    const activeMedia = useMemo(() => {
        if (view === 'form' && reminderToEdit) {
            return trackedMedia.find(m => m.id === reminderToEdit.mediaId) || anime;
        }
        return anime;
    }, [anime, reminderToEdit, view, trackedMedia]);
    
    const mediaReminders = useMemo(() => {
        if (!activeMedia) return [];
        return reminders.filter(r => r.mediaId === activeMedia.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [reminders, activeMedia]);
    
    useEffect(() => {
        if (open) {
            if (initialReminderToEdit) {
                setReminderToEdit(initialReminderToEdit);
                setView('form');
            } else {
                setView('list');
                setReminderToEdit(null);
            }
        }
    }, [open, initialReminderToEdit]);

    const handleSave = (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'mediaTitle' | 'mediaImage' | 'mediaType'>, id?: string) => {
        if (!activeMedia) return;
        if (!reminderData.title) {
            toast({ variant: 'destructive', title: t('title_is_required') });
            return;
        }
        if (!reminderData.startDateTime) {
            toast({ variant: 'destructive', title: t('date_is_required') });
            return;
        }

        if (id) {
            updateReminder(id, reminderData);
            toast({ title: t('reminder_updated') });
        } else {
            addReminder(reminderData, activeMedia);
            toast({ title: t('reminder_added') });
        }
        setView('list');
        setReminderToEdit(null);
    };
    
    const handleEdit = (reminder: Reminder) => {
        setReminderToEdit(reminder);
        setView('form');
    }
    
    const handleAddNew = () => {
        setReminderToEdit(null);
        setView('form');
    }

    if (!activeMedia) {
        return <div onClick={() => toast({variant: "destructive", title: "Error", description: "Cannot manage reminders without media context."})}>{children}</div>
    }

    const mediaTitle = activeMedia.title || '';
    const isTitleLong = mediaTitle.length > 20;
    const truncatedTitle = isTitleLong ? `${mediaTitle.substring(0, 20)}...` : mediaTitle;


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-1">
                         {view === 'form' && (
                            <Button variant="ghost" size="icon" onClick={() => setView('list')} className="mr-2">
                                <ArrowLeft className="w-5 h-5"/>
                            </Button>
                        )}
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="text-primary" />
                            {view === 'list' ? t('manage_reminders') : (reminderToEdit ? t('edit_reminder') : t('add_new_reminder'))}
                        </DialogTitle>
                    </div>
                     <div className="flex items-center gap-2 pl-10">
                        <DialogDescription className="truncate">
                           {t('reminder_for_anime')}
                        </DialogDescription>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <span className="font-semibold cursor-default text-sm text-muted-foreground truncate">{truncatedTitle}</span>
                                </TooltipTrigger>
                                {isTitleLong && (
                                     <TooltipContent>
                                        <p>{mediaTitle}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </DialogHeader>

                {view === 'list' ? (
                     <div className="py-4 space-y-3 max-h-[60vh] overflow-y-hidden flex flex-col">
                        <ScrollArea className="flex-grow pr-4">
                            <div className="space-y-3">
                                {mediaReminders.length > 0 ? (
                                    mediaReminders.map(r => (
                                        <ReminderCard 
                                            key={r.id} 
                                            reminder={r}
                                            onEdit={() => handleEdit(r)}
                                            onDelete={() => deleteReminder(r.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-16 text-muted-foreground">
                                        <p>{t('no_reminders_yet')}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-4 border-t">
                            <Button className="w-full" onClick={handleAddNew}>
                                <Plus className="mr-2"/> {t('add_new_reminder')}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <ReminderForm 
                        anime={activeMedia}
                        reminderToEdit={reminderToEdit}
                        onSave={handleSave}
                        onCancel={() => setView('list')}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
