import type { AniListMedia, Anime, JikanRelation, AniListStreamingEpisode, JikanCharacter, JikanStaff, JikanReview, JikanNewsArticle, JikanPicture, JikanVideo, SearchFilters, JikanCharacterDetail, JikanPerson, AdminDashboardStats, MostTrackedItem, JikanGenre, UserNotification, GlobalActivity, Reminder, ListData, AnnNewsItem } from '../types';
import type { LogEntry } from '@/hooks/use-logger';
import {
    AIRING_QUERY, CHARACTER_DETAILS_QUERY, CHARACTERS_QUERY, CHAR_PICS_QUERY, EPISODES_QUERY,
    LATEST_MOVIES_QUERY, LATEST_RECS_QUERY, MANGA_CHARS_QUERY, MANGA_STATUS_QUERY, MEDIA_BY_ID_QUERY, MEDIA_COUNTS_QUERY,
    MEDIA_RELATIONS_QUERY, MULTIPLE_ANIME_QUERY, NEWS_QUERY, PAGINATED_LIST_QUERY, PERSON_DETAILS_QUERY,
    PERSON_PICS_QUERY, PICTURES_QUERY, RECOMMENDATIONS_QUERY, REVIEWS_QUERY, SEARCH_CHARACTERS_QUERY, SEARCH_QUERY,
    SEASONS_QUERY, SEASON_MEDIA_QUERY, STAFF_QUERY, TOP_THIS_SEASON_QUERY, UPCOMING_QUERY, VIDEOS_QUERY, SEARCH_BY_MAL_ID_QUERY, HOME_PAGE_QUERY
} from './queries';
import { fetchAniList, mapAniListMediaToAnime, jikanApiRequest, mapJikanMediaToAnime } from './utils';
import { addDays, isPast, nextDay } from 'date-fns';
import { get } from '../idb-keyval';
import { genres_list } from '@/i18n';
import { SENSITIVE_GENRES } from '@/lib/config';


// Helper to check if a reminder is due
export const isReminderDue = (reminder: Reminder): boolean => {
  const now = new Date();
  const startDate = new Date(reminder.startDateTime);

  // If it's a one-time reminder and it's in the past
  if (reminder.repeatIntervalDays === 0 && (!reminder.repeatOnDays || reminder.repeatOnDays.length === 0)) {
    return isPast(startDate);
  }

  // Handle weekly repeats
    if (reminder.repeatOnDays && reminder.repeatOnDays.length > 0) {
        const sortedRepeatDays = [...reminder.repeatOnDays].sort((a,b) => a-b);
        
        for (const day of sortedRepeatDays) {
            let nextOccurrence = nextDay(now, day as any);
            nextOccurrence.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

            if (!isPast(nextOccurrence)) {
                return false; // Found a future occurrence, so not due yet
            }
        }
        // If all occurrences this week are past, it's due
        return true;
    }


  // If it's a repeating reminder (interval)
  if (isPast(startDate)) {
    // Check if an occurrence is due today or has been missed
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceStart % reminder.repeatIntervalDays === 0 || daysSinceStart > 0;
  }
  
  return false;
};


// Helper to get current season
function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'WINTER';
    if (month >= 3 && month <= 5) return 'SPRING';
    if (month >= 6 && month <= 8) return 'SUMMER';
    return 'FALL';
}

async function getHiddenGenres(listData?: ListData | null): Promise<{ genres: string[], tags: string[] }> {
    const SENSITIVE_GENRES_INTERNAL = SENSITIVE_GENRES;
    let finalHidden: string[] = SENSITIVE_GENRES_INTERNAL;
    let data = listData;

    try {
        if (!data) {
           data = await get<ListData>('animesync_local_list_data');
        }
        
        if (data) {
            const userHidden = data.hiddenGenres || [];
            if (data.sensitiveContentUnlocked) {
                finalHidden = userHidden;
            } else {
                finalHidden = Array.from(new Set([...SENSITIVE_GENRES_INTERNAL, ...userHidden]));
            }
        }
    } catch (e) {
        console.error("Could not get hidden genres from IDB, defaulting to SENSITIVE_GENRES", e);
    }
    
    const allGenreNames = new Set(genres_list.map(g => g.name));
    const validHidden = finalHidden.filter(g => allGenreNames.has(g));

    const hiddenGenres = validHidden.filter(name => genres_list.find(g => g.name === name)?.type === 'genre');
    const hiddenTags = validHidden.filter(name => genres_list.find(g => g.name === name)?.type === 'tag');

    return { genres: hiddenGenres, tags: hiddenTags };
}

