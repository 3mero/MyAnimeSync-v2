"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { Anime } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydration } from "@/hooks/use-hydration"
import { AnimeCard } from "@/components/anime/anime-card"
import { useTranslation } from "@/hooks/use-translation"
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

export default function ReadingListPage() {
  const { authMode, getCurrentlyReadingManga, removeItemFromList } = useAuth()
  const { t } = useTranslation()
  const [mangaList, setMangaList] = useState<Anime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isHydrated = useHydration()

  const fetchReadingManga = useCallback(async () => {
    setIsLoading(true)
    const list = await getCurrentlyReadingManga()
    setMangaList(list)
    setIsLoading(false)
  }, [getCurrentlyReadingManga])

  useEffect(() => {
    if (!isHydrated || authMode === "none") {
      setIsLoading(false)
      return
    }
    fetchReadingManga()
  }, [authMode, isHydrated, fetchReadingManga])

  if (!isHydrated) {
    return (
      <main className="container mx-auto px-4 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold font-headline my-6">{t("currently_reading")}</h1>
        <LoadingSkeleton />
      </main>
    )
  }

  const handleRemove = (itemId: number) => {
    removeItemFromList(itemId, "reading")
    setMangaList((prev) => prev.filter((item) => item.id !== itemId))
  }

  if (authMode === "none") {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <div className="py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">{t("sign_in_to_see_list")}</h2>
          <p className="mt-2 text-muted-foreground">Your "Currently Reading" list will appear here.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="flex justify-between items-center my-6">
        <h1 className="text-3xl font-bold font-headline">{t("currently_reading")}</h1>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : mangaList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {mangaList.map((manga) => (
            <AnimeCard key={manga.id} anime={manga} listType="reading" onRemove={handleRemove} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">{t("nothing_here_yet")}</h2>
          <p className="mt-2 text-muted-foreground">Add manga to your reading list to get started.</p>
        </div>
      )}
    </main>
  )
}
