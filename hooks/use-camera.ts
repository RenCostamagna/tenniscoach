"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { usePoseStore } from "@/store/pose-store"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { camera, setCameraState } = usePoseStore()

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (camera.isActive || camera.isInitializing) return

    setCameraState({ isInitializing: true, error: null })
    setIsVideoReady(false)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream

      // Set video source
      if (videoRef.current) {
        const video = videoRef.current
        
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
        video.srcObject = stream
        
        // Ensure video is muted and autoplay is enabled
        video.muted = true
        video.autoplay = true
        video.playsInline = true
        
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
  }, [camera.isActive, camera.isInitializing, setCameraState])

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
    isActive: camera.isActive,
    isInitializing: camera.isInitializing,
    isVideoReady,
    error: camera.error,
  }
}
