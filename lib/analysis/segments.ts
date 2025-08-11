// analysis/segments.ts
export type Phase = "early-prep" | "late-prep" | "accel" | "impact" | "early-follow" | "finish"

export interface PhaseSegment {
  phase: Phase
  start: number
  end: number
  confidence: number
  keyEvents: KeyEvent[]
}

export interface KeyEvent {
  type: "peak_velocity" | "min_distance" | "max_rotation" | "contact" | "release"
  timestamp: number
  value: number
  description: string
}

export interface MovementFeatures {
  t: number
  handY: number
  handDist: number
  torsoRot: number
  handSpeed: number
  handAccel: number
  shoulderRotation: number
  hipRotation: number
  kneeStability: number
}

// Detectar eventos clave en el movimiento
export function detectKeyEvents(features: MovementFeatures[]): KeyEvent[] {
  if (features.length < 5) return []
  
  const events: KeyEvent[] = []
  
  // 1. Pico de velocidad de la mano
  let maxSpeed = -Infinity
  let maxSpeedIdx = 0
  for (let i = 1; i < features.length - 1; i++) {
    if (features[i].handSpeed > maxSpeed) {
      maxSpeed = features[i].handSpeed
      maxSpeedIdx = i
    }
  }
  
  if (maxSpeed > 0) {
    events.push({
      type: "peak_velocity",
      timestamp: features[maxSpeedIdx].t,
      value: maxSpeed,
      description: `Peak hand velocity: ${maxSpeed.toFixed(2)}`
    })
  }
  
  // 2. Distancia mínima al tronco (punto de impacto)
  let minDist = Infinity
  let minDistIdx = 0
  for (let i = 0; i < features.length; i++) {
    if (features[i].handDist < minDist) {
      minDist = features[i].handDist
      minDistIdx = i
    }
  }
  
  if (minDist < Infinity) {
    events.push({
      type: "min_distance",
      timestamp: features[minDistIdx].t,
      value: minDist,
      description: `Minimum hand-body distance: ${minDist.toFixed(2)}`
    })
  }
  
  // 3. Máxima rotación del torso
  let maxRotation = -Infinity
  let maxRotationIdx = 0
  for (let i = 0; i < features.length; i++) {
    if (Math.abs(features[i].torsoRot) > maxRotation) {
      maxRotation = Math.abs(features[i].torsoRot)
      maxRotationIdx = i
    }
  }
  
  if (maxRotation > 0) {
    events.push({
      type: "max_rotation",
      timestamp: features[maxRotationIdx].t,
      value: maxRotation,
      description: `Maximum torso rotation: ${maxRotation.toFixed(1)}°`
    })
  }
  
  // 4. Detectar contacto (cuando la velocidad cambia bruscamente)
  const accelerations = features.map(f => f.handAccel)
  let maxAccel = -Infinity
  let maxAccelIdx = 0
  for (let i = 1; i < accelerations.length - 1; i++) {
    if (Math.abs(accelerations[i]) > maxAccel) {
      maxAccel = Math.abs(accelerations[i])
      maxAccelIdx = i
    }
  }
  
  if (maxAccel > 0) {
    events.push({
      type: "contact",
      timestamp: features[maxAccelIdx].t,
      value: maxAccel,
      description: `Contact/impact detected: ${maxAccel.toFixed(2)}`
    })
  }
  
  // Ordenar eventos por timestamp
  return events.sort((a, b) => a.timestamp - b.timestamp)
}

