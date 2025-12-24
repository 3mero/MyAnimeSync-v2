"use client"

import {
  getAiringNow,
  getTop,
  getUpcoming,
  getTrending,
  getPopular,
  getTopMovies,
  getLatestMovies,
  getTopThisSeason,
  getTrendingManga,
  getPopularManga,
  getTopManga,
  getReleasingManga,
  getUpcomingManga,
  getLatestAdditions,
} from "@/lib/anilist"
import type { Anime } from "@/lib/types"
import { PaginatedAnimeGrid } from "@/components/anime/paginated-anime-grid"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { useTranslation } from "@/hooks/use-translation"
import type { translations } from "@/i18n"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/back-button"
import { deduplicateAnime } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { useLogger } from "@/hooks/use-logger"

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

const PAGE_SIZE = 24

type FetcherFunction = (
  page: number,
  perPage: number,
  addLog: (message: string, type?: any, details?: any) => void,
) => Promise<{ data: Anime[]; hasNextPage: boolean }>

const listConfig: Record<ListType, { titleKey: keyof typeof translations.ar; fetcher: FetcherFunction }> = {
  // Anime
  trending: { titleKey: "trending_this_season", fetcher: getTrending },
  top: { titleKey: "top_rated_anime", fetcher: getTop },
  topThisSeason: { titleKey: "top_this_season", fetcher: getTopThisSeason },
  upcoming: { titleKey: "upcoming_season", fetcher: getUpcoming },
  airing: { titleKey: "airing_now", fetcher: getAiringNow },
  popular: { titleKey: "most_popular", fetcher: getPopular },
  movies: { titleKey: "latest_movies", fetcher: getLatestMovies },
  topMovies: { titleKey: "top_movies", fetcher: getTopMovies },
  latestAdditions: { titleKey: "latest_additions", fetcher: getLatestAdditions },
  // Manga
  trendingManga: { titleKey: "trending_manga", fetcher: getTrendingManga },
  popularManga: { titleKey: "popular_manga", fetcher: getPopularManga },
  topManga: { titleKey: "top_manga", fetcher: getTopManga },
  releasingManga: { titleKey: "releasing_manga", fetcher: getReleasingManga },
  upcomingManga: { titleKey: "upcoming_manga", fetcher: getUpcomingManga },
}

function LoadingSkeleton() {
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="w-24 h-10 mb-4">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="text-center mb-8">
        <Skeleton className="h-9 w-1/2 mx-auto" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-0">
              <Skeleton className="aspect-[2/3] w-full" />
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

function ListPageClient() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { addLog } = useLogger()

  const [animes, setAnimes] = useState<Anime[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasNextPage, setHasNextPage] = useState(false)

  const [pageNumber, setPageNumber] = useState(1)
  const [listType, setListType] = useState<ListType | null>(null)
  const [basePath, setBasePath] = useState("")

  useEffect(() => {
    const typeParam = params.type
    const pageParam = params.page
    const currentType = (Array.isArray(typeParam) ? typeParam[0] : typeParam) as ListType
    const currentPageString = Array.isArray(pageParam) ? pageParam[0] : pageParam
    const currentPage = Number.parseInt(currentPageString || "1", 10)

    if (isNaN(currentPage) || currentPage < 1 || !listConfig[currentType]) {
      notFound()
      return
    }

    setListType(currentType)
    setPageNumber(currentPage)
    setBasePath(`/list/${currentType}`)

    async function fetchData() {
      setIsLoading(true)
      const config = listConfig[currentType]
      try {
        const { data, hasNextPage } = await config.fetcher(currentPage, PAGE_SIZE, addLog)
        setAnimes(deduplicateAnime(data))
        setHasNextPage(hasNextPage)
      } catch (e) {
        console.error(e)
        setAnimes([])
        setHasNextPage(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params, addLog])

  if (isLoading && !animes) {
    return <LoadingSkeleton />
  }

  if (!listType) {
    return <LoadingSkeleton />
  }

  const config = listConfig[listType]
  const title = t(config.titleKey)

  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        <PaginatedAnimeGrid
          animes={animes || []}
          title={title}
          basePath={basePath}
          currentPage={pageNumber}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          searchParams={searchParams.toString()}
        />
      </div>
    </main>
  )
}

export default function ListPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ListPageClient />
    </Suspense>
  )
}
