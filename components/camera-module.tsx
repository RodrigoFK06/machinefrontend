"use client"

import { useRef, useState, useCallback } from "react"
import { useCamera } from "@/hooks/use-camera"
import { usePredict } from "@/hooks/use-predict"
import type { Label } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Play, Square } from "lucide-react"

interface CameraModuleProps {
  selectedLabel: Label | null
  onPredictionComplete?: (result: any) => void
}

// 👉 NORMALIZADOR AGREGADO
function normalizeLandmarks(landmarks: number[]): number[] {
  const x = []
  const y = []

  for (let i = 0; i < landmarks.length; i += 2) {
    x.push(landmarks[i])
    y.push(landmarks[i + 1])
  }

  const meanX = x.reduce((a, b) => a + b, 0) / x.length
  const meanY = y.reduce((a, b) => a + b, 0) / y.length

  const stdX = Math.sqrt(x.reduce((a, b) => a + (b - meanX) ** 2, 0) / x.length)
  const stdY = Math.sqrt(y.reduce((a, b) => a + (b - meanY) ** 2, 0) / y.length)

  const normalized: number[] = []

  for (let i = 0; i < x.length; i++) {
    const normX = stdX === 0 ? 0 : (x[i] - meanX) / stdX
    const normY = stdY === 0 ? 0 : (y[i] - meanY) / stdY
    normalized.push(normX, normY)
  }

  return normalized
}

export function CameraModule({ selectedLabel, onPredictionComplete }: CameraModuleProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [frames, setFrames] = useState<number[][]>([])
  const framesRef = useRef<number[][]>([])
  const { toast } = useToast()
  const { predict, isLoading: isPredicting } = usePredict()

  const {
    videoRef,
    canvasRef,
    isLoading: isCameraLoading,
    error: cameraError,
    preprocessFrame,
  } = useCamera({
    enabled: cameraEnabled,
    frameRate: 7,
    onFrame: async (imageData: ImageData) => {
      if (!isRecording) return
      const rawFeatures = preprocessFrame(imageData)
      const features = normalizeLandmarks(rawFeatures) // 🔧 aplicar normalización

      const isValid = features.length === 42 && features.some((v) => v !== 0)

      if (isValid) {
        framesRef.current.push(features)
        setFrames([...framesRef.current])
        console.log(`📸 Frame válido ${framesRef.current.length}`)

        if (framesRef.current.length === 35) {
          console.log("✅ Se recolectaron 35 frames válidos. Enviando al backend...")
          setIsRecording(false)
          setCameraEnabled(false)
          submitPrediction()
        }
      }
    },
  })

  const startCountdownAndRecord = () => {
    if (!selectedLabel) {
      toast({
        title: "Selecciona una seña",
        description: "Debes seleccionar una seña antes de grabar.",
        variant: "destructive",
      })
      return
    }

    framesRef.current = []
    setFrames([])
    setCameraEnabled(true)
    setCountdown(3)
    setIsCountingDown(true)

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsCountingDown(false)
          setTimeout(() => {
            console.log("🎬 Comenzando grabación (después de pequeña pausa)...")
            setIsRecording(true)
          }, 200)
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopEverything = () => {
    setIsCountingDown(false)
    setIsRecording(false)
    setCameraEnabled(false)
    framesRef.current = []
    setFrames([])
    console.log("🛑 Grabación detenida manualmente")
  }

  const submitPrediction = useCallback(async () => {
    let sequence = framesRef.current.filter(
      (frame) => frame.length === 42 && frame.some((v) => v !== 0)
    )

    if (sequence.length !== 35) {
      toast({
        title: "Secuencia incompleta",
        description: "Se necesitan exactamente 35 frames válidos.",
        variant: "destructive",
      })
      return
    }

    const normalizedLabel = selectedLabel?.name
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_")
      .trim()

    console.log("🔍 Normalized Label:", normalizedLabel)
    console.log("📤 Primer frame a enviar:", sequence[0])
    console.log("📤 Enviando al backend:", {
      sequenceLength: sequence.length,
      ejemplo: sequence[0]?.slice(0, 5),
      expected_label: normalizedLabel,
      nickname: "demo_user",
    })

    try {
      const result = await predict({
        sequence,
        expected_label: normalizedLabel,
      })
      if (onPredictionComplete) onPredictionComplete(result)
    } catch (error) {
      toast({
        title: "Error en predicción",
        description: "No se pudo procesar la secuencia.",
        variant: "destructive",
      })
      console.error("❌ Error enviando predicción:", error)
    }
  }, [predict, selectedLabel, onPredictionComplete, toast])

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4">
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0 relative">
          {isCameraLoading ? (
            <Skeleton className="w-full aspect-video" />
          ) : cameraError ? (
            <div className="w-full aspect-video flex items-center justify-center bg-muted">
              <p className="text-destructive text-center">{cameraError}</p>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover rounded-lg"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} className="hidden" />
              {selectedLabel && (
                <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded shadow">
                  <p className="text-sm font-medium">{selectedLabel.name}</p>
                </div>
              )}
              {isCountingDown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-6xl font-bold rounded-lg">
                  {countdown}
                </div>
              )}
              {isPredicting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <p className="text-white text-lg">Procesando...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        {isRecording || isCountingDown ? (
          <Button variant="destructive" size="lg" onClick={stopEverything}>
            <Square className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={startCountdownAndRecord}
            disabled={!selectedLabel || isPredicting}
          >
            <Play className="mr-2 h-4 w-4" />
            Comenzar
          </Button>
        )}
      </div>
    </div>
  )
}
