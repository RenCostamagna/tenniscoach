import { buildSeries } from "../analysis/compare"

type KP = { x: number; y: number; z: number; visibility: number; name: string }

// MediaPipe keypoint names in order
const KEYPOINT_NAMES = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index",
]

export function keypointsToPose(kps: KP[]) {
  const pose: Record<string, { x: number; y: number; z: number; v: number }> = {}

  for (const kp of kps) {
    pose[kp.name] = {
      x: kp.x,
      y: kp.y,
      z: kp.z,
      v: kp.visibility,
    }
  }

  return pose
}

export function normalizePose(pose: any) {
  // Get hip positions for scaling
  const leftHip = pose.left_hip
  const rightHip = pose.right_hip

  if (!leftHip || !rightHip) {
    console.warn("Missing hip landmarks for normalization")
    return pose
  }

  // Calculate hip distance for scaling
  const hipDistance = Math.sqrt(
    Math.pow(leftHip.x - rightHip.x, 2) + Math.pow(leftHip.y - rightHip.y, 2) + Math.pow(leftHip.z - rightHip.z, 2),
  )

  if (hipDistance === 0) {
    console.warn("Zero hip distance, skipping normalization")
    return pose
  }

  // Scale all landmarks by hip distance
  const normalizedPose: any = {}
  for (const [name, landmark] of Object.entries(pose)) {
    const lm = landmark as any
    normalizedPose[name] = {
      x: lm.x / hipDistance,
      y: lm.y / hipDistance,
      z: lm.z / hipDistance,
      v: lm.v,
    }
  }

  // TODO: Add orientation normalization when available

  return normalizedPose
}

export function buildPhaseSeries(frames: { keypoints: KP[]; timestamp: number }[], fps: number) {
  // Convert keypoints to poses and normalize
  const poses = frames.map((frame) => ({
    t: frame.timestamp,
    pose: normalizePose(keypointsToPose(frame.keypoints)),
  }))

  // Build series using existing analysis pipeline
  return buildSeries(poses, 1 / fps)
}
