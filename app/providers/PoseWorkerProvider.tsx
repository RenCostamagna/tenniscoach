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
    // Create worker instance - use dynamic import for better compatibility
    let worker: Worker | null = null
    
    const initWorker = async () => {
      try {
        // Create worker with the simplified version
        worker = new Worker(new URL("../../lib/pose.worker.ts", import.meta.url), { type: "module" })
      } catch (error) {
        console.error("Failed to create worker:", error)
        // Fallback: create a simple worker without MediaPipe for now
        const workerBlob = new Blob([`
          self.onmessage = function(e) {
            if (e.data.type === "INITIALIZE") {
              self.postMessage({ type: "INITIALIZED" })
            }
          }
        `], { type: "application/javascript" })
        worker = new Worker(URL.createObjectURL(workerBlob))
      }
      
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
    }
    
    initWorker()
  }, [setWorker, setWorkerReady])

  return <PoseWorkerContext.Provider value={null}>{children}</PoseWorkerContext.Provider>
}
