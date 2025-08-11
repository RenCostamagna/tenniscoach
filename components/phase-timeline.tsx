"use client"

import type React from "react"

import { useMemo, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Clock } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"

interface TooltipData {
  x: number
  y: number
  phase: string
  frameIndex: number
  timestamp: number
  metrics?: {
    similarity: number
    xFactor: number
    elbow: number
    wrist: number
    knee: number
    handHeight: number
  }
}

export function PhaseTimeline() {
  const { phases, currentPhase, startPhase, endCurrentPhase, frames } = usePoseStore()
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [focusedSegment, setFocusedSegment] = useState<number>(-1)
  const timelineRef = useRef<HTMLDivElement>(null)

  const phaseSegments = useMemo(() => {
    if (phases.length === 0) return []

    const totalDuration = phases.reduce((total, phase) => {
      if (phase.endTime) {
        return total + (phase.endTime - phase.startTime)
      } else if (phase.status === "active") {
        return total + (Date.now() - phase.startTime)
      }
      return total
    }, 0)

    let cumulativeTime = 0
    return phases.map((phase, index) => {
      const duration = phase.endTime ? phase.endTime - phase.startTime : Date.now() - phase.startTime
      const startPercent = totalDuration > 0 ? (cumulativeTime / totalDuration) * 100 : 0
      const widthPercent = totalDuration > 0 ? (duration / totalDuration) * 100 : 0

      cumulativeTime += duration

      return {
        ...phase,
        index,
        startPercent,
        widthPercent,
        duration,
      }
    })
  }, [phases])

  const totalDuration = useMemo(() => {
    return phases.reduce((total, phase) => {
      if (phase.endTime) {
        return total + (phase.endTime - phase.startTime)
      } else if (phase.status === "active") {
        return total + (Date.now() - phase.startTime)
      }
      return total
    }, 0)
  }, [phases])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  const handleSegmentHover = useCallback((event: React.MouseEvent, segment: any) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const relativeX = x / rect.width

    const frameIndex = Math.floor(relativeX * 60)
    const timestamp = segment.startTime + relativeX * segment.duration

    const metrics = {
      similarity: Math.random() * 100,
      xFactor: Math.random() * 100,
      elbow: Math.random() * 100,
      wrist: Math.random() * 100,
      knee: Math.random() * 100,
      handHeight: Math.random() * 2 + 1,
    }

    setTooltip({
      x: event.clientX,
      y: event.clientY,
      phase: segment.name,
      frameIndex,
      timestamp,
      metrics,
    })
  }, [])

  const handleSegmentLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (phaseSegments.length === 0) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          setFocusedSegment((prev) => Math.max(0, prev - 1))
          break
        case "ArrowRight":
          event.preventDefault()
          setFocusedSegment((prev) => Math.min(phaseSegments.length - 1, prev + 1))
          break
        case "Home":
          event.preventDefault()
          setFocusedSegment(0)
          break
        case "End":
          event.preventDefault()
          setFocusedSegment(phaseSegments.length - 1)
          break
        case "Enter":
        case " ":
          event.preventDefault()
          if (focusedSegment >= 0) {
            console.log("Selected phase:", phaseSegments[focusedSegment].name)
          }
          break
      }
    },
    [phaseSegments, focusedSegment],
  )

  const handleStartPhase = () => {
    const phaseNames = ["Preparation", "Acceleration", "Impact", "Follow-through"]
    const nextPhaseName = phaseNames[phases.length % phaseNames.length]
    startPhase(nextPhaseName)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Total: {formatDuration(totalDuration)}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {!currentPhase ? (
            <Button onClick={handleStartPhase} size="sm" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Phase
            </Button>
          ) : (
            <Button onClick={endCurrentPhase} size="sm" variant="destructive" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              End Phase
            </Button>
          )}

          {currentPhase && (
            <Badge variant="default" className="animate-pulse">
              {currentPhase.name} - {formatDuration(Date.now() - currentPhase.startTime)}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {phaseSegments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No analysis phases started</p>
              <p className="text-sm">Click "Start Phase" to begin</p>
            </div>
          ) : (
            <>
              <div
                ref={timelineRef}
                className="relative h-16 bg-gray-100 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                role="slider"
                aria-label="Phase timeline"
                aria-valuemin={0}
                aria-valuemax={phaseSegments.length - 1}
                aria-valuenow={focusedSegment}
              >
                {phaseSegments.map((segment, index) => {
                  const isActive = segment.status === "active"
                  const isCompleted = segment.status === "completed"
                  const isFocused = focusedSegment === index

                  return (
                    <div
                      key={segment.id}
                      className={`absolute top-0 h-full cursor-pointer transition-all duration-200 ${
                        isActive ? "bg-blue-500 animate-pulse" : isCompleted ? "bg-green-500" : "bg-gray-300"
                      } ${isFocused ? "ring-2 ring-blue-400 ring-inset" : ""} hover:brightness-110`}
                      style={{
                        left: `${segment.startPercent}%`,
                        width: `${segment.widthPercent}%`,
                      }}
                      onMouseMove={(e) => handleSegmentHover(e, segment)}
                      onMouseLeave={handleSegmentLeave}
                      onClick={() => setFocusedSegment(index)}
                      role="button"
                      tabIndex={-1}
                      aria-label={`${segment.name} phase, ${formatDuration(segment.duration)}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-medium truncate px-1">{segment.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-2">
                {phaseSegments.map((segment, index) => {
                  const isActive = segment.status === "active"
                  const isFocused = focusedSegment === index

                  return (
                    <div
                      key={segment.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                        isFocused ? "border-blue-500 bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isActive
                              ? "bg-blue-500 text-white"
                              : segment.status === "completed"
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{segment.name}</h4>
                          <Badge
                            variant={isActive ? "default" : segment.status === "completed" ? "secondary" : "outline"}
                            className={isActive ? "animate-pulse" : ""}
                          >
                            {segment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Started: {new Date(segment.startTime).toLocaleTimeString()}
                          {segment.endTime && ` • Ended: ${new Date(segment.endTime).toLocaleTimeString()}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">{formatDuration(segment.duration)}</div>
                        {isActive && <div className="text-xs text-blue-600">Active</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {phases.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{phases.length}</div>
              <div className="text-sm text-gray-600">Total Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {phases.filter((p) => p.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {phases.filter((p) => p.status === "active").length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        )}
      </CardContent>

      {tooltip && (
        <div
          className="fixed z-50 bg-black text-white p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <div className="text-sm font-medium mb-2">{tooltip.phase}</div>
          <div className="text-xs space-y-1">
            <div>Frame: {tooltip.frameIndex}</div>
            <div>Time: {new Date(tooltip.timestamp).toLocaleTimeString()}</div>
            {tooltip.metrics && (
              <>
                <div className="border-t border-gray-600 pt-1 mt-2">
                  <div>Similarity: {tooltip.metrics.similarity.toFixed(1)}%</div>
                  <div>X-Factor: {tooltip.metrics.xFactor.toFixed(1)}%</div>
                  <div>Elbow: {tooltip.metrics.elbow.toFixed(1)}%</div>
                  <div>Hand Height: {tooltip.metrics.handHeight.toFixed(2)}m</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
