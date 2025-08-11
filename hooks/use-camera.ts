"use client"

import { useCallback, useRef, useEffect } from "react"
import { usePoseStore } from "@/store/pose-store"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { camera, setCameraState } = usePoseStore()

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (camera.isActive || camera.isInitializing) return

    setCameraState({ isInitializing: true, error: null })

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraState({
        isActive: true,
        isInitializing: false,
        stream,
        error: null,
      })
    } catch (error) {
      console.error("Camera access error:", error)

      let errorMessage = "Failed to access camera"

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application."
        } else {
          errorMessage = error.message
        }
      }

      setCameraState({
        isActive: false,
        isInitializing: false,
        stream: null,
        error: errorMessage,
      })
    }
  }, [camera.isActive, camera.isInitializing, setCameraState])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraState({
      isActive: false,
      isInitializing: false,
      stream: null,
      error: null,
    })
  }, [setCameraState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    startCamera,
    stopCamera,
    isActive: camera.isActive,
    isInitializing: camera.isInitializing,
    error: camera.error,
  }
}
