"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PoseStreamData, PoseStreamOptions, PoseStreamControls, WorkerMessage, PoseFrame } from "@/types/pose"

interface UsePoseStreamReturn extends PoseStreamControls {
  onFrame: (callback: (data: PoseStreamData) => void) => void
}

export function usePoseStream(options: PoseStreamOptions = {}): UsePoseStreamReturn {
  const {
    targetFPS = 30,
    minVisibilityThreshold = 0.5,
    enableWorldLandmarks = true,
    fallbackOnLowVisibility = true,
  } = options

  // State
  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const workerRef = useRef<Worker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number>()
  const lastProcessTimeRef = useRef<number>(0)
  const frameCallbackRef = useRef<((data: PoseStreamData) => void) | null>(null)

  // Initialize MediaPipe worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    try {
      workerRef.current = new Worker("/pose.worker.ts", { type: "module" })

      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, data } = event.data

        switch (type) {
          case "INITIALIZED":
            setIsReady(true)
            setError(null)
            break

          case "POSE_DETECTED":
            if (data && typeof data === "object" && "landmarks" in data) {
              const frame = data as PoseFrame
              handlePoseDetected(frame)
            }
            break

          case "ERROR":
            setError(data as string)
            setIsReady(false)
            break
        }
      }

      workerRef.current.onerror = (error) => {
        setError(`Worker error: ${error.message}`)
        setIsReady(false)
      }

      // Initialize MediaPipe
      workerRef.current.postMessage({ type: "INITIALIZE" })
    } catch (err) {
      setError(`Failed to create worker: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // Handle pose detection results
  const handlePoseDetected = useCallback(
    (frame: PoseFrame) => {
      if (!frameCallbackRef.current) return

      // Calculate average visibility
      const avgVisibility =
        frame.landmarks.reduce((sum, landmark) => sum + landmark.visibility, 0) / frame.landmarks.length
      const hasLowVisibility = avgVisibility < minVisibilityThreshold

      // Prepare stream data
      const streamData: PoseStreamData = {
        landmarks: frame.landmarks,
        worldLandmarks: frame.worldLandmarks || frame.landmarks, // Fallback to regular landmarks
        timestamp: frame.timestamp,
        frameId: frame.frameId,
        confidence: avgVisibility,
        hasLowVisibility,
      }

      // Apply fallback logic if needed
      if (hasLowVisibility && fallbackOnLowVisibility) {
        // Use previous frame data or interpolation if available
        // For now, we still call the callback but with the flag set
        frameCallbackRef.current(streamData)
      } else {
        frameCallbackRef.current(streamData)
      }
    },
    [minVisibilityThreshold, fallbackOnLowVisibility],
  )

  // Process video frames
  const processVideoFrame = useCallback(() => {
    if (!workerRef.current || !isReady || !streamRef.current || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      return
    }

    const now = performance.now()
    const frameInterval = 1000 / targetFPS

    if (now - lastProcessTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      return
    }

    lastProcessTimeRef.current = now

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Send to worker for processing
      workerRef.current!.postMessage({
        type: "PROCESS_FRAME",
        data: {
          imageData,
          timestamp: now,
        },
      })
    } catch (err) {
      setError(`Frame processing error: ${err instanceof Error ? err.message : String(err)}`)
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame)
  }, [isReady, targetFPS])

  // Start pose stream
  const start = useCallback(async (): Promise<void> => {
    try {
      setError(null)

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: targetFPS },
        },
      })

      streamRef.current = stream

      // Create video element
      if (!videoRef.current) {
        videoRef.current = document.createElement("video")
        videoRef.current.style.display = "none"
        document.body.appendChild(videoRef.current)
      }

      // Create canvas element
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas")
        canvasRef.current.style.display = "none"
        document.body.appendChild(canvasRef.current)
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setIsActive(true)

      // Start processing frames
      if (isReady) {
        processVideoFrame()
      }
    } catch (err) {
      setError(`Failed to start camera: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }
  }, [targetFPS, isReady, processVideoFrame])

  // Stop pose stream
  const stop = useCallback(() => {
    setIsActive(false)

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Set frame callback
  const onFrame = useCallback((callback: (data: PoseStreamData) => void) => {
    frameCallbackRef.current = callback
  }, [])

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker()

    return () => {
      stop()
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "TERMINATE" })
        workerRef.current.terminate()
      }

      // Clean up DOM elements
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current)
      }
      if (canvasRef.current && document.body.contains(canvasRef.current)) {
        document.body.removeChild(canvasRef.current)
      }
    }
  }, [initializeWorker, stop])

  // Start processing when both active and ready
  useEffect(() => {
    if (isActive && isReady) {
      processVideoFrame()
    }
  }, [isActive, isReady, processVideoFrame])

  return {
    start,
    stop,
    onFrame,
    isActive,
    isReady,
    error,
  }
}
