"use client"
import { labelFriendlyNames } from "@/lib/label-names"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Label } from "@/lib/api"
import { generateColorFromName } from "@/lib/utils"
import { BookOpen, BarChart3 } from "lucide-react"
import Link from "next/link"

interface LabelCardProps {
  label: Label
  onSelect?: () => void
  isSelected?: boolean
}

export function LabelCard({ label, onSelect, isSelected = false }: LabelCardProps) {
const friendlyName = labelFriendlyNames[label.id] || label.name.replace(/_/g, " ")
  return (
    <Card className={`transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{friendlyName}</CardTitle>
          {/* Difficulty Badge Removed */}
        </div>
        {/* CardDescription Removed */}
      </CardHeader>
      <CardContent>
        {/* Category Badge Removed */}
        <div
          className="w-full aspect-video rounded-md flex items-center justify-center mt-2 overflow-hidden"
          style={{ backgroundColor: generateColorFromName(label?.name) }}
        >
          <div className="text-center p-4">
            <p className="font-medium text-gray-700">Ejemplo: {friendlyName}</p>
            <p className="text-sm text-gray-600 mt-1">Imagen ilustrativa</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onSelect ? (
          <Button onClick={onSelect} variant={isSelected ? "default" : "outline"} className="w-full">
            {isSelected ? "Seleccionada" : "Seleccionar"}
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/labels/${label.id}`}>
                <BookOpen className="h-4 w-4 mr-2" />
                Detalles
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/practice?label=${label.id}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Practicar
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
