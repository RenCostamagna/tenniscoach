"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react"
import { useCamera } from "@/hooks/use-camera"
import { usePoseDetection } from "@/hooks/use-pose-detection"
import { usePoseStore } from "@/store/pose-store"

export function CameraPanel() {
  const { videoRef, startCamera, stopCamera, isActive, isInitializing, isVideoReady, error } = useCamera()
  const { isInitialized: isPoseInitialized, isProcessing, startDetection, stopDetection } = usePoseDetection()
  const { currentFrame, metrics } = usePoseStore()

  // Start pose detection when video is ready
  useEffect(() => {
    if (isActive && isVideoReady && isPoseInitialized && videoRef.current) {
      console.log("Starting pose detection for video...")
      startDetection(videoRef.current)
    } else if (!isActive || !isVideoReady) {
      stopDetection()
    }
  }, [isActive, isVideoReady, isPoseInitialized, startDetection, stopDetection])

  // Ensure video element is properly initialized when camera becomes active
  useEffect(() => {
    if (isActive && videoRef.current) {
      console.log("Camera active, video element found:", videoRef.current)
      // Force a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log("Video element ready state:", videoRef.current.readyState)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  const handleToggleCamera = async () => {
    if (isActive) {
      stopCamera()
    } else {
      await startCamera()
    }
  }

  const handleRetryVideo = async () => {
    console.log("Retrying video initialization...")
    if (videoRef.current) {
      const video = videoRef.current
      console.log("Current video state:", {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        srcObject: video.srcObject,
        paused: video.paused
      })
      
      // Force reload the video
      video.load()
      try {
        await video.play()
        console.log("Retry play() successful")
      } catch (e) {
        console.error("Retry play() failed:", e)
      }
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
            {isPoseInitialized ? (
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
            {isProcessing && (
              <Badge variant="secondary" className="text-purple-600">
                Processing
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
          {/* Video element - always present but conditionally visible */}
          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isActive && isVideoReady ? 'opacity-100' : 'opacity-0'
            }`}
            playsInline 
            muted 
            autoPlay 
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
          />

          {/* Video Status Overlay */}
          {isActive && !isVideoReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Initializing video stream...</p>
                <p className="text-sm opacity-75">Please wait</p>
                <Button 
                  onClick={handleRetryVideo}
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-white border-white hover:bg-white hover:text-black"
                >
                  Retry Video
                </Button>
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

          {/* Camera not active state */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
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
            disabled={isInitializing || !isPoseInitialized}
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
            {!isPoseInitialized && (
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
            {isProcessing && (
              <div className="flex items-center gap-1 text-purple-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing pose...
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

        {/* Debug Info */}
        {isActive && (
          <div className="pt-4 border-t">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600">Debug Info</summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                <div>Video Ready: {isVideoReady ? 'Yes' : 'No'}</div>
                <div>Video Element: {videoRef.current ? 'Exists' : 'Null'}</div>
                <div>Pose AI: {isPoseInitialized ? 'Ready' : 'Loading'}</div>
                <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
                {videoRef.current && (
                  <>
                    <div>Ready State: {videoRef.current.readyState}</div>
                    <div>Video Dimensions: {videoRef.current.videoWidth} x {videoRef.current.videoHeight}</div>
                    <div>Paused: {videoRef.current.paused ? 'Yes' : 'No'}</div>
                    <div>Has Stream: {videoRef.current.srcObject ? 'Yes' : 'No'}</div>
                  </>
                )}
                {currentFrame && (
                  <>
                    <div>Landmarks: {currentFrame.landmarks.length}</div>
                    <div>Frame ID: {currentFrame.frameId}</div>
                    <div>Timestamp: {currentFrame.timestamp}</div>
                  </>
                )}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
