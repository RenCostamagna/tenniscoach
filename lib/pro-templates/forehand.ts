import type { Series } from "../analysis"

export interface TemplateByPhase {
  [phase: string]: {
    handY: Series
    handDist: Series
    torsoRot: Series
    handSpeed: Series
    shoulderRotation: Series
    hipRotation: Series
    kneeStability: Series
    elbowAngle: Series
    wristPosition: Series
  }
}

export interface ProTemplate {
  name: string
  description: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  phases: TemplateByPhase
  biomechanicalTargets: BiomechanicalTargets
  timing: TimingTargets
}

export interface BiomechanicalTargets {
  xFactor: { min: number; optimal: number; max: number }
  shoulderRotation: { min: number; optimal: number; max: number }
  hipRotation: { min: number; optimal: number; max: number }
  kneeStability: { min: number; optimal: number; max: number }
  elbowAngle: { min: number; optimal: number; max: number }
  wristPosition: { min: number; optimal: number; max: number }
}

export interface TimingTargets {
  earlyPrepDuration: { min: number; optimal: number; max: number }
  latePrepDuration: { min: number; optimal: number; max: number }
  accelerationDuration: { min: number; optimal: number; max: number }
  impactDuration: { min: number; optimal: number; max: number }
  followThroughDuration: { min: number; optimal: number; max: number }
}

// Template profesional para forehand
export function getForehandTemplate(): ProTemplate {
  return {
    name: "Professional Forehand",
    description: "Optimal biomechanical form for professional tennis forehand",
    skillLevel: "professional",
    phases: generateForehandPhases(),
    biomechanicalTargets: getBiomechanicalTargets(),
    timing: getTimingTargets()
  }
}