// Segmentación mejorada de fases usando eventos clave
export function segmentPhases(features: MovementFeatures[]): PhaseSegment[] {
  if (features.length < 8) return []
  
  const events = detectKeyEvents(features)
  const phases: PhaseSegment[] = []
  const N = features.length
  
  // Si no hay eventos suficientes, usar segmentación por tiempo
  if (events.length < 2) {
    return segmentPhasesByTime(features)
  }
  
  // Encontrar el evento de impacto (contacto o pico de velocidad)
  const impactEvent = events.find(e => e.type === "contact" || e.type === "peak_velocity")
  if (!impactEvent) {
    return segmentPhasesByTime(features)
  }
  
  const impactIdx = features.findIndex(f => f.t >= impactEvent.timestamp)
  if (impactIdx === -1) {
    return segmentPhasesByTime(features)
  }
  
  // Segmentar basándose en el impacto
  const start = 0
  const end = N - 1
  
  // Preparación temprana (0% - 25% del tiempo hasta impacto)
  const earlyPrepEnd = Math.max(1, Math.floor(0.25 * impactIdx))
  phases.push({
    phase: "early-prep",
    start,
    end: earlyPrepEnd,
    confidence: 0.8,
    keyEvents: events.filter(e => e.timestamp <= features[earlyPrepEnd].t)
  })
  
  // Preparación tardía (25% - 60% del tiempo hasta impacto)
  const latePrepEnd = Math.max(earlyPrepEnd + 1, Math.floor(0.6 * impactIdx))
  phases.push({
    phase: "late-prep",
    start: earlyPrepEnd + 1,
    end: latePrepEnd,
    confidence: 0.9,
    keyEvents: events.filter(e => 
      e.timestamp > features[earlyPrepEnd].t && e.timestamp <= features[latePrepEnd].t
    )
  })
  
  // Aceleración (60% - impacto)
  phases.push({
    phase: "accel",
    start: latePrepEnd + 1,
    end: impactIdx,
    confidence: 0.95,
    keyEvents: events.filter(e => 
      e.timestamp > features[latePrepEnd].t && e.timestamp <= features[impactIdx].t
    )
  })
  
  // Impacto (momento exacto)
  phases.push({
    phase: "impact",
    start: impactIdx,
    end: impactIdx,
    confidence: 1.0,
    keyEvents: [impactEvent]
  })
  
  // Seguimiento temprano (impacto + 20% del tiempo restante)
  const followEnd = Math.min(
    N - 2,
    impactIdx + Math.floor(0.2 * (end - impactIdx))
  )
  phases.push({
    phase: "early-follow",
    start: impactIdx + 1,
    end: followEnd,
    confidence: 0.9,
    keyEvents: events.filter(e => 
      e.timestamp > features[impactIdx].t && e.timestamp <= features[followEnd].t
    )
  })
  
  // Finalización (resto del tiempo)
  phases.push({
    phase: "finish",
    start: followEnd + 1,
    end,
    confidence: 0.8,
    keyEvents: events.filter(e => e.timestamp > features[followEnd].t)
  })
  
  return phases.filter(p => p.start < p.end)
}

// Segmentación por tiempo como fallback
export function segmentPhasesByTime(features: MovementFeatures[]): PhaseSegment[] {
  const phases: PhaseSegment[] = []
  const N = features.length
  
  if (N < 8) return phases
  
  // Detectar impacto por pico de velocidad
  let iImpact = 1
  let maxV = -1
  for (let i = 1; i < N - 1; i++) {
    if (features[i].handSpeed > maxV) {
      maxV = features[i].handSpeed
      iImpact = i
    }
  }
  
  // Búsqueda de mínimos locales para límites
  const isMinDist = (i: number) =>
    features[i].handDist < features[i - 1].handDist && 
    features[i].handDist < features[i + 1].handDist
  
  const impactIdx = isMinDist(iImpact) ? iImpact : iImpact
  
  // Split por proporciones temporales alrededor del impacto
  const start = 0
  const end = N - 1
  const latePrepEnd = Math.max(1, Math.floor(0.6 * impactIdx))
  const accelEnd = Math.max(latePrepEnd + 1, impactIdx)
  
  phases.push({
    phase: "early-prep",
    start,
    end: Math.floor(0.3 * impactIdx),
    confidence: 0.7,
    keyEvents: []
  })
  
  phases.push({
    phase: "late-prep",
    start: Math.floor(0.3 * impactIdx) + 1,
    end: latePrepEnd,
    confidence: 0.8,
    keyEvents: []
  })
  
  phases.push({
    phase: "accel",
    start: latePrepEnd + 1,
    end: accelEnd,
    confidence: 0.9,
    keyEvents: []
  })
  
  phases.push({
    phase: "impact",
    start: impactIdx,
    end: impactIdx,
    confidence: 0.95,
    keyEvents: []
  })
  
  phases.push({
    phase: "early-follow",
    start: impactIdx + 1,
    end: Math.min(N - 2, impactIdx + Math.floor(0.2 * (end - impactIdx))),
    confidence: 0.8,
    keyEvents: []
  })
  
  phases.push({
    phase: "finish",
    start: phases.at(-1)!.end + 1,
    end,
    confidence: 0.7,
    keyEvents: []
  })
  
  return phases.filter(p => p.start < p.end)
}

