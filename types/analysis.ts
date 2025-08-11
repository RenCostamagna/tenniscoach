// types/analysis.ts
export type Phase = "early-prep" | "late-prep" | "accel" | "impact" | "early-follow" | "finish"

export type PhaseScore = {
  phase: Phase
  score: number // 0..1
  cost: number // costo DTW normalizado
}

export type BiomechanicalMetrics = {
  stability: number
  symmetry: number
  fluidity: number
  balance: number
  xFactor: number
  shoulderRotation: number
  hipRotation: number
  kneeStability: number
  elbowAngle: number
  wristPosition: number
}

export type PhaseDetail = {
  phase: Phase
  score: number
  cost: number
  biomechanicalMetrics: BiomechanicalMetrics
  keyEvents: Array<{
    type: string
    timestamp: number
    value: number
  }>
  recommendations: string[]
}

export type ComparePayload = {
  strokeType: "forehand" | "backhand" | "serve" | "unknown"
  fps: number
  phases: PhaseScore[]
  scoreGlobal: number
  biomechanicalMetrics: BiomechanicalMetrics | null
  recommendations: string[]
  phaseDetails: PhaseDetail[]
}

export type WorkerIn =
  | { type: "POSE_FRAME"; t: number; pose: any; fps: number; handedness: "R" | "L" }
  | { type: "SET_TEMPLATE"; strokeType: string }

export type WorkerOut = { type: "ANALYSIS_UPDATE"; data: ComparePayload } | { type: "ANALYSIS_IDLE" }
