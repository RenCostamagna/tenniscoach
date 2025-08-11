"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, User, RatioIcon as Balance, TrendingDown, Trash2 } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"
import type { PoseDeviation } from "@/types/pose"

export function DeviationsList() {
  const { deviations, clearDeviations } = usePoseStore()

  // Group deviations by type and severity
  const groupedDeviations = useMemo(() => {
    const groups = {
      high: [] as PoseDeviation[],
      medium: [] as PoseDeviation[],
      low: [] as PoseDeviation[],
    }

    deviations.forEach((deviation) => {
      groups[deviation.severity].push(deviation)
    })

    return groups
  }, [deviations])

  const getDeviationIcon = (type: PoseDeviation["type"]) => {
    switch (type) {
      case "posture":
        return User
      case "alignment":
        return Balance
      case "stability":
        return TrendingDown
      default:
        return AlertTriangle
    }
  }

  const getSeverityColor = (severity: PoseDeviation["severity"]) => {
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

  const getSeverityBadge = (severity: PoseDeviation["severity"]) => {
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const totalDeviations = deviations.length
  const highPriorityCount = groupedDeviations.high.length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detected Deviations
          </CardTitle>
          <div className="flex items-center gap-2">
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {highPriorityCount} High Priority
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

      <CardContent>
        {totalDeviations === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No deviations detected</p>
            <p className="text-sm">Great posture! Keep it up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
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
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
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
                            <span className="text-xs text-gray-500">{formatTime(deviation.timestamp)}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{deviation.description}</p>
                          <p className="text-xs text-gray-600">Affected landmarks: {deviation.landmarks.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
