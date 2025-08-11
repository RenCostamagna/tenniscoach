"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { usePoseStore } from "@/store/pose-store"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentCamera, setCurrentCamera] = useState<"front" | "back">("front")
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])

  const { camera, setCameraState } = usePoseStore()

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      console.log("Enumerating available cameras...")
      
      // First, request permissions to ensure we can access device info
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        console.log("Camera permissions granted")
      } catch (permError) {
        console.log("Camera permissions not granted yet, but continuing...")
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      console.log("All devices found:", devices.map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })))
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log("Video devices found:", videoDevices.length)
      
      // Log each video device
      videoDevices.forEach((device, index) => {
        console.log(`Camera ${index + 1}:`, {
          label: device.label || `Camera ${index + 1}`,
          deviceId: device.deviceId,
          groupId: device.groupId
        })
      })
      
      setAvailableCameras(videoDevices)
      
      // If we have multiple cameras, try to identify front/back
      if (videoDevices.length > 1) {
        console.log("Multiple cameras detected - attempting to identify front/back")
        videoDevices.forEach((device, index) => {
          const label = device.label.toLowerCase()
          if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
            console.log(`Camera ${index + 1} appears to be BACK camera:`, device.label)
          } else if (label.includes('front') || label.includes('user')) {
            console.log(`Camera ${index + 1} appears to be FRONT camera:`, device.label)
          } else {
            console.log(`Camera ${index + 1} is UNKNOWN type:`, device.label)
          }
        })
      }
      
    } catch (error) {
      console.error("Failed to enumerate cameras:", error)
      // Set at least one camera as available to allow basic functionality
      setAvailableCameras([{ kind: 'videoinput', deviceId: 'default', label: 'Default Camera', groupId: 'default' } as MediaDeviceInfo])
    }
  }, [])

  // Get camera constraints based on current selection
  const getCameraConstraints = useCallback((cameraType: "front" | "back") => {
    if (cameraType === "back") {
      return {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "environment", // Use back camera
        },
        audio: false,
      }
    } else {
      return {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user", // Use front camera
        },
        audio: false,
      }
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async (cameraType: "front" | "back" = currentCamera) => {
    if (camera.isActive || camera.isInitializing) return

    console.log(`Starting ${cameraType} camera...`)
    setCameraState({ isInitializing: true, error: null })
    setIsVideoReady(false)
    setCurrentCamera(cameraType)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      // Request camera access with specific constraints
      console.log("Requesting camera permissions...")
      const constraints = getCameraConstraints(cameraType)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log("Camera stream obtained:", stream)
      streamRef.current = stream

      // Set video source
      if (videoRef.current) {
        const video = videoRef.current
        console.log("Video element found, setting up stream...")
        
        // Add event listeners for video readiness
        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight)
        }
        
        const handleCanPlay = () => {
          console.log("Video can start playing")
          setIsVideoReady(true)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
        
        const handlePlaying = () => {
          console.log("Video is now playing")
          setIsVideoReady(true)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
        
        const handleError = (e: Event) => {
          console.error("Video error:", e)
          setCameraState({
            isActive: false,
            isInitializing: false,
            stream: null,
            error: "Video playback error occurred",
          })
        }

        // Remove previous listeners if any
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('playing', handlePlaying)
        video.removeEventListener('error', handleError)

        // Add new listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('playing', handlePlaying)
        video.addEventListener('error', handleError)

        // Set the stream and start playing
        console.log("Setting srcObject on video element...")
        video.srcObject = stream
        
        // Ensure video is muted and autoplay is enabled
        video.muted = true
        video.autoplay = true
        video.playsInline = true
        
        console.log("Attempting to play video...")
        try {
          await video.play()
          console.log("Video play() successful")
          
          // Fallback: if events don't fire, check video state after a delay
          timeoutRef.current = setTimeout(() => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              console.log("Fallback: Video ready detected via timeout")
              setIsVideoReady(true)
            } else {
              console.log("Fallback: Video still not ready, current state:", {
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
              })
            }
          }, 2000) // Wait 2 seconds for fallback
          
        } catch (playError) {
          console.error("Video play() failed:", playError)
          // Even if play() fails, the video might still work
          // The canplay event should still fire, or we'll use the fallback
        }
      } else {
        console.error("Video element not found!")
      }

      setCameraState({
        isActive: true,
        isInitializing: false,
        stream,
        error: null,
      })
    } catch (error) {
      console.error("Camera access error:", error)

      let errorMessage = "Failed to access camera"

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application."
        } else if (error.name === "OverconstrainedError") {
          errorMessage = `Camera constraints not met. Trying to switch to ${cameraType === "front" ? "back" : "front"} camera...`
          // Try to switch to the other camera
          if (cameraType === "front") {
            setTimeout(() => startCamera("back"), 1000)
          } else {
            setTimeout(() => startCamera("front"), 1000)
          }
          return
        } else {
          errorMessage = error.message
        }
      }

      setCameraState({
        isActive: false,
        isInitializing: false,
        stream: null,
        error: errorMessage,
      })
    }
  }, [camera.isActive, camera.isInitializing, setCameraState, currentCamera, getCameraConstraints])

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!camera.isActive) return
    
    console.log("Switching camera...")
    const newCamera = currentCamera === "front" ? "back" : "front"
    
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    // Start new camera
    await startCamera(newCamera)
  }, [camera.isActive, currentCamera, startCamera])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Reset video element
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsVideoReady(false)
    setCameraState({
      isActive: false,
      isInitializing: false,
      stream: null,
      error: null,
    })
  }, [setCameraState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Get available cameras on mount
  useEffect(() => {
    getAvailableCameras()
  }, [getAvailableCameras])

  // Debug effect to log video state changes
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      console.log("Video element state:", {
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        ended: video.ended,
        srcObject: video.srcObject,
        currentSrc: video.currentSrc,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      })
    }
  }, [isVideoReady, camera.isActive])

  return {
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    isActive: camera.isActive,
    isInitializing: camera.isInitializing,
    isVideoReady,
    currentCamera,
    availableCameras,
    error: camera.error,
  }
}
