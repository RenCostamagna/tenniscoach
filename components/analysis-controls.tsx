"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { usePoseStore } from "@/store/pose-store"
import { Settings, Tennis, Target, Zap } from "lucide-react"

export function AnalysisControls() {
  const { 
    strokeType, 
    setStrokeType, 
    handedness, 
    setHandedness, 
    fps, 
    setFps,
    isWorkerReady 
  } = usePoseStore()

  const strokeTypes = [
    { value: "forehand", label: "Forehand", icon: Tennis },
    { value: "backhand", label: "Backhand", icon: Tennis },
    { value: "serve", label: "Serve", icon: Tennis },
  ]

  const handednessOptions = [
    { value: "R", label: "Right-handed" },
    { value: "L", label: "Left-handed" },
  ]

  const fpsOptions = [
    { value: 24, label: "24 FPS" },
    { value: 30, label: "30 FPS" },
    { value: 60, label: "60 FPS" },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Analysis Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stroke Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Stroke Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {strokeTypes.map((stroke) => {
              const Icon = stroke.icon
              const isSelected = strokeType === stroke.value
              
              return (
                <Button
                  key={stroke.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto p-3 flex flex-col items-center gap-2 ${
                    isSelected ? "bg-blue-600 text-white" : ""
                  }`}
                  onClick={() => setStrokeType(stroke.value as any)}
                  disabled={!isWorkerReady}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{stroke.label}</span>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Handedness and FPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Handedness</Label>
            <Select value={handedness} onValueChange={(value: "R" | "L") => setHandedness(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select handedness" />
              </SelectTrigger>
              <SelectContent>
                {handednessOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Frame Rate</Label>
            <Select value={fps.toString()} onValueChange={(value) => setFps(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select FPS" />
              </SelectTrigger>
              <SelectContent>
                {fpsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analysis Features */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Analysis Features</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Biomechanical Analysis</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Enabled
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time Processing</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tennis className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Professional Templates</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Loaded
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>AI Model:</span>
              <Badge variant={isWorkerReady ? "default" : "outline"}>
                {isWorkerReady ? "Ready" : "Loading..."}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Template:</span>
              <span className="capitalize">{strokeType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Processing:</span>
              <span>{fps} FPS</span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Pro Tips</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>• Higher FPS provides more detailed analysis but uses more resources</p>
            <p>• Ensure good lighting for accurate pose detection</p>
            <p>• Position yourself fully in frame for best results</p>
            <p>• Practice the same stroke type consistently for better tracking</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
