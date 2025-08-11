// analysis/compare.ts
import { computeAngles, calculateMovementQuality, calculateStability, calculateSymmetry } from "./biomechanics"
import { extractMovementFeatures, segmentPhases, type PhaseSegment } from "./segments"
import { dtwCost, calculateSimilarity, findBestAlignment, type DTWOptions } from "./dtw"

export interface ComparisonResult {
  overallScore: number
  phaseScores: Record<string, PhaseScore>
  biomechanicalMetrics: BiomechanicalMetrics
  recommendations: string[]
  similarity: number
  phaseShift: number
}

export interface PhaseScore {
  phase: string
  score: number
  confidence: number
  keyEvents: string[]
  biomechanicalScore: number
  timingScore: number
}

export interface BiomechanicalMetrics {
  stability: number
  symmetry: number
  fluidity: number
  balance: number
  xFactor: number
  shoulderRotation: number
  hipRotation: number
  kneeStability: number
  elbowAngle: number
  wristPosition: number
}

export interface ComparisonOptions {
  weights?: Record<string, number>
  dtwOptions?: DTWOptions
  minConfidence?: number
  enableBiomechanicalAnalysis?: boolean
  enablePhaseAnalysis?: boolean
}

// Función principal de comparación
export function comparePoses(
  studentPoses: { t: number; pose: any }[],
  proPoses: { t: number; pose: any }[],
  options: ComparisonOptions = {}
): ComparisonResult {
  const {
    weights = getDefaultWeights(),
    dtwOptions = {},
    minConfidence = 0.5,
    enableBiomechanicalAnalysis = true,
    enablePhaseAnalysis = true
  } = options

  if (studentPoses.length === 0 || proPoses.length === 0) {
    return createEmptyResult()
  }

  // Extraer características del movimiento
  const studentFeatures = extractMovementFeatures(studentPoses)
  const proFeatures = extractMovementFeatures(proPoses)

  // Análisis biomecánico general
  const biomechanicalMetrics = enableBiomechanicalAnalysis ? 
    analyzeBiomechanics(studentPoses) : createEmptyBiomechanicalMetrics()

  // Análisis por fases
  const phaseScores = enablePhaseAnalysis ? 
    analyzePhases(studentFeatures, proFeatures, weights, dtwOptions) : {}

  // Comparación general usando DTW
  const { similarity, phaseShift } = findBestAlignment(
    studentFeatures.map(f => [
      f.handY, f.handDist, f.torsoRot, f.handSpeed, f.shoulderRotation, f.hipRotation
    ]),
    proFeatures.map(f => [
      f.handY, f.handDist, f.torsoRot, f.handSpeed, f.shoulderRotation, f.hipRotation
    ]),
    dtwOptions
  )

  // Calcular puntuación general
  const overallScore = calculateOverallScore(phaseScores, biomechanicalMetrics, similarity)

  // Generar recomendaciones
  const recommendations = generateRecommendations(phaseScores, biomechanicalMetrics, similarity)

  return {
    overallScore,
    phaseScores,
    biomechanicalMetrics,
    recommendations,
    similarity,
    phaseShift
  }
}

// Análisis biomecánico detallado
function analyzeBiomechanics(poses: { t: number; pose: any }[]): BiomechanicalMetrics {
  if (poses.length === 0) return createEmptyBiomechanicalMetrics()

  // Calcular métricas de calidad de movimiento
  const movementQuality = calculateMovementQuality(poses)
  
  // Calcular ángulos del último frame (más estable)
  const lastPose = poses[poses.length - 1].pose
  const angles = computeAngles(lastPose)

  // Calcular estabilidad y simetría promedio
  const stability = calculateStability(poses, 'right_wrist')
  const symmetry = calculateSymmetry(lastPose)

  return {
    stability,
    symmetry,
    fluidity: movementQuality.fluidity,
    balance: movementQuality.balance,
    xFactor: angles.x_factor,
    shoulderRotation: angles.shoulder_rotation,
    hipRotation: angles.hip_rotation,
    kneeStability: angles.knee_stability,
    elbowAngle: angles.elbow,
    wristPosition: angles.hand_height
  }
}

// Análisis por fases del movimiento
function analyzePhases(
  studentFeatures: any[],
  proFeatures: any[],
  weights: Record<string, number>,
  dtwOptions: DTWOptions
): Record<string, PhaseScore> {
  if (studentFeatures.length === 0 || proFeatures.length === 0) return {}

  // Segmentar fases del estudiante
  const studentPhases = segmentPhases(studentFeatures)
  const phaseScores: Record<string, PhaseScore> = {}

  for (const phase of studentPhases) {
    if (phase.confidence < 0.5) continue

    // Extraer características de la fase
    const phaseFeatures = studentFeatures.slice(phase.start, phase.end + 1)
    
    // Comparar con la fase correspondiente del profesional
    const phaseScore = analyzePhase(
      phase,
      phaseFeatures,
      proFeatures,
      weights,
      dtwOptions
    )

    phaseScores[phase.phase] = phaseScore
  }

  return phaseScores
}

