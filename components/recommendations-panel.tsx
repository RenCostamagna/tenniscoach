"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePoseStore, selectRecommendations } from "@/store/pose-store"
import { Lightbulb, Target, TrendingUp, AlertCircle } from "lucide-react"

export function RecommendationsPanel() {
  const recommendations = usePoseStore(selectRecommendations)

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Lightbulb className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">No recommendations available yet</p>
            <p className="text-xs text-gray-500">Complete a movement to get personalized feedback</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("improve") || recommendation.toLowerCase().includes("work on")) {
      return Target
    }
    if (recommendation.toLowerCase().includes("excellent") || recommendation.toLowerCase().includes("great")) {
      return TrendingUp
    }
    if (recommendation.toLowerCase().includes("error") || recommendation.toLowerCase().includes("problem")) {
      return AlertCircle
    }
    return Lightbulb
  }

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("excellent") || recommendation.toLowerCase().includes("great")) {
      return "border-green-200 bg-green-50 text-green-800"
    }
    if (recommendation.toLowerCase().includes("error") || recommendation.toLowerCase().includes("problem")) {
      return "border-red-200 bg-red-50 text-red-800"
    }
    return "border-blue-200 bg-blue-50 text-blue-800"
  }

  const getRecommendationPriority = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("excellent") || recommendation.toLowerCase().includes("great")) {
      return { variant: "secondary" as const, text: "Positive" }
    }
    if (recommendation.toLowerCase().includes("error") || recommendation.toLowerCase().includes("problem")) {
      return { variant: "destructive" as const, text: "Critical" }
    }
    if (recommendation.toLowerCase().includes("improve") || recommendation.toLowerCase().includes("work on")) {
      return { variant: "default" as const, text: "Improvement" }
    }
    return { variant: "outline" as const, text: "Suggestion" }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Personalized Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
            <div className="text-xs text-gray-600">Total Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {recommendations.filter(r => r.toLowerCase().includes("excellent") || r.toLowerCase().includes("great")).length}
            </div>
            <div className="text-xs text-gray-600">Positive Feedback</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {recommendations.filter(r => r.toLowerCase().includes("improve") || r.toLowerCase().includes("work on")).length}
            </div>
            <div className="text-xs text-gray-600">Areas to Improve</div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => {
            const Icon = getRecommendationIcon(recommendation)
            const colorClass = getRecommendationColor(recommendation)
            const priority = getRecommendationPriority(recommendation)

            return (
              <div key={index} className={`p-4 border rounded-lg ${colorClass}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge {...priority}>{priority.text}</Badge>
                      <span className="text-xs opacity-75">#{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium">{recommendation}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Items */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Next Steps</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Practice the recommended movements at a slower pace</p>
            <p>• Focus on one improvement area at a time</p>
            <p>• Record your practice sessions to track progress</p>
            <p>• Consider working with a coach for personalized guidance</p>
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Track Your Progress</h4>
          <p className="text-sm text-green-800">
            Each session builds on the previous one. Focus on consistent practice and gradual improvement 
            rather than trying to perfect everything at once.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
