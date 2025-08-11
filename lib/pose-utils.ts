import type { PoseLandmark, PoseMetrics, PoseDeviation } from "@/types/pose"

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

// Calculate distance between two landmarks
export function calculateDistance(landmark1: PoseLandmark, landmark2: PoseLandmark): number {
  const dx = landmark1.x - landmark2.x
  const dy = landmark1.y - landmark2.y
  const dz = landmark1.z - landmark2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Calculate angle between three landmarks
export function calculateAngle(landmark1: PoseLandmark, landmark2: PoseLandmark, landmark3: PoseLandmark): number {
  const vector1 = {
    x: landmark1.x - landmark2.x,
    y: landmark1.y - landmark2.y,
  }

  const vector2 = {
    x: landmark3.x - landmark2.x,
    y: landmark3.y - landmark2.y,
  }

  const dot = vector1.x * vector2.x + vector1.y * vector2.y
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y)

  const cosAngle = dot / (mag1 * mag2)
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)
}

// Vector3D interface for 3D operations
interface Vector3D {
  x: number
  y: number
  z: number
}

// One Euro Filter for smoothing positions and angles
export class OneEuroFilter {
  private minCutoff: number
  private beta: number
  private dCutoff: number
  private x: LowPassFilter
  private dx: LowPassFilter
  private lastTime?: number

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
    this.x = new LowPassFilter()
    this.dx = new LowPassFilter()
  }

  filter(value: number, timestamp?: number): number {
    const dt = timestamp && this.lastTime ? (timestamp - this.lastTime) / 1000 : 1 / 60
    this.lastTime = timestamp

    // Estimate derivative
    const dx = this.x.hasLastRawValue() ? (value - this.x.lastRawValue()) / dt : 0
    const edx = this.dx.filterWithAlpha(dx, this.alpha(dt, this.dCutoff))

    // Calculate cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)

    // Filter the value
    return this.x.filterWithAlpha(value, this.alpha(dt, cutoff))
  }

  private alpha(dt: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  reset(): void {
    this.x.reset()
    this.dx.reset()
    this.lastTime = undefined
  }
}

// Low pass filter helper class
class LowPassFilter {
  private lastValue?: number
  private lastRawValue?: number

  filterWithAlpha(value: number, alpha: number): number {
    if (this.lastValue === undefined) {
      this.lastValue = value
    } else {
      this.lastValue = alpha * value + (1 - alpha) * this.lastValue
    }
    this.lastRawValue = value
    return this.lastValue
  }

  hasLastRawValue(): boolean {
    return this.lastRawValue !== undefined
  }

  lastRawValue(): number {
    return this.lastRawValue || 0
  }

  reset(): void {
    this.lastValue = undefined
    this.lastRawValue = undefined
  }
}

// Normalize skeleton based on hip-shoulder distance and alignment
export function normalizeSkeleton(landmarks: PoseLandmark[]): PoseLandmark[] {
  if (landmarks.length < 33) return landmarks

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

  // Calculate reference points
  const shoulderCenter: Vector3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  }

  const hipCenter: Vector3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  }

  // Calculate torso length for scaling
  const torsoLength = calculateDistance3D(shoulderCenter, hipCenter)
  const referenceLength = 0.5 // Standard torso length
  const scaleFactor = torsoLength > 0 ? referenceLength / torsoLength : 1

  // Calculate hip axis for alignment
  const hipAxis: Vector3D = {
    x: rightHip.x - leftHip.x,
    y: rightHip.y - leftHip.y,
    z: rightHip.z - leftHip.z,
  }

  // Calculate rotation angle to align hips horizontally
  const hipAngle = Math.atan2(hipAxis.y, hipAxis.x)

  // Normalize each landmark
  return landmarks.map((landmark) => {
    // Translate to hip center origin
    let x = landmark.x - hipCenter.x
    let y = landmark.y - hipCenter.y
    let z = landmark.z - hipCenter.z

    // Scale by torso length
    x *= scaleFactor
    y *= scaleFactor
    z *= scaleFactor

    // Rotate to align hips horizontally
    const rotatedX = x * Math.cos(-hipAngle) - y * Math.sin(-hipAngle)
    const rotatedY = x * Math.sin(-hipAngle) + y * Math.cos(-hipAngle)

    // Translate back to standard position (hip center at origin)
    return {
      x: rotatedX,
      y: rotatedY,
      z: z,
      visibility: landmark.visibility,
    }
  })
}