// Calcular características del movimiento para cada frame
export function extractMovementFeatures(
  poses: { t: number; pose: any }[],
  dt: number = 1/30
): MovementFeatures[] {
  if (poses.length === 0) return []
  
  return poses.map((frame, i) => {
    const pose = frame.pose
    const t = frame.t
    
    // Posición Y de la mano (altura)
    const handY = pose.right_wrist?.y || 0
    
    // Distancia de la mano al tronco
    const handDist = pose.right_wrist && pose.right_shoulder ? 
      Math.sqrt(
        Math.pow(pose.right_wrist.x - pose.right_shoulder.x, 2) +
        Math.pow(pose.right_wrist.y - pose.right_shoulder.y, 2) +
        Math.pow(pose.right_wrist.z - pose.right_shoulder.z, 2)
      ) : 0
    
    // Rotación del torso (X-factor)
    const torsoRot = calculateTorsoRotation(pose)
    
    // Velocidad de la mano
    const handSpeed = i > 0 ? 
      Math.abs(handY - (poses[i-1].pose.right_wrist?.y || 0)) / dt : 0
    
    // Aceleración de la mano
    const handAccel = i > 1 ? 
      (handSpeed - Math.abs(poses[i-1].pose.right_wrist?.y || 0 - (poses[i-2].pose.right_wrist?.y || 0)) / dt) / dt : 0
    
    // Rotación del hombro
    const shoulderRotation = calculateShoulderRotation(pose)
    
    // Rotación de cadera
    const hipRotation = calculateHipRotation(pose)
    
    // Estabilidad de la rodilla
    const kneeStability = calculateKneeStability(pose)
    
    return {
      t,
      handY,
      handDist,
      torsoRot,
      handSpeed,
      handAccel,
      shoulderRotation,
      hipRotation,
      kneeStability
    }
  })
}

// Función auxiliar para calcular rotación del torso
function calculateTorsoRotation(pose: any): number {
  if (!pose.right_hip || !pose.left_hip || !pose.right_shoulder || !pose.left_shoulder) return 0
  
  const hipCenter = {
    x: (pose.right_hip.x + pose.left_hip.x) / 2,
    z: (pose.right_hip.z + pose.left_hip.z) / 2
  }
  
  const shoulderCenter = {
    x: (pose.right_shoulder.x + pose.left_shoulder.x) / 2,
    z: (pose.right_shoulder.z + pose.left_shoulder.z) / 2
  }
  
  const forward = { x: 0, z: 1 }
  const torsoVector = {
    x: shoulderCenter.x - hipCenter.x,
    z: shoulderCenter.z - hipCenter.z
  }
  
  const angle = Math.atan2(torsoVector.x, torsoVector.z)
  return (angle * 180) / Math.PI
}

// Función auxiliar para calcular rotación del hombro
function calculateShoulderRotation(pose: any): number {
  if (!pose.right_shoulder || !pose.left_shoulder || !pose.right_elbow) return 0
  
  const shoulderLine = {
    x: pose.right_shoulder.x - pose.left_shoulder.x,
    z: pose.right_shoulder.z - pose.left_shoulder.z
  }
  
  const armVector = {
    x: pose.right_elbow.x - pose.right_shoulder.x,
    z: pose.right_elbow.z - pose.right_shoulder.z
  }
  
  const shoulderAngle = Math.atan2(shoulderLine.x, shoulderLine.z)
  const armAngle = Math.atan2(armVector.x, armVector.z)
  
  return ((armAngle - shoulderAngle) * 180) / Math.PI
}

// Función auxiliar para calcular rotación de cadera
function calculateHipRotation(pose: any): number {
  if (!pose.right_hip || !pose.left_hip) return 0
  
  const hipLine = {
    x: pose.right_hip.x - pose.left_hip.x,
    z: pose.right_hip.z - pose.left_hip.z
  }
  
  const forward = { x: 0, z: 1 }
  const angle = Math.atan2(hipLine.x, hipLine.z)
  
  return (angle * 180) / Math.PI
}

// Función auxiliar para calcular estabilidad de la rodilla
function calculateKneeStability(pose: any): number {
  if (!pose.right_knee || !pose.left_knee) return 0
  
  const kneeHeight = (pose.right_knee.y + pose.left_knee.y) / 2
  const hipHeight = pose.right_hip && pose.left_hip ? 
    (pose.right_hip.y + pose.left_hip.y) / 2 : 0
  
  if (hipHeight === 0) return 0
  
  const optimalFlexion = 0.15
  const actualFlexion = Math.abs(hipHeight - kneeHeight) / hipHeight
  
  return Math.max(0, 1 - Math.abs(actualFlexion - optimalFlexion) / optimalFlexion)
}
