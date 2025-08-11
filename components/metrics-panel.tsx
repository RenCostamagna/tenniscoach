"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePoseStore, selectAnalysis, selectBiomechanicalMetrics } from "@/store/pose-store"
import { TrendingUp, Loader2, Activity, Target, Zap } from "lucide-react"

export function MetricsPanel() {
  const { isAnalyzing } = usePoseStore()
  const analysis = usePoseStore(selectAnalysis)
  const biomechanicalMetrics = usePoseStore(selectBiomechanicalMetrics)

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Activity className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">Waiting for analysis data...</p>
            {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500"
    if (score >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      "early-prep": "Early Preparation",
      "late-prep": "Late Preparation", 
      "accel": "Acceleration",
      "impact": "Impact",
      "early-follow": "Early Follow-through",
      "finish": "Finish"
    }
    return labels[phase] || phase.replace("-", " ")
  }

  const getPhaseDescription = (phase: string) => {
    const descriptions: Record<string, string> = {
      "early-prep": "Initial stance and grip preparation",
      "late-prep": "Coil and backswing positioning",
      "accel": "Forward swing acceleration",
      "impact": "Ball contact and power transfer",
      "early-follow": "Immediate follow-through",
      "finish": "Complete swing completion"
    }
    return descriptions[phase] || "Movement phase"
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Movement Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              <Badge variant={isAnalyzing ? "default" : "outline"}>
                {analysis.strokeType.charAt(0).toUpperCase() + analysis.strokeType.slice(1)}
              </Badge>
              <Badge variant="outline">{analysis.fps} FPS</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              <span className={getScoreColor(analysis.scoreGlobal)}>{Math.round(analysis.scoreGlobal * 100)}</span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <p className="text-sm text-gray-600">Overall Movement Score</p>
            <div className="mt-4">
              <Progress value={analysis.scoreGlobal * 100} className="h-2" />
            </div>
            
            {/* Score Interpretation */}
            <div className="mt-3 text-sm">
              {analysis.scoreGlobal >= 0.8 ? (
                <span className="text-green-600 font-medium">Excellent form! Keep it up!</span>
              ) : analysis.scoreGlobal >= 0.6 ? (
                <span className="text-yellow-600 font-medium">Good form with room for improvement</span>
              ) : (
                <span className="text-red-600 font-medium">Focus on fundamentals and practice</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biomechanical Summary */}
      {biomechanicalMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Biomechanical Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {Math.round(biomechanicalMetrics.stability * 100)}%
                </div>
                <div className="text-xs text-gray-600">Stability</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {Math.round(biomechanicalMetrics.symmetry * 100)}%
                </div>
                <div className="text-xs text-gray-600">Symmetry</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {Math.round(biomechanicalMetrics.xFactor * 100)}%
                </div>
                <div className="text-xs text-gray-600">X-Factor</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {Math.round(biomechanicalMetrics.fluidity * 100)}%
                </div>
                <div className="text-xs text-gray-600">Fluidity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysis.phases.map((phaseScore) => (
          <Card key={phaseScore.phase} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                {getPhaseLabel(phaseScore.phase)}
                <Badge variant="outline" className={`text-xs ${getScoreColor(phaseScore.score)}`}>
                  {Math.round(phaseScore.score * 100)}%
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Phase Description */}
              <p className="text-xs text-gray-600">{getPhaseDescription(phaseScore.phase)}</p>

              {/* Score Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Similarity</span>
                  <span>{Math.round(phaseScore.score * 100)}%</span>
                </div>
                <Progress value={phaseScore.score * 100} className="h-2" />
              </div>

              {/* DTW Cost */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>DTW Cost</span>
                  <span>{phaseScore.cost.toFixed(3)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (1 - phaseScore.cost) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Phase Status Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    phaseScore.score > 0.8 ? "bg-green-500" : phaseScore.score > 0.6 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                />
                <span className="text-gray-600">
                  {phaseScore.score > 0.8 ? "Excellent" : phaseScore.score > 0.6 ? "Good" : "Needs Work"}
                </span>
              </div>

              {/* Quick Tips */}
              {phaseScore.score < 0.7 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <Zap className="h-3 w-3 inline mr-1" />
                  Focus on {getPhaseLabel(phaseScore.phase).toLowerCase()} fundamentals
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