// Helper function to calculate 3D distance
function calculateDistance3D(point1: Vector3D, point2: Vector3D): number {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  const dz = point1.z - point2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Smooth landmarks using One Euro Filter
export class PoseSmoothing {
  private landmarkFilters: Map<number, { x: OneEuroFilter; y: OneEuroFilter; z: OneEuroFilter }>
  private angleFilters: Map<string, OneEuroFilter>

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.landmarkFilters = new Map()
    this.angleFilters = new Map()

    // Initialize filters for each landmark
    for (let i = 0; i < 33; i++) {
      this.landmarkFilters.set(i, {
        x: new OneEuroFilter(minCutoff, beta, dCutoff),
        y: new OneEuroFilter(minCutoff, beta, dCutoff),
        z: new OneEuroFilter(minCutoff, beta, dCutoff),
      })
    }
  }

  smoothLandmarks(landmarks: PoseLandmark[], timestamp?: number): PoseLandmark[] {
    return landmarks.map((landmark, index) => {
      const filters = this.landmarkFilters.get(index)
      if (!filters) return landmark

      return {
        x: filters.x.filter(landmark.x, timestamp),
        y: filters.y.filter(landmark.y, timestamp),
        z: filters.z.filter(landmark.z, timestamp),
        visibility: landmark.visibility,
      }
    })
  }

  smoothAngle(angle: number, angleKey: string, timestamp?: number): number {
    let filter = this.angleFilters.get(angleKey)
    if (!filter) {
      filter = new OneEuroFilter(1.0, 0.007, 1.0)
      this.angleFilters.set(angleKey, filter)
    }
    return filter.filter(angle, timestamp)
  }

  reset(): void {
    this.landmarkFilters.forEach((filters) => {
      filters.x.reset()
      filters.y.reset()
      filters.z.reset()
    })
    this.angleFilters.forEach((filter) => filter.reset())
  }
}

// Calculate pose metrics from landmarks
export function calculatePoseMetrics(landmarks: PoseLandmark[]): PoseMetrics {
  if (landmarks.length < 33) {
    return { confidence: 0, stability: 0, symmetry: 0, posture: 0 }
  }

  // Calculate average visibility as confidence
  const confidence = landmarks.reduce((sum, landmark) => sum + landmark.visibility, 0) / landmarks.length

  // Calculate shoulder symmetry
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y)
  const symmetry = Math.max(0, 1 - shoulderHeightDiff * 5) // Scale factor for sensitivity

  // Calculate posture based on spine alignment
  const nose = landmarks[POSE_LANDMARKS.NOSE]
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
    visibility: 1,
  }

  const spineAlignment = Math.abs(nose.x - hipCenter.x)
  const posture = Math.max(0, 1 - spineAlignment * 3)

  // Stability based on key landmark visibility
  const keyLandmarks = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
  ]

  const stability = keyLandmarks.reduce((sum, index) => sum + landmarks[index].visibility, 0) / keyLandmarks.length

  return {
    confidence: Math.round(confidence * 100) / 100,
    stability: Math.round(stability * 100) / 100,
    symmetry: Math.round(symmetry * 100) / 100,
    posture: Math.round(posture * 100) / 100,
  }
}

// Detect pose deviations
export function detectDeviations(landmarks: PoseLandmark[], timestamp: number): PoseDeviation[] {
  const deviations: PoseDeviation[] = []

  if (landmarks.length < 33) return deviations

  const metrics = calculatePoseMetrics(landmarks)

  // Check for poor posture
  if (metrics.posture < 0.6) {
    deviations.push({
      id: `posture-${timestamp}`,
      type: "posture",
      severity: metrics.posture < 0.3 ? "high" : "medium",
      description: "Forward head posture detected",
      timestamp,
      landmarks: [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
    })
  }

  // Check for shoulder asymmetry
  if (metrics.symmetry < 0.7) {
    deviations.push({
      id: `alignment-${timestamp}`,
      type: "alignment",
      severity: metrics.symmetry < 0.5 ? "high" : "medium",
      description: "Shoulder height imbalance detected",
      timestamp,
      landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    })
  }

  // Check for instability
  if (metrics.stability < 0.6) {
    deviations.push({
      id: `stability-${timestamp}`,
      type: "stability",
      severity: metrics.stability < 0.4 ? "high" : "medium",
      description: "Pose instability detected",
      timestamp,
      landmarks: [
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.RIGHT_HIP,
      ],
    })
  }

  return deviations
}
