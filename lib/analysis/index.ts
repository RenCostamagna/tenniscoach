// Analysis utilities for pose comparison
export type Series = number[]

export interface AnalysisWindow {
  handY: Series
  handDist: Series
  torsoRot: Series
  handSpeed: Series
}

// Export all biomechanical analysis functions
export {
  computeAngles,
  calculateMovementQuality,
  calculateStability,
  calculateSymmetry,
  xFactor,
  trunkTilt,
  calculateShoulderRotation,
  calculateHipRotation,
  calculateKneeStability,
  calculateAnkleFlexion,
  diffSeries,
  diffSeries2,
  smoothSeries,
  calculateBalance
} from './biomechanics'

// Export segmentation functions
export {
  segmentPhases,
  extractMovementFeatures,
  detectKeyEvents,
  type PhaseSegment,
  type KeyEvent,
  type MovementFeatures
} from './segments'

// Export comparison functions
export {
  comparePoses,
  type ComparisonResult,
  type PhaseScore,
  type BiomechanicalMetrics,
  type ComparisonOptions
} from './compare'

// Export DTW functions
export {
  dtwCost,
  calculateSimilarity,
  findBestAlignment,
  dtwCostSimple,
  type DTWOptions
} from './dtw'

// Legacy functions for backward compatibility
export function computeAnglesLegacy(landmarks: any[]): AnalysisWindow {
  // Extract basic features from pose landmarks
  const mockSeries = new Array(landmarks.length).fill(0).map((_, i) => Math.sin(i * 0.1))

  return {
    handY: mockSeries,
    handDist: mockSeries,
    torsoRot: mockSeries,
    handSpeed: mockSeries,
  }
}

export function segmentPhasesLegacy(window: AnalysisWindow): Array<{ phase: string; start: number; end: number }> {
  const length = window.handY.length
  const phaseLength = Math.floor(length / 6)

  return [
    { phase: "early-prep", start: 0, end: phaseLength },
    { phase: "late-prep", start: phaseLength, end: phaseLength * 2 },
    { phase: "accel", start: phaseLength * 2, end: phaseLength * 3 },
    { phase: "impact", start: phaseLength * 3, end: phaseLength * 4 },
    { phase: "early-follow", start: phaseLength * 4, end: phaseLength * 5 },
    { phase: "finish", start: phaseLength * 5, end: length },
  ]
}

export function buildSeries(window: AnalysisWindow): AnalysisWindow {
  return window // Already in correct format
}

export function dtwCostLegacy(student: Series, template: Series, band = 0.12): number {
  // Mock DTW implementation
  if (student.length === 0 || template.length === 0) return 1.0

  // Simple distance metric as placeholder
  const minLength = Math.min(student.length, template.length)
  let totalCost = 0

  for (let i = 0; i < minLength; i++) {
    const diff = Math.abs(student[i] - template[i])
    totalCost += diff
  }

  return Math.min(1.0, totalCost / minLength)
}