async function fetchAniListPaginated(
    query: string,
    variables: Record<string, any>,
    hidden: { genres: string[], tags: string[] },
    addLog: (message: string, type?: LogEntry['type'], details?: any) => void
): Promise<{ data: Anime[]; hasNextPage: boolean }> {
    const finalVariables = {
        ...variables,
        genre_not_in: hidden.genres,
        tag_not_in: hidden.tags,
    };
    const response = await fetchAniList<{ Page: { media: AniListMedia[], pageInfo: { hasNextPage: boolean } } }>(
        query,
        finalVariables,
        addLog
    );
    return {
        data: response?.Page?.media.map(mapAniListMediaToAnime) || [],
        hasNextPage: response?.Page?.pageInfo?.hasNextPage || false,
    };
}

async function paginatedRequest(query: string, variables: any, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) {
    const listData = await get<ListData>('animesync_local_list_data');
    const hidden = await getHiddenGenres(listData);
    return fetchAniListPaginated(query, variables, hidden, addLog || (() => {}));
}

export async function getHomePageData(addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<Record<string, Anime[]>> {
    const effectiveLog = addLog || (() => {});
    try {
        const listData = await get<ListData>('animesync_local_list_data');
        const hidden = await getHiddenGenres(listData);

        const variables = {
            currentSeason: getCurrentSeason(),
            currentYear: new Date().getFullYear(),
            genre_not_in: hidden.genres,
            tag_not_in: hidden.tags,
        };

        const response = await fetchAniList<Record<string, { media: AniListMedia[] }>>(HOME_PAGE_QUERY, variables, effectiveLog, 'getHomePageData');
        
        if (!response) {
            return {};
        }

        const mappedData: Record<string, Anime[]> = {};
        for (const key in response) {
            if (Object.prototype.hasOwnProperty.call(response, key)) {
                mappedData[key] = response[key].media.map(mapAniListMediaToAnime);
            }
        }
        return mappedData;

    } catch (error) {
        effectiveLog('Failed to fetch home page data', 'error', error);
        return {};
    }
}

// New simplified functions
export const getTrending = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['TRENDING_DESC', 'POPULARITY_DESC'], type: 'ANIME' }, addLog);
export const getTop = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['SCORE_DESC'], type: 'ANIME' }, addLog);
export const getPopular = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['POPULARITY_DESC'], type: 'ANIME' }, addLog);
export const getTopMovies = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['SCORE_DESC'], type: 'ANIME', format: 'MOVIE' }, addLog);
export const getLatestMovies = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(LATEST_MOVIES_QUERY, { page, perPage }, addLog);
export const getLatestAdditions = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['ID_DESC'] }, addLog);
export const getAiringNow = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(AIRING_QUERY, { page, perPage }, addLog);
export const getUpcoming = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(UPCOMING_QUERY, { page, perPage }, addLog);

export const getTrendingManga = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['TRENDING_DESC'], type: 'MANGA' }, addLog);
export const getPopularManga = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['POPULARITY_DESC'], type: 'MANGA' }, addLog);
export const getTopManga = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(PAGINATED_LIST_QUERY, { page, perPage, sort: ['SCORE_DESC'], type: 'MANGA' }, addLog);
export const getReleasingManga = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(MANGA_STATUS_QUERY, { page, perPage, type: 'MANGA', status: 'RELEASING' }, addLog);
export const getUpcomingManga = (page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void) => paginatedRequest(MANGA_STATUS_QUERY, { page, perPage, type: 'MANGA', status: 'NOT_YET_RELEASED' }, addLog);

