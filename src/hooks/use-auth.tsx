'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { get, set, clear } from '@/lib/idb-keyval';
import { useToast } from '@/hooks/use-toast';
import { useLogger } from '@/hooks/use-logger';
import { defaultLayoutConfig, SENSITIVE_GENRES } from '@/lib/config';
import type { ListData, LayoutConfigItem, Anime, LocalProfile, AuthMode, NotificationsLayoutKey, SharedDataConfig, Reminder, UserNotification, NewsNotification, ReminderNotification, StorageNotification } from './auth/types';
import { getLatestMediaCounts, getMultipleAnimeFromAniList } from '@/lib/anilist/requests';
import { v4 as uuidv4 } from 'uuid';
import { isPast } from 'date-fns';

export type { LayoutConfigItem, CustomEpisodeLinks, WatchedEpisodes, ExcludedItems, UserNotification, Comment, NotificationsLayoutKey, GlobalActivity, Reminder, ListData } from './auth/types';

// Constants
export const IDB_PROFILE_KEY = 'animesync_local_profile';
export const IDB_LIST_DATA_KEY = 'animesync_local_list_data';
export const IDB_LAYOUT_CONFIG_KEY = 'animesync_layout_config';
export const IDB_TRACKED_MEDIA_KEY = 'animesync_tracked_media';
export const IDB_SHARED_DATA_KEY = 'animesync_shared_data_config';
const UPDATE_INTERVAL = 3 * 60 * 1000;
const INITIAL_CHECK_DELAY = 10 * 1000;
const DEFAULT_STORAGE_QUOTA = 1 * 1024 * 1024 * 1024; // 1 GB

// Initial State
const initialListData: ListData = {
    planToWatch: [],
    currentlyWatching: [],
    watchedEpisodes: {},
    planToRead: [],
    currentlyReading: [],
    readChapters: {},
    customEpisodeLinks: {},
    comments: {},
    notifications: [],
    notificationsLayout: ['updates', 'reminders', 'logs'],
    pinnedNotificationTab: 'updates',
    excludedItems: {},
    readActivityIds: [],
    reminders: [],
    hiddenGenres: SENSITIVE_GENRES,
    sensitiveContentUnlocked: false,
    storageQuota: DEFAULT_STORAGE_QUOTA,
};

