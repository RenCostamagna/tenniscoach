"use client"

import { CameraPanel } from "@/components/camera-panel"
import { PhaseTimeline } from "@/components/phase-timeline"
import { MetricsPanel } from "@/components/metrics-panel"
import { DeviationsList } from "@/components/deviations-list"
import { PoseVisualizer } from "@/components/pose-visualizer"
import { BiomechanicalMetrics } from "@/components/biomechanical-metrics"
import { RecommendationsPanel } from "@/components/recommendations-panel"
import { AnalysisControls } from "@/components/analysis-controls"
import { usePoseAnalysis } from "@/hooks/use-pose-analysis"

export default function AnalyzePage() {
  // Initialize pose analysis
  const { isAnalyzing } = usePoseAnalysis()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Pose Analysis Studio</h1>
          <p className="text-gray-600">Real-time biomechanical analysis using AI-powered pose detection</p>
          {isAnalyzing && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Analysis Active
            </div>
          )}
        </div>

        {/* Analysis Controls */}
        <AnalysisControls />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Camera and Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Panel */}
            <CameraPanel />

            {/* Pose Visualizer */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Pose Skeleton
              </h3>
              <div className="flex justify-center">
                <PoseVisualizer width={500} height={375} showConnections={true} />
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Panels */}
          <div className="space-y-6">
            {/* Metrics Panel */}
            <MetricsPanel />

            {/* Phase Timeline */}
            <PhaseTimeline />
          </div>
        </div>

        {/* Biomechanical Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BiomechanicalMetrics />
          <RecommendationsPanel />
        </div>

        {/* Bottom Section - Deviations */}
        <div className="grid grid-cols-1">
          <DeviationsList />
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 pt-6 border-t">
          <p>Powered by MediaPipe Pose Detection • Advanced Biomechanical Analysis • Processing at 30 FPS</p>
          <p className="mt-1">Ensure good lighting and position yourself fully in frame for best results</p>
        </div>
      </div>
    </div>
  )
}
