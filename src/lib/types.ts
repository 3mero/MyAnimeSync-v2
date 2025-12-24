export interface JikanRelation {
  relation: string;
  entry: {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }[];
}

export interface Anime {
  mal_id: number;
  id: number; // AniList ID (or MAL ID as a stand-in)
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
  };
  title: string;
  title_english: string | null;
  title_japanese: string;
  synopsis: string;
  type: string; // ANIME or MANGA
  format?: string;
  source: string;
  episodes: number | null; // For Anime
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  chapters: number | null; // For Manga
  volumes: number | null; // For Manga
  status: string;
  airing: boolean;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  year: number | null;
  isAdult?: boolean;
  startDate?: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  rating: string | null;
  genres: JikanGenre[];
  studios: { mal_id: number; type: string; name: string; url: string }[];
  authors?: { mal_id: number; name: string; url: string, images: { jpg: { image_url: string } } }[];
  relations?: JikanRelation[];
  relationType?: string; // Added for watch order context
  update?: {
    newEpisodes: number;
  }
  latestUpdate?: {
    status: string;
    progress: string;
    timestamp: number;
  }
}

export interface JikanPagination {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
}

export interface JikanAPISuccessResponse {
  data: any[];
  pagination: JikanPagination;
}

export interface JikanAPIErrorResponse {
  status: number;
  type: string;
  message: string;
  error: string;
}

export interface JikanAPIAnimeSuccessResponse {
  data: Anime;
}

// Types for anime-facts-rest-api
export interface AnimeFact {
  fact_id: number;
  fact: string;
}

export interface AnimeFactsResponse {
  success: boolean;
  total_facts: number;
  anime_img: string;
  data: AnimeFact[];
}

export interface AnimeListItem {
  anime_id: number;
  anime_name: string;
  anime_img: string;
}

export interface AnimeListResponse {
  success: boolean;
  data: AnimeListItem[];
}

export interface SpecificFactResponse {
  success: boolean;
  data: AnimeFact;
}

// Jikan Episodes
export interface JikanEpisode {
    mal_id: number;
    url: string;
    title: string;
    title_japanese: string;
    title_romanji: string;
    aired: string;
    score: number;
    filler: boolean;
    recap: boolean;
    forum_url: string;
}

export interface JikanApiEpisodesResponse {
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
        current_page?: number;
    };
    data: JikanEpisode[];
}


// Jikan Recommendations
export interface JikanRecommendation {
    entry: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
            webp: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
        };
        title: string;
    };
    url: string;
    votes: number;
}

// Latest Community Recommendations
export interface JikanGenericRecommendation {
  mal_id: string;
  entry: Anime[];
  content: string;
  user: {
    url: string;
    username: string;
  };
}

