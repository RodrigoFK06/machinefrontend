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
