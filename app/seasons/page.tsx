"use client"

import Link from "next/link"
import { getSeasonsList } from "@/lib/anilist"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useEffect, useState } from "react"
import type { JikanSeason } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import type { translations } from "@/i18n"

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export default function SeasonsPage() {
  const { t } = useTranslation()
  const [seasonsData, setSeasonsData] = useState<JikanSeason[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true)
      const data = await getSeasonsList()
      setSeasonsData(data)
      setIsLoading(false)
    }
    fetchSeasons()
  }, [])

  // Group seasons by year
  const seasonsByYear: { [year: number]: string[] } = {}
  seasonsData.forEach((item) => {
    if (!seasonsByYear[item.year]) {
      seasonsByYear[item.year] = []
    }
    seasonsByYear[item.year].push(...item.seasons)
  })

  const sortedYears = Object.keys(seasonsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">{t("anime_seasons")}</h1>
        <p className="text-lg text-muted-foreground mt-2">{t("browse_by_season")}</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : sortedYears.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">{t("no_seasons_found")}</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
          {sortedYears.map((year) => (
            <AccordionItem value={`year-${year}`} key={year}>
              <AccordionTrigger className="text-2xl font-semibold">{year}</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                  {seasonsByYear[year].map((season) => (
                    <Button asChild key={season} variant="outline">
                      <Link href={`/seasons/${year}/${season}/1`}>{t(season as keyof typeof translations.ar)}</Link>
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </main>
  )
}
