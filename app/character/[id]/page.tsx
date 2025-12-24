"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import type { JikanCharacterDetail, JikanVoiceActor, Anime, JikanPicture } from "@/lib/types"
import { getCharacterDetails, getCharacterPictures } from "@/lib/anilist"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { User, Mic, Tv, Star, Camera, Loader2, Languages, Undo2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { translateTextServer } from "@/lib/translation"
import { useTranslation } from "@/hooks/use-translation"
import { useLogger } from "@/hooks/use-logger"
import { BackButton } from "@/components/ui/back-button"

function VoiceActorCard({ va }: { va: JikanVoiceActor }) {
  return (
    <Link href={`/person/${va.person.mal_id}`}>
      <Card className="flex items-center p-3 hover:bg-muted/50 transition-colors">
        <div className="relative h-16 w-12 rounded-sm overflow-hidden mr-4">
          <Image src={va.person.images.jpg.image_url} alt={va.person.name} fill className="object-cover" sizes="48px" />
        </div>
        <div>
          <p className="font-semibold">{va.person.name}</p>
          <p className="text-sm text-muted-foreground">{va.language}</p>
        </div>
      </Card>
    </Link>
  )
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function OtherAppearancesTab({ animeList }: { animeList: { role: string; anime: Anime }[] }) {
  if (animeList.length === 0)
    return <div className="text-center py-8 text-muted-foreground">No other appearances found.</div>
  return (
    <ScrollArea className="h-96">
      <div className="space-y-3 pr-4">
        {animeList.map(({ anime, role }) => (
          <Link href={`/anime/${anime.mal_id}`} key={anime.mal_id}>
            <Card className="flex items-center p-3 hover:bg-muted/50 transition-colors">
              <div className="relative h-20 w-14 rounded-sm overflow-hidden mr-4 shrink-0">
                <Image
                  src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
                  alt={anime.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold truncate">{anime.title}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </ScrollArea>
  )
}

function PicturesTab({ pictures }: { pictures: JikanPicture[] | null }) {
  if (!pictures) return <TabLoading />
  if (pictures.length === 0) return <div className="text-center py-8 text-muted-foreground">No pictures found.</div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {pictures.map((pic, index) => (
        <a href={pic.jpg.image_url} target="_blank" rel="noopener noreferrer" key={index}>
          <Card className="overflow-hidden group relative">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={pic.webp?.image_url || pic.jpg.image_url}
                alt={`Character Picture ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                className="object-cover transition-transform group-hover:scale-110"
              />
            </div>
          </Card>
        </a>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <CardHeader className="p-0">
              <Skeleton className="aspect-[2/3] w-full" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <div>
            <Skeleton className="h-8 w-1/4 mb-3" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-1/4 mb-3" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CharacterPage() {
  const params = useParams()
  const idParam = params.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  const [character, setCharacter] = useState<JikanCharacterDetail | null>(null)
  const [pictures, setPictures] = useState<JikanPicture[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [translatedAbout, setTranslatedAbout] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const { toast } = useToast()
  const { t, lang } = useTranslation()
  const { addLog } = useLogger()

  useEffect(() => {
    if (!id) {
      notFound()
      return
    }

    async function fetchData() {
      addLog(`Fetching character details for ID: ${id}`)
      setIsLoading(true)
      setCharacter(null)
      setPictures(null)
      setTranslatedAbout(null)
      setShowTranslation(false)
      try {
        const data = await getCharacterDetails(Number(id), addLog)
        if (!data) {
          addLog(`Character with ID ${id} not found.`, "warn")
          notFound()
          return
        }
        setCharacter(data)
        addLog(`Successfully fetched character details for "${data.name}"`)
      } catch (error) {
        addLog(`Failed to fetch character details for ID ${id}`, "error", { error })
        console.error(`Failed to fetch character details for ID ${id}:`, error)
        toast({
          variant: "destructive",
          title: t("toast_error_title"),
          description: t("toast_character_load_failed_desc"),
        })
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, toast, t, addLog])

  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === "pictures" && !pictures && id) {
        addLog(`Fetching pictures for character ID: ${id}`)
        try {
          const pics = await getCharacterPictures(Number(id), addLog)
          setPictures(pics)
          addLog(`Successfully fetched ${pics.length} pictures for character ID: ${id}`)
        } catch (error) {
          addLog(`Failed to fetch pictures for character ID ${id}`, "error", { error })
          console.warn(`Failed to fetch pictures for character ${id}:`, error)
          setPictures([])
          toast({
            variant: "destructive",
            title: t("toast_pictures_load_failed_title"),
            description: t("toast_pictures_load_failed_desc"),
          })
        }
      }
    },
    [id, pictures, toast, t, addLog],
  )

  const handleTranslateToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }

    if (translatedAbout) {
      setShowTranslation(true)
      return
    }

    const textToTranslate = character?.about
    if (!textToTranslate || !textToTranslate.trim()) {
      addLog("Translation requested for empty biography.", "warn")
      toast({ variant: "destructive", title: t("toast_nothing_to_translate"), description: t("biography_empty") })
      return
    }

    addLog(`Translating biography for character: "${character?.name}"`)
    setIsTranslating(true)
    const result = await translateTextServer(textToTranslate)
    if (result) {
      setTranslatedAbout(result)
      setShowTranslation(true)
      addLog(`Successfully translated biography for "${character?.name}"`)
    } else {
      addLog(`Translation failed for character "${character?.name}"`, "error")
      toast({
        variant: "destructive",
        title: t("toast_translation_failed_title"),
        description: t("toast_biography_translation_failed_desc"),
      })
    }
    setIsTranslating(false)
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!character) return null

  const aboutText =
    showTranslation && translatedAbout ? translatedAbout : character.about || t("no_biography_available")

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mt-4">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <CardHeader className="p-0 relative">
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={character.images.webp.image_url}
                  alt={character.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </CardHeader>
            <CardContent className={cn("p-4 space-y-2", lang === "ar" && "rtl")}>
              <h1 className="text-2xl font-bold font-headline">{character.name}</h1>
              <h2 className="text-lg text-muted-foreground">{character.name_kanji}</h2>
              <div className="flex items-center gap-2 text-sm pt-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>
                  {character.favorites.toLocaleString()} {t("favorites")}
                </span>
              </div>
              {character.nicknames.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {character.nicknames.map((nick) => (
                    <Badge variant="secondary" key={nick}>
                      {nick}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Tabs defaultValue="about" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">
                <User className="w-4 h-4 mr-2" />
                {t("about")}
              </TabsTrigger>
              <TabsTrigger value="pictures">
                <Camera className="w-4 h-4 mr-2" />
                {t("pictures")}
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Tv className="w-4 h-4 mr-2" />
                {t("anime_roles")}
              </TabsTrigger>
              <TabsTrigger value="voices">
                <Mic className="w-4 h-4 mr-2" />
                {t("voice_actors")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="py-4">
              {character.about ? (
                <Card>
                  <CardHeader className={cn("flex flex-row items-center justify-between", lang === "ar" && "rtl")}>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" /> {t("about")}
                    </CardTitle>
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
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p
                      className={cn(
                        "text-foreground/80 leading-relaxed whitespace-pre-wrap",
                        lang === "ar" && showTranslation && "rtl",
                      )}
                    >
                      {aboutText}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("no_biography_available")}</div>
              )}
            </TabsContent>
            <TabsContent value="pictures" className="py-4">
              <PicturesTab pictures={pictures} />
            </TabsContent>
            <TabsContent value="roles" className="py-4">
              <OtherAppearancesTab animeList={character.anime} />
            </TabsContent>
            <TabsContent value="voices" className="py-4">
              {character.voices.length > 0 ? (
                <Card>
                  <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
                    {character.voices.map((va) => (
                      <VoiceActorCard key={va.person.mal_id} va={va} />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("no_voice_roles_found")}</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
