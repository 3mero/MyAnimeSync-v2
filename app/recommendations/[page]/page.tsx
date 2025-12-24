"use client"

import { useEffect, useState, useMemo } from "react"
import { getLatestRecommendations } from "@/lib/anilist"
import { LatestRecommendationCard } from "@/components/anime/latest-recommendation-card"
import { Sparkles, Search as SearchIcon } from "lucide-react"
import type { JikanGenericRecommendation } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/use-translation"

function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-80 w-full" />
      ))}
    </div>
  )
}

// Fetch multiple pages of recommendations for a more comprehensive search.
async function fetchAllRecommendations(totalPages = 5): Promise<JikanGenericRecommendation[]> {
  let allRecs: JikanGenericRecommendation[] = []
  for (let i = 1; i <= totalPages; i++) {
    try {
      const { data, hasNextPage } = await getLatestRecommendations(i)
      allRecs = [...allRecs, ...data]
      if (!hasNextPage) break
    } catch (error) {
      console.error(`Failed to fetch page ${i} of recommendations:`, error)
      // Stop fetching if one page fails
      break
    }
  }
  // Create a unique key for each recommendation based on the anime titles and content
  // to filter out true duplicates that may appear across paginated API results.
  const uniqueRecs = Array.from(
    new Map(
      allRecs.map((rec) => {
        const key = rec.entry[0]?.mal_id + "-" + rec.entry[1]?.mal_id + "-" + rec.user.username
        return [key, rec]
      }),
    ).values(),
  )
  return uniqueRecs
}

export default function LatestRecommendationsPage() {
  const [allRecommendations, setAllRecommendations] = useState<JikanGenericRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const data = await fetchAllRecommendations()
      setAllRecommendations(data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const filteredRecommendations = useMemo(() => {
    if (!searchQuery) return allRecommendations
    return allRecommendations.filter((rec) =>
      rec.entry.some((anime) => anime.title.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [allRecommendations, searchQuery])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          {t("latest_community_recs")}
        </h1>
        <div className="relative flex-1 max-w-md mx-auto mt-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search_in_recommendations")}
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            {searchQuery ? `${t("no_recommendations_for")} "${searchQuery}".` : t("could_not_load_recs")}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec, index) => (
            <LatestRecommendationCard key={`${rec.mal_id}-${index}`} rec={rec} />
          ))}
        </div>
      )}
    </main>
  )
}
