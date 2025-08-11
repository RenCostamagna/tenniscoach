"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Loader2, Activity, Target, Zap } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"

export function MetricsPanel() {
  const { currentFrame, metrics } = usePoseStore()

  if (!currentFrame) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Movement Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Activity className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">Waiting for pose detection</p>
            <p className="text-xs text-gray-500">Move in front of the camera</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Movement Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Detection Confidence
            </span>
            <Badge variant="secondary">
              {(metrics.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress value={metrics.confidence * 100} className="h-2" />
        </div>

        {/* Stability Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Movement Stability
            </span>
            <Badge variant="secondary">
              {(metrics.stability * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress value={metrics.stability * 100} className="h-2" />
        </div>

        {/* Symmetry Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Body Symmetry
            </span>
            <Badge variant="secondary">
              {(metrics.symmetry * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress value={metrics.symmetry * 100} className="h-2" />
        </div>

        {/* Posture Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Posture Quality
            </span>
            <Badge variant="secondary">
              {(metrics.posture * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress value={metrics.posture * 100} className="h-2" />
        </div>

        {/* Frame Info */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {currentFrame.landmarks.length}
              </div>
              <div className="text-xs text-gray-600">Landmarks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Date(currentFrame.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-600">Last Update</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
