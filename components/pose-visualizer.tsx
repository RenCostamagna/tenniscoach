"use client"

import { useEffect, useRef } from "react"
import { usePoseStore } from "@/store/pose-store"
import { POSE_LANDMARKS } from "@/lib/pose-utils"
import type { PoseLandmark } from "@/types/pose"

interface PoseVisualizerProps {
  width?: number
  height?: number
  showConnections?: boolean
}

// Pose connections for drawing skeleton
const POSE_CONNECTIONS = [
  // Face
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.MOUTH_LEFT, POSE_LANDMARKS.MOUTH_RIGHT],

  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Arms
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Legs
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
]

export function PoseVisualizer({ width = 400, height = 300, showConnections = true }: PoseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentFrame } = usePoseStore()

  useEffect(() => {
    if (!canvasRef.current || !currentFrame) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const landmarks = currentFrame.landmarks

    // Draw connections
    if (showConnections) {
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2

      POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx]
        const end = landmarks[endIdx]

        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath()
          ctx.moveTo(start.x * width, start.y * height)
          ctx.lineTo(end.x * width, end.y * height)
          ctx.stroke()
        }
      })
    }

    // Draw landmarks
    landmarks.forEach((landmark: PoseLandmark, index: number) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * width
        const y = landmark.y * height

        // Different colors for different body parts
        let color = "#ff0000" // Default red
        if (index <= 10)
          color = "#ffff00" // Face - yellow
        else if (index <= 22)
          color = "#00ffff" // Arms - cyan
        else color = "#ff00ff" // Legs - magenta

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()

        // Draw landmark index for debugging
        ctx.fillStyle = "#ffffff"
        ctx.font = "10px Arial"
        ctx.fillText(index.toString(), x + 5, y - 5)
      }
    })
  }, [currentFrame, width, height, showConnections])

  if (!currentFrame) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded" style={{ width, height }}>
        <p className="text-gray-500">No pose detected</p>
      </div>
    )
  }

  return <canvas ref={canvasRef} width={width} height={height} className="border rounded bg-black" />
}
