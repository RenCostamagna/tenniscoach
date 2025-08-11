"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Loader2, Activity, Target, Zap } from "lucide-react"

export function MetricsPanel() {
  // For now, just show a simple waiting state to avoid infinite loops
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Movement Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Activity className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-600">Analysis temporarily disabled</p>
          <p className="text-xs text-gray-500">Working on fixing infinite loop issues</p>
        </div>
      </CardContent>
    </Card>
  )
}
