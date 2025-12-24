"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import type { Anime, JikanStaff, JikanReview } from "@/lib/types"
import { getMediaByAniListId, getMangaStaff, getMangaReviews, getMangaRecommendations } from "@/lib/anilist"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { useTranslation } from "@/hooks/use-translation"
import type { translations } from "@/i18n"
import {
  Languages,
  Undo2,
  Loader2,
  Info,
  Star,
  BookOpen,
  Layers,
  Bookmark,
  UserCog,
  MessageSquare,
  Heart,
  BookUser,
  Check,
  ListVideo,
  Trash2,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { translateTextServer } from "@/lib/translation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { RecommendedAnimeList } from "@/components/anime/recommended-anime-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomLinksDialog } from "@/components/anime/details/tabs/CustomLinksDialog"
import { SceneSearchDialog } from "@/components/anime/details/scene-search-dialog"
import { ReminderDialog } from "@/components/notifications/reminder-dialog"

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function StaffTab({ staff }: { staff: JikanStaff[] | null }) {
  const { t } = useTranslation()
  if (!staff) return <TabLoading />
  if (staff.length === 0) return <div className="text-center py-8 text-muted-foreground">{t("no_staff_found")}</div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {staff.map((s) => (
        <Link href={`/person/${s.person.mal_id}`} key={s.person.mal_id}>
          <Card className="text-center p-3 hover:bg-muted/50 transition-colors group">
            <div className="relative aspect-square w-24 mx-auto rounded-full overflow-hidden mb-2">
              <Image
                src={s.person.images.jpg.image_url}
                alt={s.person.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <p className="font-semibold truncate group-hover:text-primary">{s.person.name}</p>
            <p className="text-xs text-muted-foreground truncate">{s.positions.join(", ")}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: JikanReview }) {
  const { toast } = useToast()
  const { t, lang } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [translatedReview, setTranslatedReview] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const handleTranslateToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }

    if (!isExpanded) {
      setIsExpanded(true)
    }

    if (translatedReview) {
      setShowTranslation(true)
      return
    }

    setIsTranslating(true)
    const result = await translateTextServer(review.review)
    if (result) {
      setTranslatedReview(result)
      setShowTranslation(true)
    } else {
      toast({
        variant: "destructive",
        title: t("toast_translation_failed_title"),
        description: t("toast_translation_failed_desc"),
      })
    }
    setIsTranslating(false)
  }

  const reviewText = showTranslation && translatedReview ? translatedReview : review.review

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src={review.user.images.webp.image_url}
              alt={review.user.username}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <a href={review.user.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">
                {review.user.username}
              </a>
              <p className="text-xs text-muted-foreground">{format(new Date(review.date), "dd MMM yyyy")}</p>
            </div>
          </div>
          <div className={cn("text-right space-y-2", lang === "ar" ? "text-left" : "text-right")}>
            <Badge
              variant={review.score > 6 ? "default" : review.score > 3 ? "secondary" : "destructive"}
              className="flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              {review.score}/10
            </Badge>
            <Button size="sm" variant="outline" onClick={handleTranslateToggle} disabled={isTranslating}>
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showTranslation ? (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t("original_text")}
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  {t("translate_to_arabic")}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <p
            className={cn(
              "text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed",
              !isExpanded && "line-clamp-6",
              lang === "ar" && showTranslation && "rtl",
            )}
          >
            {reviewText}
          </p>
          {review.review.length > 300 && !isExpanded && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card to-transparent" />
          )}
        </div>
        {review.review.length > 300 && (
          <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto mt-2">
            {isExpanded ? t("show_less") : t("show_more")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ReviewsTab({ reviews }: { reviews: JikanReview[] | null }) {
  const [showAll, setShowAll] = useState(false)
  const { t } = useTranslation()

  if (!reviews) return <TabLoading />
  if (reviews.length === 0) return <div className="text-center py-8 text-muted-foreground">{t("no_reviews_found")}</div>

  const displayedReviews = showAll ? reviews : reviews.slice(0, 5)

  return (
    <div className="space-y-6">
      {displayedReviews.map((review) => (
        <ReviewCard key={review.mal_id} review={review} />
      ))}
      {!showAll && reviews.length > 5 && (
        <div className="text-center pt-4">
          <Button onClick={() => setShowAll(true)} variant="secondary">
            {t("show_more_reviews", { count: String(reviews.length - 5) })}
          </Button>
        </div>
      )}
    </div>
  )
}

function Synopsis({ synopsis }: { synopsis: string | null | undefined }) {
  const { toast } = useToast()
  const { t, lang } = useTranslation()
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const handleTranslateToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }
    if (translatedSynopsis) {
      setShowTranslation(true)
      return
    }
    if (!synopsis) {
      toast({
        variant: "destructive",
        title: t("toast_nothing_to_translate"),
        description: t("toast_no_synopsis_available_desc"),
      })
      return
    }
    setIsTranslating(true)
    const result = await translateTextServer(synopsis)
    if (result) {
      setTranslatedSynopsis(result)
      setShowTranslation(true)
    } else {
      toast({
        variant: "destructive",
        title: t("toast_translation_failed_title"),
        description: t("toast_translation_failed_desc"),
      })
    }
    setIsTranslating(false)
  }

  const synopsisText =
    showTranslation && translatedSynopsis ? translatedSynopsis : synopsis || t("no_synopsis_available")

  return (
    <div>
      <div className={cn("flex items-center justify-between mb-3", lang === "ar" && "rtl")}>
        <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
          <Info className="w-5 h-5" /> {t("synopsis")}
        </h2>
        {synopsis && (
          <Button variant="outline" size="sm" onClick={handleTranslateToggle} disabled={isTranslating}>
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showTranslation ? (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                {t("original_text")}
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                {t("translate_to_arabic")}
              </>
            )}
          </Button>
        )}
      </div>
      <p
        className={cn(
          "text-foreground/80 leading-relaxed whitespace-pre-wrap",
          lang === "ar" && showTranslation && "rtl",
        )}
      >
        {synopsisText}
      </p>
    </div>
  )
}

function ChaptersTab({ manga, listData }: { manga: Anime; listData: any }) {
  const { authMode, toggleChapterRead, markAllChaptersRead, unmarkAllChaptersRead } = useAuth()
  const { t } = useTranslation()
  const mangaIdStr = String(manga.id)

  const [readSet, setReadSet] = useState(new Set<string>())
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const generateEpisodesFromCustomLink = (
    anime: Anime,
    linkInfo: { template: string },
    listData: any,
  ): Partial<any>[] => {
    if (!listData || !listData.customEpisodeLinks) {
      return []
    }

    if (!linkInfo.template) return []

    try {
      const episodeMap: Record<string, string> = JSON.parse(linkInfo.template)
      const episodeNumbers = Object.keys(episodeMap)
        .map(Number)
        .sort((a, b) => a - b)

      if (episodeNumbers.length === 0) return []

      const episodes: Partial<any>[] = []
      for (const epNumber of episodeNumbers) {
        const url = episodeMap[String(epNumber)]
        episodes.push({
          title: `Chapter ${epNumber}`,
          url: url || "#",
        })
      }
      return episodes
    } catch (e) {
      console.error("Failed to parse custom episode links JSON:", e)
      return []
    }
  }

  const chapterLinks = useMemo(() => {
    if (!listData || !listData.customEpisodeLinks) return []
    const currentLinkInfo = listData.customEpisodeLinks[manga.id]
    if (currentLinkInfo && currentLinkInfo.template) {
      return generateEpisodesFromCustomLink(manga, currentLinkInfo, listData)
    }
    return []
  }, [manga, listData])

  useEffect(() => {
    if (listData?.readChapters?.[mangaIdStr]) {
      const chapterIds = listData.readChapters[mangaIdStr].read || []
      setReadSet(new Set(chapterIds.map(String)))
    } else {
      setReadSet(new Set())
    }
  }, [listData.readChapters, mangaIdStr])

  const handleItemClick = useCallback(
    (chapterId: string) => {
      if (authMode === "none") return
      toggleChapterRead(manga, chapterId)
    },
    [authMode, toggleChapterRead, manga],
  )

  const sortedChapters = useMemo(() => {
    return [...chapterLinks].sort((a, b) => {
      const numA = Number.parseInt(a.title?.match(/\d+/)?.[0] || "0", 10)
      const numB = Number.parseInt(b.title?.match(/\d+/)?.[0] || "0", 10)
      return sortOrder === "asc" ? numA - numB : numB - numA
    })
  }, [chapterLinks, sortOrder])

  const allChapterIds = useMemo(() => sortedChapters.map((_, index) => String(index + 1)), [sortedChapters])
  const allAreRead = allChapterIds.length > 0 && readSet.size >= allChapterIds.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListVideo className="w-6 h-6 text-primary" />
            <span>{t("chapters")}</span>
            {allChapterIds.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {readSet.size} / {allChapterIds.length}
              </Badge>
            )}
          </div>
          {sortedChapters.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              >
                {sortOrder === "asc" ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />}
                فرز
              </Button>
              {!allAreRead && authMode !== "none" && (
                <Button variant="outline" size="sm" onClick={() => markAllChaptersRead(manga, allChapterIds)}>
                  <CheckCheck className="mr-2 h-4 w-4" /> {t("mark_all_as_read")}
                </Button>
              )}
              {readSet.size > 0 && authMode !== "none" && (
                <Button variant="destructive" size="sm" onClick={() => unmarkAllChaptersRead(manga)}>
                  <Trash2 className="mr-2 h-4 w-4" /> {t("unmark_all_as_read")}
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedChapters.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              {sortedChapters.map((ep, index) => {
                const chapterNumberMatch = ep.title?.match(/\d+/)
                const chapterNumber = chapterNumberMatch ? Number.parseInt(chapterNumberMatch[0], 10) : index + 1
                const chapterId = String(chapterNumber)
                const isRead = authMode !== "none" && readSet.has(chapterId)
                const hasLink = ep.url && ep.url !== "#"

                const content = (
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-colors",
                      isRead ? "bg-muted/50 text-muted-foreground" : hasLink ? "hover:bg-primary/10" : "",
                    )}
                  >
                    <p className="font-semibold truncate">{ep.title}</p>
                    {authMode !== "none" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleItemClick(chapterId)
                        }}
                      >
                        <Check className={cn("h-5 w-5", isRead ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    )}
                  </div>
                )

                if (hasLink) {
                  return (
                    <a key={chapterId} href={ep.url} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  )
                }

                return <div key={chapterId}>{content}</div>
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">{t("no_chapter_info_available")}</div>
        )}
        <div className="mt-4 text-center">
          <CustomLinksDialog anime={manga} isManga={true} />
        </div>
      </CardContent>
    </Card>
  )
}

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
          <div>
            <Skeleton className="h-8 w-1/4 mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MangaPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const { t } = useTranslation()
  const { authMode, listData, isPlannedToRead, togglePlanToRead, isCurrentlyReading, toggleCurrentlyReading } =
    useAuth()
  const { toast } = useToast()

  const [media, setMedia] = useState<Anime | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("about")

  const planned = media ? isPlannedToRead(media.id) : false
  const reading = media ? isCurrentlyReading(media.id) : false

  const [additionalData, setAdditionalData] = useState({
    staff: null as JikanStaff[] | null,
    reviews: null as JikanReview[] | null,
    recommendations: null as Anime[] | null,
  })

  useEffect(() => {
    if (!id) return
    const anilistId = Number(id)
    if (isNaN(anilistId)) {
      notFound()
      return
    }

    async function fetchData() {
      setIsLoading(true)
      try {
        const data = await getMediaByAniListId(anilistId)
        if (!data || (data.type !== "MANGA" && data.type !== "NOVEL" && data.type !== "ONE_SHOT")) {
          notFound()
          return
        }
        setMedia(data)
      } catch (e: any) {
        setError(e.message || "Failed to load manga details.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id, notFound])

  const handleTabChange = useCallback(
    async (tab: string) => {
      setActiveTab(tab)
      if (!media) return

      const anilistId = media.id

      type AdditionalDataKey = keyof typeof additionalData
      const key = tab as AdditionalDataKey

      // Do not fetch if data exists or it's not a fetchable tab
      if (key === "about" || key === "overview" || key === "chapters" || additionalData[key] !== null) return

      try {
        let data
        switch (key) {
          case "staff":
            data = await getMangaStaff(anilistId)
            break
          case "reviews":
            data = await getMangaReviews(anilistId)
            break
          case "recommendations":
            data = await getMangaRecommendations(anilistId)
            break
        }
        setAdditionalData((prev) => ({ ...prev, [key]: data || [] }))
      } catch (error) {
        console.warn(`Failed to fetch ${key} for manga ${id}:`, error)
        setAdditionalData((prev) => ({ ...prev, [key]: [] as any }))
        toast({
          variant: "destructive",
          title: t("toast_fetch_failed_title", { context: key }),
          description: t("toast_fetch_failed_desc", { context: key }),
        })
      }
    },
    [id, media, additionalData, toast, t],
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !media) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive">{error || "Manga not found."}</p>
      </div>
    )
  }

  const n_a = t("n_a")
  let formatKey = (media.format?.toLowerCase() || media.type.toLowerCase()) as keyof typeof translations.ar
  if (formatKey === "one_shot") formatKey = "one-shot"
  const translatedFormat = t(formatKey) || media.format || media.type
  const posterImage = media.images.webp.large_image_url || media.images.jpg.large_image_url

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <BackButton />
      <div className="grid md:grid-cols-4 gap-8 lg:gap-12 mt-4">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <CardHeader className="p-0 relative">
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={posterImage || `https://picsum.photos/seed/${media.id}/400/600`}
                  alt={`Poster for ${media.title}`}
                  fill
                  className={cn("object-cover")}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2 pt-2">
                {authMode !== "none" && (
                  <>
                    <Button
                      className="w-full flex-wrap"
                      variant={reading ? "secondary" : "outline"}
                      onClick={() => toggleCurrentlyReading(media)}
                    >
                      <BookUser className={cn("w-4 h-4 mr-2", reading ? "text-green-400" : "text-muted-foreground")} />
                      {t("currently_reading")}
                    </Button>
                    <Button
                      className="w-full flex-wrap"
                      variant={planned ? "secondary" : "outline"}
                      onClick={() => togglePlanToRead(media)}
                    >
                      <Bookmark className={cn("w-4 h-4 mr-2", planned ? "text-yellow-400" : "text-muted-foreground")} />
                      {t("plan_to_read_manga")}
                    </Button>

                    <SceneSearchDialog animeId={media.id} animeTitle={media.title} posterImage={posterImage} />

                    <ReminderDialog anime={media}>
                      <Button variant="outline" className="w-full flex-wrap bg-transparent">
                        <Bell className="text-purple-400" />
                        {t("add_reminder")}
                      </Button>
                    </ReminderDialog>
                  </>
                )}
              </div>

              {media.score && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-lg">{media.score.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({media.scored_by?.toLocaleString()} {t("votes")})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span>{translatedFormat}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span>
                  {t("chapters")} {media.chapters || n_a} &bull; {t("volumes")} {media.volumes || n_a}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">{media.title}</h1>
            {media.title_english && media.title_english !== media.title && (
              <p className="text-xl text-muted-foreground">{media.title_english}</p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="about">{t("about")}</TabsTrigger>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="chapters">{t("chapters")}</TabsTrigger>
              <TabsTrigger value="staff">
                <UserCog className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{t("staff")}</span>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <MessageSquare className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{t("reviews")}</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations">{t("manga_similar")}</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="py-4">
              <Synopsis synopsis={media.synopsis || null} />
            </TabsContent>
            <TabsContent value="overview" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("details")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <CardDescription>{t("rank")}</CardDescription>
                    <p className="font-bold text-lg">#{media.rank?.toLocaleString() || n_a}</p>
                  </div>
                  <div className="space-y-1">
                    <CardDescription>{t("popularity")}</CardDescription>
                    <p className="font-bold text-lg">#{media.popularity?.toLocaleString() || n_a}</p>
                  </div>
                  <div className="space-y-1">
                    <CardDescription>{t("favorites")}</CardDescription>
                    <p className="font-bold text-lg flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" /> {media.scored_by?.toLocaleString() || n_a}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <CardDescription>{t("source")}</CardDescription>
                    <p className="font-bold">{media.source || n_a}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chapters" className="py-4">
              <ChaptersTab manga={media} listData={listData} />
            </TabsContent>
            <TabsContent value="staff" className="py-4">
              <StaffTab staff={additionalData.staff} />
            </TabsContent>
            <TabsContent value="reviews" className="py-4">
              <ReviewsTab reviews={additionalData.reviews} />
            </TabsContent>
            <TabsContent value="recommendations" className="py-4">
              <RecommendedAnimeList
                title={t("manga_similar")}
                animes={additionalData.recommendations || []}
                animeId={media.id}
                currentTrail={[{ id: media.id, title: media.title }]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
