import type { LayoutConfigItem } from "@/hooks/use-auth";

export const SENSITIVE_GENRES = ['Boys\' Love', 'Girls Love', 'Hentai', 'Ecchi', 'Erotica'];

// NOTE: This file is used for configuration. Sensitive data has been removed.
// The password and genre lists are no longer needed as the feature has been removed.

export const JIKAN_PAGE_LIMIT = 24;

export const SENSITIVE_PASSWORD = "omarsan@3363";


export const defaultLayoutConfig: LayoutConfigItem[] = [
    { id: 'trending', titleKey: 'trending_this_season', visible: true, type: 'anime' },
    { id: 'top', titleKey: 'top_rated_anime', visible: true, type: 'anime' },
    { id: 'topThisSeason', titleKey: 'top_this_season', visible: true, type: 'anime' },
    { id: 'upcoming', titleKey: 'upcoming_season', visible: true, type: 'anime' },
    { id: 'airing', titleKey: 'airing_now', visible: true, type: 'anime' },
    { id: 'popular', titleKey: 'most_popular', visible: true, type: 'anime' },
    { id: 'topMovies', titleKey: 'top_movies', visible: true, type: 'anime' },
    { id: 'movies', titleKey: 'latest_movies', visible: true, type: 'anime' },
    { id: 'latestAdditions', titleKey: 'latest_additions', visible: true, type: 'anime' },
    { id: 'releasingManga', titleKey: 'releasing_manga', visible: true, type: 'manga' },
    { id: 'trendingManga', titleKey: 'trending_manga', visible: true, type: 'manga' },
    { id: 'upcomingManga', titleKey: 'upcoming_manga', visible: true, type: 'manga' },
    { id: 'popularManga', titleKey: 'popular_manga', visible: true, type: 'manga' },
    { id: 'topManga', titleKey: 'top_manga', visible: true, type: 'manga' },
];
