'use client';

import type { Reminder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Info, Clock, ExternalLink, Check } from 'lucide-react';
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

export function ReminderCard({ reminder, onEdit, onDelete, onMarkAsSeen }: { reminder: Reminder, onEdit?: () => void, onDelete?: () => void, onMarkAsSeen?: () => void }) {
    const { trackedMedia } = useAuth();
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
            <CardContent className="p-3">
                <div className="flex gap-4">
                    {reminder.mediaImage && (
                         <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                            <Image src={reminder.mediaImage} alt={reminder.mediaTitle || ''} fill className="object-cover" sizes="64px"/>
                        </div>
                    )}
                    <div className="flex-grow min-w-0">
                        <CardTitle className="text-base line-clamp-2">{reminder.title}</CardTitle>
                        
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
                            <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                <p className="line-clamp-2">{reminder.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                 <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <Button asChild variant="link" className="p-0 h-auto text-xs">
                        <Link href={detailPath}>
                           {t('details_page')} <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                     <div className="flex items-center">
                        {onMarkAsSeen && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkAsSeen}>
                                <Check className="w-4 h-4" />
                            </Button>
                        )}
                        {onEdit && animeForReminder && (
                            <ReminderDialog reminderToEdit={reminder} anime={animeForReminder}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </ReminderDialog>
                        )}
                        {onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
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
                                        <AlertDialogAction onClick={onDelete}>
                                            {t('delete')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
}