// Context
export type AuthContextType = ReturnType<typeof useAuthCore>;
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Main Hook
function useAuthCore() {
    const { addLog } = useLogger();
    const { toast } = useToast();

    // STATE MANAGEMENT
    const [authMode, setAuthMode] = useState<AuthMode>('none');
    const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackedMedia, setTrackedMedia] = useState<Anime[]>([]);
    const [listData, setListData] = useState<ListData>(initialListData);
    const [updates, setUpdates] = useState<any>(null);
    const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
    const [showDebugLogs, setDebugLogs] = useState(false);
    const [sharedDataConfig, setSharedDataConfig] = useState<SharedDataConfig>({ url: null, lastSync: null, lastSize: null, lastEtag: null });
    const [isSyncing, setIsSyncing] = useState(false);

    // --- AUTH STATE LOGIC ---
    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            try {
                const profile = await get<LocalProfile>(IDB_PROFILE_KEY);
                if (profile) {
                    setAuthMode('local');
                    setLocalProfile(profile);
                } else {
                    setAuthMode('none');
                }
            } catch (error) {
                addLog('Error reading profile from IndexedDB.', 'error', error);
                setAuthMode('none');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [addLog]);

    const signInLocally = useCallback(async (username: string) => {
        if (!username.trim()) return;
        const newProfile: LocalProfile = { username, avatar_url: `https://avatar.vercel.sh/${username}.svg` };
        await set(IDB_PROFILE_KEY, newProfile);
        setLocalProfile(newProfile);
        setAuthMode('local');
        toast({ title: `Welcome, ${username}!` });
    }, [toast]);

    const signOut = useCallback(async () => {
        setAuthMode('none');
        setLocalProfile(null);
        await clear();
        toast({ title: "You have been signed out." });
        window.location.href = '/';
    }, [toast]);

    const updateLocalProfile = useCallback(async (newProfileData: Partial<LocalProfile>) => {
        if (!localProfile) return;
        const updatedProfile = { ...localProfile, ...newProfileData };
        setLocalProfile(updatedProfile);
        await set(IDB_PROFILE_KEY, updatedProfile);
    }, [localProfile]);
    
    // --- STORAGE QUOTA LOGIC ---
    const checkStorageAndNotify = useCallback(async (updatedData: ListData) => {
        if (!navigator.storage || !navigator.storage.estimate) {
            return true; // Cannot check, so we allow the write.
        }

        const quota = updatedData.storageQuota || DEFAULT_STORAGE_QUOTA;
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;

        if (usage > quota) {
            toast({
                variant: 'destructive',
                title: "Storage Limit Reached",
                description: "New data cannot be saved. Please increase storage quota in settings.",
            });
            const storageNotification: StorageNotification = {
                id: `storage-warning-${Date.now()}`,
                type: 'storage',
                title: "Storage Limit Reached",
                message: "Increase your storage quota in settings to save new data.",
                timestamp: new Date().toISOString(),
                seen: false,
            };
            // Try to save just the notification, but it might fail too if we are really out of space.
            const notifications = [...(updatedData.notifications || []), storageNotification];
            set(IDB_LIST_DATA_KEY, { ...updatedData, notifications });
            return false;
        }
        return true;
    }, [toast]);


    // --- LIST DATA LOGIC ---
    const updateAndPersistListData = useCallback((getNewData: (currentData: ListData) => Partial<ListData> | ListData) => {
        setListData(currentData => {
            const newData = getNewData(currentData);
            const updatedData = { ...currentData, ...newData };
            
            checkStorageAndNotify(updatedData).then(canWrite => {
                if (canWrite) {
                    set(IDB_LIST_DATA_KEY, updatedData);
                } else {
                    addLog('Write operation blocked due to storage quota.', 'warn');
                }
            });

            return updatedData;
        });
    }, [addLog, checkStorageAndNotify]);


    useEffect(() => {
        async function loadListData() {
            if (authMode !== 'local') {
                setListData(initialListData);
                return;
            }
            try {
                let loaded = await get<ListData>(IDB_LIST_DATA_KEY);
                if (!loaded) {
                    loaded = initialListData;
                } else {
                    loaded.hiddenGenres = loaded.hiddenGenres === undefined ? SENSITIVE_GENRES : loaded.hiddenGenres;
                    loaded.notificationsLayout = loaded.notificationsLayout?.filter(k => k !== 'news') || ['updates', 'reminders', 'logs'];
                    if(loaded.pinnedNotificationTab === 'news') loaded.pinnedNotificationTab = 'updates';
                    loaded.storageQuota = loaded.storageQuota || DEFAULT_STORAGE_QUOTA;
                }
                setListData(loaded);
            } catch (error) {
                setListData(initialListData);
            }
        }
        loadListData();
    }, [authMode]);

    const handleToggleListMembership = useCallback((media: Anime, listName: 'planToWatch' | 'currentlyWatching' | 'planToRead' | 'currentlyReading') => {
        const { synopsis, ...mediaWithoutSynopsis } = media;

        updateAndPersistListData(currentData => {
            const list = (currentData as any)[listName] as number[] || [];
            const newIsInList = list.includes(media.id);
            const newList = newIsInList ? list.filter(id => id !== media.id) : [...list, media.id];
            return { [listName]: newList };
        });

        setTimeout(async () => {
            const currentTracked = await get<Anime[]>(IDB_TRACKED_MEDIA_KEY) || [];
            const freshListData = await get<ListData>(IDB_LIST_DATA_KEY) || initialListData;
            const isInAnyList = ['planToWatch', 'currentlyWatching', 'planToRead', 'currentlyReading'].some(list => (freshListData[list as keyof ListData] as number[])?.includes(media.id));

            if (isInAnyList) {
                if (!currentTracked.some(item => item.id === media.id)) {
                    const newTracked = [...currentTracked, mediaWithoutSynopsis];
                    await set(IDB_TRACKED_MEDIA_KEY, newTracked);
                    setTrackedMedia(newTracked);
                }
            } else {
                const newTracked = currentTracked.filter(item => item.id !== media.id);
                await set(IDB_TRACKED_MEDIA_KEY, newTracked);
                setTrackedMedia(newTracked);
            }
        }, 100);
    }, [updateAndPersistListData]);
    
    const isPlannedToWatch = (id: number) => listData.planToWatch?.includes(id) || false;
    const isCurrentlyWatching = (id: number) => listData.currentlyWatching?.includes(id) || false;
    const isPlannedToRead = (id: number) => listData.planToRead?.includes(id) || false;
    const isCurrentlyReading = (id: number) => listData.currentlyReading?.includes(id) || false;

    const togglePlanToWatch = (anime: Anime) => handleToggleListMembership(anime, 'planToWatch');
    const togglePlanToRead = (manga: Anime) => handleToggleListMembership(manga, 'planToRead');

    const toggleCurrentlyWatching = (anime: Anime) => {
        const { synopsis, ...animeWithoutSynopsis } = anime;

        updateAndPersistListData(d => ({
            planToWatch: d.planToWatch?.filter(id => id !== anime.id) || [],
            currentlyWatching: d.currentlyWatching?.includes(anime.id)
                ? d.currentlyWatching.filter(id => id !== anime.id)
                : [...(d.currentlyWatching || []), anime.id]
        }));
         setTimeout(async () => {
            const currentTracked = await get<Anime[]>(IDB_TRACKED_MEDIA_KEY) || [];
            if (!currentTracked.some(item => item.id === anime.id)) {
                const newTracked = [...currentTracked, animeWithoutSynopsis];
                await set(IDB_TRACKED_MEDIA_KEY, newTracked);
                setTrackedMedia(newTracked);
            }
        }, 100);
    };

    const toggleCurrentlyReading = (manga: Anime) => {
        const { synopsis, ...mangaWithoutSynopsis } = manga;

        updateAndPersistListData(d => ({
            planToRead: d.planToRead?.filter(id => id !== manga.id) || [],
            currentlyReading: d.currentlyReading?.includes(manga.id)
                ? d.currentlyReading.filter(id => id !== manga.id)
                : [...(d.currentlyReading || []), manga.id]
        }));
        setTimeout(async () => {
            const currentTracked = await get<Anime[]>(IDB_TRACKED_MEDIA_KEY) || [];
             if (!currentTracked.some(item => item.id === manga.id)) {
                const newTracked = [...currentTracked, mangaWithoutSynopsis];
                await set(IDB_TRACKED_MEDIA_KEY, newTracked);
                setTrackedMedia(newTracked);
            }
        }, 100);
    };

    const setCustomEpisodeLinks = (mediaId: number, linkInfo: { template: string; ongoing: boolean }) => 
        updateAndPersistListData(d => ({ customEpisodeLinks: { ...d.customEpisodeLinks, [mediaId]: linkInfo } }));

    const toggleEpisodeWatched = (anime: Anime, episodeId: string) => {
        const animeIdStr = String(anime.id);
        updateAndPersistListData(d => {
            const watched = new Set(d.watchedEpisodes?.[animeIdStr] || []);
            if (watched.has(episodeId)) watched.delete(episodeId);
            else watched.add(episodeId);
            return { watchedEpisodes: { ...d.watchedEpisodes, [animeIdStr]: Array.from(watched) } };
        });
    };

    const toggleChapterRead = (manga: Anime, chapterId: string) => {
        const mangaIdStr = String(manga.id);
        updateAndPersistListData(d => {
            const read = new Set(d.readChapters?.[mangaIdStr]?.read || []);
            if (read.has(chapterId)) read.delete(chapterId);
            else read.add(chapterId);
            return { readChapters: { ...d.readChapters, [mangaIdStr]: { read: Array.from(read), lastRead: new Date().toISOString() } } };
        });
    };

    const unwatchAllEpisodes = (anime: Anime) => updateAndPersistListData(d => {
        const newWatched = { ...d.watchedEpisodes };
        delete newWatched[String(anime.id)];
        return { watchedEpisodes: newWatched };
    });

    const watchAllEpisodes = (anime: Anime) => {
        const count = anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes;
        if (!count || count <= 0) return;
        const allIds = Array.from({ length: count }, (_, i) => String(i + 1));
        updateAndPersistListData(d => ({ watchedEpisodes: { ...d.watchedEpisodes, [String(anime.id)]: allIds } }));
    };
    
    const unmarkAllChaptersRead = (manga: Anime) => updateAndPersistListData(d => {
        const newRead = { ...d.readChapters };
        delete newRead[String(manga.id)];
        return { readChapters: newRead };
    });

    const markAllChaptersRead = (manga: Anime, allChapterIds: string[]) => {
        if (!allChapterIds?.length) return;
        updateAndPersistListData(d => ({ readChapters: { ...d.readChapters, [String(manga.id)]: { read: allChapterIds, lastRead: new Date().toISOString() } } }));
    };

    const removeItemFromList = (itemId: number, listName: string) => {
        switch (listName) {
            case 'watching': updateAndPersistListData(d => ({ currentlyWatching: d.currentlyWatching?.filter(id => id !== itemId) || [] })); break;
            case 'plan-to-watch': updateAndPersistListData(d => ({ planToWatch: d.planToWatch?.filter(id => id !== itemId) || [] })); break;
            case 'completed': unwatchAllEpisodes({ id: itemId } as Anime); break;
            case 'reading': updateAndPersistListData(d => ({ currentlyReading: d.currentlyReading?.filter(id => id !== itemId) || [] })); break;
            case 'plan-to-read': updateAndPersistListData(d => ({ planToRead: d.planToRead?.filter(id => id !== itemId) || [] })); break;
            case 'read': unmarkAllChaptersRead({ id: itemId } as Anime); break;
        }
    };

    const getMediaForList = useCallback(async (ids: number[]) => {
        if (ids.length === 0) return [];
        return getMultipleAnimeFromAniList(ids, addLog);
    }, [addLog]);

    const getAllWatchedAnime = useCallback(async () => {
        const watchedIds = Object.keys(listData.watchedEpisodes).map(Number).filter(id => listData.watchedEpisodes[id]?.length > 0);
        const animes = await getMediaForList(watchedIds);
        return animes.map(anime => ({ ...anime, watchedEpisodeCount: listData.watchedEpisodes[anime.id]?.length || 0 }));
    }, [listData.watchedEpisodes, getMediaForList]);

    const getCurrentlyWatchingAnime = useCallback(() => getMediaForList(listData.currentlyWatching || []), [listData.currentlyWatching, getMediaForList]);
    const getPlanToWatchAnime = useCallback(() => getMediaForList(listData.planToWatch || []), [listData.planToWatch, getMediaForList]);
    const getAllReadManga = useCallback(async () => {
        const readIds = Object.keys(listData.readChapters || {}).map(Number).filter(id => listData.readChapters?.[id]?.read.length > 0);
        const mangas = await getMediaForList(readIds);
        return mangas.map(manga => ({ ...manga, readChapterCount: listData.readChapters?.[manga.id]?.read.length || 0 }));
    }, [listData.readChapters, getMediaForList]);
    const getCurrentlyReadingManga = useCallback(() => getMediaForList(listData.currentlyReading || []), [listData.currentlyReading, getMediaForList]);
    const getPlanToReadManga = useCallback(() => getMediaForList(listData.planToRead || []), [listData.planToRead, getMediaForList]);
    const clearCompletedList = () => updateAndPersistListData(() => ({ watchedEpisodes: {} }));
    const clearReadList = () => updateAndPersistListData(() => ({ readChapters: {} }));
    const markActivityAsRead = (id: number) => updateAndPersistListData(d => ({ readActivityIds: [...(d.readActivityIds || []), id] }));
    const markAllActivitiesAsRead = (allActivityIds: number[]) => updateAndPersistListData(() => ({ readActivityIds: allActivityIds }));
    const clearDataSection = (key: keyof ListData) => updateAndPersistListData(() => ({ [key]: Array.isArray(initialListData[key]) ? [] : {} }));
    const setHiddenGenres = (genres: string[]) => updateAndPersistListData(() => ({ hiddenGenres: genres }));
    const setSensitiveContentUnlocked = (unlocked: boolean) => updateAndPersistListData(() => ({ sensitiveContentUnlocked: unlocked }));
    const setStorageQuota = (bytes: number) => updateAndPersistListData(() => ({ storageQuota: bytes }));

    // --- MEDIA TRACKING LOGIC ---
    useEffect(() => {
        async function loadTrackedMedia() {
            if (authMode === 'local') {
                let media = await get<Anime[]>(IDB_TRACKED_MEDIA_KEY) || [];
                // Retroactively clean up synopsis from old data
                const cleanedMedia = media.map(item => {
                    if ((item as Partial<Anime>).synopsis) {
                        const { synopsis, ...rest } = item as any;
                        return rest;
                    }
                    return item;
                });
                setTrackedMedia(cleanedMedia);
                // Optionally re-save the cleaned data
                if (media.length > 0 && media.some(item => (item as Partial<Anime>).synopsis)) {
                   await set(IDB_TRACKED_MEDIA_KEY, cleanedMedia);
                }
            } else {
                setTrackedMedia([]);
            }
        }
        loadTrackedMedia();
    }, [authMode]);


    const addInteraction = useCallback((media: Anime, diff: number) => {
        updateAndPersistListData(currentData => {
            const isManga = media.type === 'MANGA' || media.type === 'NOVEL' || media.type === 'ONE_SHOT';
            const message = isManga ? `${diff} new chapters available` : `${diff} new episodes available`;
            const newNotification: NewsNotification = { id: uuidv4(), type: 'news', mediaId: media.id, isManga, title: media.title, thumbnail: media.images.webp.large_image_url || '', message, timestamp: new Date().toISOString(), seen: false };
            return { notifications: [...(currentData.notifications || []), newNotification] };
        });
    }, [updateAndPersistListData]);

    const checkForUpdates = useCallback(async () => {
        const mediaToWatchIds = new Set([...(listData.currentlyWatching || []), ...(listData.currentlyReading || [])]);
        if (mediaToWatchIds.size === 0) return;

        const latestMediaData = await getMultipleAnimeFromAniList(Array.from(mediaToWatchIds), addLog);
        const latestMediaMap = new Map(latestMediaData.map(m => [m.id, m]));
        const currentMediaMap = new Map(trackedMedia.map(m => [m.id, m]));
        const newUpdates: any = {};
        
        for (const mediaId of mediaToWatchIds) {
            const currentMedia = currentMediaMap.get(mediaId);
            const latestMedia = latestMediaMap.get(mediaId);
            if (!currentMedia || !latestMedia) continue;

            const isManga = latestMedia.type === 'MANGA' || latestMedia.type === 'NOVEL' || latestMedia.type === 'ONE_SHOT';
            const oldVal = isManga ? currentMedia.chapters : currentMedia.episodes;
            const newVal = isManga ? latestMedia.chapters : latestMedia.episodes;
            
            if (newVal != null && (oldVal == null || newVal > oldVal)) {
                addInteraction(latestMedia, newVal - (oldVal || 0));
                newUpdates[mediaId] = { newEpisodes: isManga ? 0 : newVal - (oldVal || 0), newChapters: isManga ? newVal - (oldVal || 0) : 0 };
            }
        }
        if (Object.keys(newUpdates).length > 0) setUpdates((prev: any) => ({ ...prev, ...newUpdates }));
        
        const updatedTracked = trackedMedia.map(m => latestMediaMap.get(m.id) || m);
        setTrackedMedia(updatedTracked);
        await set(IDB_TRACKED_MEDIA_KEY, updatedTracked);
    }, [listData.currentlyWatching, listData.currentlyReading, trackedMedia, addLog, addInteraction]);

    const runChecks = useCallback(async () => {
        if (isCheckingForUpdates) return;
        setIsCheckingForUpdates(true);
        await checkForUpdates();
        setIsCheckingForUpdates(false);
    }, [isCheckingForUpdates, checkForUpdates]);

    useEffect(() => {
        if (authMode !== 'local') return;
        const initialTimeout = setTimeout(runChecks, INITIAL_CHECK_DELAY);
        const intervalId = setInterval(runChecks, UPDATE_INTERVAL);
        return () => {
            clearTimeout(initialTimeout);
            clearInterval(intervalId);
        };
    }, [authMode, runChecks]);
    
    const markInteractionAsRead = (id: string) => updateAndPersistListData(d => ({ notifications: d.notifications?.map(n => n.id === id ? { ...n, seen: true, seenAt: new Date().toISOString() } : n) || [] }));
    const markAllInteractionsAsRead = () => updateAndPersistListData(d => ({ notifications: d.notifications?.map(n => ({...n, seen: true, seenAt: new Date().toISOString() })) || [] }));
    
    // --- REMINDERS LOGIC ---
    const reminders = useMemo(() => listData.reminders || [], [listData.reminders]);
    const notifications = useMemo(() => listData.notifications || [], [listData.notifications]);

    const isMediaCompleted = useCallback((reminder: Reminder): boolean => {
        if (!reminder.autoStopOnCompletion) return false;
        const media = trackedMedia.find(m => m.id === reminder.mediaId);
        if (!media) return false;
        const totalUnits = media.type === 'MANGA' ? (media.chapters || media.volumes) : media.episodes;
        if (!totalUnits || totalUnits === 0) return false;
        if (media.type === 'MANGA') return (listData.readChapters?.[media.id]?.read?.length || 0) >= totalUnits;
        return (listData.watchedEpisodes?.[media.id]?.length || 0) >= totalUnits;
    }, [trackedMedia, listData.watchedEpisodes, listData.readChapters]);

    const checkRemindersAndCreateNotifications = useCallback(() => {
        const existingReminderNotifications = new Set(notifications.filter(n => n.type === 'reminder').map(n => (n as ReminderNotification).reminderId));
        let newNotifications: UserNotification[] = [];

        reminders.forEach(reminder => {
            if (isPast(new Date(reminder.startDateTime)) && !existingReminderNotifications.has(reminder.id)) {
                 if (isMediaCompleted(reminder)) return;
                newNotifications.push({
                    id: uuidv4(),
                    type: 'reminder',
                    reminderId: reminder.id,
                    mediaId: reminder.mediaId,
                    title: reminder.title,
                    message: reminder.notes,
                    timestamp: new Date().toISOString(),
                    seen: false
                });
            }
        });
        if (newNotifications.length > 0) {
            updateAndPersistListData(currentData => ({ notifications: [...currentData.notifications, ...newNotifications] }));
        }
    }, [reminders, notifications, updateAndPersistListData, isMediaCompleted]);
    
    useEffect(() => {
        if (authMode !== 'local') return;
        checkRemindersAndCreateNotifications();
        const intervalId = setInterval(checkRemindersAndCreateNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [authMode, checkRemindersAndCreateNotifications]);

    const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'mediaTitle' | 'mediaImage' | 'mediaType'>, media: Anime) => {
        const newReminder: Reminder = { ...reminderData, id: uuidv4(), createdAt: new Date().toISOString(), mediaTitle: media.title, mediaImage: media.images.webp.large_image_url || '', mediaType: media.type as 'ANIME' | 'MANGA' };
        updateAndPersistListData(currentData => ({ reminders: [...(currentData.reminders || []), newReminder] }));
    };
    const updateReminder = (id: string, data: Partial<Reminder>) => updateAndPersistListData(currentData => ({ reminders: currentData.reminders.map(r => r.id === id ? { ...r, ...data } : r) }));
    const deleteReminder = (id: string) => updateAndPersistListData(currentData => ({ reminders: currentData.reminders.filter(r => r.id !== id), notifications: currentData.notifications.filter(n => (n as any).reminderId !== id) }));
    const markReminderAsSeen = (id: string) => updateAndPersistListData(currentData => ({ notifications: currentData.notifications.map(n => n.id === id ? { ...n, seen: true, seenAt: new Date().toISOString() } : n) || [] }));
    const markAllRemindersAsSeen = () => updateAndPersistListData(currentData => ({ notifications: currentData.notifications.map(n => n.type === 'reminder' && !n.seen ? { ...n, seen: true, seenAt: new Date().toISOString() } : n) }));

    // --- UI SETTINGS LOGIC ---
    const layoutConfig = useMemo(() => listData.layoutConfig || defaultLayoutConfig, [listData.layoutConfig]);
    const notificationsLayout = useMemo(() => listData.notificationsLayout || ['updates', 'reminders', 'logs'], [listData.notificationsLayout]);
    const pinnedNotificationTab = useMemo(() => listData.pinnedNotificationTab || 'updates', [listData.pinnedNotificationTab]);
    
    const updateLayoutConfig = (config: LayoutConfigItem[]) => updateAndPersistListData(() => ({ layoutConfig: config }));
    const updateNotificationsLayout = (layout: NotificationsLayoutKey[]) => updateAndPersistListData(() => ({ notificationsLayout: layout }));
    const updatePinnedNotificationTab = (tab: NotificationsLayoutKey) => updateAndPersistListData(() => ({ pinnedNotificationTab: tab }));

    // --- DATA MANAGEMENT LOGIC ---
    const disconnectFromSharedData = useCallback((showToast = true) => {
        const newConfig = { url: null, lastSync: null, lastSize: null, lastEtag: null };
        setSharedDataConfig(newConfig);
        set(IDB_SHARED_DATA_KEY, newConfig);
        if (showToast) toast({ title: 'Disconnected' });
    }, [toast]);
    
    const convertToRawGistUrl = (url: string) => {
        const match = url.match(/gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+)/);
        return match ? `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw` : url;
    };

    const syncSharedData = useCallback(async (isManualTrigger = false) => {
        const currentConfig = await get<SharedDataConfig>(IDB_SHARED_DATA_KEY);
        if (!currentConfig?.url) return;
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const rawUrl = convertToRawGistUrl(currentConfig.url);
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
            const headers: HeadersInit = isManualTrigger ? {} : (currentConfig.lastEtag ? { 'If-None-Match': currentConfig.lastEtag } : {});
            
            const response = await fetch(proxyUrl, { headers });

            if (response.status === 304) {
                if (isManualTrigger) toast({ title: "Already Up-to-Date" });
            } else if (response.ok) {
                const data = await response.json();
                if (!data.profile || !data.lists) throw new Error("Invalid data structure.");
                
                await set(IDB_PROFILE_KEY, data.profile);
                await set(IDB_LIST_DATA_KEY, data.lists);
                if (data.layout) await set(IDB_LAYOUT_CONFIG_KEY, data.layout);
                if (data.tracked) await set(IDB_TRACKED_MEDIA_KEY, data.tracked);

                const newConfig = { ...currentConfig, lastSync: new Date().toISOString(), lastEtag: response.headers.get('etag'), lastSize: Number(response.headers.get('content-length') || 0) };
                setSharedDataConfig(newConfig);
                await set(IDB_SHARED_DATA_KEY, newConfig);
                
                toast({ title: "Sync Successful", description: "Reloading app." });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                throw new Error(`Fetch failed: ${response.statusText}`);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Sync Failed", description: error.message });
            disconnectFromSharedData(false);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, toast, disconnectFromSharedData]);

    useEffect(() => {
        async function loadSharedConfig() {
            if (authMode !== 'local') return;
            const config = await get<SharedDataConfig>(IDB_SHARED_DATA_KEY);
            if (config?.url) setSharedDataConfig(config);
        }
        loadSharedConfig();
    }, [authMode]);

    const connectToSharedData = async (url: string) => {
        const newConfig = { url, lastSync: null, lastSize: null, lastEtag: null };
        setSharedDataConfig(newConfig);
        await set(IDB_SHARED_DATA_KEY, newConfig);
        await syncSharedData(true);
    };
    
    const exportData = async () => {
        try {
            const allData = {
                profile: await get(IDB_PROFILE_KEY),
                lists: await get(IDB_LIST_DATA_KEY),
                layout: await get(IDB_LAYOUT_CONFIG_KEY),
                tracked: await get(IDB_TRACKED_MEDIA_KEY),
            };
            const dataStr = JSON.stringify(allData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `animesync_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            toast({ title: "Download Started" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Export Failed', description: error.message });
        }
    };

    const importData = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (!data.profile || !data.lists) throw new Error("Invalid file structure.");
                await set(IDB_PROFILE_KEY, data.profile);
                await set(IDB_LIST_DATA_KEY, data.lists);
                if (data.layout) await set(IDB_LAYOUT_CONFIG_KEY, data.layout);
                if (data.tracked) await set(IDB_TRACKED_MEDIA_KEY, data.tracked);
                toast({ title: "Import Successful", description: "Reloading app." });
                setTimeout(() => window.location.reload(), 1500);
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Import Failed", description: error.message });
            }
        };
        reader.readAsText(file);
    };

    const resetLocalData = () => signOut();

    return {
        // Auth
        authMode, localProfile, loading, signInLocally, signOut, updateLocalProfile,
        // Lists & Media
        listData, setListData: updateAndPersistListData, trackedMedia,
        isPlannedToWatch, isCurrentlyWatching, togglePlanToWatch, toggleCurrentlyWatching,
        isPlannedToRead, isCurrentlyReading, togglePlanToRead, toggleCurrentlyReading,
        toggleEpisodeWatched, watchAllEpisodes, unwatchAllEpisodes,
        toggleChapterRead, markAllChaptersRead, unmarkAllChaptersRead,
        getAllWatchedAnime, getCurrentlyWatchingAnime, getPlanToWatchAnime,
        getAllReadManga, getCurrentlyReadingManga, getPlanToReadManga,
        clearCompletedList, clearReadList, removeItemFromList,
        // Updates & Notifications
        updates, runChecks, isCheckingForUpdates, addInteraction, markInteractionAsRead, markAllInteractionsAsRead,
        markActivityAsRead, markAllActivitiesAsRead,
        // Reminders
        reminders, addReminder, updateReminder, deleteReminder, markReminderAsSeen, markAllRemindersAsSeen,
        // UI
        layoutConfig, updateLayoutConfig, notificationsLayout, updateNotificationsLayout, pinnedNotificationTab, updatePinnedNotificationTab,
        setHiddenGenres, setSensitiveContentUnlocked,
        // Data Management
        exportData, importData, resetLocalData, setStorageQuota,
        sharedDataConfig, connectToSharedData, disconnectFromSharedData, syncSharedData, isSyncing,
        // Other
        setCustomEpisodeLinks, clearDataSection,
        showDebugLogs, setDebugLogs
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const authCoreValue = useAuthCore();
    return <AuthContext.Provider value={authCoreValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
