"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, User, BarChart3, TrendingDown, Trash2, Target, Zap } from "lucide-react"
import { usePoseStore, selectBiomechanicalMetrics, selectRecommendations } from "@/store/pose-store"
import type { PoseDeviation } from "@/types/pose"

export function DeviationsList() {
  const { deviations, clearDeviations } = usePoseStore()
  const biomechanicalMetrics = usePoseStore(selectBiomechanicalMetrics)
  const recommendations = usePoseStore(selectRecommendations)

  // Generate biomechanical deviations based on metrics
  const biomechanicalDeviations = useMemo(() => {
    if (!biomechanicalMetrics) return []

    const deviations: Array<{
      id: string
      type: "biomechanical"
      severity: "high" | "medium" | "low"
      description: string
      timestamp: number
      landmarks: string[]
      metric: string
      value: number
      target: number
    }> = []

    Object.entries(biomechanicalMetrics).forEach(([metric, value]) => {
      if (value < 0.6) {
        deviations.push({
          id: `bio-${metric}`,
          type: "biomechanical",
          severity: value < 0.4 ? "high" : value < 0.5 ? "medium" : "low",
          description: `Low ${metric} score: ${Math.round(value * 100)}%`,
          timestamp: Date.now(),
          landmarks: getLandmarksForMetric(metric),
          metric,
          value,
          target: 0.8
        })
      }
    })

    return deviations
  }, [biomechanicalMetrics])

  // Combine regular deviations with biomechanical ones
  const allDeviations = useMemo(() => {
    return [...deviations, ...biomechanicalDeviations]
  }, [deviations, biomechanicalDeviations])

  // Group deviations by type and severity
  const groupedDeviations = useMemo(() => {
    const groups = {
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[],
    }

    allDeviations.forEach((deviation) => {
      groups[deviation.severity].push(deviation)
    })

    return groups
  }, [allDeviations])

  const getDeviationIcon = (type: string) => {
    switch (type) {
      case "posture":
        return User
      case "alignment":
        return BarChart3
      case "stability":
        return TrendingDown
      case "biomechanical":
        return Target
      default:
        return AlertTriangle
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return { variant: "destructive" as const, text: "High Priority" }
      case "medium":
        return { variant: "default" as const, text: "Medium" }
      case "low":
        return { variant: "secondary" as const, text: "Low" }
      default:
        return { variant: "outline" as const, text: "Unknown" }
    }
  }

  const getLandmarksForMetric = (metric: string) => {
    const landmarkMap: Record<string, string[]> = {
      stability: ["shoulders", "hips", "knees"],
      symmetry: ["left_shoulder", "right_shoulder", "left_hip", "right_hip"],
      xFactor: ["shoulders", "hips", "torso"],
      shoulderRotation: ["left_shoulder", "right_shoulder"],
      hipRotation: ["left_hip", "right_hip"],
      kneeStability: ["left_knee", "right_knee"],
      elbowAngle: ["left_elbow", "right_elbow"],
      wristPosition: ["left_wrist", "right_wrist"]
    }
    return landmarkMap[metric] || ["general"]
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const totalDeviations = allDeviations.length
  const highPriorityCount = groupedDeviations.high.length
  const biomechanicalCount = biomechanicalDeviations.length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detected Deviations & Issues
          </CardTitle>
          <div className="flex items-center gap-2">
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {highPriorityCount} High Priority
              </Badge>
            )}
            {biomechanicalCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {biomechanicalCount} Biomechanical
              </Badge>
            )}
            <Button
              onClick={clearDeviations}
              size="sm"
              variant="outline"
              className="flex items-center gap-1 bg-transparent"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {totalDeviations === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No deviations detected</p>
            <p className="text-sm">Great form! Keep it up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{groupedDeviations.high.length}</div>
                <div className="text-xs text-gray-600">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{groupedDeviations.medium.length}</div>
                <div className="text-xs text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{groupedDeviations.low.length}</div>
                <div className="text-xs text-gray-600">Low Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{biomechanicalCount}</div>
                <div className="text-xs text-gray-600">Biomechanical</div>
              </div>
            </div>

            {/* Deviations List */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {/* High Priority First */}
                {groupedDeviations.high.map((deviation) => {
                  const Icon = getDeviationIcon(deviation.type)
                  const badge = getSeverityBadge(deviation.severity)

                  return (
                    <div key={deviation.id} className={`p-3 border rounded-lg ${getSeverityColor(deviation.severity)}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge {...badge}>{badge.text}</Badge>
                            {deviation.type === "biomechanical" && (
                              <Badge variant="outline" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                Biomechanical
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          {deviation.type === "biomechanical" ? (
                            <div className="text-xs text-gray-600">
                              <div>Metric: {deviation.metric}</div>
                              <div>Current: {Math.round(deviation.value * 100)}% | Target: {Math.round(deviation.target * 100)}%</div>
                              <div>Affected areas: {deviation.landmarks.join(", ")}</div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Medium Priority */}
                {groupedDeviations.medium.map((deviation) => {
                  const Icon = getDeviationIcon(deviation.type)
                  const badge = getSeverityBadge(deviation.severity)

                  return (
                    <div key={deviation.id} className={`p-3 border rounded-lg ${getSeverityColor(deviation.severity)}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge {...badge}>{badge.text}</Badge>
                            {deviation.type === "biomechanical" && (
                              <Badge variant="outline" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                Biomechanical
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          {deviation.type === "biomechanical" ? (
                            <div className="text-xs text-gray-600">
                              <div>Metric: {deviation.metric}</div>
                              <div>Current: {Math.round(deviation.value * 100)}% | Target: {Math.round(deviation.target * 100)}%</div>
                              <div>Affected areas: {deviation.landmarks.join(", ")}</div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Low Priority */}
                {groupedDeviations.low.map((deviation) => {
                  const Icon = getDeviationIcon(deviation.type)
                  const badge = getSeverityBadge(deviation.severity)

                  return (
                    <div key={deviation.id} className={`p-3 border rounded-lg ${getSeverityColor(deviation.severity)}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge {...badge}>{badge.text}</Badge>
                            {deviation.type === "biomechanical" && (
                              <Badge variant="outline" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                Biomechanical
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          {deviation.type === "biomechanical" ? (
                            <div className="text-xs text-gray-600">
                              <div>Metric: {deviation.metric}</div>
                              <div>Current: {Math.round(deviation.value * 100)}% | Target: {Math.round(deviation.target * 100)}%</div>
                              <div>Affected areas: {deviation.landmarks.join(", ")}</div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {biomechanicalCount > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Biomechanical Improvement Tips
                </h4>
                <div className="space-y-2 text-sm text-purple-800">
                  <p>• Focus on one metric at a time for better results</p>
                  <p>• Practice movements slowly to improve form</p>
                  <p>• Use the recommendations panel for specific guidance</p>
                  <p>• Track your progress over multiple sessions</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
