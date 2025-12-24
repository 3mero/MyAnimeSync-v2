"use client"

import { useEffect, useState, useMemo } from "react"
import { getMediaByAniListId, getAnimeRecommendations } from "@/lib/anilist"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"
import { AnimeCard } from "@/components/anime/anime-card"
import type { Anime, BreadcrumbItem } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { ServerCrash } from "lucide-react"

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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

export default function RecommendationsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { toast } = useToast()

  const idParam = params.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  const trailParam = searchParams.get("trail")

  const [anime, setAnime] = useState<Anime | null>(null)
  const [recommendations, setRecommendations] = useState<Anime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentTrail: BreadcrumbItem[] = useMemo(() => {
    if (!trailParam) return id ? [{ id: Number(id), title: "" }] : []
    const ids = trailParam.split(",").map(Number)
    return ids.map((id) => ({ id, title: "" }))
  }, [trailParam, id])

  useEffect(() => {
    if (!id) {
      notFound()
      return
    }

    async function fetchData() {
      setIsLoading(true)
      setError(null)
      const anilistId = Number(id)

      try {
        // First get the base anime's data
        const animeData = await getMediaByAniListId(anilistId)

        if (!animeData) {
          notFound()
          return
        }

        setAnime(animeData)

        // Then fetch recommendations using the anilistId
        const recsData = await getAnimeRecommendations(anilistId)
        setRecommendations(recsData)
      } catch (err) {
        console.error("Failed to fetch recommendations data:", err)
        setError(t("failed_to_fetch_recs"))
        toast({
          variant: "destructive",
          title: t("translation_failed"),
          description: t("failed_to_fetch_recs"),
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, t, toast])

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <BackButton />
        <Skeleton className="h-9 w-1/2 mt-4 mb-6" />
        <LoadingSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <div className="py-16">
          <ServerCrash className="mx-auto h-16 w-16 text-destructive" />
          <h2 className="mt-6 text-3xl font-bold font-headline">{t("translation_failed")}</h2>
          <p className="mt-2 text-lg text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  if (!anime) {
    // This will be caught by notFound() in useEffect, but as a fallback
    return null
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-3xl font-bold font-headline mt-4 mb-6">
        {t("recommendations_for")} {anime.title}
      </h1>

      {recommendations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t("no_recommendations_found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {recommendations.map((recAnime) => (
            <AnimeCard key={recAnime.id} anime={recAnime} currentTrail={currentTrail} />
          ))}
        </div>
      )}
    </main>
  )
}
