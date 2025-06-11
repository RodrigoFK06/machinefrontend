/**
 * @module lib/api
 * @description
 * This module serves as the central API service for the application.
 * It utilizes the `ApiService` class to manage all HTTP requests.
 * Key features include:
 * - Calls to backend services are proxied through Next.js API routes (under /api/...).
 * - Automatic retries for failed requests to these API routes.
 * - Fallback to dummy data if API routes return errors or the underlying backend service is unavailable.
 * - Defines data types for API requests and responses.
 * - Provides helper functions for user nickname management.
 */
// API Service - Centraliza todas las llamadas a la API con fallback a datos dummy

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://machinelear.onrender.com"; // Calls are now proxied through Next.js API routes

// Tipos para las respuestas de la API
export interface PredictionRequest {
  sequence: number[][] // Expected as a 35x42 matrix (35 frames, 42 features/frame)
  expected_label: string
  nickname: string
}

export interface PredictionResponse {
  predicted_label: string
  confidence: number
  evaluation: "correct" | "doubtful" | "incorrect"
  observation: string
  success_rate?: number
  average_confidence?: number
}

export interface Label {
  id: string
  name: string
  description: string
  category?: string

  difficulty?: "beginner" | "intermediate" | "advanced" | "default"
}

export interface PredictionRecord {
  id: string
  timestamp: string
  expected_label: string
  predicted_label: string
  confidence: number
  evaluation: "correct" | "doubtful" | "incorrect"
  observation: string
  success_rate?: number
  average_confidence?: number
}

export interface ProgressData {
  label_name: string
  total_attempts: number
  correct_attempts: number
  doubtful_attempts: number
  incorrect_attempts: number
  average_confidence: number
  max_confidence: number
  last_practice: string
  success_rate: number
}

export interface DailyActivity {
  date: string
  total_practices: number
  correct: number
  doubtful: number
  incorrect: number
}

export interface GlobalStats {
  total_attempts: number
  correct_percentage: number
  doubtful_percentage: number
  incorrect_percentage: number
}

// Datos dummy para fallback
const DUMMY_LABELS: Label[] = [
  {
    id: "tengo_fiebre",
    name: "Tengo fiebre",
    description: "Indica que el paciente tiene fiebre",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "me_duele_la_cabeza",
    name: "Me duele la cabeza",
    description: "Comunica dolor de cabeza",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "tengo_tos",
    name: "Tengo tos",
    description: "Indica tos o irritación",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "necesito_medicamentos",
    name: "Necesito medicamentos",
    description: "Solicitar medicación o receta",
    category: "Tratamiento",
    difficulty: "intermediate",
  },
  {
    id: "tengo_alergia",
    name: "Tengo alergia",
    description: "Avisar de una reacción alérgica",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "me_siento_mareado",
    name: "Me siento mareado",
    description: "Expresar mareo o vértigo",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "necesito_interprete",
    name: "Necesito un intérprete",
    description: "Pedir ayuda a un intérprete de señas",
    category: "Asistencia",
    difficulty: "advanced",
  },
  {
    id: "tengo_diabetes",
    name: "Tengo diabetes",
    description: "Informar condición de diabetes",
    category: "Condiciones",
    difficulty: "intermediate",
  },
  {
    id: "alergico_penicilina",
    name: "Soy alérgico a la penicilina",
    description: "Advertir sobre alergia a penicilina",
    category: "Condiciones",
    difficulty: "intermediate",
  },
  {
    id: "necesito_ayuda",
    name: "Necesito ayuda",
    description: "Solicitar ayuda de manera general",
    category: "Asistencia",
    difficulty: "beginner",
  },
  {
    id: "dolor_estomago",
    name: "Tengo dolor de estómago",
    description: "Expresar molestia estomacal",
    category: "Síntomas",
    difficulty: "beginner",
  },
  {
    id: "estoy_embarazada",
    name: "Estoy embarazada",
    description: "Indicar embarazo",
    category: "Condiciones",
    difficulty: "beginner",
  },
]

