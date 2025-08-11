// Simple worker for pose analysis - avoiding complex imports initially
let isInitialized = false
let frameId = 0

let currentStrokeType = "forehand"
let frameWindow: Array<{ t: number; pose: any; fps: number; handedness: string }> = []
const WINDOW_SIZE = 90 // 3 seconds at 30fps

// Initialize worker
async function initializeWorker() {
  try {
    isInitialized = true
    
    const message = {
      type: "INITIALIZED",
    }

    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.debug("[worker] INITIALIZED")
    }

    self.postMessage(message)
  } catch (error) {
    const message = {
      type: "ERROR",
      data: `Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`,
    }

    self.postMessage(message)
  }
}

function analyze(window: Array<{ t: number; pose: any; fps: number; handedness: string }>) {
  if (window.length === 0) {
    return {
      strokeType: currentStrokeType,
      fps: 30,
      phases: [],
      scoreGlobal: 0,
      biomechanicalMetrics: null,
      recommendations: [],
      phaseDetails: []
    }
  }

  const fps = window[0]?.fps || 30

  // Mock analysis for now - will be replaced with real MediaPipe analysis
  const mockPhases = [
    { phase: "early-prep", score: 0.8, cost: 0.2 },
    { phase: "late-prep", score: 0.7, cost: 0.3 },
    { phase: "accel", score: 0.9, cost: 0.1 },
    { phase: "impact", score: 0.85, cost: 0.15 },
    { phase: "early-follow", score: 0.75, cost: 0.25 },
    { phase: "finish", score: 0.8, cost: 0.2 },
  ]

  const scoreGlobal = mockPhases.reduce((sum, p) => sum + p.score, 0) / mockPhases.length

  return {
    strokeType: currentStrokeType,
    fps,
    phases: mockPhases,
    scoreGlobal,
    biomechanicalMetrics: null,
    recommendations: [],
    phaseDetails: []
  }
}

function handleAnalysisMessage(message: any) {
  switch (message.type) {
    case "SET_TEMPLATE":
      currentStrokeType = message.strokeType
      break

    case "POSE_FRAME":
      // Add frame to window
      frameWindow.push({
        t: message.t,
        pose: message.pose,
        fps: message.fps,
        handedness: message.handedness,
      })

      // Keep window size limited
      if (frameWindow.length > WINDOW_SIZE) {
        frameWindow = frameWindow.slice(-WINDOW_SIZE)
      }

      // Perform analysis and emit result
      if (frameWindow.length >= 10) {
        // Minimum frames for analysis
        const analysisResult = analyze(frameWindow)

        const response = {
          type: "ANALYSIS_UPDATE",
          data: analysisResult,
        }

        self.postMessage(response)
      }
      break
  }
}

// Handle messages from main thread
self.onmessage = (event) => {
  const { type, data } = event.data

  if (type === "SET_TEMPLATE" || type === "POSE_FRAME") {
    handleAnalysisMessage(event.data)
    return
  }

  switch (type) {
    case "INITIALIZE":
      if (!isInitialized) {
        initializeWorker()
      }
      break

    case "PROCESS_FRAME":
      // For now, just acknowledge frame processing
      if (data && data.imageData && data.timestamp) {
        // Mock pose detection - will be replaced with MediaPipe
        const mockPoseFrame = {
          landmarks: Array(33).fill(0).map((_, i) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            z: Math.random() * 100,
            visibility: 1.0,
          })),
          timestamp: data.timestamp,
          frameId: frameId++,
        }

        const message = {
          type: "POSE_DETECTED",
          data: mockPoseFrame,
        }

        self.postMessage(message)
      }
      break

    case "TERMINATE":
      isInitialized = false
      frameWindow = []
      self.close()
      break

    default:
      const message = {
        type: "ERROR",
        data: `Unknown message type: ${type}`,
      }
      self.postMessage(message)
  }
}

// Handle worker errors
self.onerror = (error) => {
  const message = {
    type: "ERROR",
    data: `Worker error: ${error.message}`,
  }

  self.postMessage(message)
}
