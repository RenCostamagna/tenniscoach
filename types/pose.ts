export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface PoseFrame {
  landmarks: PoseLandmark[]
  worldLandmarks?: PoseLandmark[] // Added world landmarks support
  timestamp: number
  frameId: number
}

export interface PoseMetrics {
  confidence: number
  stability: number
  symmetry: number
  posture: number
}

export interface PoseDeviation {
  id: string
  type: "posture" | "alignment" | "stability"
  severity: "low" | "medium" | "high"
  description: string
  timestamp: number
  landmarks: number[] // indices of affected landmarks
}

export interface AnalysisPhase {
  id: string
  name: string
  startTime: number
  endTime?: number
  status: "active" | "completed" | "paused"
}

export interface CameraState {
  isActive: boolean
  isInitializing: boolean
  error: string | null
  stream: MediaStream | null
}

export interface WorkerMessage {
  type: "POSE_DETECTED" | "ERROR" | "INITIALIZED"
  data?: PoseFrame | string
}

export interface PoseStreamData {
  landmarks: PoseLandmark[]
  worldLandmarks: PoseLandmark[]
  timestamp: number
  frameId: number
  confidence: number
  hasLowVisibility: boolean
}

export interface PoseStreamOptions {
  targetFPS?: number
  minVisibilityThreshold?: number
  enableWorldLandmarks?: boolean
  fallbackOnLowVisibility?: boolean
}

export interface PoseStreamControls {
  start: () => Promise<void>
  stop: () => void
  isActive: boolean
  isReady: boolean
  error: string | null
}

export interface PhaseMetrics {
  similarity: number // 0-1, similarity to ideal form
  xFactor: number // 0-1, X-factor measurement
  elbowAngle: number // degrees
  wristPosition: number // 0-1, relative position score
  kneeStability: number // 0-1, stability score
  handHeight: number[] // array of recent hand heights for sparkline
}

export interface MovementPhase {
  id: "preparation" | "acceleration" | "impact" | "follow"
  name: string
  metrics: PhaseMetrics
  isActive: boolean
  isComplete: boolean
  duration: number // in seconds
}

export interface PhaseAnalysis {
  currentPhase: MovementPhase["id"] | null
  phases: Record<MovementPhase["id"], MovementPhase>
  isAnalyzing: boolean
  error: string | null
}
