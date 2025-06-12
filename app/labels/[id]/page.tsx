"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLabels } from "@/hooks/use-labels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Play } from "lucide-react"
import Link from "next/link"
import type { Label } from "@/lib/api"
import { safeLength, generateColorFromName } from "@/lib/utils"

const DEFAULT_LABEL: Label = {
  id: "",
  name: "",
  description: "",
  difficulty: "default",
  category: "",
}

export default function LabelDetailPage() {
  const params = useParams<{ id?: string }>() || {}
  const router = useRouter()
  const { labels, isLoading } = useLabels()
  const [label, setLabel] = useState<Label>(DEFAULT_LABEL)

  // Asegurarnos de que labels sea un array
  const safeLabels = useMemo(() => (Array.isArray(labels) ? labels : []), [labels])

  useEffect(() => {
    if (safeLength(safeLabels) > 0 && params.id) {
      const foundLabel = safeLabels.find((l) => l.id === params.id)
      setLabel(foundLabel ?? DEFAULT_LABEL)
    }
  }, [safeLabels, params.id])


  const difficultyText = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    default: "Desconocido",
  }

  const difficultyColor = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    default: "bg-muted text-foreground",
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/labels">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-video" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!isLoading && !label.id) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/labels">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al catálogo
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Etiqueta no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/labels">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al catálogo
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{label.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-0">
            <div
              className="w-full aspect-video flex items-center justify-center"
              style={{ backgroundColor: generateColorFromName(label?.name) }}
            >
              <div className="text-center p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{label.name}</h2>
                <p className="text-gray-700">Imagen ilustrativa de la seña</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            {label.description?.length ? (
              <p className="text-muted-foreground">{label.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{label.category || "Sin categoría"}</Badge>
            <Badge className={difficultyColor[label.difficulty ?? "default"]}>
              {difficultyText[label.difficulty ?? "default"]}
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Instrucciones</h2>
            <p className="text-muted-foreground">Para realizar esta seña correctamente, sigue estos pasos:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Posiciona tus manos como se muestra en la imagen</li>
              <li>Realiza el movimiento de manera fluida y clara</li>
              <li>Mantén una postura corporal adecuada</li>
              <li>Practica la seña varias veces para mejorar tu precisión</li>
            </ul>
          </div>

          <Button size="lg" asChild>
            <Link href={`/practice?label=${label.id}`}>
              <Play className="mr-2 h-4 w-4" />
              Practicar esta seña
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}