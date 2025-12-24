"use client"

import type React from "react"
import { useState, useCallback, useEffect, Suspense } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { useLogger } from "@/hooks/use-logger"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { searchMediaGraphQL } from "@/lib/anilist"
import { mapAniListMediaToAnime } from "@/lib/anilist/utils"
import type { Anime } from "@/lib/types"
import { AnimeCard } from "@/components/anime/anime-card"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useSearchParams, useRouter } from "next/navigation"

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
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
  )
}

function PageLoadingSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
      <div className="flex items-center gap-2 max-w-2xl mx-auto mb-8">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 w-12" />
      </div>
      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-96 w-full" />
        </aside>
        <section className="md:col-span-3">
          <SearchSkeleton />
        </section>
      </div>
    </main>
  )
}

const initialFilters = {
  type: null as "ANIME" | "MANGA" | null,
  format: null as string | null,
  status: null as string | null,
  year: "",
  sort: "POPULARITY_DESC",
}

function SearchPageClient() {
  const { t } = useTranslation()
  const { addLog } = useLogger()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Anime[]>([])
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(Number.parseInt(searchParams.get("page") || "1", 10))
  const [hasNextPage, setHasNextPage] = useState(false)

  // To keep track of the query that produced the current results
  const [activeQuery, setActiveQuery] = useState(searchParams.get("q") || "")
  const [filters, setFilters] = useState(() => {
    const initial = { ...initialFilters }
    searchParams.forEach((value, key) => {
      if (key in initial) {
        ;(initial as any)[key] = value === "ALL" ? null : value
      }
    })
    return initial
  })

  const handleSearch = useCallback(
    async (page = 1, shouldUpdateUrl = false) => {
      setIsLoading(true)
      setError(null)
      if (page === 1) {
        setResults([])
      }

      const searchQuery = query.trim()
      if (searchQuery) {
        setActiveQuery(searchQuery)
      }
      addLog(`Performing search for: "${searchQuery}", page: ${page}`, "info", { filters })

      if (shouldUpdateUrl) {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        params.set("page", String(page))
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "ALL") {
            params.set(key, String(value))
          }
        })
        router.push(`/search?${params.toString()}`)
      }

      try {
        const variables: any = {
          search: searchQuery || undefined,
          page: page,
          sort: filters.sort,
        }
        if (filters.type) variables.type = filters.type
        if (filters.format) variables.format = [filters.format]
        if (filters.status) variables.status = filters.status
        if (filters.year) variables.seasonYear = Number.parseInt(filters.year, 10)

        // The searchMediaGraphQL function will now automatically apply hidden genres
        const data = await searchMediaGraphQL(variables, addLog)

        if (data?.media) {
          const mappedData = data.media.map(mapAniListMediaToAnime)
          setResults(page === 1 ? mappedData : [...results, ...mappedData])
          setHasNextPage(data.pageInfo.hasNextPage)
          setCurrentPage(data.pageInfo.currentPage)

          if (mappedData.length === 0 && page === 1) {
            setError(t("no_results_found"))
          }
        } else {
          setResults([])
          setHasNextPage(false)
          setError(t("no_results_found"))
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.")
        addLog(`Search failed: ${e.message}`, "error", e)
      } finally {
        setIsLoading(false)
      }
    },
    [query, filters, addLog, t, router, results],
  )

  useEffect(() => {
    // Run search on initial load if there are params in the URL
    if (searchParams.toString()) {
      handleSearch(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value === "ALL" ? null : value }
    setFilters(newFilters)
    // Automatically search when filters change
    handleSearch(1, true)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    handleSearch(1, true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(1, true)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-center mb-2">{t("search")}</h1>
        <p className="text-center text-muted-foreground">{t("search_for_anime")}</p>
      </div>

      <div className="flex items-center gap-2 max-w-2xl mx-auto mb-8">
        <Input
          placeholder={t("search_for_anime")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-12 text-lg"
        />
        <Button onClick={() => handleSearch(1, true)} size="lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <SearchIcon />}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">{t("filters")}</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>{t("type")}</Label>
                <Select value={filters.type || ""} onValueChange={(v) => handleFilterChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_a_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("all")}</SelectItem>
                    <SelectItem value="ANIME">{t("anime")}</SelectItem>
                    <SelectItem value="MANGA">{t("manga")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("format")}</Label>
                <Select value={filters.format || ""} onValueChange={(v) => handleFilterChange("format", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_a_format")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("all_formats")}</SelectItem>
                    <SelectItem value="TV">{t("tv")}</SelectItem>
                    <SelectItem value="TV_SHORT">{t("tv_short")}</SelectItem>
                    <SelectItem value="MOVIE">{t("movie")}</SelectItem>
                    <SelectItem value="SPECIAL">{t("special")}</SelectItem>
                    <SelectItem value="OVA">{t("ova")}</SelectItem>
                    <SelectItem value="ONA">{t("ona")}</SelectItem>
                    <SelectItem value="MUSIC">{t("music")}</SelectItem>
                    <SelectItem value="MANGA">{t("manga")}</SelectItem>
                    <SelectItem value="NOVEL">{t("novel")}</SelectItem>
                    <SelectItem value="ONE_SHOT">{t("one-shot")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("status")}</Label>
                <Select value={filters.status || ""} onValueChange={(v) => handleFilterChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_a_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("all_statuses")}</SelectItem>
                    <SelectItem value="RELEASING">{t("airing")}</SelectItem>
                    <SelectItem value="FINISHED">{t("complete")}</SelectItem>
                    <SelectItem value="NOT_YET_RELEASED">{t("upcoming")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("year")}</Label>
                <Input
                  type="number"
                  placeholder={t("any_year")}
                  value={filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("order_by")}</Label>
                <Select value={filters.sort} onValueChange={(v) => handleFilterChange("sort", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POPULARITY_DESC">{t("popularity")}</SelectItem>
                    <SelectItem value="SCORE_DESC">{t("score")}</SelectItem>
                    <SelectItem value="TRENDING_DESC">{t("trending_this_season")}</SelectItem>
                    <SelectItem value="FAVOURITES_DESC">{t("favorites")}</SelectItem>
                    <SelectItem value="START_DATE_DESC">{t("newest")}</SelectItem>
                    <SelectItem value="START_DATE">{t("oldest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" onClick={resetFilters} className="w-full mt-4">
                {t("reset_filters")}
              </Button>
            </CardContent>
          </Card>
        </aside>

        <section className="md:col-span-3">
          {isLoading && results.length === 0 ? (
            <SearchSkeleton />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              {activeQuery && (
                <p className="text-muted-foreground mb-4">{t("search_results_for", { query: activeQuery })}</p>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
              <PaginationControls
                basePath="/search"
                currentPage={currentPage}
                hasNextPage={hasNextPage}
                onPageChange={(page) => handleSearch(page, true)}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {!activeQuery ? t("search_for_anime") : t("try_different_search")}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <SearchPageClient />
    </Suspense>
  )
}
