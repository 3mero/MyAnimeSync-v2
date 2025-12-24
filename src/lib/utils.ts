import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Anime } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
