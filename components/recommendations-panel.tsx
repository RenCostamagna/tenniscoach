"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { usePoseStore } from "@/store/pose-store"

export function RecommendationsPanel() {
  const { currentFrame, metrics } = usePoseStore()

  if (!currentFrame) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Lightbulb className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">No recommendations yet</p>
            <p className="text-xs text-gray-500">Start moving to get personalized tips</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate recommendations based on current metrics
  const generateRecommendations = () => {
    const recommendations = []

    // Confidence-based recommendations
    if (metrics.confidence < 0.5) {
      recommendations.push({
        type: "warning",
        icon: <AlertTriangle className="h-4 w-4" />,
        text: "Improve lighting or move closer to camera for better detection",
        priority: "high"
      })
    }

    // Stability-based recommendations
    if (metrics.stability < 0.6) {
      recommendations.push({
        type: "improvement",
        icon: <TrendingUp className="h-4 w-4" />,
        text: "Try to maintain a more stable posture - reduce unnecessary movement",
        priority: "medium"
      })
    } else if (metrics.stability > 0.8) {
      recommendations.push({
        type: "success",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Excellent stability! Your movements are well-controlled",
        priority: "low"
      })
    }

    // Symmetry-based recommendations
    if (metrics.symmetry < 0.7) {
      recommendations.push({
        type: "improvement",
        icon: <TrendingUp className="h-4 w-4" />,
        text: "Focus on maintaining balanced posture - check shoulder and hip alignment",
        priority: "medium"
      })
    }

    // Posture-based recommendations
    if (metrics.posture < 0.6) {
      recommendations.push({
        type: "improvement",
        icon: <TrendingUp className="h-4 w-4" />,
        text: "Keep your head above shoulders and maintain straight spine",
        priority: "high"
      })
    }

    // General tips
    if (recommendations.length === 0) {
      recommendations.push({
        type: "success",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Great form! Keep up the excellent posture and movement quality",
        priority: "low"
      })
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200"
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low": return "text-green-600 bg-green-50 border-green-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning": return "text-red-500"
      case "improvement": return "text-yellow-500"
      case "success": return "text-green-500"
      default: return "text-blue-500"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getTypeColor(rec.type)}`}>
                {rec.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{rec.text}</p>
                <Badge 
                  variant="outline" 
                  className={`mt-2 text-xs ${getPriorityColor(rec.priority)}`}
                >
                  {rec.priority === "high" ? "High Priority" : 
                   rec.priority === "medium" ? "Medium Priority" : "Low Priority"}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {/* Quick Tips */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Quick Tips</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Ensure good lighting for accurate detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Maintain natural, relaxed posture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Keep movements slow and controlled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