// Generar características de cada fase del forehand
function generateForehandPhases(): TemplateByPhase {
  const phases: TemplateByPhase = {}
  
  // Early Preparation (0-25% del swing)
  phases["early-prep"] = {
    handY: generateSmoothCurve(30, 0.3, 0.4, 'ascending'),
    handDist: generateSmoothCurve(30, 0.8, 0.9, 'stable'),
    torsoRot: generateSmoothCurve(30, 0.1, 0.2, 'ascending'),
    handSpeed: generateSmoothCurve(30, 0.1, 0.2, 'ascending'),
    shoulderRotation: generateSmoothCurve(30, 0.1, 0.3, 'ascending'),
    hipRotation: generateSmoothCurve(30, 0.05, 0.15, 'ascending'),
    kneeStability: generateSmoothCurve(30, 0.8, 0.9, 'stable'),
    elbowAngle: generateSmoothCurve(30, 0.7, 0.8, 'stable'),
    wristPosition: generateSmoothCurve(30, 0.6, 0.7, 'stable')
  }
  
  // Late Preparation (25-60% del swing)
  phases["late-prep"] = {
    handY: generateSmoothCurve(35, 0.4, 0.6, 'ascending'),
    handDist: generateSmoothCurve(35, 0.9, 1.0, 'ascending'),
    torsoRot: generateSmoothCurve(35, 0.2, 0.5, 'ascending'),
    handSpeed: generateSmoothCurve(35, 0.2, 0.4, 'ascending'),
    shoulderRotation: generateSmoothCurve(35, 0.3, 0.6, 'ascending'),
    hipRotation: generateSmoothCurve(35, 0.15, 0.4, 'ascending'),
    kneeStability: generateSmoothCurve(35, 0.8, 0.9, 'stable'),
    elbowAngle: generateSmoothCurve(35, 0.8, 0.9, 'ascending'),
    wristPosition: generateSmoothCurve(35, 0.7, 0.8, 'stable')
  }
  
  // Acceleration (60-75% del swing)
  phases["accel"] = {
    handY: generateSmoothCurve(15, 0.6, 0.8, 'ascending'),
    handDist: generateSmoothCurve(15, 1.0, 0.7, 'descending'),
    torsoRot: generateSmoothCurve(15, 0.5, 0.8, 'ascending'),
    handSpeed: generateSmoothCurve(15, 0.4, 0.9, 'ascending'),
    shoulderRotation: generateSmoothCurve(15, 0.6, 0.9, 'ascending'),
    hipRotation: generateSmoothCurve(15, 0.4, 0.7, 'ascending'),
    kneeStability: generateSmoothCurve(15, 0.9, 0.95, 'stable'),
    elbowAngle: generateSmoothCurve(15, 0.9, 0.95, 'ascending'),
    wristPosition: generateSmoothCurve(15, 0.8, 0.9, 'ascending')
  }
  
  // Impact (75% del swing - momento exacto)
  phases["impact"] = {
    handY: generateSmoothCurve(5, 0.8, 0.85, 'peak'),
    handDist: generateSmoothCurve(5, 0.7, 0.6, 'descending'),
    torsoRot: generateSmoothCurve(5, 0.8, 0.85, 'peak'),
    handSpeed: generateSmoothCurve(5, 0.9, 1.0, 'peak'),
    shoulderRotation: generateSmoothCurve(5, 0.9, 0.95, 'peak'),
    hipRotation: generateSmoothCurve(5, 0.7, 0.8, 'peak'),
    kneeStability: generateSmoothCurve(5, 0.95, 1.0, 'peak'),
    elbowAngle: generateSmoothCurve(5, 0.95, 1.0, 'peak'),
    wristPosition: generateSmoothCurve(5, 0.9, 0.95, 'peak')
  }
  
  // Early Follow-through (75-90% del swing)
  phases["early-follow"] = {
    handY: generateSmoothCurve(15, 0.85, 0.7, 'descending'),
    handDist: generateSmoothCurve(15, 0.6, 0.8, 'ascending'),
    torsoRot: generateSmoothCurve(15, 0.85, 0.6, 'descending'),
    handSpeed: generateSmoothCurve(15, 1.0, 0.6, 'descending'),
    shoulderRotation: generateSmoothCurve(15, 0.95, 0.7, 'descending'),
    hipRotation: generateSmoothCurve(15, 0.8, 0.5, 'descending'),
    kneeStability: generateSmoothCurve(15, 1.0, 0.9, 'stable'),
    elbowAngle: generateSmoothCurve(15, 1.0, 0.8, 'descending'),
    wristPosition: generateSmoothCurve(15, 0.95, 0.8, 'descending')
  }
  
  // Finish (90-100% del swing)
  phases["finish"] = {
    handY: generateSmoothCurve(10, 0.7, 0.5, 'descending'),
    handDist: generateSmoothCurve(10, 0.8, 0.9, 'ascending'),
    torsoRot: generateSmoothCurve(10, 0.6, 0.3, 'descending'),
    handSpeed: generateSmoothCurve(10, 0.6, 0.2, 'descending'),
    shoulderRotation: generateSmoothCurve(10, 0.7, 0.4, 'descending'),
    hipRotation: generateSmoothCurve(10, 0.5, 0.2, 'descending'),
    kneeStability: generateSmoothCurve(10, 0.9, 0.85, 'stable'),
    elbowAngle: generateSmoothCurve(10, 0.8, 0.7, 'descending'),
    wristPosition: generateSmoothCurve(10, 0.8, 0.6, 'descending')
  }
  
  return phases
}

// Generar curvas suaves para las características
function generateSmoothCurve(
  length: number,
  startValue: number,
  endValue: number,
  pattern: 'ascending' | 'descending' | 'peak' | 'stable'
): number[] {
  const curve = new Array(length).fill(0)
  
  switch (pattern) {
    case 'ascending':
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1)
        curve[i] = startValue + (endValue - startValue) * smoothStep(t)
      }
      break
      
    case 'descending':
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1)
        curve[i] = startValue + (endValue - startValue) * smoothStep(1 - t)
      }
      break
      
    case 'peak':
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1)
        const peak = Math.sin(t * Math.PI)
        curve[i] = startValue + (endValue - startValue) * peak
      }
      break
      
    case 'stable':
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1)
        const noise = (Math.random() - 0.5) * 0.05
        curve[i] = startValue + noise
      }
      break
  }
  
  return curve
}

// Función de suavizado para transiciones naturales
function smoothStep(t: number): number {
  return t * t * (3 - 2 * t)
}

