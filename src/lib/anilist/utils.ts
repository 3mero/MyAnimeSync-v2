import type { AniListMedia, Anime, JikanRelation, ListData } from '../types';
import { genres_list } from '@/i18n';
import type { LogEntry } from '@/hooks/use-logger';

export const ANILIST_API_URL = 'https://graphql.anilist.co';
export const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export async function fetchAniList<T>(query: string, variables: Record<string, any> = {}, addLog: (message: string, type?: LogEntry['type'], details?: any) => void, operationName?: string): Promise<T | null> {
    const effectiveLog = addLog || (() => {});
    try {
        // Use the local proxy
        const response = await fetch('/api/anilist/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `AniList API request for ${operationName || 'operation'} failed. Error: ${errorBody}`;
             effectiveLog(errorMessage, 'error', { query, variables });
            throw new Error(errorMessage);
        }
        
        const jsonResponse = await response.json();
        
        if(jsonResponse.errors) {
            const finalError = `GraphQL Error: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`;
             effectiveLog(finalError, 'error', { query, variables });
            throw new Error(finalError);
        }
        
        return jsonResponse.data as T;

    } catch (error) {
        effectiveLog((error as Error).message, 'error', { query, variables });
        throw error;
    }
}

export async function jikanApiRequest(endpoint: string, addLog: (message: string, type?: LogEntry['type'], details?: any) => void, params?: URLSearchParams): Promise<any> {
    const url = new URL(`${JIKAN_API_URL}${endpoint}`);
    if (params) {
        url.search = params.toString();
    }
    
    addLog(`Jikan Request: ${endpoint}`, 'network', { url: url.toString() });

    await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay

    try {
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            const errorBody = await response.text();
            let jsonError = {};
            try {
                jsonError = JSON.parse(errorBody);
            } catch(e) {
                // Ignore if not json
            }
            const error = new Error(JSON.stringify({
                status: response.status,
                message: `Jikan API responded with status ${response.status}`,
                details: jsonError,
            }));
             addLog(`Jikan Failure: ${endpoint}: ${error.message}`, 'error', { url: url.toString() });
            throw error;
        }

        const json = await response.json();
        addLog(`Jikan Success: ${endpoint}`, 'info', { url: url.toString(), status: response.status });
        return json;
    } catch (error: any) {
        addLog(`Jikan Failure: ${endpoint}: ${error.message}`, 'error', { url: url.toString() });
        throw error;
    }
}


function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
}


export function mapJikanMediaToAnime(media: any, relationType?: string): Anime {
    const malId = media.mal_id;
    const anilistId = media.mal_id;

    const genres = media.genres?.map((g: any) => ({ ...g, type: 'genre' })) || [];
    const themes = media.themes?.map((t: any) => ({ ...t, type: 'tag' })) || [];
    const demographics = media.demographics?.map((d: any) => ({ ...d, type: 'tag' })) || [];

    const base: Omit<Anime, 'synopsis'> & { synopsis?: string } = {
        id: anilistId,
        mal_id: malId,
        title: media.title || media.name || 'Unknown Title',
        images: {
          jpg: {
              image_url: media.images?.jpg?.image_url || '',
              small_image_url: media.images?.jpg?.small_image_url || '',
              large_image_url: media.images?.jpg?.large_image_url || '',
          },
          webp: {
              image_url: media.images?.webp?.image_url || '',
              small_image_url: media.images?.webp?.small_image_url || '',
              large_image_url: media.images?.webp?.large_image_url || '',
          }
        },
        type: media.type || 'UNKNOWN',
        url: media.url || '',
        trailer: media.trailer ? {
            youtube_id: media.trailer.youtube_id,
            url: media.trailer.url,
            embed_url: media.trailer.embed_url,
        } : { youtube_id: null, url: null, embed_url: null },
        title_english: media.title_english,
        title_japanese: media.title_japanese,
        format: media.type,
        source: media.source || '',
        episodes: media.episodes,
        chapters: media.chapters,
        volumes: media.volumes,
        status: media.status || '',
        airing: media.airing || false,
        score: media.score,
        scored_by: media.scored_by,
        rank: media.rank,
        popularity: media.popularity,
        year: media.year,
        broadcast: media.broadcast || { day: null, time: null, timezone: null, string: null },
        rating: media.rating,
        genres: [...genres, ...themes, ...demographics],
        studios: media.studios || [],
        relations: media.relations || [],
        authors: media.authors || [],
        relationType,
    };
    
    if (media.synopsis) {
      base.synopsis = media.synopsis;
    }

    return base as Anime;
}


