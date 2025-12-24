"use client"

import { useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDay } from "date-fns"
import { ReminderCard } from "@/components/notifications/reminder-card"
import { CalendarClock } from "lucide-react"

export default function SchedulesPage() {
  const { reminders } = useAuth()
  const { t, lang } = useTranslation()

  const daysOfWeek = useMemo(
    () => [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")],
    [t],
  )

  const todayIndex = getDay(new Date())

  const remindersByDay = useMemo(() => {
    const grouped: { [key: number]: any[] } = Array.from({ length: 7 }, () => [])
    reminders.forEach((reminder) => {
      const reminderDate = new Date(reminder.startDateTime)

      if (reminder.repeatOnDays && reminder.repeatOnDays.length > 0) {
        reminder.repeatOnDays.forEach((dayIndex) => {
          if (dayIndex >= 0 && dayIndex < 7) {
            grouped[dayIndex].push(reminder)
          }
        })
      } else {
        const dayIndex = getDay(reminderDate)
        grouped[dayIndex].push(reminder)
      }
    })

    // Sort reminders within each day by time
    for (const day in grouped) {
      grouped[day].sort((a, b) => {
        const timeA = new Date(a.startDateTime).getTime()
        const timeB = new Date(b.startDateTime).getTime()
        return timeA - timeB
      })
    }

    return grouped
  }, [reminders])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
          <CalendarClock className="w-10 h-10" />
          {t("schedules")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t("weekly_schedule_desc")}</p>
      </div>

      <Tabs defaultValue={String(todayIndex)} className="w-full" dir={lang === "ar" ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-7">
          {daysOfWeek.map((day, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {daysOfWeek.map((_, index) => (
          <TabsContent key={index} value={String(index)} className="mt-6">
            {remindersByDay[index] && remindersByDay[index].length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {remindersByDay[index].map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground rounded-lg bg-muted/50">
                <CalendarClock className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">{t("no_reminders_for_today")}</h3>
                <p>{t("add_reminders_to_see_schedule")}</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
