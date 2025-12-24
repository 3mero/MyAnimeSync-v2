"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import type { JikanGenre } from "@/lib/types"
import { Library } from "lucide-react"
import { genres_list } from "@/i18n/index"

function GenreSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-1/4" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

function GenreSection({ title, genres }: { title: string; genres: JikanGenre[] }) {
  if (genres.length === 0) return null
  return (
    <section>
      <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {genres.map((genre) => (
          <Link href={`/search?tags=${encodeURIComponent(genre.name)}`} key={genre.mal_id}>
            <Card className="flex items-center justify-center p-4 h-16 text-center hover:bg-primary hover:text-primary-foreground transition-colors">
              <CardTitle className="text-sm font-semibold">{genre.name}</CardTitle>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function GenresPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)

  const filteredGenres = genres_list

  // Group genres from the static list
  const mainGenres = filteredGenres.filter((g) => g.type === "genre")
  const themes = filteredGenres.filter((g) => g.type === "tag")

  useEffect(() => {
    // We are using a static list now, so we can set loading to false.
    // If we were fetching, this is where it would happen.
    setIsLoading(false)
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
          <Library className="w-10 h-10" />
          {t("anime_genres")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t("explore_anime_by_genre")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-12">
          <GenreSkeleton />
          <GenreSkeleton />
        </div>
      ) : (
        <div className="space-y-12">
          <GenreSection title={t("main_genres")} genres={mainGenres} />
          <GenreSection title={t("themes")} genres={themes} />
        </div>
      )}
    </main>
  )
}
