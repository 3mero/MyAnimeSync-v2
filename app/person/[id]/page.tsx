"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import type { JikanPerson, JikanPersonVoiceRole, JikanPicture } from "@/lib/types"
import { getPersonDetails, getPersonPictures } from "@/lib/anilist"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { User, Star, Mic, Cake, Languages, Undo2, Loader2, Camera, CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { translateTextServer } from "@/lib/translation"
import { useTranslation } from "@/hooks/use-translation"
import type { translations } from "@/i18n"
import { BackButton } from "@/components/ui/back-button"
import { useLogger } from "@/hooks/use-logger"

function VoiceRoleCard({ role }: { role: JikanPersonVoiceRole }) {
  const { t } = useTranslation()
  const roleKey = role.role.toLowerCase() as keyof typeof translations.ar
  const translatedRole = t(roleKey) || role.role

  const linkPath = role.anime.type === "MANGA" ? `/manga/${role.anime.mal_id}` : `/anime/${role.anime.mal_id}`

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <div className="flex p-3">
        <div className="w-1/3 pr-3 text-center space-y-1 flex flex-col items-center">
          <Link href={`/character/${role.character.mal_id}`} className="block group">
            <div className="relative h-16 w-16 rounded-full overflow-hidden mx-auto">
              <Image
                src={role.character.images.jpg.image_url}
                alt={role.character.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <p className="text-sm font-semibold mt-1 truncate group-hover:text-primary">{role.character.name}</p>
          </Link>
          <Badge variant="outline" className="text-xs">
            {translatedRole}
          </Badge>
        </div>

        <div className="w-2/3 pl-3 border-l border-border space-y-1">
          <Link href={linkPath} className="block group">
            <div className="flex">
              <div className="relative h-20 w-14 rounded-sm overflow-hidden mr-3 shrink-0">
                <Image
                  src={role.anime.images.jpg.large_image_url}
                  alt={role.anime.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold truncate group-hover:text-primary">{role.anime.title}</p>
                {role.anime.year && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {role.anime.year}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Card>
  )
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function PicturesTab({ pictures }: { pictures: JikanPicture[] | null }) {
  const { t } = useTranslation()
  if (!pictures) return <TabLoading />
  if (pictures.length === 0)
    return <div className="text-center py-8 text-muted-foreground">{t("no_pictures_found")}</div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {pictures.map((pic, index) => (
        <a href={pic.jpg.image_url} target="_blank" rel="noopener noreferrer" key={index}>
          <Card className="overflow-hidden group relative">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={pic.jpg.image_url}
                alt={`Person Picture ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
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
      <Skeleton className="h-9 w-24 mb-4" />
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
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </main>
  )
}

function cleanAboutText(text: string | null | undefined): string {
  if (!text) return ""
  // This regex looks for Markdown links [text](url) and replaces them with HTML <a> tags.
  // It also handles the <br> tags.
  return text
    .replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>',
    )
    .replace(/<br\s*\/?>/gi, "\n")
}

export default function PersonPage() {
  const params = useParams()
  const idParam = params.id
  const id = Array.isArray(idParam) ? Number.parseInt(idParam[0], 10) : Number.parseInt(idParam, 10)
  const [person, setPerson] = useState<JikanPerson | null>(null)
  const [pictures, setPictures] = useState<JikanPicture[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [translatedAbout, setTranslatedAbout] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const { toast } = useToast()
  const { t, lang } = useTranslation()
  const { addLog } = useLogger()

  useEffect(() => {
    if (!id || isNaN(id)) {
      notFound()
      return
    }

    async function fetchData() {
      setIsLoading(true)
      setPerson(null)
      setPictures(null)
      setTranslatedAbout(null)
      setShowTranslation(false)
      try {
        const data = await getPersonDetails(id, addLog)
        if (!data) {
          notFound()
          return
        }
        setPerson(data)
      } catch (error) {
        console.error(`Failed to fetch person details for ID ${id}:`, error)
        toast({ variant: "destructive", title: "Error", description: "Could not load person details." })
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, toast, addLog])

  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === "pictures" && !pictures && id) {
        try {
          const pics = await getPersonPictures(id, addLog)
          setPictures(pics)
        } catch (error) {
          console.warn(`Failed to fetch pictures for person ${id}:`, error)
          setPictures([])
          toast({
            variant: "destructive",
            title: "Failed to load pictures",
            description: "There was an issue fetching the picture gallery.",
          })
        }
      }
    },
    [id, pictures, toast, addLog],
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

    const textToTranslate = person?.about
    if (!textToTranslate || !textToTranslate.trim()) {
      toast({ variant: "destructive", title: t("nothing_to_translate"), description: t("biography_empty") })
      return
    }

    setIsTranslating(true)
    const result = await translateTextServer(cleanAboutText(textToTranslate))
    if (result) {
      setTranslatedAbout(result)
      setShowTranslation(true)
    } else {
      toast({ variant: "destructive", title: t("translation_failed"), description: t("no_biography_available") })
    }
    setIsTranslating(false)
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!person) return null

  const originalAboutText = cleanAboutText(person.about) || t("no_biography_available")
  const aboutText = showTranslation && translatedAbout ? translatedAbout : originalAboutText

  return (
    <main className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mt-4">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <CardHeader className="p-0 relative">
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={person.images.jpg.image_url}
                  alt={person.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </CardHeader>
            <CardContent className={cn("p-4 space-y-2", lang === "ar" && "rtl")}>
              <h1 className="text-2xl font-bold font-headline">{person.name}</h1>
              <h2 className="text-lg text-muted-foreground">
                {person.given_name} {person.family_name}
              </h2>
              <div className="flex items-center gap-2 text-sm pt-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>
                  {person.favorites.toLocaleString()} {t("favorites")}
                </span>
              </div>
              {person.birthday && (
                <div className="flex items-center gap-2 text-sm">
                  <Cake className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(person.birthday), "MMMM d, yyyy")}</span>
                </div>
              )}
              {person.alternate_names.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {person.alternate_names.map((nick) => (
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">
                <User className="w-4 h-4 mr-2" /> {t("about")}
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Mic className="w-4 h-4 mr-2" /> {t("voice_acting_roles")}
              </TabsTrigger>
              <TabsTrigger value="pictures">
                <Camera className="w-4 h-4 mr-2" /> {t("pictures")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="py-4">
              {person.about ? (
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
                    <div
                      className={cn(
                        "text-foreground/80 leading-relaxed whitespace-pre-wrap",
                        lang === "ar" && showTranslation && "rtl",
                      )}
                      dangerouslySetInnerHTML={{ __html: aboutText }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("no_biography_available")}</div>
              )}
            </TabsContent>
            <TabsContent value="roles" className="py-4">
              {person.voices.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5" /> {t("voice_acting_roles")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {person.voices.map((role, index) => (
                        <VoiceRoleCard key={`${role.anime.mal_id}-${role.character.mal_id}-${index}`} role={role} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("no_voice_roles_found")}</div>
              )}
            </TabsContent>
            <TabsContent value="pictures" className="py-4">
              <PicturesTab pictures={pictures} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
