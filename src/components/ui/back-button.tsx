"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function BackButton() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Button variant="ghost" onClick={() => router.back()} className="pl-2">
      <ChevronLeft className="h-5 w-5 mr-1" />
      {t('back')}
    </Button>
  )
}
