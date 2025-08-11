"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { usePoseStore, selectAnalysis } from "@/store/pose-store"

export function PhaseTimeline() {
  const analysis = usePoseStore(selectAnalysis)

  if (!analysis || !analysis.phases.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Phase Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <p>No phase data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500"
    if (score >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Phase Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analysis.phases.map((phase, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${getScoreColor(phase.score)}`}
                title={`Score: ${Math.round(phase.score * 100)}%`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium capitalize">{phase.phase.replace("-", " ")}</div>
                <div className="text-xs text-gray-500">{Math.round(phase.score * 100)}% similarity</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
