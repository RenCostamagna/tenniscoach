"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, TrendingUp, AlertTriangle, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Pose Analysis
            <span className="text-blue-600"> Studio</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced AI-powered posture analysis using MediaPipe technology. Get real-time feedback on your posture,
            detect deviations, and track your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Analysis
                <Camera className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Camera className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">Real-time Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>30-60 FPS pose detection using advanced MediaPipe technology</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-lg">Live Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Track confidence, stability, symmetry, and posture quality in real-time</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <AlertTriangle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <CardTitle className="text-lg">Deviation Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Automatic detection of posture issues with severity classification</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-lg">Phase Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Organize analysis sessions into phases with timeline tracking</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Technical Specs */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">Performance</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>30-60 FPS processing</li>
                  <li>60-frame ring buffer</li>
                  <li>Web Worker optimization</li>
                  <li>Real-time analysis</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Detection</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>33 pose landmarks</li>
                  <li>MediaPipe Pose Tasks</li>
                  <li>Visibility scoring</li>
                  <li>3D coordinate tracking</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>Posture assessment</li>
                  <li>Symmetry analysis</li>
                  <li>Stability tracking</li>
                  <li>Deviation classification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Analyze Your Posture?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Start your pose analysis session now. Make sure you have good lighting and position yourself fully in frame
            for the best results.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="text-lg px-12 py-4">
              Launch Analysis Studio
              <Camera className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