export interface JikanAPIGenericRecommendationsResponse {
  data: JikanGenericRecommendation[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}


// Breadcrumbs
export interface BreadcrumbItem {
  id: number;
  title: string;
}


// Characters
export interface JikanCharacter {
    character: {
        mal_id: number;
        url?: string;
        images: {
            jpg: { image_url: string };
            webp: { image_url: string; small_image_url: string };
        };
        name: string;
    };
    role: string;
    favorites?: number;
    voice_actors?: JikanVoiceActor[];
}

export interface JikanVoiceActor {
    person: {
        mal_id: number;
        url?: string;
        images: { jpg: { image_url: string } };
        name: string;
    };
    language: string;
}

export interface JikanCharacterDetail {
    mal_id: number;
    name: string;
    name_kanji: string;
    nicknames: string[];
    favorites: number;
    about: string;
    images: {
        jpg: { image_url: string };
        webp: { image_url: string };
    };
    anime: {
        role: string;
        anime: Anime;
    }[];
    voices: JikanVoiceActor[];
}

// Person / Voice Actor
export interface JikanPerson {
    mal_id: number;
    name: string;
    given_name: string;
    family_name: string;
    alternate_names: string[];
    birthday: string;
    favorites: number;
    about: string;
    images: {
        jpg: { image_url: string };
    };
    voices: JikanPersonVoiceRole[];
}

export interface JikanPersonVoiceRole {
    role: string;
    anime: Anime; // Changed from just Anime to full Anime object
    character: {
        mal_id: number;
        name: string;
        images: {
             jpg: { image_url: string };
             webp: { image_url: string, small_image_url: string };
        }
    };
}

// Genres
export interface JikanGenre {
    mal_id: number;
    name: string;
    url?: string;
    count?: number;
    type: 'genre' | 'tag';
}

export interface JikanAPIGenresResponse {
    data: JikanGenre[];
}

// Pictures
export interface JikanPicture {
    jpg: { image_url: string };
    webp?: { image_url: string };
}

// Videos
export interface JikanVideo {
    title: string;
    trailer: {
        youtube_id: string;
        url: string;
        embed_url: string;
        images: {
            default_image_url: string;
            medium_image_url: string;
            large_image_url: string;
            maximum_image_url: string;
        }
    }
}

// Staff
export interface JikanStaff {
    person: {
        mal_id: number;
        url?: string;
        images: { jpg: { image_url: string } };
        name: string;
    };
    positions: string[];
}

// Reviews
export interface JikanReview {
    user: {
        username: string;
        url: string;
        images: {
            jpg: { image_url: string };
            webp: { image_url: string };
        };
    };
    mal_id: number;
    url?: string;
    type?: string;
    reactions: {
        overall: number;
        nice: number;
        love_it: number;
        funny: number;
        confusing: number;
        informative: number;
        well_written: number;
        creative: number;
    };
    date: string;
    review: string;
    score: number;
    tags?: string[];
    is_spoiler: boolean;
    is_preliminary?: boolean;
}

// Seasons
export interface JikanSeason {
    year: number;
    seasons: string[];
}

// News
export interface JikanNewsArticle {
    mal_id: number;
    url: string;
    title: string;
    date: string;
    author_username: string;
    author_url: string;
    forum_url: string;
    images: {
        jpg: {
            image_url: string;
        }
    };
    comments: number;
    excerpt: string;
}

// ANN News
export interface AnnNewsItem {
    id: string;
    gid: string;
    type: string;
    date: string; // ISO 8601 format
    link: string;
    title: string;
    topics: string[];
    preview_text: string;
    preview_image: {
        src: string | null;
        width: number;
        height: number;
        full: string | null;
    };
}


// AniList Types (Kept for reference, but data is now mapped from Jikan)
export interface AniListMedia {
    id: number;
    idMal: number;
    title: {
      romaji: string;
      english: string | null;
      native: string;
    };
    coverImage: {
      extraLarge: string;
      large: string;
      color: string | null;
    };
    description?: string;
    source?: string;
    episodes: number | null; // Anime
    nextAiringEpisode?: {
        airingAt: number;
        timeUntilAiring: number;
        episode: number;
    } | null;
    chapters: number | null; // Manga
    volumes: number | null; // Manga
    status: string;
    averageScore: number | null;
    popularity: number;
    genres: string[];
    tags?: { id: number, name: string }[];
    type: string; // ANIME or MANGA
    format: string;
    seasonYear: number | null;
    startDate?: {
        year: number | null;
        month: number | null;
        day: number | null;
    };
    trailer?: {
        id: string;
        site: string;
    };
    rankings?: { rank: number; allTime: boolean }[];
    relations?: {
        edges: {
            relationType: string;
            node: AniListMedia;
        }[];
    };
    studios?: {
        nodes: {
            id: number;
            name: string;
        }[];
    };
    staff?: {
      edges: {
        role: string;
        node: {
          id: number;
          name: {
            full: string;
          }
          image: {
            large: string;
          }
        }
      }[];
    };
    isAdult?: boolean;
    broadcast?: {
        day: string;
        time: string;
    }
}

export interface AniListStreamingEpisode {
  title: string;
  thumbnail: string;
  url: string;
  site: string;
}

// trace.moe Types
export interface TraceMoeResult {
    anilist: {
        id: number;
        idMal: number;
        title: {
            native: string;
            romaji: string;
            english: string;
        };
        isAdult: boolean;
    } | number; // anilist can be just an ID
    filename: string;
    episode: number | string; // Can be a string like "1-12"
    from: number;
    to: number;
    similarity: number;
    video: string;
    image: string;
}

export interface TraceMoeResponse {
    frameCount: number;
    error: string;
    result: TraceMoeResult[];
}

// Update Notifications
export interface UpdateInfo {
  newEpisodes?: number;
  newChapters?: number;
}
export interface Updates {
  [mediaId: number]: UpdateInfo;
}

// Search Filters
export interface SearchFilters {
    q?: string;
    type?: 'ANIME' | 'MANGA';
    genre?: string;
    tag_in?: string[];
    sort?: string;
}

// Comments
export interface Comment {
    id: string;
    mediaId: number;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    timestamp: string;
    parentId: string | null;
    likes: string[]; // Array of user IDs
    reports: {
        userId: string;
        reason: string;
        timestamp: string;
    }[];
}

export interface LikeNotification {
    type: 'like';
    id: string;
    mediaId: number;
    commentId: string;
    likerUsername: string;
    commentOwnerId: string;
    timestamp: string;
    seen: boolean;
}

export interface ReplyNotification {
    type: 'reply';
    id: string;
    mediaId: number;
    commentId: string;
    replierUsername: string;
    parentCommentOwnerId: string;
    timestamp: string;
    seen: boolean;
}

export interface NewsNotification {
    type: 'news';
    id: string;
    mediaId: number;
    isManga: boolean;
    title: string;
    thumbnail: string;
    message: string;
    timestamp: string;
    seen: boolean;
    seenAt?: string;
}

export interface StorageNotification {
    type: 'storage';
    id: string;
    title: string;
    message: string;
    timestamp: string;
    seen: boolean;
    seenAt?: string;
}

export interface ReminderNotification {
    type: 'reminder';
    id: string;
    reminderId: string;
    mediaId: number;
    title: string;
    message: string;
    timestamp: string;
    seen: boolean;
    seenAt?: string;
}

export interface BroadcastNotification {
    type: 'broadcast';
    id: string; // Unique ID for this message instance (e.g., hash of message + timestamp)
    message: string;
    timestamp: string; // ISO string of when the broadcast was created by the owner
    seen: boolean;
    seenAt?: string;
}


export type UserNotification = LikeNotification | ReplyNotification | NewsNotification | ReminderNotification | BroadcastNotification | StorageNotification;


// Live Chat
export interface ChatRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface ChatUser {
  id: string;
  username: string;
  avatar_url: string;
  last_seen: string;
}


export interface LiveChatMessage {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    timestamp: string;
    status: 'local' | 'cloud' | 'synced';
    deleted?: boolean;
}

export interface GlobalActivity {
    id: number;
    type: string;
    status: string;
    progress: string;
    createdAt: number;
    user: {
        id: number;
        name: string;
        avatar: string;
    };
    media: {
        id: number;
        title: string;
        type: 'ANIME' | 'MANGA';
        coverImage: string;
    };
}


// Admin Dashboard
export interface AdminDashboardStats {
    totalUsers: number;
    totalComments: number;
    totalPlanToWatch: number;
    totalWatching: number;
}

export interface MostTrackedItem {
    id: number;
    title: string;
    image: string;
    count: number;
    type: 'ANIME' | 'MANGA';
}

export type WatchedEpisodes = Record<string, string[]>;
export type ReadChapters = Record<string, { read: string[]; lastRead: string }>;
export type CustomEpisodeLinks = Record<string, { template: string; ongoing: boolean }>;
export type ExcludedItems = Record<number, number[]>; // root anilistId -> excluded mal_id array

export interface Reminder {
    id: string;
    mediaId: number;
    mediaTitle: string;
    mediaImage?: string;
    mediaType?: 'ANIME' | 'MANGA';
    title: string;
    notes: string;
    startDateTime: string; // ISO string
    repeatIntervalDays: number; // 0 for no repeat
    repeatOnDays?: number[]; // 0 for Sunday, 6 for Saturday
    autoStopOnCompletion?: boolean; // New property
    createdAt: string; // ISO string
    isDue?: boolean;
    seen?: boolean;
    seenAt?: string; // ISO string
}

export type NotificationsLayoutKey = 'updates' | 'reminders' | 'logs';

export interface ListData {
  planToWatch: number[];
  currentlyWatching: number[];
  watchedEpisodes: WatchedEpisodes;
  planToRead: number[];
  currentlyReading: number[];
  readChapters: ReadChapters;
  customEpisodeLinks: CustomEpisodeLinks;
  comments: Record<string, Comment[]>;
  notifications: UserNotification[];
  notificationsLayout: NotificationsLayoutKey[];
  pinnedNotificationTab: NotificationsLayoutKey;
  excludedItems: ExcludedItems;
  readActivityIds: number[];
  reminders: Reminder[];
  hiddenGenres: string[];
  sensitiveContentUnlocked: boolean;
  broadcastMessage?: string;
  storageQuota: number; // in bytes
}

export interface LayoutConfigItem {
  id: string;
  titleKey: string;
  visible: boolean;
  customTitle?: string;
  type: 'anime' | 'manga';
}
