'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { Anime, UserNotification, NotificationsLayoutKey, GlobalActivity, Reminder, NewsNotification, ReminderNotification } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, BookOpen, Tv, ListChecks, Newspaper, Save, Undo, GripVertical, Pin, PinOff, User, RefreshCcw, Loader2, Info, AlertCircle, Network } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLogger } from '@/hooks/use-logger';
import { LogViewer } from '../logging/log-viewer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ReminderCard } from './reminder-card';


interface UpdateNotificationItemProps {
    notification: NewsNotification;
    onMarkAsSeen: (id: string) => void;
}

function UpdateNotificationItem({ notification, onMarkAsSeen }: UpdateNotificationItemProps) {
    const { t } = useTranslation();
    const link = `/${notification.isManga ? 'manga' : 'anime'}/${notification.mediaId}`;
    
    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
            <Link href={link} className="flex-shrink-0">
                <div className="relative w-16 h-24 rounded-md overflow-hidden">
                    <Image
                        src={notification.thumbnail}
                        alt={notification.title}
                        fill
                        className="object-cover"
                    />
                </div>
            </Link>
            <div className="flex-grow min-w-0">
                <Link href={link}>
                    <p className="font-semibold hover:text-primary line-clamp-2">{notification.title}</p>
                </Link>
                 <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    {notification.isManga ? <BookOpen className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                    <span>{notification.message}</span>
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0"
                onClick={() => onMarkAsSeen(notification.id)}
            >
                <Check className="w-4 h-4 md:mr-2"/>
                <span className="hidden md:inline">{notification.isManga ? t('read_verb') : t('watched_verb')}</span>
            </Button>
        </div>
    );
}

function ReminderNotificationItem({ notification, onMarkAsSeen, onEdit, onDelete }: { notification: ReminderNotification & { originalReminder?: Reminder }, onMarkAsSeen: (id: string) => void, onEdit: () => void, onDelete: () => void }) {
    if (!notification.originalReminder) return null;
    return <ReminderCard reminder={notification.originalReminder} onEdit={onEdit} onDelete={onDelete} onMarkAsSeen={() => onMarkAsSeen(notification.id)} />;
}


