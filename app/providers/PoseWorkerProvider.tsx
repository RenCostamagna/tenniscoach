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
    let worker: Worker | null = null
    
    try {
      // Create worker
      worker = new Worker(new URL("../../lib/pose.worker.ts", import.meta.url), { type: "module" })
      
      // Handle worker messages
      const handleMessage = (event: MessageEvent) => {
        const { type } = event.data

        if (type === "INITIALIZED") {
          setWorkerReady(true)
          console.log("[provider] Worker ready")
        }
      }

      worker.addEventListener("message", handleMessage)

      // Initialize worker
      worker.postMessage({ type: "INITIALIZE" })
      setWorker(worker)

    } catch (error) {
      console.error("Failed to create worker:", error)
      setWorkerReady(false)
    }
    
    // Simple cleanup
    return () => {
      if (worker) {
        worker.postMessage({ type: "TERMINATE" })
        worker.terminate()
        setWorker(null)
        setWorkerReady(false)
      }
    }
  }, [setWorker, setWorkerReady])

  return <PoseWorkerContext.Provider value={null}>{children}</PoseWorkerContext.Provider>
}
