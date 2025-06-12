import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Devuelve la longitud de un array o string de forma segura
// evitando errores si el valor es undefined o null
export function safeLength(value?: { length: number } | string | any[]): number {
  return value?.length ?? 0
}

// Genera un color de fondo HSL a partir de un nombre de forma segura
export function generateColorFromName(name?: string): string {
  // Si el nombre no es válido, devolver un color por defecto
  if (!name || typeof name !== "string" || name.length === 0) {
    return "hsl(200, 70%, 85%)"
  }

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 85%)`
}
