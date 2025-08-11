"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePoseStore, selectBiomechanicalMetrics } from "@/store/pose-store"
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"

export function BiomechanicalMetrics() {
  const biomechanicalMetrics = usePoseStore(selectBiomechanicalMetrics)

  if (!biomechanicalMetrics) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Activity className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">Waiting for biomechanical analysis...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMetricColor = (value: number) => {
    if (value >= 0.8) return "text-green-600"
    if (value >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (value: number) => {
    if (value >= 0.8) return "bg-green-500"
    if (value >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getMetricIcon = (value: number) => {
    if (value >= 0.8) return TrendingUp
    if (value >= 0.6) return Minus
    return TrendingDown
  }

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      stability: "Movement Stability",
      symmetry: "Bilateral Symmetry",
      fluidity: "Movement Fluidity",
      balance: "Body Balance",
      xFactor: "X-Factor (Torso-Hip Separation)",
      shoulderRotation: "Shoulder Rotation",
      hipRotation: "Hip Rotation",
      kneeStability: "Knee Stability",
      elbowAngle: "Elbow Angle",
      wristPosition: "Wrist Position"
    }
    return labels[metric] || metric
  }

  const getMetricDescription = (metric: string) => {
    const descriptions: Record<string, string> = {
      stability: "Consistency of movement patterns",
      symmetry: "Balance between left and right sides",
      fluidity: "Smoothness of motion transitions",
      balance: "Maintenance of center of gravity",
      xFactor: "Separation between torso and hip rotation",
      shoulderRotation: "Proper shoulder turn during swing",
      hipRotation: "Hip movement coordination",
      kneeStability: "Knee position and movement control",
      elbowAngle: "Elbow positioning and angle control",
      wristPosition: "Wrist alignment and positioning"
    }
    return descriptions[metric] || "Movement quality metric"
  }

  const metrics = Object.entries(biomechanicalMetrics)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Biomechanical Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((biomechanicalMetrics.stability + biomechanicalMetrics.symmetry) / 2 * 100)}%
            </div>
            <div className="text-sm text-gray-600">Stability & Symmetry</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((biomechanicalMetrics.fluidity + biomechanicalMetrics.balance) / 2 * 100)}%
            </div>
            <div className="text-sm text-gray-600">Fluidity & Balance</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(biomechanicalMetrics.xFactor * 100)}%
            </div>
            <div className="text-sm text-gray-600">X-Factor</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((biomechanicalMetrics.shoulderRotation + biomechanicalMetrics.hipRotation) / 2 * 100)}%
            </div>
            <div className="text-sm text-gray-600">Rotation Control</div>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map(([key, value]) => {
            const Icon = getMetricIcon(value)
            const label = getMetricLabel(key)
            const description = getMetricDescription(key)

            return (
              <Card key={key} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${getMetricColor(value)}`} />
                      <Badge variant="outline" className={`text-xs ${getMetricColor(value)}`}>
                        {Math.round(value * 100)}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Quality</span>
                      <span>{Math.round(value * 100)}%</span>
                    </div>
                    <Progress value={value * 100} className="h-2" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600">{description}</p>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        value > 0.8 ? "bg-green-500" : value > 0.6 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-gray-600">
                      {value > 0.8 ? "Excellent" : value > 0.6 ? "Good" : "Needs Improvement"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Key Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Key Insights</h4>
          <div className="space-y-2 text-sm text-blue-800">
            {biomechanicalMetrics.stability < 0.7 && (
              <p>• Movement stability could be improved for more consistent performance</p>
            )}
            {biomechanicalMetrics.symmetry < 0.7 && (
              <p>• Focus on balanced movement between left and right sides</p>
            )}
            {biomechanicalMetrics.xFactor < 0.6 && (
              <p>• Increase torso-hip separation for better power generation</p>
            )}
            {biomechanicalMetrics.kneeStability < 0.7 && (
              <p>• Work on knee stability for better balance and control</p>
            )}
            {biomechanicalMetrics.stability >= 0.8 && biomechanicalMetrics.symmetry >= 0.8 && (
              <p>• Excellent movement consistency and symmetry!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