export async function getTopThisSeason(page: number, perPage: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<{data: Anime[], hasNextPage: boolean}> {
    const variables = { 
        page, 
        perPage, 
        season: getCurrentSeason(), 
        seasonYear: new Date().getFullYear(),
    };
    return paginatedRequest(TOP_THIS_SEASON_QUERY, variables, addLog);
}

export async function getMultipleAnimeFromAniList(anilistIds: number[], addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<Anime[]> {
    const effectiveLog = addLog || (() => {});
    if (anilistIds.length === 0) return [];
    
    try {
        const listData = await get<ListData>('animesync_local_list_data');
        const hidden = await getHiddenGenres(listData);
        const response = await fetchAniList<{ Page: { media: AniListMedia[] } }>(
            MULTIPLE_ANIME_QUERY,
            { ids: anilistIds, genre_not_in: hidden.genres, tag_not_in: hidden.tags },
            effectiveLog,
            'getMultipleAnimeFromAniList'
        );
        return response?.Page?.media.map(mapAniListMediaToAnime) || [];
    } catch (error) {
        effectiveLog('Failed to fetch multiple anime', 'error', error);
        return [];
    }
}

export async function getMediaByAniListId(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<Anime | null> {
    const effectiveLog = addLog || (() => {});
    try {
        const listData = await get<ListData>('animesync_local_list_data');
        const hidden = await getHiddenGenres(listData);
        const response = await fetchAniList<{ Media: AniListMedia }>(
            MEDIA_BY_ID_QUERY,
            { id: anilistId, genre_not_in: hidden.genres, tag_not_in: hidden.tags },
            effectiveLog,
            `getMediaByAniListId-${anilistId}`
        );
        return response ? mapAniListMediaToAnime(response.Media) : null;
    } catch (error) {
        effectiveLog(`Failed to get media by AniList ID ${anilistId}`, 'error', error);
        return null;
    }
}


export async function getAnimeEpisodes(anilistId: number, addLog: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<AniListStreamingEpisode[]> {
  const effectiveLog = addLog || (() => {});
  try {
      const response = await fetchAniList<{ Media: { streamingEpisodes: AniListStreamingEpisode[] } }>(
        EPISODES_QUERY, { id: anilistId }, effectiveLog, 'getAnimeEpisodes'
      );
      return response?.Media?.streamingEpisodes || [];
  } catch(err) {
      effectiveLog(`Failed to fetch AniList episodes for ID ${anilistId}`, 'warn');
      return [];
  }
}

export async function getMediaBySeason(
  year: number,
  season: string,
  page: number,
  perPage: number,
  filter: string,
  addLog: (message: string, type?: LogEntry['type'], details?: any) => void
): Promise<{ data: Anime[]; hasNextPage: boolean }> {
    const listData = await get<ListData>('animesync_local_list_data');
    const hidden = await getHiddenGenres(listData);
    const variables: any = {
        page,
        perPage,
        season: season.toUpperCase(),
        seasonYear: year,
        type: 'ANIME',
        genre_not_in: hidden.genres,
        tag_not_in: hidden.tags,
    };
    if (filter && filter !== 'all') {
        variables.format_in = [filter.toUpperCase()];
    }
    const response = await fetchAniList<{ Page: { media: AniListMedia[], pageInfo: { hasNextPage: boolean } } }>(
        SEASON_MEDIA_QUERY,
        variables,
        addLog
    );
    return {
        data: response?.Page?.media.map(mapAniListMediaToAnime) || [],
        hasNextPage: response?.Page?.pageInfo.hasNextPage || false,
    };
}

export async function getAnimeRecommendations(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<Anime[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Media: { recommendations: { edges: { node: { mediaRecommendation: AniListMedia } }[] } } }>(
            RECOMMENDATIONS_QUERY,
            { id: anilistId },
            effectiveLog,
            'getAnimeRecommendations'
        );
        return response?.Media?.recommendations.edges.map(edge => mapAniListMediaToAnime(edge.node.mediaRecommendation)) || [];
    } catch (error) {
        effectiveLog(`Failed to fetch AniList recommendations for ID ${anilistId}`, 'warn');
        return [];
    }
}

export async function getAnimeCharacters(malId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanCharacter[]> {
    if (!malId) return [];
    const effectiveLog = addLog || (() => {});
    try {
        const response = await jikanApiRequest(`/anime/${malId}/characters`, effectiveLog);
        return response.data as JikanCharacter[];
    } catch (error: any) {
        effectiveLog(`Failed to fetch Jikan characters for MAL ID ${malId}: ${error.message}`, 'error');
        throw error;
    }
}


export async function getAnimeStaff(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanStaff[]> {
     const effectiveLog = addLog || (() => {});
     try {
        const response = await fetchAniList<{ Media: { staff: { edges: any[] } } }>(STAFF_QUERY, { id: anilistId }, effectiveLog);
        return response?.Media?.staff.edges.map(edge => ({
            person: {
                mal_id: edge.node.id,
                name: edge.node.name.full,
                images: { jpg: { image_url: edge.node.image.large } },
            },
            positions: [edge.role]
        })) || [];
    } catch (e) {
        effectiveLog(`Failed to get staff for AniList ID ${anilistId}`, 'warn');
        return [];
    }
}

export async function getAnimeReviews(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanReview[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Media: { reviews: { nodes: any[] } } }>(REVIEWS_QUERY, { id: anilistId }, effectiveLog);
        return response?.Media?.reviews.nodes.map(node => ({
            mal_id: node.id,
            user: { 
                username: node.user.name, 
                url: `https://anilist.co/user/${node.user.name}`,
                images: { webp: { image_url: node.user.avatar.large }, jpg: { image_url: node.user.avatar.large } }
            },
            date: new Date(node.createdAt * 1000).toISOString(),
            review: node.body,
            score: node.score,
            reactions: { nice: node.rating, confusing: 0, creative: 0, funny: 0, informative: 0, love_it: 0, overall: node.ratingAmount, well_written: 0 },
            is_spoiler: node.body?.includes('~!') || false,
        })) || [];
    } catch (e) {
        effectiveLog(`Failed to get reviews for AniList ID ${anilistId}`, 'warn');
        return [];
    }
}

export async function getAnimePictures(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanPicture[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Media: { bannerImage: string, coverImage: { extraLarge: string } } }>(PICTURES_QUERY, { id: anilistId }, effectiveLog);
        const pictures: JikanPicture[] = [];
        if (response?.Media?.bannerImage) pictures.push({ jpg: { image_url: response.Media.bannerImage } });
        if (response?.Media?.coverImage?.extraLarge) pictures.push({ jpg: { image_url: response.Media.coverImage.extraLarge } });
        return pictures;
    } catch (e) {
        effectiveLog(`Failed to get pictures for AniList ID ${anilistId}`, 'warn');
        return [];
    }
}

export async function getAnimeVideos(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanVideo[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Media: { trailer: any, streamingEpisodes: any[] } }>(VIDEOS_QUERY, { id: anilistId }, effectiveLog);
        const videos: JikanVideo[] = [];
        if (response?.Media?.trailer) {
            videos.push({ title: 'Official Trailer', trailer: { ...response.Media.trailer, images: { maximum_image_url: response.Media.trailer.thumbnail } } });
        }
        response?.Media?.streamingEpisodes?.forEach(ep => {
            videos.push({ title: ep.title, trailer: { youtube_id: '', url: ep.url, embed_url: '', images: { maximum_image_url: ep.thumbnail } } });
        });
        return videos;
    } catch(e) {
        effectiveLog(`Failed to get videos for AniList ID ${anilistId}`, 'warn');
        return [];
    }
}


export async function getCharacterDetails(characterId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanCharacterDetail | null> {
    // Jikan is the source of truth for character details
    const effectiveLog = addLog || (() => {});
    try {
        const response = await jikanApiRequest(`/characters/${characterId}/full`, effectiveLog);
        return response.data as JikanCharacterDetail;
    } catch (error: any) {
        effectiveLog(`Failed to fetch Jikan character details for ID ${characterId}: ${error.message}`, 'error');
        throw error;
    }
}


export async function getPersonDetails(personId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<JikanPerson | null> {
    // Jikan is the source of truth for person details
    const effectiveLog = addLog || (() => {});
    try {
        const response = await jikanApiRequest(`/people/${personId}/full`, effectiveLog);
        return response.data as JikanPerson;
    } catch (error: any) {
        effectiveLog(`Failed to fetch Jikan person details for ID ${personId}: ${error.message}`, 'error');
        throw error;
    }
}

export async function getCharacterPictures(characterId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
    const effectiveLog = addLog || (() => {});
    try {
         const response = await fetchAniList<{ Character: { image: { large: string } } }>(CHAR_PICS_QUERY, { id: characterId }, effectiveLog);
         return response?.Character?.image?.large ? [{ jpg: { image_url: response.Character.image.large } }] : [];
    } catch (error: any) {
        effectiveLog(`Failed to fetch character pictures for ID ${characterId}: ${error.message}`, 'warn');
        return [];
    }
}
export async function getPersonPictures(personId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
     const effectiveLog = addLog || (() => {});
    try {
         const response = await fetchAniList<{ Staff: { image: { large: string } } }>(PERSON_PICS_QUERY, { id: personId }, effectiveLog);
         return response?.Staff?.image?.large ? [{ jpg: { image_url: response.Staff.image.large } }] : [];
    } catch (e) {
        effectiveLog(`Failed to get person pictures for ID ${personId}`, 'warn');
        return [];
    }
}
export async function getMangaCharacters(mangaId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
    const effectiveLog = addLog || (() => {});
     try {
        const response = await fetchAniList<{ Media: { characters: { edges: any[] } } }>(MANGA_CHARS_QUERY, { id: mangaId }, effectiveLog);
        return response?.Media?.characters?.edges.map(edge => ({
            character: { ...edge.node, mal_id: edge.node.id, images: { webp: { image_url: edge.node.image.large }, jpg: { image_url: edge.node.image.large } } },
            role: edge.role
        })) || [];
    } catch (error: any) {
        effectiveLog(`Failed to fetch manga characters for ID ${mangaId}: ${error.message}`, 'error');
        throw error;
    }
}
export async function getMangaStaff(mangaId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
     return getAnimeStaff(mangaId, addLog); // Same query works
}
export async function getMangaReviews(mangaId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
     return getAnimeReviews(mangaId, addLog); // Same query works
}
export async function getMangaRecommendations(mangaId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
     return getAnimeRecommendations(mangaId, addLog); // Same query works
}

export async function getSeasonsList(addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ SeasonList: { media: { season: string, seasonYear: number }[] } }>(SEASONS_QUERY, {}, effectiveLog);
        const seasonsMap = new Map<number, Set<string>>();
        response?.SeasonList?.media.forEach(item => {
            if (item.seasonYear && item.season) {
                if (!seasonsMap.has(item.seasonYear)) {
                    seasonsMap.set(item.seasonYear, new Set());
                }
                seasonsMap.get(item.seasonYear)?.add(item.season.toLowerCase());
            }
        });
        
        return Array.from(seasonsMap.entries())
            .map(([year, seasons]) => ({ year, seasons: Array.from(seasons) }))
            .sort((a, b) => b.year - a.year);

    } catch(e) {
        if(addLog) addLog(`Failed to fetch seasons list: ${(e as Error).message}`, 'warn');
        return [];
    }
}


export async function getLatestRecommendations(page: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await jikanApiRequest('/recommendations/anime', effectiveLog, new URLSearchParams({ page: String(page) }));
        return { data: response.data, hasNextPage: response.pagination.has_next_page };
    } catch (e) {
        effectiveLog(`Failed to get latest recommendations`, 'warn');
        return { data: [], hasNextPage: false };
    }
}

export async function getLatestMediaCounts(
    mediaIds: number[],
    addLog?: (message: string, type?: LogEntry['type'], details?: any) => void
): Promise<Map<number, { episodes: number | null; chapters: number | null; volumes: number | null }>> {
    const effectiveLog = addLog || (() => {});
    const countsMap = new Map<number, { episodes: number | null; chapters: number | null; volumes: number | null }>();
    if (mediaIds.length === 0) return countsMap;
    
    try {
        const response = await fetchAniList<{ Page: { media: any[] } }>(MEDIA_COUNTS_QUERY, { ids: mediaIds }, effectiveLog);
        response?.Page?.media.forEach(m => {
            countsMap.set(m.id, { episodes: m.episodes, chapters: m.chapters, volumes: m.volumes });
        });
    } catch(e) {
        effectiveLog(`Failed to get media counts for ${mediaIds.length} items`, 'warn', e);
    }

    return countsMap;
}


export async function searchMediaGraphQL(variables: any, addLog: (message: string, type?: LogEntry['type'], details?: any) => void) {
    const effectiveLog = addLog || (() => {});
    const listData = await get<ListData>('animesync_local_list_data');
    const hidden = await getHiddenGenres(listData);
    const finalVariables = {
        ...variables,
        isAdult: false,
        genre_not_in: hidden.genres,
        tag_not_in: hidden.tags,
    };
    
    try {
        const response = await fetchAniList<{ Page: { media: AniListMedia[], pageInfo: { hasNextPage: boolean, currentPage: number } } }>(
            SEARCH_QUERY,
            finalVariables,
            effectiveLog,
            "Search"
        );
        
        return {
            media: response?.Page?.media || [],
            pageInfo: {
                ...response?.Page?.pageInfo,
                hasNextPage: response?.Page?.pageInfo.hasNextPage || false
            }
        };
    } catch (error) {
        effectiveLog(`AniList search failed: ${(error as Error).message}`, 'error', { variables });
        throw error;
    }
}


export async function searchCharacters(query: string, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any[]> {
    const effectiveLog = addLog || (() => {});
    try {
        // Jikan is better for character search
        const response = await jikanApiRequest('/characters', effectiveLog, new URLSearchParams({q: query, order_by: 'favorites', sort: 'desc'}));
        return response?.data?.map((char: any) => ({
            id: char.mal_id,
            name: { full: char.name },
            image: { large: char.images.jpg.image_url }
        })) || [];
    } catch (e) {
        effectiveLog(`Failed to search characters: ${e}`, 'warn');
        return [];
    }
}

export async function getCharacter(id: number, source: "anilist" | "jikan" = "anilist", addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<any> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Character: any }>(CHARACTER_DETAILS_QUERY, { id }, effectiveLog);
        return response?.Character;
    } catch(e) {
        effectiveLog(`Failed to get character with media: ${id}`, 'warn');
        return null;
    }
}