// Obtener objetivos biomecánicos específicos
function getBiomechanicalTargets(): BiomechanicalTargets {
  return {
    xFactor: { min: 15, optimal: 25, max: 35 }, // grados
    shoulderRotation: { min: 60, optimal: 80, max: 100 }, // grados
    hipRotation: { min: 40, optimal: 60, max: 80 }, // grados
    kneeStability: { min: 0.7, optimal: 0.9, max: 1.0 }, // 0-1
    elbowAngle: { min: 80, optimal: 100, max: 120 }, // grados
    wristPosition: { min: 0.6, optimal: 0.8, max: 1.0 } // 0-1
  }
}

// Obtener objetivos de timing
function getTimingTargets(): TimingTargets {
  return {
    earlyPrepDuration: { min: 0.2, optimal: 0.25, max: 0.3 }, // segundos
    latePrepDuration: { min: 0.3, optimal: 0.35, max: 0.4 }, // segundos
    accelerationDuration: { min: 0.1, optimal: 0.15, max: 0.2 }, // segundos
    impactDuration: { min: 0.02, optimal: 0.05, max: 0.08 }, // segundos
    followThroughDuration: { min: 0.2, optimal: 0.25, max: 0.3 } // segundos
  }
}

// Template para nivel intermedio
export function getIntermediateForehandTemplate(): ProTemplate {
  const proTemplate = getForehandTemplate()
  
  return {
    ...proTemplate,
    name: "Intermediate Forehand",
    description: "Modified form suitable for intermediate players",
    skillLevel: "intermediate",
    biomechanicalTargets: {
      ...proTemplate.biomechanicalTargets,
      xFactor: { min: 10, optimal: 20, max: 30 },
      shoulderRotation: { min: 50, optimal: 70, max: 90 },
      hipRotation: { min: 30, optimal: 50, max: 70 }
    }
  }
}

// Template para nivel principiante
export function getBeginnerForehandTemplate(): ProTemplate {
  const proTemplate = getForehandTemplate()
  
  return {
    ...proTemplate,
    name: "Beginner Forehand",
    description: "Simplified form for beginners focusing on fundamentals",
    skillLevel: "beginner",
    biomechanicalTargets: {
      ...proTemplate.biomechanicalTargets,
      xFactor: { min: 5, optimal: 15, max: 25 },
      shoulderRotation: { min: 40, optimal: 60, max: 80 },
      hipRotation: { min: 20, optimal: 40, max: 60 },
      kneeStability: { min: 0.6, optimal: 0.8, max: 0.9 }
    }
  }
}

// Función para obtener template según nivel de habilidad
export function getTemplateBySkillLevel(skillLevel: string): ProTemplate {
  switch (skillLevel.toLowerCase()) {
    case 'beginner':
      return getBeginnerForehandTemplate()
    case 'intermediate':
      return getIntermediateForehandTemplate()
    case 'advanced':
    case 'professional':
    default:
      return getForehandTemplate()
  }
}

// Función para validar si un movimiento cumple con los objetivos del template
export function validateAgainstTemplate(
  movement: any,
  template: ProTemplate
): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let totalScore = 0
  let validMetrics = 0
  
  // Validar objetivos biomecánicos
  for (const [metric, target] of Object.entries(template.biomechanicalTargets)) {
    const value = movement[metric]
    if (value !== undefined) {
      if (value >= target.min && value <= target.max) {
        const optimalDistance = Math.abs(value - target.optimal)
        const range = target.max - target.min
        const score = Math.max(0, 1 - (optimalDistance / (range * 0.5)))
        totalScore += score
        validMetrics++
        
        if (score < 0.7) {
          feedback.push(`${metric} needs improvement: ${value} (target: ${target.optimal} ± ${(target.max - target.min) / 2})`)
        }
      } else {
        feedback.push(`${metric} out of range: ${value} (target: ${target.min}-${target.max})`)
      }
    }
  }
  
  const finalScore = validMetrics > 0 ? totalScore / validMetrics : 0
  const isValid = finalScore >= 0.7
  
  if (feedback.length === 0) {
    feedback.push("Excellent form! All biomechanical targets met.")
  }
  
  return {
    isValid,
    score: finalScore,
    feedback
  }
}
