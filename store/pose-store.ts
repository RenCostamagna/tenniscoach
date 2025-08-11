import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { RingBuffer } from "@/lib/ring-buffer"
import type { PoseFrame, PoseMetrics, PoseDeviation, AnalysisPhase, CameraState } from "@/types/pose"
import type { ComparePayload } from "@/types/analysis"

interface PoseStore {
  // Camera state
  camera: CameraState
  setCameraState: (state: Partial<CameraState>) => void

  // Frame buffer
  frameBuffer: RingBuffer<PoseFrame>
  addFrame: (frame: PoseFrame) => void
  clearFrames: () => void

  // Current analysis
  currentFrame: PoseFrame | null
  metrics: PoseMetrics
  deviations: PoseDeviation[]

  analysis: ComparePayload | null

  // Analysis phases
  phases: AnalysisPhase[]
  currentPhase: AnalysisPhase | null

  // Worker state
  worker: Worker | null
  isWorkerReady: boolean

  // Analysis configuration state
  fps: number
  handedness: "R" | "L"
  strokeType: "forehand" | "backhand" | "serve" | "unknown"

  // Actions
  setCurrentFrame: (frame: PoseFrame) => void
  updateMetrics: (metrics: PoseMetrics) => void
  addDeviation: (deviation: PoseDeviation) => void
  clearDeviations: () => void
  startPhase: (name: string) => void
  endCurrentPhase: () => void
  setWorker: (worker: Worker | null) => void
  setWorkerReady: (ready: boolean) => void

  setAnalysis: (analysis: ComparePayload | null) => void

  setFps: (fps: number) => void
  setHandedness: (handedness: "R" | "L") => void
  setStrokeType: (strokeType: "forehand" | "backhand" | "serve" | "unknown") => void

  // Computed getters
  getRecentFrames: (count?: number) => PoseFrame[]
  getPhaseHistory: () => AnalysisPhase[]
}

export const usePoseStore = create<PoseStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    camera: {
      isActive: false,
      isInitializing: false,
      error: null,
      stream: null,
    },

    frameBuffer: new RingBuffer<PoseFrame>(60), // 60 frames buffer
    currentFrame: null,

    metrics: {
      confidence: 0,
      stability: 0,
      symmetry: 0,
      posture: 0,
    },

    deviations: [],
    analysis: null,
    phases: [],
    currentPhase: null,
    worker: null,
    isWorkerReady: false,

    fps: 30,
    handedness: "R",
    strokeType: "forehand",

    // Actions
    setCameraState: (state) =>
      set((prev) => ({
        camera: { ...prev.camera, ...state },
      })),

    addFrame: (frame) => {
      const { frameBuffer } = get()
      frameBuffer.push(frame)
      set({ currentFrame: frame })
    },

    clearFrames: () => {
      const { frameBuffer } = get()
      frameBuffer.clear()
      set({ currentFrame: null })
    },

    setCurrentFrame: (frame) => set({ currentFrame: frame }),

    updateMetrics: (metrics) => set({ metrics }),

    addDeviation: (deviation) =>
      set((state) => ({
        deviations: [...state.deviations, deviation],
      })),

    clearDeviations: () => set({ deviations: [] }),

    setAnalysis: (analysis) => set({ analysis }),

    startPhase: (name) => {
      const newPhase: AnalysisPhase = {
        id: `phase-${Date.now()}`,
        name,
        startTime: Date.now(),
        status: "active",
      }

      set((state) => ({
        phases: [...state.phases, newPhase],
        currentPhase: newPhase,
      }))
    },

    endCurrentPhase: () =>
      set((state) => {
        if (!state.currentPhase) return state

        const updatedPhases = state.phases.map((phase) =>
          phase.id === state.currentPhase!.id ? { ...phase, endTime: Date.now(), status: "completed" as const } : phase,
        )

        return {
          phases: updatedPhases,
          currentPhase: null,
        }
      }),

    setWorker: (worker) => set({ worker }),
    setWorkerReady: (ready) => set({ isWorkerReady: ready }),

    setFps: (fps) => set({ fps }),
    setHandedness: (handedness) => set({ handedness }),
    setStrokeType: (strokeType) => set({ strokeType }),

    // Computed getters
    getRecentFrames: (count = 30) => {
      const { frameBuffer } = get()
      return frameBuffer.getLatest(count)
    },

    getPhaseHistory: () => {
      const { phases } = get()
      return phases.filter((phase) => phase.status === "completed")
    },
  })),
)

// Selectors for performance
export const selectCameraState = (state: PoseStore) => state.camera
export const selectCurrentFrame = (state: PoseStore) => state.currentFrame
export const selectMetrics = (state: PoseStore) => state.metrics
export const selectDeviations = (state: PoseStore) => state.deviations
export const selectCurrentPhase = (state: PoseStore) => state.currentPhase
export const selectIsWorkerReady = (state: PoseStore) => state.isWorkerReady
export const selectAnalysis = (state: PoseStore) => state.analysis
export const selectFps = (state: PoseStore) => state.fps
export const selectHandedness = (state: PoseStore) => state.handedness
export const selectStrokeType = (state: PoseStore) => state.strokeType