// Análisis de una fase específica
function analyzePhase(
  phase: PhaseSegment,
  phaseFeatures: any[],
  proFeatures: any[],
  weights: Record<string, number>,
  dtwOptions: DTWOptions
): PhaseScore {
  // Encontrar la fase correspondiente en el template profesional
  const proPhaseFeatures = findProPhaseFeatures(phase.phase, proFeatures)
  
  if (proPhaseFeatures.length === 0) {
    return {
      phase: phase.phase,
      score: 0,
      confidence: phase.confidence,
      keyEvents: [],
      biomechanicalScore: 0,
      timingScore: 0
    }
  }

  // Comparar características biomecánicas
  const biomechanicalScore = compareBiomechanicalFeatures(phaseFeatures, proPhaseFeatures)
  
  // Comparar timing y secuencia
  const timingScore = compareTiming(phaseFeatures, proPhaseFeatures, dtwOptions)
  
  // Puntuación combinada
  const score = (biomechanicalScore * 0.6) + (timingScore * 0.4)
  
  // Eventos clave de la fase
  const keyEvents = phase.keyEvents.map(e => e.description)

  return {
    phase: phase.phase,
    score,
    confidence: phase.confidence,
    keyEvents,
    biomechanicalScore,
    timingScore
  }
}

// Encontrar características de la fase correspondiente en el template profesional
function findProPhaseFeatures(phaseName: string, proFeatures: any[]): any[] {
  // Por ahora, usar una ventana temporal aproximada
  // En una implementación real, esto vendría del template profesional
  const phaseLengths: Record<string, number> = {
    'early-prep': 0.25,
    'late-prep': 0.35,
    'accel': 0.15,
    'impact': 0.05,
    'early-follow': 0.15,
    'finish': 0.05
  }
  
  const phaseLength = phaseLengths[phaseName] || 0.2
  const startIdx = Math.floor(phaseName === 'early-prep' ? 0 : 
    phaseName === 'late-prep' ? 0.25 * proFeatures.length :
    phaseName === 'accel' ? 0.6 * proFeatures.length :
    phaseName === 'impact' ? 0.75 * proFeatures.length :
    phaseName === 'early-follow' ? 0.8 * proFeatures.length : 0.9 * proFeatures.length)
  
  const endIdx = Math.min(
    proFeatures.length - 1,
    startIdx + Math.floor(phaseLength * proFeatures.length)
  )
  
  return proFeatures.slice(startIdx, endIdx + 1)
}

// Comparar características biomecánicas
function compareBiomechanicalFeatures(studentFeatures: any[], proFeatures: any[]): number {
  if (studentFeatures.length === 0 || proFeatures.length === 0) return 0

  // Calcular métricas promedio para cada conjunto de características
  const studentAvg = calculateFeatureAverages(studentFeatures)
  const proAvg = calculateFeatureAverages(proFeatures)
  
  // Comparar cada métrica
  const metrics = ['handY', 'handDist', 'torsoRot', 'shoulderRotation', 'hipRotation', 'kneeStability']
  let totalScore = 0
  let validMetrics = 0
  
  for (const metric of metrics) {
    if (studentAvg[metric] !== undefined && proAvg[metric] !== undefined) {
      const diff = Math.abs(studentAvg[metric] - proAvg[metric])
      const maxValue = Math.max(Math.abs(proAvg[metric]), 1)
      const score = Math.max(0, 1 - (diff / maxValue))
      totalScore += score
      validMetrics++
    }
  }
  
  return validMetrics > 0 ? totalScore / validMetrics : 0
}

// Comparar timing y secuencia
function compareTiming(
  studentFeatures: any[],
  proFeatures: any[],
  dtwOptions: DTWOptions
): number {
  if (studentFeatures.length === 0 || proFeatures.length === 0) return 0

  // Convertir a formato de series para DTW
  const studentSeries = studentFeatures.map(f => [
    f.handY, f.handDist, f.torsoRot, f.handSpeed
  ])
  
  const proSeries = proFeatures.map(f => [
    f.handY, f.handDist, f.torsoRot, f.handSpeed
  ])

  // Calcular similitud usando DTW
  const similarity = calculateSimilarity(studentSeries, proSeries, dtwOptions)
  
  return similarity
}

