"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ProgressItem {
  label: string
  total_attempts: number
  correct_attempts: number
  doubtful_attempts: number
  incorrect_attempts: number
  last_attempt: string
}

interface ProgressChartProps {
  progressData: ProgressItem[]
  title: string
  description?: string
}

export function ProgressChart({ progressData, title, description }: ProgressChartProps) {
  const safeProgress = Array.isArray(progressData) ? progressData : []

  const processData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date,
        dateStr: format(date, "dd MMM", { locale: es }),
        correct: 0,
        doubtful: 0,
        incorrect: 0,
        total: 0,
      }
    })

    safeProgress.forEach((item) => {
      const recordDate = new Date(item.last_attempt)
      const recordDay = recordDate.toISOString().split("T")[0] // "2025-07-02"
      const dayIndex = days.findIndex(
        (day) => day.date.toISOString().split("T")[0] === recordDay
      )


      if (dayIndex !== -1) {
        days[dayIndex].correct += item.correct_attempts
        days[dayIndex].doubtful += item.doubtful_attempts
        days[dayIndex].incorrect += item.incorrect_attempts
        days[dayIndex].total += item.total_attempts
      }
    })

    return days.map((day) => ({
      name: day.dateStr,
      Correctos: day.correct,
      Dudosos: day.doubtful,
      Incorrectos: day.incorrect,
      total: day.total,
    }))
  }

  const data = processData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Correctos" stackId="a" fill="#10b981" />
              <Bar dataKey="Dudosos" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Incorrectos" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
