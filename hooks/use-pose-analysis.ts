"use client"

import { useEffect, useRef } from "react"
import { usePoseStore } from "@/store/pose-store"
import type { WorkerIn, WorkerOut } from "@/types/analysis"

export function usePoseAnalysis() {
  const { currentFrame, worker, setAnalysis, strokeType, handedness, fps } = usePoseStore()
  const lastFrameTime = useRef<number>(0)

  useEffect(() => {
    if (!worker || !strokeType) return

    if (process.env.NODE_ENV === "development") {
      console.debug("[hook] Setting template", { strokeType })
    }

    const message: WorkerIn = {
      type: "SET_TEMPLATE",
      strokeType,
    }

    worker.postMessage(message)
  }, [worker, strokeType])

  useEffect(() => {
    if (!worker) return

    const handleMessage = (event: MessageEvent<WorkerOut>) => {
      const { type, data } = event.data

      switch (type) {
        case "ANALYSIS_UPDATE":
          if (process.env.NODE_ENV === "development") {
            console.debug("[hook] ANALYSIS_UPDATE", data.scoreGlobal, data.phases?.length)
          }
          setAnalysis(data)
          break
        case "ANALYSIS_IDLE":
          // Worker is idle, could reset analysis state if needed
          break
      }
    }

    worker.addEventListener("message", handleMessage)
    return () => worker.removeEventListener("message", handleMessage)
  }, [worker, setAnalysis])

  useEffect(() => {
    if (!currentFrame || !worker) return

    const now = Date.now()
    // Throttle to minimum 8ms (125 FPS max)
    if (now - lastFrameTime.current < 8) return

    lastFrameTime.current = now

    try {
      const message: WorkerIn = {
        type: "POSE_FRAME",
        t: currentFrame.timestamp,
        pose: currentFrame.landmarks,
        fps: fps || 30,
        handedness: handedness || "R",
      }

      if (process.env.NODE_ENV === "development") {
        console.debug("[hook] POSE_FRAME", {
          t: currentFrame.timestamp,
          fps: fps || 30,
          handedness: handedness || "R",
          strokeType,
        })
      }

      worker.postMessage(message)
    } catch (error) {
      console.error("Error sending frame to worker:", error)
    }
  }, [currentFrame, worker, fps, handedness, strokeType])

  return {
    isAnalyzing: !!currentFrame,
  }
}
