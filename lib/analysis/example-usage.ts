// Example usage of the complete biomechanical analysis system
import {
  comparePoses,
  extractMovementFeatures,
  segmentPhases,
  calculateMovementQuality,
  computeAngles,
  type ComparisonResult,
  type BiomechanicalMetrics
} from './index'
import { getForehandTemplate, validateAgainstTemplate } from '../pro-templates/forehand'

// Example: Complete analysis of a tennis forehand
export async function analyzeTennisForehand(
  poseData: { t: number; pose: any }[]
): Promise<{
  analysis: ComparisonResult
  biomechanics: BiomechanicalMetrics
  recommendations: string[]
  phaseBreakdown: any
}> {
  
  // 1. Extract movement features from pose data
  const features = extractMovementFeatures(poseData, 1/30) // 30 FPS
  
  // 2. Segment the movement into phases
  const phases = segmentPhases(features)
  
  // 3. Get professional template for comparison
  const proTemplate = getForehandTemplate()
  
  // 4. Compare student movement with professional template
  const analysis = comparePoses(poseData, [], {
    weights: {
      'handY': 1.2,
      'torsoRot': 1.5,
      'shoulderRotation': 1.4,
      'hipRotation': 1.3
    },
    enableBiomechanicalAnalysis: true,
    enablePhaseAnalysis: true
  })
  
  // 5. Calculate overall biomechanical metrics
  const biomechanics = calculateMovementQuality(poseData)
  
  // 6. Validate against template
  const lastPose = poseData[poseData.length - 1]?.pose
  const validation = lastPose ? validateAgainstTemplate(lastPose, proTemplate) : null
  
  // 7. Generate phase-by-phase breakdown
  const phaseBreakdown = phases.map(phase => {
    const phaseFeatures = features.slice(phase.start, phase.end + 1)
    const phaseMetrics = calculateMovementQuality(
      poseData.slice(phase.start, phase.end + 1)
    )
    
    return {
      phase: phase.phase,
      duration: (phase.end - phase.start + 1) / 30, // seconds
      confidence: phase.confidence,
      keyEvents: phase.keyEvents.map(e => e.description),
      metrics: phaseMetrics,
      score: analysis.phaseScores[phase.phase]?.score || 0
    }
  })
  
  // 8. Compile recommendations
  const recommendations = [
    ...analysis.recommendations,
    ...(validation?.feedback || [])
  ]
  
  return {
    analysis,
    biomechanics,
    recommendations: recommendations.slice(0, 8), // Top 8 recommendations
    phaseBreakdown
  }
}

// Example: Real-time analysis during movement
export function createRealTimeAnalyzer() {
  let poseBuffer: { t: number; pose: any }[] = []
  const BUFFER_SIZE = 90 // 3 seconds at 30 FPS
  
  return {
    // Add new pose data
    addPose(timestamp: number, pose: any) {
      poseBuffer.push({ t: timestamp, pose })
      
      // Keep only recent poses
      if (poseBuffer.length > BUFFER_SIZE) {
        poseBuffer.shift()
      }
    },
    
    // Get current analysis
    getCurrentAnalysis() {
      if (poseBuffer.length < 10) return null
      
      const features = extractMovementFeatures(poseBuffer, 1/30)
      const phases = segmentPhases(features)
      const biomechanics = calculateMovementQuality(poseBuffer)
      
      return {
        currentPhase: phases.find(p => p.confidence > 0.7)?.phase || 'unknown',
        phases,
        biomechanics,
        poseCount: poseBuffer.length,
        duration: poseBuffer.length / 30
      }
    },
    
    // Get immediate feedback
    getImmediateFeedback() {
      if (poseBuffer.length < 5) return []
      
      const lastPose = poseBuffer[poseBuffer.length - 1].pose
      const angles = computeAngles(lastPose)
      const feedback: string[] = []
      
      // Check immediate biomechanical issues
      if (angles.x_factor < 15) {
        feedback.push("Increase X-factor: Rotate shoulders more relative to hips")
      }
      
      if (angles.knee_stability < 0.6) {
        feedback.push("Bend knees more for stability")
      }
      
      if (angles.shoulder_rotation < 60) {
        feedback.push("Rotate shoulders more during preparation")
      }
      
      return feedback
    },
    
    // Clear buffer
    clear() {
      poseBuffer = []
    }
  }
}

