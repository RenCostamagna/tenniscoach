"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react"
import { useCamera } from "@/hooks/use-camera"
import { usePoseWorker } from "@/hooks/use-pose-worker"
import { usePoseStore } from "@/store/pose-store"

export function CameraPanel() {
  const { videoRef, startCamera, stopCamera, isActive, isInitializing, isVideoReady, error } = useCamera()
  const { isWorkerReady, createCanvas } = usePoseWorker()
  const { currentFrame, metrics } = usePoseStore()

  // Create hidden canvas for frame processing
  useEffect(() => {
    if (isActive && isWorkerReady) {
      createCanvas()
    }
  }, [isActive, isWorkerReady, createCanvas])

  const handleToggleCamera = async () => {
    if (isActive) {
      stopCamera()
    } else {
      await startCamera()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            {isWorkerReady ? (
              <Badge variant="secondary" className="text-green-600">
                AI Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-600">
                AI Loading
              </Badge>
            )}
            {isActive && isVideoReady && (
              <Badge variant="secondary" className="text-blue-600">
                Video Ready
              </Badge>
            )}
            {currentFrame && <Badge variant="secondary">Frame #{currentFrame.frameId}</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Video Container */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isActive ? (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                playsInline 
                muted 
                autoPlay 
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
              />

              {/* Video Status Overlay */}
              {!isVideoReady && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p>Initializing video stream...</p>
                    <p className="text-sm opacity-75">Please wait</p>
                  </div>
                </div>
              )}

              {/* Pose Detection Overlay */}
              {currentFrame && isVideoReady && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  Pose Detected: {currentFrame.landmarks.length} landmarks
                </div>
              )}

              {/* Metrics Overlay */}
              {metrics.confidence > 0 && isVideoReady && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm space-y-1">
                  <div>Confidence: {(metrics.confidence * 100).toFixed(0)}%</div>
                  <div>Stability: {(metrics.stability * 100).toFixed(0)}%</div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Camera not active</p>
                <p className="text-sm">Click start to begin pose analysis</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleToggleCamera}
            disabled={isInitializing || !isWorkerReady}
            variant={isActive ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : isActive ? (
              <>
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start Camera
              </>
            )}
          </Button>

          {/* Status Info */}
          <div className="text-sm text-gray-600 space-y-1">
            {!isWorkerReady && (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading AI model...
              </div>
            )}
            {isActive && !isVideoReady && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Initializing video...
              </div>
            )}
            {isActive && isVideoReady && currentFrame && (
              <div>Last update: {new Date(currentFrame.timestamp).toLocaleTimeString()}</div>
            )}
          </div>
        </div>

        {/* Camera Info */}
        {isActive && isVideoReady && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentFrame ? currentFrame.landmarks.length : 0}
              </div>
              <div className="text-sm text-gray-600">Landmarks Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.confidence > 0 ? (metrics.confidence * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-gray-600">Detection Confidence</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
