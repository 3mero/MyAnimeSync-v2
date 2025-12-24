"use client"
import { useState } from "react"
import type React from "react"

import Link from "next/link"
import { ArrowRight, PlusCircle } from "lucide-react"
import type { Anime } from "@/lib/types"
import { AnimeCard } from "./anime-card"
import { AnimeListSkeleton } from "./anime-list-skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"

const INITIAL_VISIBLE_COUNT = 5
const LOAD_MORE_COUNT = 5

type ListType =
  | "trending"
  | "top"
  | "upcoming"
  | "popular"
  | "airing"
  | "movies"
  | "topMovies"
  | "topThisSeason"
  | "trendingManga"
  | "popularManga"
  | "topManga"
  | "releasingManga"
  | "upcomingManga"
  | "latestAdditions"

interface AnimeListProps {
  animes?: Anime[] | null
  title: string
  type: ListType
  isLoading?: boolean
  Icon?: React.ElementType
}

export { AnimeListSkeleton } from "./anime-list-skeleton"

export function AnimeList({ animes, title, type, isLoading, Icon }: AnimeListProps) {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  if (isLoading) {
    return <AnimeListSkeleton title={title} Icon={Icon} />
  }

  if (!animes || animes.length === 0) {
    // Don't render anything if there are no animes, even the title.
    // The skeleton handles the loading state.
    return null
  }

  const visibleAnimes = animes.slice(0, visibleCount)
  const hasMoreToLoad = visibleCount < animes.length
  const hasMoreOnFullPage = animes.length >= 9 // Original fetch limit was 9

  return (
    <section>
      <Link href={`/list/${type}/1`}>
        <h2 className="text-3xl font-bold font-headline mb-4 hover:text-primary transition-colors inline-flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          {title}
        </h2>
      </Link>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {visibleAnimes.map((anime, index) => (
          <AnimeCard key={anime.id} anime={anime} disableTooltip={true} />
        ))}
      </div>
      {(hasMoreToLoad || hasMoreOnFullPage) && (
        <div className="flex justify-center items-center gap-4 mt-4">
          {hasMoreToLoad && (
            <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}>
              <PlusCircle className="mr-2" /> {t("show_more")}
            </Button>
          )}
          {hasMoreOnFullPage && (
            <Button asChild>
              <Link href={`/list/${type}/1`}>
                {t("view_all")} <ArrowRight className="ml-2" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
