"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Clock } from "lucide-react"
import { usePoseStore, selectAnalysis } from "@/store/pose-store"

export function MetricsPanel() {
  const analysis = usePoseStore(selectAnalysis)

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analysis Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Esperando análisis...</p>
            <p className="text-sm">Muévete frente a la cámara para comenzar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const similarityPercent = Math.round(analysis.scoreGlobal * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Analysis Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Similarity */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">Similarity: {similarityPercent}%</div>
          <Progress value={similarityPercent} className="w-full" />
          <Badge variant={similarityPercent >= 80 ? "default" : similarityPercent >= 60 ? "secondary" : "destructive"}>
            {similarityPercent >= 80 ? "Excellent" : similarityPercent >= 60 ? "Good" : "Needs Work"}
          </Badge>
        </div>

        {/* Stroke Info */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Stroke Type</div>
            <div className="font-semibold capitalize">{analysis.strokeType}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">FPS</div>
            <div className="font-semibold">{analysis.fps}</div>
          </div>
        </div>

        {/* Phase Scores Grid */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Phase Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {analysis.phases.map((phase, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 capitalize mb-1">{phase.phase.replace("-", " ")}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{Math.round(phase.score * 100)}%</div>
                  <div className="flex-1">
                    <Progress value={phase.score * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
