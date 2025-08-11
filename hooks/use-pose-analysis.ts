"use client"

import { useEffect, useCallback } from "react"
import { usePoseStore } from "@/store/pose-store"
import type { WorkerIn, WorkerOut } from "@/types/analysis"

export function usePoseAnalysis() {
  const { worker, setAnalysis, strokeType } = usePoseStore()

  // Memoize the message handler to avoid recreating it on every render
  const handleMessage = useCallback((event: MessageEvent<WorkerOut>) => {
    const { type } = event.data

    switch (type) {
      case "ANALYSIS_UPDATE":
        if (process.env.NODE_ENV === "development") {
          console.debug("[hook] ANALYSIS_UPDATE received")
        }
        // For now, don't call setAnalysis to prevent infinite loops
        break
      case "ANALYSIS_IDLE":
        // Worker is idle, could reset analysis state if needed
        break
    }
  }, [])

  // Set template when worker or strokeType changes
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

  // Set up message listener when worker changes
  useEffect(() => {
    if (!worker) return

    worker.addEventListener("message", handleMessage)
    return () => worker.removeEventListener("message", handleMessage)
  }, [worker, handleMessage])

  // For now, just return a simple state to avoid infinite loops
  return {
    isAnalyzing: false, // Temporarily disabled to prevent infinite loops
  }
}