// Example: Performance tracking over time
export function createPerformanceTracker() {
  const sessions: Array<{
    date: string
    duration: number
    overallScore: number
    phaseScores: Record<string, number>
    biomechanics: BiomechanicalMetrics
  }> = []
  
  return {
    // Record a training session
    recordSession(analysis: ComparisonResult, duration: number) {
      sessions.push({
        date: new Date().toISOString(),
        duration,
        overallScore: analysis.overallScore,
        phaseScores: Object.fromEntries(
          Object.entries(analysis.phaseScores).map(([phase, data]) => [
            phase,
            data.score
          ])
        ),
        biomechanics: analysis.biomechanicalMetrics
      })
    },
    
    // Get progress over time
    getProgress() {
      if (sessions.length < 2) return null
      
      const sortedSessions = sessions.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      const firstSession = sortedSessions[0]
      const lastSession = sortedSessions[sortedSessions.length - 1]
      
      return {
        totalSessions: sessions.length,
        totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
        overallImprovement: lastSession.overallScore - firstSession.overallScore,
        phaseImprovements: Object.keys(firstSession.phaseScores).map(phase => ({
          phase,
          improvement: lastSession.phaseScores[phase] - firstSession.phaseScores[phase]
        })),
        biomechanicalImprovements: {
          stability: lastSession.biomechanics.stability - firstSession.biomechanics.stability,
          symmetry: lastSession.biomechanics.symmetry - firstSession.biomechanics.symmetry,
          fluidity: lastSession.biomechanics.fluidity - firstSession.biomechanics.fluidity,
          balance: lastSession.biomechanics.balance - firstSession.biomechanics.balance
        }
      }
    },
    
    // Get session history
    getSessionHistory() {
      return sessions
    }
  }
}

// Example: Custom analysis configuration
export function createCustomAnalyzer(options: {
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  focusAreas: string[]
  customWeights?: Record<string, number>
}) {
  const template = getForehandTemplate() // You can modify this based on skill level
  
  const defaultWeights = {
    'handY': 1.0,
    'handDist': 1.0,
    'torsoRot': 1.0,
    'handSpeed': 1.0,
    'shoulderRotation': 1.0,
    'hipRotation': 1.0,
    'kneeStability': 1.0,
    'elbowAngle': 1.0,
    'wristPosition': 1.0
  }
  
  const weights = { ...defaultWeights, ...options.customWeights }
  
  // Adjust weights based on focus areas
  options.focusAreas.forEach(area => {
    if (weights[area as keyof typeof weights]) {
      weights[area as keyof typeof weights] *= 1.5
    }
  })
  
  return {
    analyze(poseData: { t: number; pose: any }[]) {
      return comparePoses(poseData, [], {
        weights,
        enableBiomechanicalAnalysis: true,
        enablePhaseAnalysis: true,
        minConfidence: 0.6
      })
    },
    
    getFocusAreas() {
      return options.focusAreas
    },
    
    getWeights() {
      return weights
    }
  }
}

// Example: Export analysis results
export function exportAnalysisResults(
  analysis: ComparisonResult,
  biomechanics: BiomechanicalMetrics,
  phaseBreakdown: any[]
) {
  const results = {
    timestamp: new Date().toISOString(),
    overallScore: analysis.overallScore,
    similarity: analysis.similarity,
    phaseShift: analysis.phaseShift,
    biomechanicalMetrics: biomechanics,
    phaseAnalysis: phaseBreakdown,
    recommendations: analysis.recommendations,
    summary: {
      excellent: Object.values(analysis.phaseScores).filter(p => p.score >= 0.8).length,
      good: Object.values(analysis.phaseScores).filter(p => p.score >= 0.6 && p.score < 0.8).length,
      needsImprovement: Object.values(analysis.phaseScores).filter(p => p.score < 0.6).length
    }
  }
  
  return {
    json: JSON.stringify(results, null, 2),
    csv: convertToCSV(results),
    summary: generateSummary(results)
  }
}

// Helper function to convert results to CSV
function convertToCSV(results: any): string {
  const headers = ['Metric', 'Value', 'Unit']
  const rows = [
    ['Overall Score', results.overallScore.toFixed(3), '0-1'],
    ['Similarity', results.similarity.toFixed(3), '0-1'],
    ['Stability', results.biomechanicalMetrics.stability.toFixed(3), '0-1'],
    ['Symmetry', results.biomechanicalMetrics.symmetry.toFixed(3), '0-1'],
    ['Fluidity', results.biomechanicalMetrics.fluidity.toFixed(3), '0-1'],
    ['Balance', results.biomechanicalMetrics.balance.toFixed(3), '0-1'],
    ['X-Factor', results.biomechanicalMetrics.xFactor.toFixed(1), 'degrees'],
    ['Shoulder Rotation', results.biomechanicalMetrics.shoulderRotation.toFixed(1), 'degrees']
  ]
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Helper function to generate human-readable summary
function generateSummary(results: any): string {
  const score = results.overallScore
  let grade = 'F'
  let description = 'Needs significant improvement'
  
  if (score >= 0.9) {
    grade = 'A+'
    description = 'Exceptional form'
  } else if (score >= 0.8) {
    grade = 'A'
    description = 'Excellent form'
  } else if (score >= 0.7) {
    grade = 'B'
    description = 'Good form with room for improvement'
  } else if (score >= 0.6) {
    grade = 'C'
    description = 'Average form, needs work'
  } else if (score >= 0.5) {
    grade = 'D'
    description = 'Below average, requires significant practice'
  }
  
  return `
Analysis Summary
================
Grade: ${grade} (${(score * 100).toFixed(1)}%)
Overall Assessment: ${description}

Phase Performance:
- Excellent: ${results.summary.excellent} phases
- Good: ${results.summary.good} phases  
- Needs Improvement: ${results.summary.needsImprovement} phases

Top Recommendations:
${results.recommendations.slice(0, 3).map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
  `.trim()
}
