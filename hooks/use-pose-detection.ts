"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Pose } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils"
import { usePoseStore } from "@/store/pose-store"

export function usePoseDetection() {
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { addFrame, updateMetrics, currentFrame } = usePoseStore()

  // Initialize MediaPipe Pose
  const initializePose = useCallback(async () => {
    try {
      console.log("Initializing MediaPipe Pose...")
      
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      // Handle pose results
      pose.onResults((results) => {
        if (results.poseLandmarks) {
          const landmarks = results.poseLandmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z || 0,
            visibility: landmark.visibility || 1.0
          }))

          const frame = {
            landmarks,
            timestamp: performance.now(),
            frameId: Date.now()
          }

          addFrame(frame)

          // Calculate basic metrics
          const confidence = results.poseLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / results.poseLandmarks.length
          const stability = calculateStability(landmarks)
          
          updateMetrics({
            confidence,
            stability,
            symmetry: calculateSymmetry(landmarks),
            posture: calculatePosture(landmarks)
          })
        }
      })

      poseRef.current = pose
      setIsInitialized(true)
      console.log("MediaPipe Pose initialized successfully")
      
    } catch (error) {
      console.error("Failed to initialize MediaPipe Pose:", error)
      setIsInitialized(false)
    }
  }, [addFrame, updateMetrics])

  // Calculate pose stability
  const calculateStability = useCallback((landmarks: any[]) => {
    if (!currentFrame || landmarks.length === 0) return 0
    
    // Simple stability calculation based on landmark movement
    const keyPoints = [0, 11, 12, 23, 24] // nose, shoulders, hips
    let totalMovement = 0
    
    keyPoints.forEach(index => {
      if (landmarks[index] && currentFrame.landmarks[index]) {
        const dx = landmarks[index].x - currentFrame.landmarks[index].x
        const dy = landmarks[index].y - currentFrame.landmarks[index].y
        totalMovement += Math.sqrt(dx * dx + dy * dy)
      }
    })
    
    // Convert to stability score (0-1, higher is more stable)
    return Math.max(0, 1 - (totalMovement / keyPoints.length))
  }, [currentFrame])

  // Calculate pose symmetry
  const calculateSymmetry = useCallback((landmarks: any[]) => {
    if (landmarks.length < 33) return 0
    
    // Compare left and right side landmarks
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0
    
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y)
    const hipDiff = Math.abs(leftHip.y - rightHip.y)
    
    // Normalize differences (0-1, lower is more symmetric)
    return Math.max(0, 1 - (shoulderDiff + hipDiff) / 2)
  }, [])

  // Calculate posture score
  const calculatePosture = useCallback((landmarks: any[]) => {
    if (landmarks.length < 33) return 0
    
    // Simple posture check based on spine alignment
    const nose = landmarks[0]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    
    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0
    
    // Check if head is above shoulders
    const headAboveShoulders = nose.y < Math.min(leftShoulder.y, rightShoulder.y)
    
    // Check if shoulders are above hips
    const shouldersAboveHips = Math.min(leftShoulder.y, rightShoulder.y) < Math.min(leftHip.y, rightHip.y)
    
    return headAboveShoulders && shouldersAboveHips ? 0.8 : 0.3
  }, [])

  // Start pose detection from video stream
  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!poseRef.current || !isInitialized || isProcessing) return
    
    try {
      setIsProcessing(true)
      console.log("Starting pose detection...")
      
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (poseRef.current && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            await poseRef.current.send({ image: videoElement })
          }
        },
        width: 1280,
        height: 720
      })
      
      cameraRef.current = camera
      await camera.start()
      console.log("Pose detection started successfully")
      
    } catch (error) {
      console.error("Failed to start pose detection:", error)
      setIsProcessing(false)
    }
  }, [isInitialized, isProcessing])

  // Stop pose detection
  const stopDetection = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }
    setIsProcessing(false)
    console.log("Pose detection stopped")
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializePose()
    
    return () => {
      stopDetection()
      if (poseRef.current) {
        poseRef.current.close()
      }
    }
  }, [initializePose, stopDetection])

  return {
    isInitialized,
    isProcessing,
    startDetection,
    stopDetection
  }
}
