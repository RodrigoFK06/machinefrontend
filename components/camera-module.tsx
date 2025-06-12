"use client"

import { useRef, useState, useEffect, useCallback } from "react" // Added useCallback
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

// Constants for the expected LSTM input matrix dimensions
const NUM_FRAMES = 35
const NUM_FEATURES = 42

export function CameraModule({ selectedLabel, onPredictionComplete }: CameraModuleProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false) // ✅ Nuevo estado para controlar la cámara
  const [isRecording, setIsRecording] = useState(false)
  const [isReadyForPrediction, setIsReadyForPrediction] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [frames, setFrames] = useState<number[][]>([])
  const framesRef = useRef<number[][]>([])
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const recordingRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { predict, isLoading: isPredicting } = usePredict()

  // Handle frame processing
  const handleFrame = (imageData: ImageData) => {
    console.log("📸 Frame recibido", imageData)

    if (isRecording && isReadyForPrediction) {
      setFrames((prevFrames) => {
        if (prevFrames.length < NUM_FRAMES) {
          const processedFrame = preprocessFrame(imageData)
          console.log("🧪 Frame procesado:", processedFrame)

          const newFrames = [...prevFrames, processedFrame]
          framesRef.current = newFrames
          console.log(`📸 Capturando frame ${newFrames.length} de ${NUM_FRAMES}`)
          return newFrames
        }

        framesRef.current = prevFrames
        return prevFrames
      })
    }
  }

  const {
    videoRef,
    canvasRef,
    isLoading: isCameraLoading,
    error: cameraError,
    preprocessFrame,
  } = useCamera({
    enabled: cameraEnabled, // ✅ Ahora usa cameraEnabled en lugar de isRecording
    onFrame: handleFrame,
    frameRate: 15,
  })

  // Start recording with countdown
  const startRecording = () => {
    if (!selectedLabel) {
      toast({
        title: "Selecciona una seña",
        description: "Debes seleccionar una seña para practicar",
        variant: "destructive",
      })
      return
    }

    setFrames([])
    framesRef.current = []
    setIsReadyForPrediction(false)
    setCameraEnabled(true) // ✅ Activa cámara de inmediato
    setCountdown(3)

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!)
          setCountdown(null)
          setIsReadyForPrediction(true)
          setIsRecording(true) // ✅ Ahora sí comienza la grabación real

          console.log("🎥 Grabación iniciada, esperando capturar frames...")

          recordingRef.current = setTimeout(() => {
            setIsRecording(false)
            setCameraEnabled(false) // ✅ Apaga cámara al terminar
            submitRecording()
          }, 3000)

          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false)
    setIsReadyForPrediction(false)
    setCameraEnabled(false) // ✅ También apaga la cámara
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      setCountdown(null)
    }
    if (recordingRef.current) {
      clearTimeout(recordingRef.current)
    }
  }

  // Submit recording for prediction
  const submitRecording = useCallback(async () => {
    if (!selectedLabel) return
    const capturedFrames = framesRef.current
    console.log("🧪 Enviando frames:", capturedFrames.length)

    if (capturedFrames.length < NUM_FRAMES || !capturedFrames.every((f) => f.length === NUM_FEATURES)) {
      toast({
        title: "Captura incompleta",
        description: "No se capturaron suficientes frames para la predicción.",
        variant: "destructive",
      })
      setIsRecording(false)
      return
    }
    const sequenceToSubmit = capturedFrames

    // Clear frames for the next recording
    setFrames([])
    framesRef.current = []

    try {
      console.log("📡 Enviando frames al endpoint /predict")
      const result = await predict({
        sequence: sequenceToSubmit,
        expected_label: selectedLabel.name,
      })

      if (result && onPredictionComplete) {
        onPredictionComplete(result)
      }
    } catch (error) {
      console.error("Error during prediction submission or completion callback:", error)
      toast({
        title: "Error de Procesamiento",
        description: "Ocurrió un error al procesar la predicción.",
        variant: "destructive",
      })
      setIsRecording(false) // Safeguard
      setIsReadyForPrediction(false)
    }
  }, [selectedLabel, predict, onPredictionComplete, toast]) // NUM_FRAMES & NUM_FEATURES are constants

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (recordingRef.current) clearTimeout(recordingRef.current) // recordingRef might be null now but good practice
    }
  }, [])

  if (cameraError) {
    console.warn("🚨 Error de cámara:", cameraError)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4">
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0 relative">
          {isCameraLoading ? (
            <Skeleton className="w-full aspect-video" />
          ) : cameraError ? (
            <div className="w-full aspect-video flex items-center justify-center bg-muted">
              <div className="text-center p-6">
                <p className="text-destructive mb-2">{cameraError}</p>
                <p className="text-sm text-muted-foreground">
                  No te preocupes, puedes seguir probando la aplicación en modo simulación.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover rounded-lg"
                style={{
                  transform: "scaleX(-1)", // Mirror the video for better UX
                  objectPosition: "center center", // Ensure proper centering
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-medium">Grabando...</span>
                </div>
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center">
                    <span className="text-6xl font-bold text-white drop-shadow-lg">{countdown}</span>
                    <p className="text-white mt-2 text-lg">Prepárate...</p>
                  </div>
                </div>
              )}

              {/* Selected label overlay */}
              {selectedLabel && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <p className="font-medium text-sm">{selectedLabel.name}</p>
                </div>
              )}

              {/* Processing overlay */}
              {isPredicting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Procesando...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        {isRecording ? (
          <Button variant="destructive" size="lg" onClick={stopRecording} disabled={isPredicting}>
            <Square className="mr-2 h-4 w-4" />
            Detener
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={startRecording}
            disabled={!selectedLabel || isPredicting || countdown !== null}
          >
            {isPredicting ? (
              "Procesando..."
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Comenzar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}