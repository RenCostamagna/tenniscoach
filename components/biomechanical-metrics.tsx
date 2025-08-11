"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Target, TrendingUp, Zap } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"

export function BiomechanicalMetrics() {
  const { currentFrame, metrics } = usePoseStore()

  if (!currentFrame) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Biomechanical Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Activity className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">No biomechanical data</p>
            <p className="text-xs text-gray-500">Move to see real-time metrics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate biomechanical metrics from landmarks
  const calculateBiomechanics = () => {
    if (!currentFrame || currentFrame.landmarks.length < 33) return null

    const landmarks = currentFrame.landmarks
    
    // Calculate shoulder alignment
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const shoulderAlignment = leftShoulder && rightShoulder ? 
      Math.abs(leftShoulder.y - rightShoulder.y) < 0.05 ? "Excellent" : 
      Math.abs(leftShoulder.y - rightShoulder.y) < 0.1 ? "Good" : "Poor" : "Unknown"

    // Calculate hip alignment
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const hipAlignment = leftHip && rightHip ? 
      Math.abs(leftHip.y - rightHip.y) < 0.05 ? "Excellent" : 
      Math.abs(leftHip.y - rightHip.y) < 0.1 ? "Good" : "Poor" : "Unknown"

    // Calculate spine curvature (simplified)
    const nose = landmarks[0]
    const midShoulder = leftShoulder && rightShoulder ? {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    } : null
    const midHip = leftHip && rightHip ? {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    } : null

    let spineCurvature = "Unknown"
    if (nose && midShoulder && midHip) {
      const spineAngle = Math.atan2(midHip.y - midShoulder.y, midHip.x - midShoulder.x)
      const headAngle = Math.atan2(nose.y - midShoulder.y, nose.x - midShoulder.x)
      const curvature = Math.abs(spineAngle - headAngle)
      
      if (curvature < 0.2) spineCurvature = "Excellent"
      else if (curvature < 0.4) spineCurvature = "Good"
      else spineCurvature = "Needs Improvement"
    }

    return {
      shoulderAlignment,
      hipAlignment,
      spineCurvature
    }
  }

  const biomechanics = calculateBiomechanics()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Biomechanical Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {biomechanics ? (
          <>
            {/* Shoulder Alignment */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Shoulder Alignment</span>
              </div>
              <Badge 
                variant={biomechanics.shoulderAlignment === "Excellent" ? "default" : 
                        biomechanics.shoulderAlignment === "Good" ? "secondary" : "destructive"}
              >
                {biomechanics.shoulderAlignment}
              </Badge>
            </div>

            {/* Hip Alignment */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Hip Alignment</span>
              </div>
              <Badge 
                variant={biomechanics.hipAlignment === "Excellent" ? "default" : 
                        biomechanics.hipAlignment === "Good" ? "secondary" : "destructive"}
              >
                {biomechanics.hipAlignment}
              </Badge>
            </div>

            {/* Spine Curvature */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Spine Curvature</span>
              </div>
              <Badge 
                variant={biomechanics.spineCurvature === "Excellent" ? "default" : 
                        biomechanics.spineCurvature === "Good" ? "secondary" : "destructive"}
              >
                {biomechanics.spineCurvature}
              </Badge>
            </div>

            {/* Overall Score */}
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    const scores = [biomechanics.shoulderAlignment, biomechanics.hipAlignment, biomechanics.spineCurvature]
                    const excellent = scores.filter(s => s === "Excellent").length
                    const good = scores.filter(s => s === "Good").length
                    return Math.round((excellent * 100 + good * 70) / scores.length)
                  })()}%
                </div>
                <div className="text-xs text-gray-600">Overall Biomechanical Score</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-500">
            Insufficient landmark data for biomechanical analysis
          </div>
        )}
      </CardContent>
    </Card>
  )
}