const TABS_CONFIG: Record<NotificationsLayoutKey, { titleKey: string; icon: React.ElementType, badgeClass: (hasErrors: boolean) => string }> = {
    updates: { titleKey: 'updates', icon: Bell, badgeClass: () => 'bg-yellow-500 text-black' },
    reminders: { titleKey: 'reminders', icon: Bell, badgeClass: () => 'bg-purple-500 text-white' },
    logs: { titleKey: 'logs', icon: ListChecks, badgeClass: (hasErrors) => hasErrors ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground' },
};


export function NotificationsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { 
        listData,
        markAllInteractionsAsRead,
        markInteractionAsRead,
        notificationsLayout, 
        updateNotificationsLayout, pinnedNotificationTab, updatePinnedNotificationTab,
        runChecks, isCheckingForUpdates,
        reminders,
        deleteReminder,
        markReminderAsSeen,
        markAllRemindersAsSeen,
    } = useAuth();
    const { logs } = useLogger();
    const { t, lang } = useTranslation();
    const { toast } = useToast();
    
    // Pinning 'updates' as default now that news is gone.
    const activePinnedTab = (['updates', 'reminders', 'logs'] as NotificationsLayoutKey[]).includes(pinnedNotificationTab) ? pinnedNotificationTab : 'updates';
    const [activeTab, setActiveTab] = useState(activePinnedTab);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingReminders, setIsEditingReminders] = useState(false);
    const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);

    const [internalLayout, setInternalLayout] = useState(notificationsLayout.filter(k => k !== 'news'));
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        if (open) {
            // Filter out 'news' from layout if it exists from a previous version
            const currentLayout = notificationsLayout.filter(k => k !== 'news');
            setInternalLayout(currentLayout);
            setActiveTab(activePinnedTab);
            setIsEditing(false);
        }
    }, [open, notificationsLayout, activePinnedTab]);

    const updateEntries = useMemo(() => {
        return (listData.notifications || [])
            .filter(n => n.type === 'news' && !n.seen)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [listData.notifications]);

    const reminderNotifications = useMemo(() => {
         return (listData.notifications || [])
            .filter((n): n is ReminderNotification => n.type === 'reminder')
            .map(n => ({
                ...n,
                originalReminder: reminders.find(r => r.id === n.reminderId)
            }))
            .filter(n => n.originalReminder)
            .sort((a, b) => {
                if (a.seen && !b.seen) return 1;
                if (!a.seen && b.seen) return -1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
    }, [listData.notifications, reminders]);

    const errorCount = useMemo(() => logs.filter(log => log.type === 'error').length, [logs]);
    const totalUpdates = updateEntries.length;
    const totalUnseenReminders = useMemo(() => reminderNotifications.filter(r => !r.seen).length, [reminderNotifications]);


    const getCountForTab = (key: NotificationsLayoutKey): number => {
        if (key === 'updates') return totalUpdates;
        if (key === 'logs') return errorCount;
        if (key === 'reminders') return totalUnseenReminders;
        return 0;
    };
    
    const handleEditReminder = (reminder: Reminder) => {
        setIsEditingReminders(true);
        setReminderToEdit(reminder);
    }
    
    const handleDeleteReminder = (reminderId: string) => {
        deleteReminder(reminderId);
        toast({ title: "Reminder Deleted" });
    }

    if (!open) return null;

    const handleDragStart = (e: React.DragEvent, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setIsEditing(true), 0);
    };

    const handleDragEnter = (e: React.DragEvent, position: number) => {
        if (dragItem.current === null || dragItem.current === position) {
            return;
        }

        const newLayout = [...internalLayout];
        const dragItemContent = newLayout[dragItem.current];
        
        if (!dragItemContent) return;

        newLayout.splice(dragItem.current, 1);
        newLayout.splice(position, 0, dragItemContent);
        
        dragItem.current = position;
        setInternalLayout(newLayout);
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleSaveLayout = () => {
        updateNotificationsLayout(internalLayout);
        setIsEditing(false);
        toast({ title: "تم حفظ الترتيب" });
    };

    const handleCancelEdit = () => {
        setInternalLayout(notificationsLayout.filter(k => k !== 'news'));
        setIsEditing(false);
    };

    const handlePinClick = (e: React.MouseEvent, key: NotificationsLayoutKey) => {
        e.stopPropagation();
        e.preventDefault();
        const config = TABS_CONFIG[key];
        if (config) {
            updatePinnedNotificationTab(key);
            toast({ title: `تم تدبيس تبويب "${t(config.titleKey as any)}"`});
        }
    }
    
    const tabsContent: Partial<Record<NotificationsLayoutKey, React.ReactNode>> = {
        updates: (
             <div className="h-full flex flex-col">
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                    {updateEntries.length > 0 ? (
                            <div className="space-y-3">
                                {updateEntries.map((notification) => (
                                    <UpdateNotificationItem
                                        key={notification.id}
                                        notification={notification as NewsNotification}
                                        onMarkAsSeen={markInteractionAsRead}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                                <Bell className="w-12 h-12 mb-4" />
                                <p className="font-semibold">{t('no_new_updates')}</p>
                                <p className="text-sm">{t('new_updates_description')}</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
                {updateEntries.length > 0 && (
                    <div className="flex-shrink-0 pt-4 border-t">
                        <Button onClick={markAllInteractionsAsRead} className="w-full">
                            {t('mark_all_as_seen')}
                        </Button>
                    </div>
                )}
            </div>
        ),
        reminders: (
             <div className="h-full flex flex-col">
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                    {reminderNotifications.length > 0 ? (
                        <div className="space-y-3">
                            {reminderNotifications.map((notif) => (
                               <div key={notif.id} className={cn(notif.seen && "opacity-50")}>
                                  <ReminderNotificationItem
                                      notification={notif}
                                      onMarkAsSeen={markReminderAsSeen}
                                      onEdit={() => notif.originalReminder && handleEditReminder(notif.originalReminder)}
                                      onDelete={() => notif.originalReminder && handleDeleteReminder(notif.originalReminder.id)}
                                  />
                               </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                            <Bell className="w-12 h-12 mb-4" />
                            <p className="font-semibold">لا توجد تنبيهات مستحقة</p>
                            <p className="text-sm">سيتم عرض التنبيهات هنا عندما يحين وقتها.</p>
                        </div>
                    )}
                    </ScrollArea>
                </div>
                <div className="flex-shrink-0 pt-4 border-t space-y-2">
                    {totalUnseenReminders > 0 && (
                        <Button onClick={markAllRemindersAsSeen} className="w-full">
                            وضع علامة على الكل كمقروء
                        </Button>
                    )}
                </div>
            </div>
        ),
        logs: <LogViewer />
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col" dir={lang}>
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="flex items-center gap-2">
                            <Bell />
                            {t('notifications_and_updates')}
                        </DialogTitle>
                         <Button size="icon" variant="ghost" onClick={runChecks} disabled={isCheckingForUpdates}>
                            {isCheckingForUpdates ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCcw className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                    <DialogDescription>
                        {t('notifications_description')}
                    </DialogDescription>
                </DialogHeader>

                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col overflow-hidden" dir="ltr">
                    <div className="relative">
                        
                        {isEditing && (
                            <div className="absolute top-0 right-0 flex gap-2 z-10">
                                <Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={handleSaveLayout}><Save className="w-4 h-4" /></Button>
                                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={handleCancelEdit}><Undo className="w-4 h-4"/></Button>
                            </div>
                        )}
                    </div>
                    <TabsList className="grid w-full grid-cols-3">
                        {internalLayout.map((key, index) => {
                             const config = TABS_CONFIG[key];
                             if (!config) return null;
                             const count = getCountForTab(key);
                             const isPinned = key === pinnedNotificationTab;
                             return (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => { e.preventDefault(); handleDragEnter(e, index); }}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "flex items-center gap-2 transition-all duration-300 relative pr-8",
                                        isEditing && "cursor-grab active:cursor-grabbing",
                                        key === 'logs' && errorCount > 0 && "text-red-500"
                                    )}
                                >
                                   {isEditing && <GripVertical className="w-4 h-4 text-muted-foreground" />}
                                   <config.icon className="w-4 h-4" />
                                   {t(config.titleKey as any)}
                                   {count > 0 && <Badge className={cn("ml-2", config.badgeClass(key === 'logs' && errorCount > 0))}>{count}</Badge>}
                                    <div
                                        role="button"
                                        aria-label={`Pin ${config.titleKey} tab`}
                                        onClick={(e) => handlePinClick(e, key)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-accent"
                                    >
                                       {isPinned ? <Pin className="w-4 h-4 text-primary"/> : <PinOff className="w-4 h-4 text-muted-foreground/50"/>}
                                    </div>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                    
                    {internalLayout.map(key => (
                         <TabsContent key={key} value={key} className="flex-grow overflow-hidden mt-4" dir={lang}>
                           {tabsContent[key]}
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