// Calcular promedios de características
function calculateFeatureAverages(features: any[]): Record<string, number> {
  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  
  for (const feature of features) {
    for (const [key, value] of Object.entries(feature)) {
      if (typeof value === 'number' && !isNaN(value)) {
        sums[key] = (sums[key] || 0) + value
        counts[key] = (counts[key] || 0) + 1
      }
    }
  }
  
  const averages: Record<string, number> = {}
  for (const [key, sum] of Object.entries(sums)) {
    averages[key] = sum / counts[key]
  }
  
  return averages
}

// Calcular puntuación general
function calculateOverallScore(
  phaseScores: Record<string, PhaseScore>,
  biomechanicalMetrics: BiomechanicalMetrics,
  similarity: number
): number {
  let totalScore = 0
  let totalWeight = 0
  
  // Peso de las fases (60%)
  const phaseWeight = 0.6
  if (Object.keys(phaseScores).length > 0) {
    const avgPhaseScore = Object.values(phaseScores)
      .reduce((sum, phase) => sum + phase.score, 0) / Object.values(phaseScores).length
    totalScore += avgPhaseScore * phaseWeight
    totalWeight += phaseWeight
  }
  
  // Peso de las métricas biomecánicas (30%)
  const biomechWeight = 0.3
  const biomechScore = (
    biomechanicalMetrics.stability +
    biomechanicalMetrics.symmetry +
    biomechanicalMetrics.fluidity +
    biomechanicalMetrics.balance
  ) / 4
  totalScore += biomechScore * biomechWeight
  totalWeight += biomechWeight
  
  // Peso de la similitud general (10%)
  const similarityWeight = 0.1
  totalScore += similarity * similarityWeight
  totalWeight += similarityWeight
  
  return totalWeight > 0 ? totalScore / totalWeight : 0
}

// Generar recomendaciones
function generateRecommendations(
  phaseScores: Record<string, PhaseScore>,
  biomechanicalMetrics: BiomechanicalMetrics,
  similarity: number
): string[] {
  const recommendations: string[] = []
  
  // Recomendaciones basadas en fases
  for (const [phaseName, phaseScore] of Object.entries(phaseScores)) {
    if (phaseScore.score < 0.7) {
      recommendations.push(`Improve ${phaseName} phase: Focus on biomechanical form and timing`)
    }
  }
  
  // Recomendaciones biomecánicas
  if (biomechanicalMetrics.stability < 0.6) {
    recommendations.push("Improve movement stability: Reduce unnecessary motion and maintain consistent form")
  }
  
  if (biomechanicalMetrics.symmetry < 0.6) {
    recommendations.push("Work on bilateral symmetry: Ensure both sides of your body move equally")
  }
  
  if (biomechanicalMetrics.balance < 0.6) {
    recommendations.push("Improve balance: Focus on maintaining center of mass over your base of support")
  }
  
  if (biomechanicalMetrics.xFactor < 15) {
    recommendations.push("Increase X-factor: Generate more separation between shoulder and hip rotation")
  }
  
  if (biomechanicalMetrics.kneeStability < 0.6) {
    recommendations.push("Improve knee stability: Maintain slight knee flexion throughout the movement")
  }
  
  // Recomendaciones generales
  if (similarity < 0.6) {
    recommendations.push("Overall form needs improvement: Focus on matching the professional template more closely")
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Excellent form! Keep practicing to maintain consistency")
  }
  
  return recommendations.slice(0, 5) // Limitar a 5 recomendaciones
}

// Pesos por defecto para diferentes características
function getDefaultWeights(): Record<string, number> {
  return {
    'handY': 1.2,        // Posición de la mano (muy importante)
    'handDist': 1.0,     // Distancia al tronco
    'torsoRot': 1.5,     // Rotación del torso (crítico)
    'handSpeed': 1.3,    // Velocidad de la mano
    'shoulderRotation': 1.4, // Rotación del hombro
    'hipRotation': 1.3,  // Rotación de cadera
    'kneeStability': 1.1, // Estabilidad de rodilla
    'elbow': 1.0,        // Ángulo del codo
    'wrist': 0.8         // Posición de muñeca
  }
}

// Crear resultado vacío
function createEmptyResult(): ComparisonResult {
  return {
    overallScore: 0,
    phaseScores: {},
    biomechanicalMetrics: createEmptyBiomechanicalMetrics(),
    recommendations: ["No data available for analysis"],
    similarity: 0,
    phaseShift: 0
  }
}

// Crear métricas biomecánicas vacías
function createEmptyBiomechanicalMetrics(): BiomechanicalMetrics {
  return {
    stability: 0,
    symmetry: 0,
    fluidity: 0,
    balance: 0,
    xFactor: 0,
    shoulderRotation: 0,
    hipRotation: 0,
    kneeStability: 0,
    elbowAngle: 0,
    wristPosition: 0
  }
}