// Función helper para generar datos dummy de records
const generateDummyRecords = (count = 50): PredictionRecord[] => {
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 14)
    const hoursAgo = Math.floor(Math.random() * 24)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(date.getHours() - hoursAgo)

    const expected = DUMMY_LABELS[Math.floor(Math.random() * DUMMY_LABELS.length)]
    const expectedLabel = expected.name
    const evaluationRandom = Math.random()

    let evaluation: "correct" | "doubtful" | "incorrect"
    let predictedLabel: string
    let confidence: number

    if (evaluationRandom > 0.7) {
      evaluation = "correct"
      predictedLabel = expectedLabel
      confidence = 0.75 + Math.random() * 0.25
    } else if (evaluationRandom > 0.4) {
      evaluation = "doubtful"
      predictedLabel = expectedLabel
      confidence = 0.5 + Math.random() * 0.25
    } else {
      evaluation = "incorrect"
      let incorrect
      do {
        incorrect = DUMMY_LABELS[Math.floor(Math.random() * DUMMY_LABELS.length)]
      } while (incorrect.name === expectedLabel)
      predictedLabel = incorrect.name
      confidence = 0.3 + Math.random() * 0.2
    }

    const observations = {
      correct: "Excelente ejecución de la seña. Movimientos claros y precisos.",
      doubtful: "La seña es reconocible pero puede mejorar en velocidad y precisión.",
      incorrect: "La seña no fue reconocida correctamente. Intenta seguir el patrón de movimiento con más precisión.",
    }

    return {
      id: `record-${i}`,
      timestamp: date.toISOString(),
      expected_label: expectedLabel,
      predicted_label: predictedLabel,
      confidence: confidence,
      evaluation: evaluation,
      observation: observations[evaluation],
      success_rate: Math.random() * 100,
      average_confidence: 0.6 + Math.random() * 0.3,
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Función helper para generar datos dummy de progreso
const generateDummyProgress = (): ProgressData[] => {
  return DUMMY_LABELS.map((label) => {
    const totalAttempts = Math.floor(Math.random() * 20) + 1
    const correctAttempts = Math.floor(totalAttempts * (0.3 + Math.random() * 0.5))
    const doubtfulAttempts = Math.floor((totalAttempts - correctAttempts) * 0.6)
    const incorrectAttempts = totalAttempts - correctAttempts - doubtfulAttempts

    return {
      label_name: label.name,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      doubtful_attempts: doubtfulAttempts,
      incorrect_attempts: incorrectAttempts,
      average_confidence: 0.5 + Math.random() * 0.4,
      max_confidence: 0.7 + Math.random() * 0.3,
      last_practice: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      success_rate: (correctAttempts / totalAttempts) * 100,
    }
  }).filter((p) => p.total_attempts > 0)
}

// Headers estándar para todas las llamadas API
const getApiHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    "Content-Type": "application/json", // Still needed for POST/PUT to our /api routes
    ...additionalHeaders,
  }
}

