"use client"

import { useState, useEffect, useRef } from "react"
import type { HandLandmarker } from "@mediapipe/tasks-vision"

type UseCameraOptions = {
  enabled?: boolean
  onFrame?: (imageData: ImageData) => void
  frameRate?: number
}

export function useCamera({ enabled = true, onFrame, frameRate = 10 }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameLoopRef = useRef<number | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)

  // Initialize camera
  useEffect(() => {
    if (!enabled) return

    const initCamera = async () => {
      setIsLoading(true)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        setStream(mediaStream)
        setError(null)
      } catch (err) {
        setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
        console.error("Error accessing camera:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initCamera()

    const initHandLandmarker = async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision")
        const resolver = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
        )
        handLandmarkerRef.current = await vision.HandLandmarker.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task",
          },
          runningMode: "IMAGE",
          numHands: 2,
        })
      } catch (err) {
        console.error("Failed to load MediaPipe HandLandmarker", err)
        setError(
          "Error al cargar el modelo de detección de manos. Revisa tu conexión e intenta nuevamente."
        )
      }
    }

    initHandLandmarker()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (frameLoopRef.current) {
        cancelAnimationFrame(frameLoopRef.current)
      }
      handLandmarkerRef.current?.close?.()
    }
  }, [enabled])

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream, videoRef])

  // Process frames
  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current || !onFrame) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    let lastFrameTime = 0
    const interval = 1000 / frameRate

    const processFrame = (timestamp: number) => {
      if (timestamp - lastFrameTime >= interval) {
        // Only process frames at the specified frame rate
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Get image data and pass to callback
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          onFrame(imageData)
        }
        lastFrameTime = timestamp
      }

      frameLoopRef.current = requestAnimationFrame(processFrame)
    }

    video.onloadedmetadata = () => {
      frameLoopRef.current = requestAnimationFrame(processFrame)
    }

    return () => {
      if (frameLoopRef.current) {
        cancelAnimationFrame(frameLoopRef.current)
      }
    }
  }, [stream, onFrame, frameRate])

  // Process a frame with MediaPipe to obtain 42 features (21 points x/y per hand)
  const preprocessFrame = (imageData: ImageData): number[] => {
    const landmarker = handLandmarkerRef.current
    if (!landmarker) {
      return Array(42).fill(0)
    }

    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const ctx = tempCanvas.getContext("2d")!
    ctx.putImageData(imageData, 0, 0)

    const result = landmarker.detect(tempCanvas)
    const features: number[] = Array(42).fill(0)

    if (result.landmarks && result.landmarks.length > 0) {
      for (let h = 0; h < 2; h++) {
        const hand = result.landmarks[h] || []
        for (let i = 0; i < 21; i++) {
          const idx = h * 42 + i * 2
          const point = hand[i]
          features[idx] = point ? point.x : 0
          features[idx + 1] = point ? point.y : 0
        }
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
