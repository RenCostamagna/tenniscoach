"use client"

import { createContext, useEffect, type ReactNode } from "react"
import { usePoseStore } from "@/store/pose-store"

const PoseWorkerContext = createContext<null>(null)

interface PoseWorkerProviderProps {
  children: ReactNode
}

export function PoseWorkerProvider({ children }: PoseWorkerProviderProps) {
  const { setWorker, setWorkerReady } = usePoseStore()

  useEffect(() => {
    // Create worker instance
    const worker = new Worker("/pose.worker.ts", { type: "module" })

    // Handle worker messages
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data

      if (type === "INITIALIZED") {
        setWorkerReady(true)
        if (process.env.NODE_ENV === "development") {
          console.debug("[provider] Worker ready")
        }
      }
    }

    worker.addEventListener("message", handleMessage)

    // Initialize worker
    worker.postMessage({ type: "INITIALIZE" })
    setWorker(worker)

    // Cleanup
    return () => {
      worker.removeEventListener("message", handleMessage)
      worker.postMessage({ type: "TERMINATE" })
      setWorker(null)
      setWorkerReady(false)
    }
  }, [setWorker, setWorkerReady])

  return <PoseWorkerContext.Provider value={null}>{children}</PoseWorkerContext.Provider>
}