export function mapAniListMediaToAnime(media: AniListMedia & { relationType?: string }): Anime {
  let year = media.seasonYear;
  if (!year && media.startDate?.year) {
    year = media.startDate.year;
  }

  const relations: JikanRelation[] = media.relations?.edges?.map(edge => ({
      relation: edge.relationType,
      entry: [{
        mal_id: edge.node.idMal,
        type: edge.node.type,
        name: edge.node.title.romaji || edge.node.title.english || '',
        url: `https://anilist.co/${edge.node.type.toLowerCase()}/${edge.node.id}`
      }]
    })) || [];
    
  const genres = media.genres?.map(name => {
      const genreData = genres_list.find(g => g.name === name && g.type === 'genre');
      return { mal_id: genreData?.mal_id || 0, name, type: 'genre', url: '' };
  }).filter(g => g.mal_id !== 0) || [];
  
  const tags = media.tags?.map(tag => {
      const genreData = genres_list.find(g => g.name === tag.name && g.type === 'tag');
      return { mal_id: genreData?.mal_id || tag.id, name: tag.name, type: 'tag', url: '' };
  }).filter(t => t.mal_id !== 0) || [];

  const combinedGenres = [...genres, ...tags];

  const anime: Omit<Anime, 'synopsis'> & { synopsis?: string } = {
    mal_id: media.idMal,
    id: media.id, // AniList ID
    url: `https://anilist.co/${media.type.toLowerCase()}/${media.id}`,
    images: {
      jpg: {
        image_url: media.coverImage?.large || '',
        small_image_url: media.coverImage?.large || '',
        large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
      },
      webp: {
        image_url: media.coverImage?.large || '',
        small_image_url: media.coverImage?.large || '',
        large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
      },
    },
    trailer: {
      youtube_id: media.trailer?.site === 'youtube' ? media.trailer.id : null,
      url: media.trailer?.site === 'youtube' ? `https://youtube.com/watch?v=${media.trailer.id}` : null,
      embed_url: media.trailer?.site === 'youtube' ? `https://youtube.com/embed/${media.trailer.id}` : null,
    },
    title: media.title.romaji || media.title.english || '',
    title_english: media.title.english,
    title_japanese: media.title.native,
    type: media.type, // ANIME or MANGA
    format: media.format,
    source: media.source,
    episodes: media.episodes, // For Anime
    nextAiringEpisode: media.nextAiringEpisode,
    chapters: media.chapters, // For Manga
    volumes: media.volumes, // For Manga
    status: media.status,
    airing: media.status === 'RELEASING',
    score: media.averageScore ? media.averageScore / 10 : null,
    scored_by: media.popularity, // Using popularity as a stand-in as scored_by is not in basic query
    rank: media.rankings?.find(r => r.allTime)?.rank || null,
    popularity: media.popularity,
    year: year,
    startDate: media.startDate,
    broadcast: {
      day: media.broadcast?.day || null,
      time: media.broadcast?.time || null,
      timezone: null,
      string: null,
    },
    rating: media.isAdult ? 'Rx - Hentai' : null, // Basic adult flag
    genres: combinedGenres,
    studios: media.studios?.nodes?.map(studio => ({ mal_id: studio.id, name: studio.name, type: 'studio', url: ''})) || [],
    relations: relations,
    relationType: media.relationType,
    authors: media.staff?.edges
        .filter(edge => edge.role === 'Story & Art' || edge.role === 'Story')
        .map(edge => ({
            mal_id: edge.node.id,
            name: edge.node.name.full,
            url: `https://anilist.co/staff/${edge.node.id}`,
            images: { jpg: { image_url: edge.node.image.large } }
        })) || []
  };

  if (media.description) {
    anime.synopsis = stripHtml(media.description);
  }

  return anime as Anime;
}

export function deduplicateAnime(animes: Anime[]): Anime[] {
  if (!animes || animes.length === 0) {
    return [];
  }
  const seen = new Map<number, boolean>();
  const result: Anime[] = [];
  for (const anime of animes) {
    if (anime && anime.id && !seen.has(anime.id)) {
      seen.set(anime.id, true);
      result.push(anime);
    }
  }
  return result;
}
