"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CameraModule } from "@/components/camera-module"
import { PredictionResult } from "@/components/prediction-result"
import { LabelCard } from "@/components/label-card"
import { useLabels } from "@/hooks/use-labels"
import type { Label, PredictionResponse } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { safeLength, cn } from "@/lib/utils"
import { labelFriendlyNames } from "@/lib/label-names"

const LEVELS = ["principiante", "intermedio", "avanzado"]

export default function PracticePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const labelId = searchParams?.get("label") ?? null
  const { labels, isLoading } = useLabels()

  const [activeLevel, setActiveLevel] = useState("principiante")
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLabels, setFilteredLabels] = useState<Label[]>([])
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null)

  const safeLabels = Array.isArray(labels) ? labels : []

  // 🔎 Filtro por nivel y texto
  useEffect(() => {
    let filtered = safeLabels.filter(
      (label) => label.difficulty?.toLowerCase() === activeLevel
    )
    if (searchTerm) {
      filtered = filtered.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredLabels(filtered)
  }, [labels, searchTerm, activeLevel])

  // 🔁 Seleccionar automáticamente desde la URL (si existe)
  useEffect(() => {
    if (labelId && safeLength(safeLabels) > 0) {
      const label = safeLabels.find((l) => l.id === labelId)
      if (label) {
        setSelectedLabel(label)
        setActiveLevel(label.difficulty?.toLowerCase() || "principiante")
      }
    }
  }, [labelId, labels])

  const handleLabelSelect = (label: Label) => {
    setSelectedLabel(label)
    setPredictionResult(null)
    router.push(`/practice?label=${label.id}`)
  }

  const handlePredictionComplete = (result: PredictionResponse) => {
    setPredictionResult(result)
  }

  const handleClosePrediction = () => {
    setPredictionResult(null)
  }

  const handleRepeat = () => {
    setPredictionResult(null)
  }

  const handleNextLesson = () => {
    if (!selectedLabel) return
    const currentIndex = filteredLabels.findIndex((l) => l.id === selectedLabel.id)
    if (currentIndex !== -1 && currentIndex < safeLength(filteredLabels) - 1) {
      const nextLabel = filteredLabels[currentIndex + 1]
      setSelectedLabel(nextLabel)
      setPredictionResult(null)
      router.push(`/practice?label=${nextLabel.id}`)
    } else {
      const firstLabel = filteredLabels[0]
      if (firstLabel) {
        setSelectedLabel(firstLabel)
        setPredictionResult(null)
        router.push(`/practice?label=${firstLabel.id}`)
      }
    }
  }

  const getFriendlyName = (label: Label | null) => {
    if (!label) return ""
    return labelFriendlyNames[label.id] || label.name.replace(/_/g, " ")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left column - Label selection */}
          <div className="xl:col-span-1 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Selecciona una seña</h2>

              {/* Tabs de nivel */}
              <div className="flex gap-2 mb-4">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-full border",
                      activeLevel === level
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>

              {/* Input búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar señas..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Listado de señas */}
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-[200px]" />
                  ))}
                </div>
              ) : safeLength(filteredLabels) === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No se encontraron señas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredLabels.map((label) => (
                    <LabelCard
                      key={label.id}
                      label={{
                        ...label,
                        name: getFriendlyName(label),
                      }}
                      onSelect={() => handleLabelSelect(label)}
                      isSelected={selectedLabel?.id === label.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Camera and practice */}
          <div className="xl:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Practica la seña</h2>

              {selectedLabel ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-medium">
                      {getFriendlyName(selectedLabel)}
                    </h3>
                  </div>

                  {predictionResult ? (
                    <div className="flex justify-center">
                      <PredictionResult
                        result={predictionResult}
                        expectedLabel={getFriendlyName(selectedLabel)}
                        onClose={handleClosePrediction}
                        onRepeat={handleRepeat}
                        onNextLesson={handleNextLesson}
                      />
                    </div>
                  ) : (
                    <CameraModule
                      selectedLabel={selectedLabel}
                      onPredictionComplete={handlePredictionComplete}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-muted rounded-lg">
                  <p className="text-muted-foreground text-lg">
                    Selecciona una seña para comenzar a practicar
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Elige una seña del panel izquierdo para empezar tu práctica
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
