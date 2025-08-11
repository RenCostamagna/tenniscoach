"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "./sparkline"
import type { MovementPhase } from "@/types/pose"
import { CheckCircle, Clock, Play, Loader2 } from "lucide-react"

interface PhaseCardProps {
  phase: MovementPhase
  isLoading?: boolean
}

export function PhaseCard({ phase, isLoading = false }: PhaseCardProps) {
  const getPhaseIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (phase.isComplete) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (phase.isActive) return <Play className="h-4 w-4 text-blue-600" />
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getPhaseStatus = () => {
    if (isLoading) return { variant: "outline" as const, text: "Loading..." }
    if (phase.isComplete) return { variant: "secondary" as const, text: "Complete" }
    if (phase.isActive) return { variant: "default" as const, text: "Active" }
    return { variant: "outline" as const, text: "Pending" }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-green-600"
    if (similarity >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const features = [
    { name: "X-Factor", value: phase.metrics.xFactor, color: "#8b5cf6" },
    { name: "Elbow", value: phase.metrics.elbowAngle / 180, color: "#06b6d4" }, // Normalize to 0-1
    { name: "Wrist", value: phase.metrics.wristPosition, color: "#10b981" },
    { name: "Knee", value: phase.metrics.kneeStability, color: "#f59e0b" },
  ]

  const status = getPhaseStatus()

  return (
    <Card
      className={`transition-all duration-200 ${
        phase.isActive ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${phase.isComplete ? "bg-green-50 dark:bg-green-950/20" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getPhaseIcon()}
            {phase.name}
          </CardTitle>
          <Badge {...status}>{status.text}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Similarity Score */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">
            <span className={getSimilarityColor(phase.metrics.similarity)}>
              {Math.round(phase.metrics.similarity * 100)}
            </span>
            <span className="text-lg text-gray-500">%</span>
          </div>
          <p className="text-sm text-gray-600">Similarity to Ideal</p>
        </div>

        {/* Feature Bars */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Features</h4>
          {features.map((feature) => (
            <div key={feature.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">{feature.name}</span>
                <span className="text-xs text-gray-500">
                  {feature.name === "Elbow"
                    ? `${Math.round(phase.metrics.elbowAngle)}°`
                    : `${Math.round(feature.value * 100)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${feature.value * 100}%`,
                    backgroundColor: feature.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hand Height Sparkline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Hand Height Trend</h4>
          <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Sparkline data={phase.metrics.handHeight} width={120} height={40} color="#3b82f6" />
          </div>
        </div>

        {/* Duration */}
        {(phase.isActive || phase.isComplete) && (
          <div className="text-center pt-2 border-t">
            <div className="text-sm text-gray-600">
              Duration: <span className="font-medium">{phase.duration.toFixed(1)}s</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