export async function getMediaRelations(anilistId: number, addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<Anime[]> {
    const effectiveLog = addLog || (() => {});
    try {
        const response = await fetchAniList<{ Media: { relations: { edges: any[] } } }>(MEDIA_RELATIONS_QUERY, { id: anilistId }, effectiveLog);
        return response?.Media?.relations.edges.map(edge => mapAniListMediaToAnime({ ...edge.node, relationType: edge.relationType })) || [];
    } catch (error) {
        effectiveLog(`Failed to get media relations for AniList ID ${anilistId}`, 'warn');
        return [];
    }
}

export async function getJikanGenresAndThemes(addLog?: (message: string, type?: LogEntry['type'], details?: any) => void): Promise<{ genres: JikanGenre[], themes: JikanGenre[] }> {
    const effectiveLog = addLog || (() => {});
    
    try {
        const [genresResponse, themesResponse] = await Promise.all([
             jikanApiRequest('/genres/anime', effectiveLog, new URLSearchParams({ filter: 'genres' })),
             jikanApiRequest('/genres/anime', effectiveLog, new URLSearchParams({ filter: 'themes' }))
        ]);

        const genres: JikanGenre[] = (genresResponse.data as any[]).map(item => ({
            mal_id: item.mal_id,
            name: item.name,
            url: item.url,
            count: item.count,
            type: 'genre',
        }));

        const themes: JikanGenre[] = (themesResponse.data as any[]).map(item => ({
            mal_id: item.mal_id,
            name: item.name,
            url: item.url,
            count: item.count,
            type: 'tag',
        }));

        effectiveLog('Successfully fetched and processed genres and themes from Jikan', 'info');
        return { genres, themes };

    } catch (error: any) {
        effectiveLog(`Failed to fetch Jikan genres/themes: ${error.message}`, 'error');
        throw error;
    }
}
