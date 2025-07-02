"use client"

import React from "react"
import { useRecords } from "@/hooks/use-records"
import { useLabels } from "@/hooks/use-labels"
import { useProgress } from "@/hooks/use-progress"
import { ProgressChart } from "@/components/progress-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { safeLength } from "@/lib/utils"

export default function ProgressPage() {
  const { allRecords } = useRecords()
  const { labels } = useLabels()
  const { progressData, globalStats, isLoading: isProgressLoading } = useProgress()

  // Asegurarnos de que allRecords y labels sean arrays
  const safeRecords = Array.isArray(allRecords) ? allRecords : []
  const safeLabels = Array.isArray(labels) ? labels : []

  // Debug logging
  console.log("🔍 Progress Page Debug:", {
    progressDataLength: safeLength(progressData),
    progressDataSample: progressData.slice(0, 2),
    globalStats,
    globalStatsExists: !!globalStats,
    globalStatsHasData: !!(globalStats && globalStats.total_attempts),
    safeRecordsLength: safeLength(safeRecords),
    safeLabelsLength: safeLength(safeLabels),
    isProgressLoading
  })

  // Calculate statistics from records (fallback si no hay progressData de la API)
  const totalAttempts = safeLength(safeRecords)
  const correctCount = safeLength(safeRecords.filter((r) => r.evaluation === "correct"))
  const doubtfulCount = safeLength(safeRecords.filter((r) => r.evaluation === "doubtful"))
  const incorrectCount = safeLength(safeRecords.filter((r) => r.evaluation === "incorrect"))

  const correctPercentage = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0
  const doubtfulPercentage = totalAttempts > 0 ? Math.round((doubtfulCount / totalAttempts) * 100) : 0
  const incorrectPercentage = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0

  // Helper function para formatear números
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num) || num < 0) return "0"
    return new Intl.NumberFormat('es-ES').format(Math.round(num))
  }

  const formatPercentage = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num) || num < 0) return "0"
    const rounded = Math.round(num)
    return rounded.toString()
  }

  // Usar datos de la API si están disponibles, sino usar cálculos locales con validación robusta
  const displayStats = (() => {
    // 1. Prioridad: usar globalStats si está disponible y tiene datos válidos
    if (globalStats && typeof globalStats.total_attempts === 'number' && globalStats.total_attempts >= 0) {
      console.log("📈 Using Global Stats:", globalStats)
      return {
        total_attempts: globalStats.total_attempts || 0,
        correct_percentage: typeof globalStats.correct_percentage === 'number' ? globalStats.correct_percentage : 0,
        doubtful_percentage: typeof globalStats.doubtful_percentage === 'number' ? globalStats.doubtful_percentage : 0,
        incorrect_percentage: typeof globalStats.incorrect_percentage === 'number' ? globalStats.incorrect_percentage : 0,
      }
    }
    
    // 2. Segunda prioridad: calcular desde progressData si está disponible
    if (safeLength(progressData) > 0) {
      const totalFromProgress = progressData.reduce((sum, p) => sum + (typeof p.total_attempts === 'number' ? p.total_attempts : 0), 0)
      const correctFromProgress = progressData.reduce((sum, p) => sum + (typeof p.correct_attempts === 'number' ? p.correct_attempts : 0), 0)
      const doubtfulFromProgress = progressData.reduce((sum, p) => sum + (typeof p.doubtful_attempts === 'number' ? p.doubtful_attempts : 0), 0)
      const incorrectFromProgress = progressData.reduce((sum, p) => sum + (typeof p.incorrect_attempts === 'number' ? p.incorrect_attempts : 0), 0)

      const correctPercentageFromProgress = totalFromProgress > 0 ?
        (correctFromProgress / totalFromProgress) * 100 : 0
      const doubtfulPercentageFromProgress = totalFromProgress > 0 ?
        (doubtfulFromProgress / totalFromProgress) * 100 : 0
      const incorrectPercentageFromProgress = totalFromProgress > 0 ?
        (incorrectFromProgress / totalFromProgress) * 100 : 0

      console.log("📈 Display Stats from Progress Data:", {
        totalFromProgress,
        correctPercentageFromProgress,
        doubtfulPercentageFromProgress,
        incorrectPercentageFromProgress
      })

      return {
        total_attempts: totalFromProgress,
        correct_percentage: correctPercentageFromProgress,
        doubtful_percentage: doubtfulPercentageFromProgress,
        incorrect_percentage: incorrectPercentageFromProgress,
      }
    }
    
    // 3. Última prioridad: usar datos locales calculados desde records
    if (totalAttempts > 0) {
      console.log("📈 Using Local Records Data")
      return {
        total_attempts: totalAttempts,
        correct_percentage: correctPercentage,
        doubtful_percentage: doubtfulPercentage,
        incorrect_percentage: incorrectPercentage,
      }
    }

    // 4. Fallback final: datos por defecto
    console.log("📈 Using Default Fallback Data")
    return {
      total_attempts: 0,
      correct_percentage: 0,
      doubtful_percentage: 0,
      incorrect_percentage: 0,
    }
  })()

  // Data for pie chart - usar datos de la API si están disponibles
  const pieData = (() => {
    if (globalStats && typeof globalStats.total_attempts === 'number' && globalStats.total_attempts > 0) {
      // ✅ Usar globalStats para crear datos del pie chart
      const totalFromAPI = globalStats.total_attempts
      const correctFromAPI = Math.round((globalStats.correct_percentage / 100) * totalFromAPI) || 0
      const doubtfulFromAPI = Math.round((globalStats.doubtful_percentage / 100) * totalFromAPI) || 0
      const incorrectFromAPI = Math.round((globalStats.incorrect_percentage / 100) * totalFromAPI) || 0

      console.log("📊 Pie Chart API Data:", {
        totalFromAPI,
        correctFromAPI,
        doubtfulFromAPI,
        incorrectFromAPI,
        percentages: {
          correct: globalStats.correct_percentage,
          doubtful: globalStats.doubtful_percentage,
          incorrect: globalStats.incorrect_percentage
        }
      })

      return [
        { name: "Correctos", value: correctFromAPI, color: "#10b981" },
        { name: "Dudosos", value: doubtfulFromAPI, color: "#f59e0b" },
        { name: "Incorrectos", value: incorrectFromAPI, color: "#ef4444" },
      ].filter(item => item.value > 0) // Solo incluir elementos con valores > 0
    } else if (safeLength(progressData) > 0) {
      // Calcular desde progressData si no hay globalStats
      const totalFromProgress = progressData.reduce((sum, p) => sum + (typeof p.total_attempts === 'number' ? p.total_attempts : 0), 0)
      const correctFromProgress = progressData.reduce((sum, p) => sum + (typeof p.correct_attempts === 'number' ? p.correct_attempts : 0), 0)
      const doubtfulFromProgress = progressData.reduce((sum, p) => sum + (typeof p.doubtful_attempts === 'number' ? p.doubtful_attempts : 0), 0)
      const incorrectFromProgress = progressData.reduce((sum, p) => sum + (typeof p.incorrect_attempts === 'number' ? p.incorrect_attempts : 0), 0)

      console.log("📊 Pie Chart Progress Data:", {
        totalFromProgress,
        correctFromProgress,
        doubtfulFromProgress,
        incorrectFromProgress
      })

      return [
        { name: "Correctos", value: correctFromProgress, color: "#10b981" },
        { name: "Dudosos", value: doubtfulFromProgress, color: "#f59e0b" },
        { name: "Incorrectos", value: incorrectFromProgress, color: "#ef4444" },
      ].filter(item => item.value > 0) // Solo incluir elementos con valores > 0
    } else {
      // Fallback a datos locales
      console.log("📊 Pie Chart Local Data:", {
        correctCount,
        doubtfulCount,
        incorrectCount
      })

      return [
        { name: "Correctos", value: correctCount, color: "#10b981" },
        { name: "Dudosos", value: doubtfulCount, color: "#f59e0b" },
        { name: "Incorrectos", value: incorrectCount, color: "#ef4444" },
      ].filter(item => item.value > 0) // Solo incluir elementos con valores > 0
    }
  })()


  // Helper function para normalizar nombres y mejorar el mapeo
  const normalizeLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacríticos
      .replace(/[^\w\s]/g, "") // Remove caracteres especiales
      .replace(/\s+/g, "_") // Replace espacios con guiones bajos
      .trim()
  }

  // Calculate statistics by label usando progressData de la API si está disponible
  let labelStats: any[] = []

  if (safeLength(progressData) > 0) {
    // Usar datos de la API
    labelStats = progressData.map((progress) => {
      // Mejorar el mapeo de categorías con normalización
      const matchingLabel = safeLabels.find((l) => {
        const normalizedApiLabel = normalizeLabel(progress.label)
        const normalizedLocalLabel = normalizeLabel(l.name)
        const normalizedLocalId = normalizeLabel(l.id)

        return normalizedApiLabel === normalizedLocalLabel ||
          normalizedApiLabel === normalizedLocalId ||
          progress.label === l.name ||
          progress.label === l.id
      })

      return {
        id: progress.label, // Use `label` as the unique key
        name: progress.label.replace(/_/g, " "), // Mostrar con espacios para mejor legibilidad
        total: progress.total_attempts,
        correct: progress.correct_attempts,
        doubtful: progress.doubtful_attempts,
        incorrect: progress.incorrect_attempts,
        successRate: Math.round(progress.success_rate * 10) / 10, // Redondear a 1 decimal
        doubtfulRate: Math.round(progress.doubtful_rate * 10) / 10,
        incorrectRate: Math.round(progress.incorrect_rate * 10) / 10,
        averageConfidence: Math.round(progress.average_confidence * 100) / 100, // Redondear a 2 decimales
        maxConfidence: Math.round(progress.max_confidence * 100) / 100,
        minConfidence: Math.round(progress.min_confidence * 100) / 100,
        lastAttempt: progress.last_attempt,
        category: matchingLabel?.category || "Médico", // Default más descriptivo
        difficulty: matchingLabel?.difficulty || "default",
      }
    })
  } else {
    // Fallback a cálculos locales
    labelStats = safeLabels
      .map((label) => {
        const labelRecords = safeRecords.filter((r) => r.expected_label === label.name)
        const total = safeLength(labelRecords)
        const correct = safeLength(labelRecords.filter((r) => r.evaluation === "correct"))
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

        return {
          id: label.id,
          name: label.name,
          total,
          correct,
          percentage,
          successRate: percentage, // Add successRate for consistency
          category: label.category || "Sin categoría",
        }
      })
      .filter((stat) => stat.total > 0)
  }

  // Sort by most practiced
  const sortedLabelStats = [...labelStats].sort((a, b) => b.total - a.total)

  // Calcular número de señas practicadas
  const practicesSignsCount = safeLength(labelStats)

  // Additional debug logging after all variables are defined
  console.log("🥧 Pie Data Debug:", pieData)
  console.log("🎯 Label Stats Debug:", {
    length: labelStats.length,
    sampleData: labelStats.slice(0, 2)
  })
  console.log("📊 Display Stats Debug:", displayStats)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Tu progreso</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Intentos totales</CardTitle>
              <CardDescription>Número total de prácticas</CardDescription>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <p className="text-4xl font-bold">
                  {formatNumber(displayStats.total_attempts)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tasa de éxito</CardTitle>
              <CardDescription>Porcentaje de señas correctas</CardDescription>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <p className="text-4xl font-bold text-green-500">
                  {formatPercentage(displayStats.correct_percentage)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Señas practicadas</CardTitle>
              <CardDescription>Número de señas diferentes</CardDescription>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <p className="text-4xl font-bold">
                  {formatNumber(practicesSignsCount)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProgressChart
            progressData={progressData}
            title="Actividad diaria"
            description="Resultados de tus prácticas en los últimos 7 días"
          />

          <Card>
            <CardHeader>
              <CardTitle>Distribución de resultados</CardTitle>
              <CardDescription>Proporción de evaluaciones por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {isProgressLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData.length > 0 && pieData.some(item => item.value > 0)
                          ? pieData.filter(item => item.value > 0)
                          : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }]
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent, value }) =>
                          pieData.length > 0 && pieData.some(item => item.value > 0)
                            ? `${name} ${(percent * 100).toFixed(0)}%`
                            : "Sin datos disponibles"
                        }
                      >
                        {(pieData.length > 0 && pieData.some(item => item.value > 0)
                          ? pieData.filter(item => item.value > 0)
                          : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }]
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) =>
                          pieData.length > 0 && pieData.some(item => item.value > 0)
                            ? [`${value} intentos`, name]
                            : ["No hay datos", ""]
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progreso por seña</CardTitle>
            <CardDescription>
              {safeLength(progressData) > 0
                ? `Estadísticas detalladas desde la API por cada seña practicada (${progressData.length} señas)`
                : "Estadísticas calculadas localmente por cada seña practicada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProgressLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : safeLength(sortedLabelStats) > 0 ? (
              <Tabs defaultValue="most-practiced">
                <TabsList className="mb-4">
                  <TabsTrigger value="most-practiced">Más practicadas</TabsTrigger>
                  <TabsTrigger value="best-performance">Mejor rendimiento</TabsTrigger>
                  <TabsTrigger value="all-signs">Todas las señas</TabsTrigger>
                </TabsList>

                <TabsContent value="most-practiced">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {Math.min(sortedLabelStats.length, 10)} de {sortedLabelStats.length} señas
                      </p>
                    </div>
                    {sortedLabelStats.slice(0, 10).map((stat) => (
                      <div key={stat.id} className="flex items-center p-3 border rounded-lg">
                        <div className="w-1/3">
                          <p className="font-medium">{stat.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{stat.category}</p>
                            {stat.difficulty && stat.difficulty !== 'default' && (
                              <span className={`text-xs px-2 py-1 rounded-full ${stat.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                  stat.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {stat.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-1/3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{stat.total} intentos</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat.correct}✓ {stat.doubtful}⚠ {stat.incorrect}✗
                          </div>
                        </div>
                        <div className="w-1/3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-green-500 h-2.5 rounded-full"
                                style={{ width: `${Math.min(stat.successRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{stat.successRate}%</span>
                          </div>
                          {stat.averageConfidence && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Confianza: {Math.round(stat.averageConfidence * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sortedLabelStats.length > 10 && (
                      <div className="text-center pt-4">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                          onClick={() => {
                            // TODO: Implementar modal o expandir lista
                            console.log("Ver todas las señas:", sortedLabelStats.length)
                          }}
                        >
                          Ver todas las {sortedLabelStats.length} señas
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="best-performance">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        Señas con mejor rendimiento (min. 2 intentos)
                      </p>
                    </div>
                    {[...labelStats]
                      .filter((stat) => stat.total >= 2) // Reducir filtro de 3 a 2 intentos
                      .sort((a, b) => b.successRate - a.successRate)
                      .slice(0, 10) // Mostrar 10 en lugar de 5
                      .map((stat) => (
                        <div key={stat.id} className="flex items-center p-3 border rounded-lg">
                          <div className="w-1/3">
                            <p className="font-medium">{stat.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">{stat.category}</p>
                              {stat.difficulty && stat.difficulty !== 'default' && (
                                <span className={`text-xs px-2 py-1 rounded-full ${stat.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                    stat.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                  {stat.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-1/3">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">{stat.total} intentos</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {stat.correct}✓ {stat.doubtful}⚠ {stat.incorrect}✗
                            </div>
                          </div>
                          <div className="w-1/3">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className="bg-green-500 h-2.5 rounded-full"
                                  style={{ width: `${Math.min(stat.successRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{stat.successRate}%</span>
                            </div>
                            {stat.averageConfidence && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Confianza: {Math.round(stat.averageConfidence * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="all-signs">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        Todas las señas practicadas ({labelStats.length} total)
                      </p>
                      <div className="text-xs text-muted-foreground">
                        ✓ Correctos | ⚠ Dudosos | ✗ Incorrectos
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {labelStats
                        .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar alfabéticamente
                        .map((stat) => (
                          <div key={stat.id} className="flex items-center p-3 border rounded-lg">
                            <div className="w-1/3">
                              <p className="font-medium">{stat.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{stat.category}</p>
                                {stat.difficulty && stat.difficulty !== 'default' && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${stat.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                      stat.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {stat.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-1/3">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">{stat.total} intentos</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stat.correct}✓ {stat.doubtful}⚠ {stat.incorrect}✗
                              </div>
                            </div>
                            <div className="w-1/3">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-2.5">
                                  <div
                                    className="bg-green-500 h-2.5 rounded-full"
                                    style={{ width: `${Math.min(stat.successRate, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{stat.successRate}%</span>
                              </div>
                              {stat.averageConfidence && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Confianza: {Math.round(stat.averageConfidence * 100)}%
                                </div>
                              )}
                              {stat.lastAttempt && (
                                <div className="text-xs text-muted-foreground">
                                  Último: {new Date(stat.lastAttempt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info - Solo visible en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-2">
                <div>📊 Progress Data Length: {safeLength(progressData)}</div>
                <div>📋 Labels Length: {safeLength(safeLabels)}</div>
                <div>📝 Records Length: {safeLength(safeRecords)}</div>
                <div>🎯 Label Stats Length: {safeLength(labelStats)}</div>
                <div>📈 Global Stats: {globalStats ? "✅ Available" : "❌ Not available"}</div>
                <div>🔄 Loading: {isProgressLoading ? "Yes" : "No"}</div>
                
                <div className="mt-4 p-2 bg-gray-50 rounded">
                  <div className="font-semibold">📊 Display Stats Values:</div>
                  <div>Total Attempts: {formatNumber(displayStats.total_attempts)} (raw: {displayStats.total_attempts})</div>
                  <div>Correct %: {formatPercentage(displayStats.correct_percentage)}% (raw: {displayStats.correct_percentage})</div>
                  <div>Doubtful %: {formatPercentage(displayStats.doubtful_percentage)}% (raw: {displayStats.doubtful_percentage})</div>
                  <div>Incorrect %: {formatPercentage(displayStats.incorrect_percentage)}% (raw: {displayStats.incorrect_percentage})</div>
                </div>

                {globalStats && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver Global Stats completo</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(globalStats, null, 2)}
                    </pre>
                  </details>
                )}

                {progressData.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver muestra de Progress Data</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(progressData.slice(0, 2), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}