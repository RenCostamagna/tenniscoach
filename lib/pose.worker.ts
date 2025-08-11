import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import type { PoseFrame, WorkerMessage } from "../types/pose"
import type { WorkerIn, WorkerOut, ComparePayload } from "../types/analysis"
import { loadTemplate } from "./pro-templates/loader"
import { comparePoses } from "./analysis/compare"

let poseLandmarker: PoseLandmarker | null = null
let isInitialized = false
let frameId = 0

let currentStrokeType = "forehand"
let proTemplate: any = null
let frameWindow: Array<{ t: number; pose: any; fps: number; handedness: string }> = []
const WINDOW_SIZE = 90 // 3 seconds at 30fps

// Initialize MediaPipe Pose Landmarker
async function initializePoseLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm",
    )

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false,
    })

    isInitialized = true

    const message: WorkerOut = {
      type: "INITIALIZED" as any,
    }

    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.debug("[worker] INITIALIZED")
    }

    self.postMessage(message)
  } catch (error) {
    const message: WorkerMessage = {
      type: "ERROR",
      data: `Failed to initialize MediaPipe: ${error instanceof Error ? error.message : String(error)}`,
    }

    self.postMessage(message)
  }
}

function analyze(window: Array<{ t: number; pose: any; fps: number; handedness: string }>): ComparePayload {
  if (window.length === 0) {
    return {
      strokeType: currentStrokeType as any,
      fps: 30,
      phases: [],
      scoreGlobal: 0,
      biomechanicalMetrics: null,
      recommendations: [],
      phaseDetails: []
    }
  }

  const fps = window[0]?.fps || 30

  try {
    // Convert window data to format expected by comparePoses
    const studentPoses = window.map(frame => ({
      landmarks: frame.pose,
      timestamp: frame.t,
      frameId: frame.t // Use timestamp as frameId for simplicity
    }))

    // Get professional template for comparison
    if (!proTemplate) {
      // Fallback to mock data if no template available
      const mockPhases = [
        { phase: "early-prep" as const, score: 0.8, cost: 0.2 },
        { phase: "late-prep" as const, score: 0.7, cost: 0.3 },
        { phase: "accel" as const, score: 0.9, cost: 0.1 },
        { phase: "impact" as const, score: 0.85, cost: 0.15 },
        { phase: "early-follow" as const, score: 0.75, cost: 0.25 },
        { phase: "finish" as const, score: 0.8, cost: 0.2 },
      ]

      const scoreGlobal = mockPhases.reduce((sum, p) => sum + p.score, 0) / mockPhases.length

      return {
        strokeType: currentStrokeType as any,
        fps,
        phases: mockPhases,
        scoreGlobal,
        biomechanicalMetrics: null,
        recommendations: [],
        phaseDetails: []
      }
    }

    // Perform real biomechanical analysis
    const comparisonResult = comparePoses(studentPoses, proTemplate, {
      strokeType: currentStrokeType as any,
      handedness: window[0]?.handedness || "R",
      fps
    })

    // Convert comparison result to UI format
    const phases = comparisonResult.phases.map(phase => ({
      phase: phase.phase,
      score: phase.score,
      cost: phase.cost
    }))

    const scoreGlobal = comparisonResult.overallScore

    return {
      strokeType: currentStrokeType as any,
      fps,
      phases,
      scoreGlobal,
      biomechanicalMetrics: comparisonResult.biomechanicalMetrics,
      recommendations: comparisonResult.recommendations,
      phaseDetails: comparisonResult.phases
    }

  } catch (error) {
    console.error("Analysis error:", error)
    
    // Fallback to mock data on error
    const mockPhases = [
      { phase: "early-prep" as const, score: 0.6, cost: 0.4 },
      { phase: "late-prep" as const, score: 0.5, cost: 0.5 },
      { phase: "accel" as const, score: 0.7, cost: 0.3 },
      { phase: "impact" as const, score: 0.65, cost: 0.35 },
      { phase: "early-follow" as const, score: 0.55, cost: 0.45 },
      { phase: "finish" as const, score: 0.6, cost: 0.4 },
    ]

    const scoreGlobal = mockPhases.reduce((sum, p) => sum + p.score, 0) / mockPhases.length

    return {
      strokeType: currentStrokeType as any,
      fps,
      phases: mockPhases,
      scoreGlobal,
      biomechanicalMetrics: null,
      recommendations: ["Analysis error occurred. Please try again."],
      phaseDetails: []
    }
  }
}

// Process video frame for pose detection
function processFrame(imageData: ImageData, timestamp: number) {
  if (!poseLandmarker || !isInitialized) {
    const message: WorkerMessage = {
      type: "ERROR",
      data: "Pose landmarker not initialized",
    }
    self.postMessage(message)
    return
  }

  try {
    // Create canvas from ImageData
    const canvas = new OffscreenCanvas(imageData.width, imageData.height)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    ctx.putImageData(imageData, 0, 0)

    // Detect pose landmarks
    const results = poseLandmarker.detectForVideo(canvas, timestamp)

    if (results.landmarks && results.landmarks.length > 0) {
      // Convert MediaPipe landmarks to our format
      const landmarks = results.landmarks[0].map((landmark) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility || 1.0,
      }))

      const worldLandmarks =
        results.worldLandmarks && results.worldLandmarks.length > 0
          ? results.worldLandmarks[0].map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
              visibility: landmark.visibility || 1.0,
            }))
          : landmarks // Fallback to regular landmarks

      const poseFrame: PoseFrame = {
        landmarks,
        worldLandmarks,
        timestamp,
        frameId: frameId++,
      }

      const message: WorkerMessage = {
        type: "POSE_DETECTED",
        data: poseFrame,
      }

      self.postMessage(message)
    }
  } catch (error) {
    const message: WorkerMessage = {
      type: "ERROR",
      data: `Pose detection error: ${error instanceof Error ? error.message : String(error)}`,
    }

    self.postMessage(message)
  }
}

function handleAnalysisMessage(message: WorkerIn) {
  switch (message.type) {
    case "SET_TEMPLATE":
      currentStrokeType = message.strokeType
      loadTemplate(message.strokeType)
        .then((template) => {
          proTemplate = template
          if (!proTemplate.byPhase["early-prep"] || proTemplate.byPhase["early-prep"].length === 0) {
            console.warn(`Template ${message.strokeType} has empty early-prep phase, using mock data`)
          }
        })
        .catch((error) => {
          console.error(`Failed to load template ${message.strokeType}:`, error)
          proTemplate = null
        })
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

        const response: WorkerOut = {
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
    handleAnalysisMessage(event.data as WorkerIn)
    return
  }

  switch (type) {
    case "INITIALIZE":
      if (!isInitialized) {
        initializePoseLandmarker()
      }
      break

    case "PROCESS_FRAME":
      if (data && data.imageData && data.timestamp) {
        processFrame(data.imageData, data.timestamp)
      }
      break

    case "TERMINATE":
      if (poseLandmarker) {
        poseLandmarker.close()
        poseLandmarker = null
      }
      isInitialized = false
      frameWindow = []
      self.close()
      break

    default:
      const message: WorkerMessage = {
        type: "ERROR",
        data: `Unknown message type: ${type}`,
      }
      self.postMessage(message)
  }
}

// Handle worker errors
self.onerror = (error) => {
  const message: WorkerMessage = {
    type: "ERROR",
    data: `Worker error: ${error.message}`,
  }

  self.postMessage(message)
}
