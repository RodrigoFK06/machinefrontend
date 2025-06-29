"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useStore } from "@/store/use-store"
import { apiService, type Label } from "@/lib/api"

export function useLabels() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { labels, setLabels, setError } = useStore()

  const fetchLabels = async (): Promise<Label[]> => {
    if (Array.isArray(labels) && labels.length > 0) {
      console.log("📋 Using cached labels:", labels.length)
      return labels
    }

    setIsLoading(true)

    try {
      console.log("🔄 Fetching labels from API...")

      const fetchedData: { label: string; level: string }[] = await apiService.getLabels()

      const safeLabels: Label[] = fetchedData.map((item) => ({
        id: item.label,
        name: item.label.replace(/_/g, " "),
        description: "", // Puedes completar luego si lo deseas
        difficulty: item.level.toLowerCase() as Label["difficulty"], // convertir a tipo correcto
      }))

      setLabels(safeLabels)
      setError(null)
      return safeLabels
    } catch (error) {
      console.error("❌ Error fetching labels:", error)
      setError("Error al cargar etiquetas")
      toast({
        title: "Error al cargar señas",
        description: "No se pudieron cargar las señas. Usando datos de demostración.",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLabels()
  }, [])

  return {
    labels: Array.isArray(labels) ? labels : [],
    isLoading,
    fetchLabels,
  }
}
