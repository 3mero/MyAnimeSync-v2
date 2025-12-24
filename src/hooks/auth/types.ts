// This file centralizes types used across the auth hooks.
export type { 
    LayoutConfigItem, 
    CustomEpisodeLinks, 
    WatchedEpisodes, 
    ExcludedItems, 
    UserNotification, 
    Comment, 
    NotificationsLayoutKey, 
    GlobalActivity, 
    Reminder,
    ListData,
    Anime,
    UpdateInfo,
    Updates,
    BroadcastNotification,
} from '../../lib/types';


export interface LocalProfile {
  username: string;
  avatar_url: string;
  id?: string;
  bio?: string;
  socials?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}

export interface SharedDataConfig {
    url: string | null;
    lastSync: string | null;
    lastSize: number | null;
    lastEtag: string | null;
}

export type AuthMode = 'local' | 'none';
