'use client';

import type { Reminder, Anime } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Info, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { format, nextDay, addDays, isPast, isToday, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';
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
} from "@/components/ui/alert-dialog";
import { ReminderDialog } from '@/components/notifications/reminder-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

export function ScheduleCard({ reminder }: { reminder: Reminder }) {
    const { deleteReminder, trackedMedia } = useAuth();
    const { t, lang } = useTranslation();

    const animeForReminder = useMemo(() => {
        return trackedMedia.find(m => m.id === reminder.mediaId);
    }, [trackedMedia, reminder.mediaId]);

    const getNextOccurrence = (reminder: Reminder): Date => {
        const now = new Date();
        const startDate = new Date(reminder.startDateTime);
        const timePart = { hours: startDate.getHours(), minutes: startDate.getMinutes(), seconds: 0, milliseconds: 0 };
        
        if (reminder.repeatOnDays && reminder.repeatOnDays.length > 0) {
            const sortedRepeatDays = [...reminder.repeatOnDays].sort((a,b) => a-b);
            
            for (const day of sortedRepeatDays) {
                let nextOccurrence = nextDay(now, day as any);
                nextOccurrence.setHours(timePart.hours, timePart.minutes, timePart.seconds, timePart.milliseconds);

                if (!isPast(nextOccurrence)) {
                    return nextOccurrence;
                }
            }
            let nextOccurrence = nextDay(now, sortedRepeatDays[0] as any);
            nextOccurrence = addDays(nextOccurrence, 7);
            nextOccurrence.setHours(timePart.hours, timePart.minutes, timePart.seconds, timePart.milliseconds);
            return nextOccurrence;
        }
        
        return startDate;
    };
    
    const nextOccurrence = getNextOccurrence(reminder);
    const isForToday = isToday(nextOccurrence);
    const daysRemaining = differenceInDays(nextOccurrence, new Date());
    const reminderTime = format(new Date(reminder.startDateTime), 'p', { locale: lang === 'ar' ? ar : undefined });

    const detailPath = `/${reminder.mediaType?.toLowerCase() || 'anime'}/${reminder.mediaId}`;

    return (
        <Card className="relative overflow-hidden group">
            <CardHeader className="p-0">
                <div className="relative aspect-[16/9] w-full">
                    {reminder.mediaImage ? (
                        <Image src={reminder.mediaImage} alt={reminder.mediaTitle || ''} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Info className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40" />

                    <div className="absolute top-2 right-2">
                        {animeForReminder && (
                            <ReminderDialog reminderToEdit={reminder} anime={animeForReminder}>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </ReminderDialog>
                        )}
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full bg-black/60 hover:bg-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('delete_reminder_confirm')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteReminder(reminder.id)}>
                                        {t('delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3">
                <CardTitle className="text-base line-clamp-1">{reminder.title}</CardTitle>
                
                 {isForToday ? (
                     <div className="flex items-center gap-2 text-sm text-green-500 font-semibold mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{t('today_at', { time: reminderTime })}</span>
                    </div>
                 ) : (
                     <div className="flex items-center gap-2 text-sm text-primary font-semibold mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{t('days_left', { count: String(daysRemaining + 1) })}</span>
                    </div>
                 )}

                {reminder.notes && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5 p-2 bg-muted/50 rounded-md">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <p className="line-clamp-2">{reminder.notes}</p>
                    </div>
                )}

                 <Button asChild variant="link" className="w-full justify-center mt-2 p-0 h-auto">
                    <Link href={detailPath}>
                       {t('details_page')} <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
