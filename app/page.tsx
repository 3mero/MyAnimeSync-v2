"use client"

import type React from "react"
import { Suspense, useEffect, useState, useMemo, useRef } from "react"
import { AnimeList, AnimeListSkeleton } from "@/components/anime/anime-list"
import { WatchingList } from "@/components/anime/watching-list"
import { ReadingList } from "@/components/anime/reading-list"
import { useTranslation } from "@/hooks/use-translation"
import type { Anime } from "@/lib/types"
import { useLogger } from "@/hooks/use-logger"
import { useAuth } from "@/hooks/use-auth"
import { CharacterRecommender } from "@/components/anime/character-recommender"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHomePageData } from "@/lib/anilist"
import {
  Flame,
  TrendingUp,
  BarChart,
  Tv,
  Clapperboard,
  Star,
  Calendar,
  Popcorn,
  BookMarked,
  CalendarClock,
  PlusCircle,
  Languages,
  Loader2,
  User,
  Upload,
} from "lucide-react"
import { DebugLogViewer } from "@/components/logging/debug-log-viewer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const listIcons: { [key: string]: React.ElementType } = {
  trending: Flame,
  top: Star,
  airing: Tv,
  upcoming: Calendar,
  popular: BarChart,
  topMovies: Clapperboard,
  movies: Popcorn,
  topThisSeason: TrendingUp,
  trendingManga: Flame,
  popularManga: BarChart,
  topManga: Star,
  releasingManga: BookMarked,
  upcomingManga: CalendarClock,
  latestAdditions: PlusCircle,
}

export default function Home() {
  const { t, toggleLanguage } = useTranslation()
  const { authMode, layoutConfig, signInLocally, importData } = useAuth()
  const { addLog } = useLogger()
  const [homePageData, setHomePageData] = useState<Record<string, Anime[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authMode !== "none") {
      setIsLoading(true)
      getHomePageData(addLog)
        .then((data) => {
          setHomePageData(data)
          setIsLoading(false)
        })
        .catch((err) => {
          addLog("Failed to fetch home page data", "error", err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [authMode, addLog])

  const visibleLayout = useMemo(() => layoutConfig.filter((item) => item.visible), [layoutConfig])

  const handleLocalSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    addLog(`Attempting local sign-in for user: ${username}`)
    setLoading(true)
    signInLocally(username)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      addLog(`Importing data from file: ${file.name} from Auth Dialog`)
      importData(file)
    }
  }

  if (authMode === "none") {
    return (
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="p-8 max-w-xl w-full text-center relative">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Languages />
              <span className="sr-only">Toggle Language</span>
            </Button>
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">{t("welcome_to_animesync")}</CardTitle>
            <CardDescription className="text-base">{t("sign_in_desc_local")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLocalSignIn} className="space-y-4 pt-4">
              <div className="space-y-2 text-right">
                <Label htmlFor="username-local" className="text-base">
                  {t("username")}
                </Label>
                <Input
                  id="username-local"
                  type="text"
                  placeholder={t("your_username_placeholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 text-lg text-center"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading || !username}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2" />}
                {t("local_signin_button")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("or_separator")}</span>
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <Button onClick={handleImportClick} variant="outline" className="w-full bg-transparent" size="lg">
              <Upload className="mr-2 h-4 w-4" />
              {t("restore_from_backup")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <>
      <section className="relative h-[40vh] min-h-[350px] w-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-20" />
        <div className="absolute inset-0 bg-secondary/60 z-10" />
        <div className="relative z-30 flex flex-col items-center text-center text-primary-foreground p-4 w-full max-w-2xl mx-auto">
          <CharacterRecommender />
        </div>
      </section>

      <main className="container mx-auto px-4 space-y-12 my-12">
        <DebugLogViewer />
        <WatchingList />
        <ReadingList />

        {visibleLayout.map((item) => {
          const Icon = listIcons[item.id] || Star
          const title = item.customTitle || t(item.titleKey as any)
          const animes = homePageData[item.id]

          return (
            <Suspense key={item.id} fallback={<AnimeListSkeleton title={title} Icon={Icon} />}>
              <AnimeList animes={animes} title={title} type={item.id as any} Icon={Icon} isLoading={isLoading} />
            </Suspense>
          )
        })}
      </main>
    </>
  )
}
