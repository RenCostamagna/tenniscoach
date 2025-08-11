"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePoseStream } from "@/hooks/use-pose-stream"
import type { PoseStreamData } from "@/types/pose"

export function PoseStreamDemo() {
  const [streamData, setStreamData] = useState<PoseStreamData | null>(null)
  const [frameCount, setFrameCount] = useState(0)

  const poseStream = usePoseStream({
    targetFPS: 30,
    minVisibilityThreshold: 0.6,
    enableWorldLandmarks: true,
    fallbackOnLowVisibility: true,
  })

  // Set up frame callback
  useEffect(() => {
    poseStream.onFrame((data) => {
      setStreamData(data)
      setFrameCount((prev) => prev + 1)
    })
  }, [poseStream])

  const handleStart = async () => {
    try {
      await poseStream.start()
    } catch (error) {
      console.error("Failed to start pose stream:", error)
    }
  }

  const handleStop = () => {
    poseStream.stop()
    setStreamData(null)
    setFrameCount(0)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pose Stream Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleStart} disabled={!poseStream.isReady || poseStream.isActive}>
              Start Stream
            </Button>
            <Button onClick={handleStop} disabled={!poseStream.isActive} variant="outline">
              Stop Stream
            </Button>
          </div>

          <div className="flex gap-2">
            <Badge variant={poseStream.isReady ? "default" : "secondary"}>
              Worker: {poseStream.isReady ? "Ready" : "Loading"}
            </Badge>
            <Badge variant={poseStream.isActive ? "default" : "secondary"}>
              Stream: {poseStream.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {poseStream.error && <div className="text-red-500 text-sm">Error: {poseStream.error}</div>}

          {streamData && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Frame #{streamData.frameId} | Frames processed: {frameCount}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Confidence:</strong> {(streamData.confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <strong>Low Visibility:</strong> {streamData.hasLowVisibility ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Landmarks:</strong> {streamData.landmarks.length}
                </div>
                <div>
                  <strong>World Landmarks:</strong> {streamData.worldLandmarks.length}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
