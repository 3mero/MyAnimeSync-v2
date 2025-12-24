"use client"

import { getMediaBySeason } from "@/lib/anilist"
import type { Anime } from "@/lib/types"
import { PaginatedAnimeGrid } from "@/components/anime/paginated-anime-grid"
import { notFound, useParams, useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense, useTransition } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Skeleton } from "@/components/ui/skeleton"
import type { translations } from "@/i18n"
import { deduplicateAnime } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useLogger } from "@/hooks/use-logger"

const validSeasons = ["winter", "spring", "summer", "fall"]
const filterTypes = ["all", "tv", "movie"]
const PAGE_SIZE = 24

function LoadingSkeleton({ title }: { title: string }) {
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="text-center my-4">
        <Skeleton className="h-9 w-1/2 mx-auto" />
      </div>
      <div className="flex justify-end mb-6 max-w-xs ml-auto">
        <div className="w-full space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className={gridClass}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-0">
              <Skeleton className="aspect-[2/3] w-full" />
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-5 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

function SeasonPageClient() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { addLog } = useLogger()
  const [isPending, startTransition] = useTransition()

  const [allAnimes, setAllAnimes] = useState<Anime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasNextPage, setHasNextPage] = useState(false)

  const pageParam = params.page
  const page = Array.isArray(pageParam) ? Number.parseInt(pageParam[0], 10) : Number.parseInt(pageParam, 10)

  const yearParam = params.year
  const seasonParam = params.season
  const year = Array.isArray(yearParam) ? yearParam[0] : yearParam
  const season = (Array.isArray(seasonParam) ? seasonParam[0] : seasonParam).toLowerCase()
  const yearNumber = Number.parseInt(year, 10)

  const typeFilter = searchParams.get("filter") || "all"

  useEffect(() => {
    if (isNaN(yearNumber) || isNaN(page) || page < 1 || !validSeasons.includes(season)) {
      notFound()
      return
    }

    const fetchAnimes = async () => {
      setIsLoading(true)
      const { data, hasNextPage: newHasNextPage } = await getMediaBySeason(
        yearNumber,
        season,
        page,
        PAGE_SIZE,
        typeFilter,
        addLog,
      )
      setAllAnimes(deduplicateAnime(data))
      setHasNextPage(newHasNextPage)
      setIsLoading(false)
    }
    fetchAnimes()
  }, [year, season, yearNumber, page, typeFilter, addLog])

  const handleFilterChange = (value: string) => {
    const currentParams = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      currentParams.set("filter", value)
    } else {
      currentParams.delete("filter")
    }

    startTransition(() => {
      router.push(`/seasons/${year}/${season}/1?${currentParams.toString()}`)
    })
  }

  const title = t("season_year")
    .replace("{{season}}", t(season as keyof typeof translations.ar))
    .replace("{{year}}", year)

  if (isLoading && allAnimes.length === 0) {
    // Only show big skeleton on initial load
    return <LoadingSkeleton title={title} />
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline">{title}</h1>
      </div>

      <div className="flex justify-end mb-6 max-w-xs ml-auto">
        <div className="w-full space-y-2">
          <Label htmlFor="type_filter" className="text-muted-foreground">
            {t("filter_by_type")}
          </Label>
          <Select value={typeFilter} onValueChange={handleFilterChange} disabled={isPending}>
            <SelectTrigger id="type_filter">
              <SelectValue placeholder={t("filter_by_type")} />
            </SelectTrigger>
            <SelectContent>
              {filterTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(type as keyof typeof translations.ar)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PaginatedAnimeGrid
        animes={allAnimes}
        title=""
        basePath={`/seasons/${year}/${season}`}
        currentPage={page}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        searchParams={searchParams.toString()}
      />
    </main>
  )
}

export default function SeasonPage() {
  return (
    <Suspense fallback={<LoadingSkeleton title="Loading Season..." />}>
      <SeasonPageClient />
    </Suspense>
  )
}