// Clase para manejar las llamadas a la API
class ApiService {
  // Helper para reintentos automáticos
  private async fetchWithRetry<T>(endpoint: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: getApiHeaders(options.headers as Record<string, string>),
          ...options,
        })

        if (response.ok) {
          return response
        }

        // Si es un error 4xx, no reintentar
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Para errores 5xx, reintentar
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delay}ms`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  private async fetchWithFallback<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData: T,
    description: string,
  ): Promise<T> {
    try {
      console.log(`🌐 API Call: ${description} - ${endpoint}`)

      const response = await this.fetchWithRetry(endpoint, options, 2)
      const data = await response.json()

      console.log(`✅ API Success: ${description}`)
      return data
    } catch (error) {
      console.warn(`⚠️ API Fallback: ${description} - Using dummy data`, error)
      return fallbackData
    }
  }

  // POST /predict - Envía predicción y recibe evaluación
  async predict(data: PredictionRequest): Promise<PredictionResponse> {
    try {
      console.log("👉 Real POST to backend:", data)

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`)
      }

      const result: PredictionResponse = await response.json()
      console.log("✅ Prediction response:", result)
      return result
    } catch (error) {
      console.error("❌ Error calling backend:", error)

      // Fallback dummy response if backend is unreachable
      return {
        predicted_label: data.expected_label,
        confidence: 0.5,
        evaluation: "doubtful",
        observation: "Respuesta generada por fallback local.",
        success_rate: 50,
        average_confidence: 0.5,
      }
    }
  }


  // GET /labels - Obtiene lista de señas disponibles
  async getLabels(): Promise<Label[]> {
    return this.fetchWithFallback("/labels", { method: "GET" }, DUMMY_LABELS, "Get labels")
  }

  // GET /records?nickname=xxx - Obtiene historial de prácticas
  async getRecords(nickname: string, page = 1, limit = 50): Promise<PredictionRecord[]> {
    const fallbackRecords = generateDummyRecords(limit)

    return this.fetchWithFallback(
      `/records?nickname=${encodeURIComponent(nickname)}&page=${page}&limit=${limit}`,
      { method: "GET" },
      fallbackRecords,
      "Get records",
    )
  }

  // GET /progress?nickname=xxx - Obtiene progreso por seña
  async getProgress(nickname: string): Promise<ProgressData[]> {
    const fallbackProgress = generateDummyProgress()

    return this.fetchWithFallback(
      `/progress?nickname=${encodeURIComponent(nickname)}`,
      { method: "GET" },
      fallbackProgress,
      "Get progress",
    )
  }

  // GET /activity/daily/{nickname}/{date_str} - Obtiene actividad diaria
  async getDailyActivity(nickname: string, dateStr: string): Promise<DailyActivity> {
    const fallbackActivity: DailyActivity = {
      date: dateStr,
      total_practices: Math.floor(Math.random() * 10),
      correct: Math.floor(Math.random() * 5),
      doubtful: Math.floor(Math.random() * 3),
      incorrect: Math.floor(Math.random() * 2),
    }

    return this.fetchWithFallback(
      `/activity/daily/${encodeURIComponent(nickname)}/${dateStr}`,
      { method: "GET" },
      fallbackActivity,
      `Get daily activity for ${dateStr}`,
    )
  }

  // GET /stats/global_distribution - Obtiene estadísticas globales
  async getGlobalStats(): Promise<GlobalStats> {
    const fallbackStats: GlobalStats = {
      total_attempts: 1250,
      correct_percentage: 65,
      doubtful_percentage: 25,
      incorrect_percentage: 10,
    }

    return this.fetchWithFallback(
      "/stats/global_distribution",
      { method: "GET" },
      fallbackStats,
      "Get global statistics",
    )
  }

  // GET /health - Verificar estado de la API
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: getApiHeaders(),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      return response.ok
    } catch (error) {
      console.warn("⚠️ API Health check failed:", error)
      return false
    }
  }

  // GET /user/{nickname} - Obtener información del usuario (opcional)
  async getUserInfo(
    nickname: string,
  ): Promise<{ nickname: string; total_practices: number; created_at: string } | null> {
    const fallbackUser = {
      nickname,
      total_practices: 0,
      created_at: new Date().toISOString(),
    }

    return this.fetchWithFallback(
      `/user/${encodeURIComponent(nickname)}`,
      { method: "GET" },
      fallbackUser,
      "Get user info",
    )
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService()

// Helper para obtener nickname del usuario (puedes modificar según tu lógica de autenticación)
export const getUserNickname = (): string => {
  // Por ahora usamos un nickname por defecto, pero puedes integrarlo con tu sistema de auth
  return localStorage.getItem("user_nickname") || "demo_user"
}

// Helper para establecer nickname del usuario
export const setUserNickname = (nickname: string): void => {
  localStorage.setItem("user_nickname", nickname)
}
