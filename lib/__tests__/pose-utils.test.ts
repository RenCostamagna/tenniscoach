import { describe, it, expect, beforeEach } from "vitest"
import { normalizeSkeleton, OneEuroFilter, PoseSmoothing, calculateDistance, POSE_LANDMARKS } from "../pose-utils"
import type { PoseLandmark } from "@/types/pose"

// Mock pose data for testing
function createMockPose(scale = 1, rotation = 0, offset = { x: 0, y: 0, z: 0 }): PoseLandmark[] {
  const basePose: PoseLandmark[] = Array(33)
    .fill(null)
    .map(() => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 1,
    }))

  // Set key landmarks for a standing pose
  basePose[POSE_LANDMARKS.LEFT_SHOULDER] = { x: -0.2 * scale, y: -0.3 * scale, z: 0, visibility: 0.9 }
  basePose[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.2 * scale, y: -0.3 * scale, z: 0, visibility: 0.9 }
  basePose[POSE_LANDMARKS.LEFT_HIP] = { x: -0.1 * scale, y: 0.2 * scale, z: 0, visibility: 0.9 }
  basePose[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.1 * scale, y: 0.2 * scale, z: 0, visibility: 0.9 }
  basePose[POSE_LANDMARKS.NOSE] = { x: 0, y: -0.5 * scale, z: 0, visibility: 0.8 }

  // Apply transformations
  return basePose.map((landmark) => {
    // Apply rotation
    const rotatedX = landmark.x * Math.cos(rotation) - landmark.y * Math.sin(rotation)
    const rotatedY = landmark.x * Math.sin(rotation) + landmark.y * Math.cos(rotation)

    return {
      x: rotatedX + offset.x,
      y: rotatedY + offset.y,
      z: landmark.z + offset.z,
      visibility: landmark.visibility,
    }
  })
}

describe("OneEuroFilter", () => {
  let filter: OneEuroFilter

  beforeEach(() => {
    filter = new OneEuroFilter(1.0, 0.007, 1.0)
  })

  it("should smooth noisy data", () => {
    const noisyData = [1.0, 1.1, 0.9, 1.05, 0.95, 1.02]
    const smoothedData = noisyData.map((value, i) => filter.filter(value, i * 16.67)) // 60fps

    // Smoothed data should have less variation
    const originalVariance = calculateVariance(noisyData)
    const smoothedVariance = calculateVariance(smoothedData)

    expect(smoothedVariance).toBeLessThan(originalVariance)
  })

  it("should respond to rapid changes", () => {
    const data = [0, 0, 0, 10, 10, 10] // Step change
    const smoothedData = data.map((value, i) => filter.filter(value, i * 16.67))

    // Should eventually reach the new value
    expect(smoothedData[smoothedData.length - 1]).toBeCloseTo(10, 0)
  })

  it("should reset properly", () => {
    filter.filter(5.0)
    filter.reset()
    const result = filter.filter(0.0)
    expect(result).toBe(0.0)
  })
})

describe("normalizeSkeleton", () => {
  it("should normalize pose scale", () => {
    const largePose = createMockPose(2.0) // Double size
    const smallPose = createMockPose(0.5) // Half size

    const normalizedLarge = normalizeSkeleton(largePose)
    const normalizedSmall = normalizeSkeleton(smallPose)

    // Torso lengths should be similar after normalization
    const torsoLengthLarge = calculateDistance(
      normalizedLarge[POSE_LANDMARKS.LEFT_SHOULDER],
      normalizedLarge[POSE_LANDMARKS.LEFT_HIP],
    )
    const torsoLengthSmall = calculateDistance(
      normalizedSmall[POSE_LANDMARKS.LEFT_SHOULDER],
      normalizedSmall[POSE_LANDMARKS.LEFT_HIP],
    )

    expect(Math.abs(torsoLengthLarge - torsoLengthSmall)).toBeLessThan(0.1)
  })

  it("should align hip axis horizontally", () => {
    const rotatedPose = createMockPose(1.0, Math.PI / 6) // 30 degree rotation
    const normalized = normalizeSkeleton(rotatedPose)

    const leftHip = normalized[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = normalized[POSE_LANDMARKS.RIGHT_HIP]

    // Hips should be approximately at the same height
    expect(Math.abs(leftHip.y - rightHip.y)).toBeLessThan(0.05)
  })

  it("should center pose at hip center", () => {
    const offsetPose = createMockPose(1.0, 0, { x: 2, y: 3, z: 1 })
    const normalized = normalizeSkeleton(offsetPose)

    const leftHip = normalized[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = normalized[POSE_LANDMARKS.RIGHT_HIP]
    const hipCenterX = (leftHip.x + rightHip.x) / 2
    const hipCenterY = (leftHip.y + rightHip.y) / 2

    // Hip center should be close to origin
    expect(Math.abs(hipCenterX)).toBeLessThan(0.01)
    expect(Math.abs(hipCenterY)).toBeLessThan(0.01)
  })

  it("should handle invalid input gracefully", () => {
    const invalidPose: PoseLandmark[] = []
    const result = normalizeSkeleton(invalidPose)
    expect(result).toEqual([])
  })
})

describe("PoseSmoothing", () => {
  let smoother: PoseSmoothing

  beforeEach(() => {
    smoother = new PoseSmoothing(1.0, 0.007, 1.0)
  })

  it("should smooth landmark positions", () => {
    const pose1 = createMockPose(1.0)
    const pose2 = createMockPose(1.0)

    // Add noise to second pose
    pose2[POSE_LANDMARKS.NOSE].x += 0.1
    pose2[POSE_LANDMARKS.NOSE].y += 0.1

    const smoothed1 = smoother.smoothLandmarks(pose1, 0)
    const smoothed2 = smoother.smoothLandmarks(pose2, 16.67)

    // Smoothed movement should be less than original
    const originalMovement = Math.abs(pose2[POSE_LANDMARKS.NOSE].x - pose1[POSE_LANDMARKS.NOSE].x)
    const smoothedMovement = Math.abs(smoothed2[POSE_LANDMARKS.NOSE].x - smoothed1[POSE_LANDMARKS.NOSE].x)

    expect(smoothedMovement).toBeLessThan(originalMovement)
  })

  it("should smooth angles", () => {
    const angles = [90, 95, 85, 92, 88, 91]
    const smoothedAngles = angles.map((angle, i) => smoother.smoothAngle(angle, "test-angle", i * 16.67))

    const originalVariance = calculateVariance(angles)
    const smoothedVariance = calculateVariance(smoothedAngles)

    expect(smoothedVariance).toBeLessThan(originalVariance)
  })

  it("should reset filters properly", () => {
    const pose = createMockPose(1.0)
    smoother.smoothLandmarks(pose, 0)
    smoother.smoothAngle(90, "test", 0)

    smoother.reset()

    const result = smoother.smoothLandmarks(pose, 16.67)
    expect(result[0].x).toBe(pose[0].x) // Should be unfiltered after reset
  })
})

// Helper function to calculate variance
function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2))
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length
}
