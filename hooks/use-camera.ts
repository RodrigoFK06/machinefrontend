"use client"

import { useState, useEffect, useRef } from "react"
import type { HandLandmarker } from "@mediapipe/tasks-vision"

type UseCameraOptions = {
  enabled?: boolean
  onFrame?: (imageData: ImageData) => void
  frameRate?: number
}

export function useCamera({ enabled = true, onFrame, frameRate = 7 }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameLoopRef = useRef<number | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)

  useEffect(() => {
    if (!enabled) return

    const init = async () => {
      setIsLoading(true)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        setStream(mediaStream)

        const vision = await import("@mediapipe/tasks-vision")
        const resolver = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
        )

        const handLandmarker = await vision.HandLandmarker.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task",
          },
          runningMode: "IMAGE",
          numHands: 2,
        })

        handLandmarkerRef.current = handLandmarker
        console.log("✅ Modelo MediaPipe cargado correctamente")
      } catch (err) {
        console.error("❌ Error al iniciar cámara o modelo:", err)
        setError("No se pudo acceder a la cámara o al modelo.")
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
      if (frameLoopRef.current) cancelAnimationFrame(frameLoopRef.current)
      handLandmarkerRef.current?.close?.()
    }
  }, [enabled])

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream
        console.log("🎥 Stream asignado a videoRef")
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [stream])

  useEffect(() => {
    if (!enabled || !stream || !videoRef.current || !canvasRef.current || !onFrame) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    let lastFrameTime = 0
    const interval = 1000 / frameRate

    const processFrame = (timestamp: number) => {
      if (
        timestamp - lastFrameTime >= interval &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        console.log("🔁 Frame capturado")
        onFrame(imageData)
        lastFrameTime = timestamp
      }
      frameLoopRef.current = requestAnimationFrame(processFrame)
    }

    frameLoopRef.current = requestAnimationFrame(processFrame)

    return () => {
      if (frameLoopRef.current) cancelAnimationFrame(frameLoopRef.current)
    }
  }, [enabled, stream, onFrame, frameRate])

  const preprocessFrame = (imageData: ImageData): number[] => {
    const handLandmarker = handLandmarkerRef.current
    if (!handLandmarker) return Array(42).fill(0)

    const canvas = document.createElement("canvas")
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext("2d")!
    ctx.putImageData(imageData, 0, 0)

    const result = handLandmarker.detect(canvas)
    const features = Array(42).fill(0)

    if (result.landmarks?.length >= 1) {
      const hand = result.landmarks[0]
      for (let i = 0; i < 21; i++) {
        const x = hand[i]?.x ?? 0
        const y = hand[i]?.y ?? 0
        features[i * 2] = x * imageData.width
        features[i * 2 + 1] = y * imageData.height
      }
    }

    return features
  }

  return {
    videoRef,
    canvasRef,
    stream,
    error,
    isLoading,
    preprocessFrame,
  }
}
