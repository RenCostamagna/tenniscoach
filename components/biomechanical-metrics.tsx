"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export function BiomechanicalMetrics() {
  // For now, just show a simple waiting state to avoid infinite loops
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Biomechanical Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Activity className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-600">Biomechanical analysis temporarily disabled</p>
          <p className="text-xs text-gray-500">Working on fixing infinite loop issues</p>
        </div>
      </CardContent>
    </Card>
  )
}
