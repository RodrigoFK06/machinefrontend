"use client"

import { useState, useEffect } from "react"
import { useLabels } from "@/hooks/use-labels"
import { LabelCard } from "@/components/label-card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
// import type { Label } from "@/store/use-store"; // Label is now string via lib/api.ts

export default function LabelsPage() {
  const { labels, isLoading } = useLabels() // useLabels now returns string[]
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLabels, setFilteredLabels] = useState<string[]>([])
  // activeCategory and categories are removed

  // Filter labels based on search
  useEffect(() => {
    // Asegurarnos de que labels sea un array
    const safeLabels = Array.isArray(labels) ? labels : []
    let filtered = [...safeLabels]

    if (searchTerm) {
      filtered = filtered.filter((label) => label.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Category filtering removed
    setFilteredLabels(filtered)
  }, [labels, searchTerm]) // activeCategory removed from dependencies

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo de señas médicas</h1>

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

      {/* Tabs component removed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-[250px]" />
          ))}
        </div>
      ) : filteredLabels.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No se encontraron señas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabels.map((label) => (
            <LabelCard key={label} label={label} /> // Key updated to label itself
          ))}
        </div>
      )}
    </div>
  )
}
