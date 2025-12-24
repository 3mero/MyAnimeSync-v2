"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  useAuth,
  IDB_PROFILE_KEY,
  IDB_LAYOUT_CONFIG_KEY,
  IDB_TRACKED_MEDIA_KEY,
  IDB_LIST_DATA_KEY,
} from "@/hooks/use-auth"
import type { ListData } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useLogger } from "@/hooks/use-logger"
import * as packageJson from "@/../package.json"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/CodeBlock"
import { AuthDialog } from "@/components/auth/auth-dialog"

import {
  User,
  Languages,
  Settings,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RotateCw,
  Database,
  Eye,
  Tv,
  Bookmark,
  ListVideo,
  Link as LinkIcon,
  BookOpen,
  BookUser,
  BookCheck,
  Pencil,
  Bell,
  Undo2,
  Users,
  LayoutDashboard,
  Pin,
  Check,
  EyeOff,
  Tags,
  Save,
  RefreshCcw,
  Lock,
  Unlock,
  Github,
  Twitter,
  Share2,
  ChevronDown,
  HelpCircle,
  Info,
  Mail,
  Bot,
  Palette,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { get } from "@/lib/idb-keyval"
import { genres_list } from "@/i18n"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { SENSITIVE_GENRES, SENSITIVE_PASSWORD } from "@/lib/config"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"

function AvatarEditDialog() {
  const { localProfile, updateLocalProfile } = useAuth()
  const { toast } = useToast()
  const { addLog } = useLogger()
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(localProfile?.avatar_url || "")
  const [previewUrl, setPreviewUrl] = useState(localProfile?.avatar_url || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAvatarUrl(localProfile?.avatar_url || "")
      setPreviewUrl(localProfile?.avatar_url || "")
    }
  }, [open, localProfile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      addLog(`Selected new avatar file: ${file.name}`)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value)
    setPreviewUrl(e.target.value)
  }

  const handleSave = () => {
    if (!previewUrl) {
      toast({ variant: "destructive", title: "No Image Provided" })
      return
    }
    updateLocalProfile({ avatar_url: previewUrl })
    addLog("User profile avatar updated.")
    toast({ title: "Avatar Updated!" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background/70">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Avatar</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl} />
              <AvatarFallback>
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar-url">Image URL</Label>
            <Input
              id="avatar-url"
              name="avatar-url"
              value={avatarUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">OR</div>
          <div className="space-y-2">
            <Label htmlFor="avatar-file">Upload Image</Label>
            <Input
              id="avatar-file"
              name="avatar-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const socialIcons = {
  twitter: Twitter,
  github: Github,
  website: LinkIcon,
}

function GeneralSettingsTab() {
  const { t } = useTranslation()
  const { addLog } = useLogger()
  const { toggleLanguage } = useTranslation()
  const { localProfile, updateLocalProfile } = useAuth()
  const { toast } = useToast()

  const [bio, setBio] = useState(localProfile?.bio || "")
  const [socials, setSocials] = useState(localProfile?.socials || { twitter: "", github: "", website: "" })

  const handleSaveProfile = () => {
    updateLocalProfile({ bio, socials })
    toast({ title: t("profile_saved") })
  }

  const handleToggleLang = () => {
    addLog(`Toggling language to ${localStorage.getItem("anime-sync-lang") === "en" ? "ar" : "en"}`)
    toggleLanguage()
  }

  if (!localProfile) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("local_profile_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={localProfile.avatar_url} alt={localProfile.username} />
                <AvatarFallback>{localProfile.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <AvatarEditDialog />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{localProfile.username}</p>
              <p className="text-muted-foreground">{t("local_account")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bio_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("social_links")}</Label>
            <div className="space-y-2">
              {Object.keys(socials).map((key) => {
                const Icon = socialIcons[key as keyof typeof socialIcons] || LinkIcon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id={`social-${key}`}
                      name={`social-${key}`}
                      placeholder={`${t(key as any)} URL`}
                      value={socials[key as keyof typeof socials]}
                      onChange={(e) => setSocials((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveProfile}>{t("save_profile")}</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleToggleLang} variant="outline" className="w-full bg-transparent">
            <Languages className="mr-2 h-4 w-4" />
            {localStorage.getItem("anime-sync-lang") === "en" ? t("switch_to_arabic") : t("switch_to_english")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DestructiveActionDialog({
  onConfirm,
  children,
  title,
  description,
  confirmText,
  confirmCta,
}: {
  onConfirm: () => void
  children: React.ReactNode
  title: string
  description: string
  confirmText: string
  confirmCta: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (!open) {
      setInputValue("")
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-input-destructive">{t("confirm_action_label", { action: confirmText })}</Label>
          <Input
            id="confirm-input-destructive"
            name="confirm-input-destructive"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmText}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={inputValue !== confirmText}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmCta}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DataManagementTab() {
  const { t } = useTranslation()
  const { exportData, importData, resetLocalData } = useAuth()
  const { addLog } = useLogger()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      addLog(`Importing data from file: ${file.name}`)
      importData(file)
    }
  }

  const handleExport = () => {
    addLog("Exporting user data.")
    exportData()
  }

  const handleReset = () => {
    addLog("User initiated data reset.")
    resetLocalData()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("export_data_title")}</CardTitle>
          <CardDescription>{t("export_data_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t("export_data_btn")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("import_data_title")}</CardTitle>
          <CardDescription>{t("import_data_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          <Button onClick={handleImportClick} variant="outline" className="w-full bg-transparent">
            <Upload className="mr-2 h-4 w-4" />
            {t("import_data_btn")}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">{t("reset_data_title")}</CardTitle>
          <CardDescription>{t("reset_data_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DestructiveActionDialog
            title={t("are_you_sure")}
            description={t("reset_data_confirm")}
            confirmText={t("delete_word")}
            confirmCta={t("delete_everything")}
            onConfirm={handleReset}
          >
            <Button variant="destructive" className="w-full">
              <RotateCw className="mr-2 h-4 w-4" />
              {t("reset_data_btn")}
            </Button>
          </DestructiveActionDialog>
        </CardContent>
      </Card>
    </div>
  )
}

function DataViewerDialog({ trigger, title, data }: { trigger: React.ReactNode; title: string; data: any }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const textData = useMemo(() => JSON.stringify(data, null, 2), [data])
  const [searchQuery, setSearchQuery] = useState("")
  const [matches, setMatches] = useState(0)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentMatchIndex(0)
  }

  const handleNavigate = (direction: "next" | "prev") => {
    if (matches === 0) return
    if (direction === "next") {
      setCurrentMatchIndex((prev) => (prev + 1) % matches)
    } else {
      setCurrentMatchIndex((prev) => (prev - 1 + matches) % matches)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(textData)
    toast({ title: t("toast_copied_to_clipboard") })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Input placeholder={t("search")} value={searchQuery} onChange={handleSearchChange} className="flex-grow" />
          {searchQuery && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-sm text-muted-foreground font-mono">
                {matches > 0 ? `${currentMatchIndex + 1}/${matches}` : "0/0"}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                onClick={() => handleNavigate("prev")}
                disabled={matches === 0}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                onClick={() => handleNavigate("next")}
                disabled={matches === 0}
              >
                <ArrowDown />
              </Button>
            </div>
          )}
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0 bg-transparent" onClick={handleCopy}>
            <Copy />
          </Button>
        </div>
        <ScrollArea className="flex-grow bg-muted/50 rounded-md">
          <CodeBlock
            text={textData}
            highlightText={searchQuery}
            onHighlightChange={setMatches}
            currentMatchIndex={currentMatchIndex}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

function DatabaseTab() {
  const { t } = useTranslation()
  const { listData, clearDataSection, resetLocalData, setStorageQuota } = useAuth()
  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0 })
  const [allData, setAllData] = useState<Partial<ListData & { profile: any; layout: any; trackedMedia: any }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [quotaGB, setQuotaGB] = useState(listData.storageQuota / 1024 ** 3)

  const { toast } = useToast()

  const fetchAllData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true)
      try {
        const data = (await get<ListData>(IDB_LIST_DATA_KEY)) || ({} as ListData)
        const dataToSet = {
          profile: await get(IDB_PROFILE_KEY),
          layout: await get(IDB_LAYOUT_CONFIG_KEY),
          trackedMedia: await get(IDB_TRACKED_MEDIA_KEY),
          ...data,
        }
        setAllData(dataToSet)
        setQuotaGB((data.storageQuota || 1024 ** 3) / 1024 ** 3)

        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate()
          setStorageUsage({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
          })
        }
      } catch (e) {
        console.error("Failed to fetch all data from IndexedDB", e)
        toast({ variant: "destructive", title: "Error", description: "Could not load database information." })
      } finally {
        if (showLoader) setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    fetchAllData(true)
  }, [fetchAllData])

  const handleSliderChange = (value: number[]) => {
    setQuotaGB(value[0])
  }

  const handleCommitQuota = (value: number[]) => {
    const newQuotaBytes = value[0] * 1024 ** 3
    setStorageQuota(newQuotaBytes)
    toast({ title: "Storage Limit Updated", description: `New limit is ${value[0]} GB` })
  }

  const handleRefresh = useCallback(() => {
    fetchAllData(false).finally(() => {
      toast({ title: "Data Refreshed" })
    })
  }, [fetchAllData])

  const dataSections = [
    { key: "profile", title: "profile", icon: User, data: allData.profile },
    { key: "layout", title: "layout", icon: LayoutDashboard, data: allData.layout },
    { key: "trackedMedia", title: "tracked_media", icon: Users, data: allData.trackedMedia },
    { key: "planToWatch", title: "plan_to_watch", icon: Bookmark, data: allData.planToWatch },
    { key: "currentlyWatching", title: "watching", icon: Tv, data: allData.currentlyWatching },
    { key: "watchedEpisodes", title: "episodes", icon: ListVideo, data: allData.watchedEpisodes },
    { key: "planToRead", title: "plan_to_read_manga", icon: BookUser, data: allData.planToRead },
    { key: "currentlyReading", title: "currently_reading", icon: BookOpen, data: allData.currentlyReading },
    { key: "readChapters", title: "chapters", icon: BookCheck, data: allData.readChapters },
    { key: "customEpisodeLinks", title: "custom_links", icon: LinkIcon, data: allData.customEpisodeLinks },
    { key: "reminders", title: "reminders", icon: Bell, data: allData.reminders },
    { key: "readActivityIds", title: "read_activity_ids", icon: Check, data: allData.readActivityIds },
    { key: "excludedItems", title: "excluded_items", icon: EyeOff, data: allData.excludedItems },
    {
      key: "notificationsLayout",
      title: "notifications_layout",
      icon: LayoutDashboard,
      data: allData.notificationsLayout,
    },
    { key: "pinnedNotificationTab", title: "pinned_notification_tab", icon: Pin, data: allData.pinnedNotificationTab },
    { key: "hiddenGenres", title: "hidden_genres", icon: EyeOff, data: allData.hiddenGenres },
  ]

  const usagePercent = storageUsage.quota > 0 ? (storageUsage.usage / storageUsage.quota) * 100 : 0

  const getObjectSize = (data: any) => {
    if (data === undefined || data === null) return 0
    return new TextEncoder().encode(JSON.stringify(data)).length
  }

  const getObjectCount = (data: any) => {
    if (data === undefined || data === null) return 0
    if (Array.isArray(data)) return data.length
    if (typeof data === "object") return Object.keys(data).length
    return 1
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("storage_overview")}</CardTitle>
          <CardDescription>{t("storage_overview_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("used_storage")}</Label>
            <Progress value={usagePercent} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {t("used")} {formatBytes(storageUsage.usage)}
              </span>
              {storageUsage.quota > 0 && (
                <span>
                  {t("total")} {formatBytes(storageUsage.quota)}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Label htmlFor="storage-quota-slider">
              {t("storage_limit")} ({quotaGB} GB)
            </Label>
            <Slider
              id="storage-quota-slider"
              min={1}
              max={10}
              step={1}
              value={[quotaGB]}
              onValueChange={handleSliderChange}
              onValueCommit={handleCommitQuota}
            />
            <p className="text-xs text-muted-foreground">{t("storage_limit_desc")}</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <DataViewerDialog
            title={t("all_stored_data")}
            data={allData}
            trigger={
              <Button variant="outline" className="flex-1 bg-transparent">
                <Eye className="mr-2 h-4 w-4" /> {t("view_all_data")}
              </Button>
            }
          />
          <DestructiveActionDialog
            title={t("format_storage_title")}
            description={t("format_storage_desc")}
            confirmText={t("delete_word")}
            confirmCta={t("format_cta")}
            onConfirm={resetLocalData}
          >
            <Button variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" /> {t("format_btn")}
            </Button>
          </DestructiveActionDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("database")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCcw className="w-5 h-5" />
            </Button>
          </div>
          <CardDescription>{t("view_raw_data_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSections.map(({ key, title, icon: Icon, data }) => {
              if (!Icon) return null
              const count = getObjectCount(data)
              const sizeInBytes = getObjectSize(data)
              const isEmpty = count === 0

              return (
                <Card key={key} className="flex flex-col">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t(title as any)}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">{t("items_in_section")}</p>
                    <p className="text-xs font-mono text-primary mt-1">{formatBytes(sizeInBytes)}</p>
                  </CardContent>
                  <CardFooter className="p-2 pt-0 flex gap-2">
                    <DataViewerDialog
                      title={t(title as any)}
                      data={data}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled={isEmpty}>
                          <Eye className="mr-2 h-4 w-4" /> {t("view_data")}
                        </Button>
                      }
                    />
                    <DestructiveActionDialog
                      title={t("are_you_sure")}
                      description={t("delete_section_confirm", { section: t(title as any) })}
                      confirmText={t("delete_word")}
                      confirmCta={t("delete")}
                      onConfirm={() => clearDataSection(key as keyof ListData)}
                    >
                      <Button variant="destructive" size="sm" className="flex-1" disabled={isEmpty}>
                        <Trash2 className="mr-2 h-4 w-4" /> {t("delete")}
                      </Button>
                    </DestructiveActionDialog>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function GenrePanel() {
  const { t } = useTranslation()
  const { listData, setHiddenGenres, sensitiveContentUnlocked, setSensitiveContentUnlocked } = useAuth()
  const { addLog } = useLogger()
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pendingHiddenGenres, setPendingHiddenGenres] = useState(new Set(listData.hiddenGenres || []))

  useEffect(() => {
    setPendingHiddenGenres(new Set(listData.hiddenGenres || []))
  }, [listData.hiddenGenres])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SENSITIVE_PASSWORD) {
      setSensitiveContentUnlocked(true)
      setPendingHiddenGenres((prev) => {
        const newSet = new Set(prev)
        SENSITIVE_GENRES.forEach((g) => newSet.delete(g))
        return newSet
      })
      setPassword("")
      toast({ title: t("toast_content_unlocked") })
    } else {
      toast({ variant: "destructive", title: t("toast_incorrect_password_title") })
    }
  }

  const handleRevertLock = () => {
    setSensitiveContentUnlocked(false)
    setPendingHiddenGenres((prev) => {
      const newSet = new Set(prev)
      SENSITIVE_GENRES.forEach((g) => newSet.add(g))
      return newSet
    })
  }

  const handleToggle = (genreName: string) => {
    if (!sensitiveContentUnlocked && SENSITIVE_GENRES.includes(genreName)) {
      toast({ variant: "destructive", description: t("toast_unlock_to_edit_genre") })
      return
    }
    setPendingHiddenGenres((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(genreName)) {
        newSet.delete(genreName)
      } else {
        newSet.add(genreName)
      }
      return newSet
    })
  }

  const handleSave = () => {
    const newHidden = Array.from(pendingHiddenGenres)
    setHiddenGenres(newHidden)
    addLog("Updated hidden genres", "info", { genres: newHidden })
    toast({ title: "Settings Saved!", description: "The page will now reload to apply changes." })
    setTimeout(() => (window.location.href = "/"), 1500)
  }

  const handleCancel = () => {
    setPendingHiddenGenres(new Set(listData.hiddenGenres || []))
  }

  const hasChanges =
    pendingHiddenGenres.size !== (listData.hiddenGenres || []).length ||
    [...pendingHiddenGenres].some((g) => !(listData.hiddenGenres || []).includes(g))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("genre_panel_title")}</CardTitle>
        <CardDescription>{t("genre_panel_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sensitiveContentUnlocked ? (
          <div className="p-3 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-500">
              <Unlock />
              <span className="font-semibold">{t("content_unlocked")}</span>
            </div>
            <Button variant="secondary" onClick={handleRevertLock}>
              <Undo2 className="mr-2" /> {t("revert")}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handlePasswordSubmit}
            className="flex items-center gap-2 p-3 border-2 border-dashed border-destructive rounded-lg"
          >
            <div className="relative flex-grow">
              <Label htmlFor="sensitive-password-input" className="sr-only">
                {t("unlock_sensitive_placeholder")}
              </Label>
              <Input
                id="sensitive-password-input"
                name="sensitive-password-input"
                type={showPassword ? "text" : "password"}
                placeholder={t("unlock_sensitive_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <Button type="submit">{t("unlock_btn")}</Button>
          </form>
        )}
        <ScrollArea className="h-72">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pr-4">
            {genres_list.map((genre) => {
              const isHidden = pendingHiddenGenres.has(genre.name)
              const isLocked = !sensitiveContentUnlocked && SENSITIVE_GENRES.includes(genre.name)
              return (
                <div key={genre.mal_id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className={cn("text-sm truncate", isLocked && "opacity-50")}>{t(genre.name as any)}</span>
                  <div className="flex items-center gap-1">
                    {isLocked && <Lock className="w-4 h-4 text-destructive" />}
                    <Button
                      size="icon"
                      variant={isHidden ? "secondary" : "outline"}
                      onClick={() => handleToggle(genre.name)}
                      className="h-7 w-7"
                      disabled={isLocked}
                    >
                      {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
      {hasChanges && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2" />
            {t("save_changes")}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function SharingTab() {
  const { t } = useTranslation()
  const { sharedDataConfig, connectToSharedData, disconnectFromSharedData, syncSharedData, isSyncing } = useAuth()
  const [url, setUrl] = useState("")
  const message = "" // Broadcast message feature removed for simplification

  useEffect(() => {
    if (sharedDataConfig?.url) {
      setUrl(sharedDataConfig.url)
    } else {
      setUrl("")
    }
  }, [sharedDataConfig?.url])

  const handleConnect = () => {
    if (url) {
      connectToSharedData(url)
    }
  }

  return (
    <div className="space-y-6">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t("how_does_it_work_title")}</span>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-2">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("how_it_works_p1")}</p>
            <ol className="list-decimal space-y-2 pl-5 rtl:pr-5">
              <li>
                <span className="font-semibold">{t("how_it_works_s1_title")}:</span> {t("how_it_works_s1_desc")}
              </li>
              <li>
                <span className="font-semibold">{t("how_it_works_s2_title")}:</span> {t("how_it_works_s2_desc")}
              </li>
              <li>
                <span className="font-semibold">{t("how_it_works_s3_title")}:</span> {t("how_it_works_s3_desc")}
              </li>
            </ol>
            <p>{t("how_it_works_p2")}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Card>
        <CardHeader>
          <CardTitle>{t("shared_sync_title")}</CardTitle>
          <CardDescription>{t("shared_sync_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shared-url">{t("shared_json_url")}</Label>
            <div className="flex gap-2">
              <Input
                id="shared-url"
                name="shared-url"
                placeholder="https://gist.github.com/.../raw"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={!!sharedDataConfig.url}
              />
              {sharedDataConfig.url ? (
                <>
                  <Button onClick={() => syncSharedData(true)} variant="outline" size="icon" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
                  </Button>
                  <Button onClick={disconnectFromSharedData} variant="destructive" disabled={isSyncing}>
                    {t("disconnect")}
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect} disabled={!url || isSyncing}>
                  {isSyncing ? <Loader2 className="animate-spin" /> : t("connect")}
                </Button>
              )}
            </div>
          </div>
          {sharedDataConfig.url && (
            <div className="text-sm text-muted-foreground space-y-1 rounded-lg border p-3">
              <p>
                <strong>{t("last_sync")}:</strong>{" "}
                {sharedDataConfig.lastSync ? new Date(sharedDataConfig.lastSync).toLocaleString() : t("n_a")}
              </p>
              <p>
                <strong>{t("data_size")}:</strong> {formatBytes(sharedDataConfig.lastSize || 0)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AboutTab() {
  const { t } = useTranslation()
  const appVersion = packageJson.version

  const features = [
    { icon: Palette, title: "feature_modern_design_title", desc: "feature_modern_design_desc" },
    { icon: Bot, title: "feature_ai_title", desc: "feature_ai_desc" },
    { icon: Tv, title: "feature_personal_tracking_title", desc: "feature_personal_tracking_desc" },
    { icon: Bell, title: "feature_notifications_title", desc: "feature_notifications_desc" },
    { icon: HardDrive, title: "feature_storage_title", desc: "feature_storage_desc" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  fill="currentColor"
                />
                <path
                  d="M11 17h2v-6h-2v6zm1-8.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              AnimeSync
              <Badge variant="secondary" className="ml-2">
                v{appVersion}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>{t("anime_sync_motto")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("developed_by")}</p>
          <p className="text-sm text-muted-foreground">{t("about_data_sources")}</p>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <feature.icon className="w-6 h-6 text-primary mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">{t(feature.title as any)}</h4>
                  <p className="text-sm text-muted-foreground">{t(feature.desc as any)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 pt-4 border-t">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              {t("about_privacy")}
            </p>
            <p className="flex items-start gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              {t("about_sharing_warning")}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 mt-4">
            <h4 className="font-semibold">{t("contact_and_support")}</h4>
            <div className="flex flex-wrap gap-2">
              <a href="mailto:alomar3363@gmail.com" className="inline-flex items-center">
                <Button variant="outline" size="sm">
                  <Mail className="mr-2" /> alomar3363@gmail.com
                </Button>
              </a>
              <a
                href="https://wa.me/96899818404"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Button variant="outline" size="sm">
                  <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.2-.1-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6c-.1-.2 0-.4.1-.5c.1-.1.2-.2.4-.4c.1-.1.2-.2.2-.4c.1-.1.1-.3 0-.4c0-.1-.6-1.5-.8-2c-.2-.6-.4-.5-.6-.5h-.5c-.2 0-.4.1-.6.3c-.2.2-.8.8-.8 1.9c0 1.1.8 2.2 1 2.3c.1.1 1.5 2.3 3.7 3.2c.5.2.9.3 1.2.4c.5.1 1 .1 1.4-.1c.4-.1 1.2-.5 1.4-1c.2-.4.2-.8.1-.9c-.1-.1-.2-.2-.4-.3zM12 2A10 10 0 0 0 2 12c0 5.5 4.5 10 10 10c1.7 0 3.3-.4 4.8-1.2l3.4 1.2l-1.2-3.3A9.9 9.9 0 0 0 22 12c0-5.5-4.5-10-10-10z"
                    />
                  </svg>
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">{t("about_thank_you")}</p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const { authMode } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("settings")

  const TABS = [
    { value: "settings", label: "general", icon: Settings, component: <GeneralSettingsTab /> },
    { value: "sharing", label: "sharing_tab_title", icon: Share2, component: <SharingTab /> },
    { value: "data", label: "data_management", icon: HardDrive, component: <DataManagementTab /> },
    { value: "database", label: "database", icon: Database, component: <DatabaseTab /> },
    { value: "genres", label: "genre_panel_title", icon: Tags, component: <GenrePanel /> },
    { value: "about", label: "about", icon: Info, component: <AboutTab /> },
  ]

  if (authMode === "none") {
    return (
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="p-8 max-w-lg w-full text-center">
          <p className="text-lg mb-6">{t("must_be_logged_in_to_view_settings")}</p>
          <AuthDialog />
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t("control_panel")}</h1>
          <p className="text-muted-foreground">{t("control_panel_desc")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8">
        <TabsList className="flex flex-row md:flex-col md:w-1/4 h-full shrink-0 overflow-x-auto md:overflow-x-visible">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="w-full justify-start gap-2 text-base md:text-sm p-3 md:p-2"
            >
              <tab.icon className="h-5 w-5" />
              {t(tab.label as any)}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="md:w-3/4">
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="m-0">
              {activeTab === tab.value && tab.component}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </main>
  )
}
