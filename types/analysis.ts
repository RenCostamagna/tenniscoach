// types/analysis.ts
export type Phase = "early-prep" | "late-prep" | "accel" | "impact" | "early-follow" | "finish"

export type PhaseScore = {
  phase: Phase
  score: number // 0..1
  cost: number // costo DTW normalizado
}

export type ComparePayload = {
  strokeType: "forehand" | "backhand" | "serve" | "unknown"
  fps: number
  phases: PhaseScore[]
  scoreGlobal: number
}

export type WorkerIn =
  | { type: "POSE_FRAME"; t: number; pose: any; fps: number; handedness: "R" | "L" }
  | { type: "SET_TEMPLATE"; strokeType: string }

export type WorkerOut = { type: "ANALYSIS_UPDATE"; data: ComparePayload } | { type: "ANALYSIS_IDLE" }
