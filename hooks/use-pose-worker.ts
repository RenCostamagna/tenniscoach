"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePoseStore } from "@/store/pose-store"
import type { WorkerMessage, PoseFrame } from "@/types/pose"

export function usePoseWorker() {
  const workerRef = useRef<Worker | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number>()
  const lastProcessTimeRef = useRef<number>(0)

  const { camera, setCameraState, addFrame, setWorker, setWorkerReady, isWorkerReady } = usePoseStore()

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    try {
      workerRef.current = new Worker("/pose.worker.ts", { type: "module" })
      setWorker(workerRef.current)

      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, data } = event.data

        switch (type) {
          case "INITIALIZED":
            setWorkerReady(true)
            console.log("MediaPipe worker initialized")
            break

          case "POSE_DETECTED":
            if (data && typeof data === "object" && "landmarks" in data) {
              addFrame(data as PoseFrame)
            }
            break

          case "ERROR":
            console.error("Worker error:", data)
            setCameraState({ error: data as string })
            break
        }
      }

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error)
        setCameraState({ error: "Worker initialization failed" })
        setWorkerReady(false)
      }

      // Initialize MediaPipe in worker
      workerRef.current.postMessage({ type: "INITIALIZE" })
    } catch (error) {
      console.error("Failed to create worker:", error)
      setCameraState({ error: "Failed to create pose detection worker" })
    }
  }, [setWorker, setWorkerReady, addFrame, setCameraState])

  // Process video frames
  const processVideoFrame = useCallback(() => {
    if (!workerRef.current || !isWorkerReady || !camera.stream || !canvasRef.current) {
      return
    }

    const video = document.querySelector("video")
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      return
    }

    const now = performance.now()
    const targetFPS = 30 // Target 30 FPS for pose detection
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
      workerRef.current.postMessage({
        type: "PROCESS_FRAME",
        data: {
          imageData,
          timestamp: now,
        },
      })
    } catch (error) {
      console.error("Error processing frame:", error)
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame)
  }, [isWorkerReady, camera.stream])

  // Start processing when camera is active
  useEffect(() => {
    if (camera.isActive && isWorkerReady) {
      processVideoFrame()
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [camera.isActive, isWorkerReady, processVideoFrame])

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "TERMINATE" })
        workerRef.current.terminate()
      }
    }
  }, [initializeWorker])

  // Create canvas ref for frame processing
  const createCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
      canvasRef.current.style.display = "none"
      document.body.appendChild(canvasRef.current)
    }
    return canvasRef.current
  }, [])

  return {
    isWorkerReady,
    createCanvas,
    worker: workerRef.current,
  }
}
