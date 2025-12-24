"use client"

import { useEffect, useState } from "react"
import { useParams, notFound } from "next/navigation"
import type { Anime } from "@/lib/types"
import { getMediaByAniListId, getAnimeRecommendations } from "@/lib/anilist"

import { RecommendedAnimeList } from "@/components/anime/recommended-anime-list"
import { ServerCrash } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimeDetails } from "@/components/anime/details/anime-details"
import { AnimeTabs } from "@/components/anime/details/anime-tabs"
import { useTranslation } from "@/hooks/use-translation"
import { BackButton } from "@/components/ui/back-button"
import { useLogger } from "@/hooks/use-logger"

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="h-7 w-48" />
      <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <CardHeader className="p-0">
              <Skeleton className="aspect-[2/3] w-full" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3 space-y-8">
          <div>
            <Skeleton className="h-12 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-1/4 mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="py-16">
        <ServerCrash className="mx-auto h-16 w-16 text-destructive" />
        <h2 className="mt-6 text-3xl font-bold font-headline">An Error Occurred</h2>
        <p className="mt-2 text-lg text-muted-foreground">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">Please try refreshing the page or come back later.</p>
      </div>
    </div>
  )
}

export default function AnimePage() {
  const params = useParams()
  const { addLog } = useLogger()
  const { t } = useTranslation()
  const idParam = params.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam

  const [anime, setAnime] = useState<Anime | null>(null)
  const [recommendations, setRecommendations] = useState<Anime[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let isMounted = true

    async function fetchAllData() {
      if (!id) {
        addLog("fetchAllData called without an ID.", "warn")
        return
      }

      addLog(`Navigated to anime details page for ID: ${id}`)
      setAnime(null)
      setRecommendations([])
      setIsLoading(true)
      setError(null)

      try {
        const animeIdNumber = Number(id)
        if (isNaN(animeIdNumber)) {
          addLog(`Invalid anime ID: ${id}. Not a number.`, "error")
          if (isMounted) notFound()
          return
        }

        addLog(`Fetching primary data for anime AniList ID: ${id}`)
        const animeData = await getMediaByAniListId(animeIdNumber, addLog)

        if (!isMounted) return

        if (!animeData) {
          addLog(`Anime with AniList ID: ${id} not found.`, "warn")
          notFound()
          return
        }

        addLog(`Successfully fetched primary data for "${animeData.title}"`)
        setAnime(animeData)
        setIsLoading(false)

        // Fetch secondary data
        try {
          addLog(`Fetching recommendations for anime: "${animeData.title}" (AniList ID: ${animeData.id})`)
          const recs = await getAnimeRecommendations(animeData.id, addLog)
          if (isMounted && recs) setRecommendations(recs)
        } catch (err: any) {
          addLog(`Could not fetch recommendations for AniList ID ${animeData.id}: ${err.message}`, "warn")
        }
      } catch (e: any) {
        addLog(`Failed to load primary anime details for AniList ID: ${id}. Error: ${e.message}`, "error")
        if (isMounted) {
          setError(e.message || "Failed to load anime details. The data could not be found or the server had an issue.")
          setIsLoading(false)
        }
      }
    }

    fetchAllData()

    return () => {
      isMounted = false
    }
  }, [id, addLog, notFound])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error && !anime) {
    return <ErrorState message={error} />
  }

  if (!anime) {
    return <ErrorState message="An unexpected error occurred while preparing the page." />
  }

  const isMovie = anime.type === "Movie"

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <BackButton />
      <div className="grid md:grid-cols-4 gap-8 lg:gap-12 mt-4">
        <div className="md:col-span-1">
          <AnimeDetails anime={anime} />
        </div>

        <div className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">{anime.title}</h1>
            {anime.title_english && anime.title_english !== anime.title && (
              <p className="text-xl text-muted-foreground">{anime.title_english}</p>
            )}
          </div>

          {anime.id && <AnimeTabs anime={anime} />}
        </div>
      </div>

      <RecommendedAnimeList
        animes={recommendations}
        animeId={anime.id || anime.mal_id}
        currentTrail={[{ id: anime.id || anime.mal_id, title: anime.title }]}
      />
    </main>
  )
}
