"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePoseStore } from "@/store/pose-store"
import type { WorkerMessage, PoseFrame } from "@/types/pose"

export function usePoseWorker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number>()
  const lastProcessTimeRef = useRef<number>(0)

  const { camera, setCameraState, addFrame, worker, isWorkerReady } = usePoseStore()

  // Process video frames
  const processVideoFrame = useCallback(() => {
    if (!worker || !isWorkerReady || !camera.stream || !canvasRef.current) {
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
      worker.postMessage({
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
  }, [worker, isWorkerReady, camera.stream])

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
    worker,
  }
}
