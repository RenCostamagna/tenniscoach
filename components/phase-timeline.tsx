"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, Square } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"

export function PhaseTimeline() {
  const { currentFrame, metrics, currentPhase } = usePoseStore()

  if (!currentFrame) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Clock className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">No analysis data</p>
            <p className="text-xs text-gray-500">Start moving to see timeline</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Analysis Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Status</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Play className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Detection Quality</span>
            <Badge variant={metrics.confidence > 0.7 ? "default" : metrics.confidence > 0.4 ? "secondary" : "destructive"}>
              {metrics.confidence > 0.7 ? "Excellent" : metrics.confidence > 0.4 ? "Good" : "Poor"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Movement Type</span>
            <Badge variant="outline">General</Badge>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Real-time Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stability</span>
              <span className="font-medium">{(metrics.stability * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Symmetry</span>
              <span className="font-medium">{(metrics.symmetry * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Posture</span>
              <span className="font-medium">{(metrics.posture * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Frame Counter */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentFrame.frameId}
            </div>
            <div className="text-xs text-gray-600">Frames Processed</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
              <Play className="h-3 w-3 mr-1 inline" />
              Start Session
            </button>
            <button className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              <Square className="h-3 w-3 mr-1 inline" />
              Reset
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
