"use client"

import { labelFriendlyNames } from "@/lib/label-names"
import { useState, useEffect } from "react"
import { useLabels } from "@/hooks/use-labels"
import { LabelCard } from "@/components/label-card"
import type { Label } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { safeLength } from "@/lib/utils"
import { cn } from "@/lib/utils" // para clases condicionales si usas shadcn

const LEVELS = ["principiante", "intermedio", "avanzado"]

export default function LabelsPage() {
  const { labels, isLoading } = useLabels()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeLevel, setActiveLevel] = useState("principiante")
  const [filteredLabels, setFilteredLabels] = useState<Label[]>([])

  // Filtrar labels por nivel y búsqueda
  useEffect(() => {
    const safeLabels = Array.isArray(labels) ? labels : []
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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">Catálogo de señas médicas</h1>

      {/* Tabs de nivel */}
      <div className="flex gap-2 mb-6">
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

      {/* Input de búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar señas..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-[250px]" />
          ))}
        </div>
      ) : safeLength(filteredLabels) === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No se encontraron señas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabels.map((label) => {
            const friendlyName =
              labelFriendlyNames[label.id] || label.name.replace(/_/g, " ")
            return (
              <LabelCard key={label.id} label={{ ...label, name: friendlyName }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
