"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CameraModule } from "@/components/camera-module"
import { PredictionResult } from "@/components/prediction-result"
import { LabelCard } from "@/components/label-card"
import { useLabels } from "@/hooks/use-labels"
import type { Label, PredictionResponse } from "@/lib/api"
import { Input } from "@/components/ui/input"
// Badge and Tabs are no longer used directly here for categories/difficulty
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"

export default function PracticePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const labelId = searchParams.get("label")
  const { labels, isLoading } = useLabels()
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLabels, setFilteredLabels] = useState<Label[]>([])
  // activeCategory and categories removed
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null)

  // Asegurarnos de que labels sea un array
  const safeLabels = Array.isArray(labels) ? labels : []

  // Filter labels based on search
  useEffect(() => {
    const safeLabels = Array.isArray(labels) ? labels : []
    let filtered = [...safeLabels]

    if (searchTerm) {
      filtered = filtered.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filtering removed
    setFilteredLabels(filtered)
  }, [labels, searchTerm]) // activeCategory removed from dependencies

  // Set selected label from URL param
  useEffect(() => {
    const safeLabels = Array.isArray(labels) ? labels : []
    if (labelId && safeLabels.length > 0) {
      const label = safeLabels.find((l) => l.id === labelId)
      if (label) {
        setSelectedLabel(label)
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
    // Optionally, you could trigger the camera to start recording again
  }

  const handleNextLesson = () => {
    if (!selectedLabel) return

    const safeLabels = Array.isArray(labels) ? labels : []
    const currentIndex = safeLabels.findIndex((l) => l.id === selectedLabel.id)

    if (currentIndex !== -1 && currentIndex < safeLabels.length - 1) {
      const nextLabel = safeLabels[currentIndex + 1]
      setSelectedLabel(nextLabel)
      setPredictionResult(null)
      router.push(`/practice?label=${nextLabel.id}`)
    } else {
      // If it's the last lesson, go to the first one or show completion message
      const firstLabel = safeLabels[0]
      if (firstLabel) {
        setSelectedLabel(firstLabel)
        setPredictionResult(null)
        router.push(`/practice?label=${firstLabel.id}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left column - Label selection */}
          <div className="xl:col-span-1 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Selecciona una seña</h2>
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

              {/* Tabs for category filtering removed */}
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-[200px]" />
                  ))}
                </div>
              ) : filteredLabels.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No se encontraron señas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredLabels.map((label) => (
                    <LabelCard
                      key={label.id}
                      label={label}
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
                    <h3 className="text-xl font-medium">{selectedLabel.name}</h3>
                    {/* Badges for category and difficulty removed */}
                  </div>

                  {predictionResult ? (
                    <div className="flex justify-center">
                      <PredictionResult
                        result={predictionResult}
                        expectedLabel={selectedLabel.name}
                        onClose={handleClosePrediction}
                        onRepeat={handleRepeat}
                        onNextLesson={handleNextLesson}
                      />
                    </div>
                  ) : (
                    <CameraModule selectedLabel={selectedLabel} onPredictionComplete={handlePredictionComplete} />
                  )}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-muted rounded-lg">
                  <p className="text-muted-foreground text-lg">Selecciona una seña para comenzar a practicar</p>
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
