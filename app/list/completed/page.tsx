"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { Anime } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle2, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydration } from "@/hooks/use-hydration"
import { AnimeCard } from "@/components/anime/anime-card"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BackButton } from "@/components/ui/back-button"

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

export default function CompletedListPage() {
  const { authMode, getAllWatchedAnime, removeItemFromList, clearCompletedList } = useAuth()
  const [animeList, setAnimeList] = useState<(Anime & { watchedEpisodeCount: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isHydrated = useHydration()
  const { t } = useTranslation()

  const fetchCompletedAnime = useCallback(async () => {
    setIsLoading(true)
    const allWatched = await getAllWatchedAnime()

    // An anime is "completed" if all its episodes have been watched.
    const completed = allWatched.filter(
      (anime) => anime.episodes && anime.episodes > 0 && anime.watchedEpisodeCount >= anime.episodes,
    )

    setAnimeList(completed)
    setIsLoading(false)
  }, [getAllWatchedAnime])

  useEffect(() => {
    if (!isHydrated || authMode === "none") {
      setIsLoading(false)
      return
    }
    fetchCompletedAnime()
  }, [authMode, isHydrated, fetchCompletedAnime])

  const handleRemove = (itemId: number) => {
    // To remove from "completed", we essentially unwatch all episodes.
    removeItemFromList(itemId, "completed")
    // Refetch or filter locally
    setAnimeList((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleClearAll = () => {
    clearCompletedList()
    setAnimeList([])
  }

  if (!isHydrated) {
    return (
      <main className="container mx-auto px-4 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold font-headline my-6 flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
          {t("completed")}
        </h1>
        <LoadingSkeleton />
      </main>
    )
  }

  if (authMode === "none") {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <div className="py-16">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">{t("sign_in_to_see_list")}</h2>
          <p className="mt-2 text-muted-foreground">{t("completed_list_prompt")}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="flex justify-between items-center my-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
          {t("completed")}
        </h1>
        {animeList.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("unwatch_all")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                <AlertDialogDescription>{t("clear_completed_warning")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>{t("delete_everything")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : animeList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} listType="completed" onRemove={handleRemove} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">{t("nothing_here_yet")}</h2>
          <p className="mt-2 text-muted-foreground">{t("completed_empty_prompt")}</p>
        </div>
      )}
    </main>
  )
}
