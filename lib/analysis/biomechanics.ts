// analysis/biomechanics.ts
export type V3 = { x: number; y: number; z: number; v?: number } // v = visibility
export type Pose = Record<string, V3> // ej: left_hip, right_hip, left_knee, ...

const EPS = 1e-6
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const toDegrees = (rad: number) => (rad * 180) / Math.PI
const toRadians = (deg: number) => (deg * Math.PI) / 180

// Utility functions
function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function add(a: V3, b: V3): V3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross(a: V3, b: V3): V3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  }
}

function norm(a: V3): number {
  return Math.hypot(a.x, a.y, a.z)
}

function normalize(a: V3): V3 {
  const n = norm(a)
  if (n < EPS) return { x: 0, y: 0, z: 0 }
  return { x: a.x / n, y: a.y / n, z: a.z / n }
}

function angle(a: V3, b: V3): number {
  const na = norm(a)
  const nb = norm(b)
  if (na < EPS || nb < EPS) return 0
  return Math.acos(clamp(dot(a, b) / (na * nb), -1, 1))
}

// Ángulo p–q–r (en q) en grados
export function anglePQR(p: V3, q: V3, r: V3): number {
  return toDegrees(angle(sub(p, q), sub(r, q)))
}

// X-Factor: Diferencia de rotación hombros-caderas (azimut en planta)
export function xFactor(pose: Pose): number {
  if (!pose.right_hip || !pose.left_hip || !pose.right_shoulder || !pose.left_shoulder) return 0
  
  const hip = sub(pose.right_hip, pose.left_hip)
  const sh = sub(pose.right_shoulder, pose.left_shoulder)
  const hip2D = { x: hip.x, y: hip.z, z: 0 }
  const sh2D = { x: sh.x, y: sh.z, z: 0 }
  return toDegrees(angle(hip2D, sh2D))
}

// Inclinación lateral del tronco respecto vertical
export function trunkTilt(pose: Pose): number {
  if (!pose.left_hip || !pose.right_hip) return 0
  
  const midHip = {
    x: (pose.left_hip.x + pose.right_hip.x) / 2,
    y: (pose.left_hip.y + pose.right_hip.y) / 2,
    z: (pose.left_hip.z + pose.right_hip.z) / 2,
  }
  
  const neck = pose.neck || pose.left_shoulder
  if (!neck) return 0
  
  const v = sub(neck, midHip)
  const vertical = { x: 0, y: -1, z: 0 }
  return toDegrees(angle(v, vertical))
}

// Estabilidad del movimiento (varianza de posiciones)
export function calculateStability(poses: Pose[], landmarkKey: string): number {
  if (poses.length < 3) return 0
  
  const positions = poses.map(p => p[landmarkKey]).filter(Boolean)
  if (positions.length < 3) return 0
  
  const center = {
    x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
    y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length,
    z: positions.reduce((sum, p) => sum + p.z, 0) / positions.length,
  }
  
  const variance = positions.reduce((sum, p) => {
    const diff = sub(p, center)
    return sum + (diff.x * diff.x + diff.y * diff.y + diff.z * diff.z)
  }, 0) / positions.length
  
  // Convertir a score 0-1 (menor varianza = mayor estabilidad)
  return Math.max(0, 1 - Math.min(variance / 1000, 1))
}

// Simetría entre lados izquierdo y derecho
export function calculateSymmetry(pose: Pose): number {
  const leftLandmarks = ['left_shoulder', 'left_elbow', 'left_wrist', 'left_hip', 'left_knee', 'left_ankle']
  const rightLandmarks = ['right_shoulder', 'right_elbow', 'right_wrist', 'right_hip', 'right_knee', 'right_ankle']
  
  let totalSymmetry = 0
  let validPairs = 0
  
  for (let i = 0; i < leftLandmarks.length; i++) {
    const left = pose[leftLandmarks[i]]
    const right = pose[rightLandmarks[i]]
    
    if (left && right) {
      // Comparar posiciones relativas al centro del cuerpo
      const center = pose.torso || {
        x: (pose.left_hip?.x || 0 + pose.right_hip?.x || 0) / 2,
        y: (pose.left_hip?.y || 0 + pose.right_hip?.y || 0) / 2,
        z: (pose.left_hip?.z || 0 + pose.right_hip?.z || 0) / 2,
      }
      
      const leftDist = norm(sub(left, center))
      const rightDist = norm(sub(right, center))
      
      if (leftDist > 0 && rightDist > 0) {
        const symmetry = 1 - Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist)
        totalSymmetry += symmetry
        validPairs++
      }
    }
  }
  
  return validPairs > 0 ? totalSymmetry / validPairs : 0
}

// Calcular ángulos principales del cuerpo
export function computeAngles(p: Pose) {
  return {
    knee_r: anglePQR(p.right_hip, p.right_knee, p.right_ankle),
    knee_l: anglePQR(p.left_hip, p.left_knee, p.left_ankle),
    elbow: anglePQR(p.right_shoulder, p.right_elbow, p.right_wrist),
    shoulder_abd: anglePQR(p.torso || p.right_hip, p.right_shoulder, p.right_elbow),
    wrist: anglePQR(p.right_elbow, p.right_wrist, { x: p.right_wrist.x + 1, y: p.right_wrist.y, z: p.right_wrist.z }),
    x_factor: xFactor(p),
    trunk_tilt: trunkTilt(p),
    hand_height: p.right_wrist?.y || 0,
    hand_body_dist: p.right_wrist && p.right_shoulder ? norm(sub(p.right_wrist, p.right_shoulder)) : 0,
    
    // Nuevos ángulos específicos del tenis
    shoulder_rotation: calculateShoulderRotation(p),
    hip_rotation: calculateHipRotation(p),
    knee_stability: calculateKneeStability(p),
    ankle_flexion: calculateAnkleFlexion(p),
  }
}

// Rotación del hombro (importante para el swing)
export function calculateShoulderRotation(pose: Pose): number {
  if (!pose.right_shoulder || !pose.left_shoulder || !pose.right_elbow) return 0
  
  const shoulderLine = sub(pose.right_shoulder, pose.left_shoulder)
  const armVector = sub(pose.right_elbow, pose.right_shoulder)
  
  // Proyección en el plano XZ (vista superior)
  const shoulderLine2D = { x: shoulderLine.x, y: 0, z: shoulderLine.z }
  const armVector2D = { x: armVector.x, y: 0, z: armVector.z }
  
  return toDegrees(angle(shoulderLine2D, armVector2D))
}

// Rotación de cadera
export function calculateHipRotation(pose: Pose): number {
  if (!pose.right_hip || !pose.left_hip) return 0
  
  const hipLine = sub(pose.right_hip, pose.left_hip)
  const forward = { x: 0, y: 0, z: 1 } // Dirección hacia adelante
  
  // Proyección en el plano XZ
  const hipLine2D = { x: hipLine.x, y: 0, z: hipLine.z }
  
  return toDegrees(angle(hipLine2D, forward))
}

// Estabilidad de la rodilla
export function calculateKneeStability(pose: Pose): number {
  if (!pose.right_knee || !pose.left_knee) return 0
  
  const kneeHeight = (pose.right_knee.y + pose.left_knee.y) / 2
  const hipHeight = pose.right_hip && pose.left_hip ? 
    (pose.right_hip.y + pose.left_hip.y) / 2 : 0
  
  if (hipHeight === 0) return 0
  
  // La rodilla debe estar ligeramente flexionada para estabilidad
  const optimalFlexion = 0.15 // 15% de flexión
  const actualFlexion = Math.abs(hipHeight - kneeHeight) / hipHeight
  
  return Math.max(0, 1 - Math.abs(actualFlexion - optimalFlexion) / optimalFlexion)
}

// Flexión del tobillo
export function calculateAnkleFlexion(pose: Pose): number {
  if (!pose.right_ankle || !pose.right_knee) return 0
  
  const ankleToKnee = sub(pose.right_ankle, pose.right_knee)
  const vertical = { x: 0, y: -1, z: 0 }
  
  return toDegrees(angle(ankleToKnee, vertical))
}

// Calcular velocidades (derivadas) de series temporales
export function diffSeries(xs: number[], dt: number): number[] {
  const v = new Array(xs.length).fill(0)
  for (let i = 1; i < xs.length; i++) {
    v[i] = (xs[i] - xs[i - 1]) / dt
  }
  return v
}

// Calcular aceleraciones (segunda derivada)
export function diffSeries2(xs: number[], dt: number): number[] {
  const v = diffSeries(xs, dt)
  return diffSeries(v, dt)
}

// Calcular suavizado de series temporales
export function smoothSeries(xs: number[], windowSize: number = 3): number[] {
  const smoothed = new Array(xs.length).fill(0)
  const halfWindow = Math.floor(windowSize / 2)
  
  for (let i = 0; i < xs.length; i++) {
    let sum = 0
    let count = 0
    
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(xs.length - 1, i + halfWindow); j++) {
      sum += xs[j]
      count++
    }
    
    smoothed[i] = sum / count
  }
  
  return smoothed
}

// Calcular métricas de calidad de movimiento
export function calculateMovementQuality(poses: Pose[]): {
  stability: number
  symmetry: number
  fluidity: number
  balance: number
} {
  if (poses.length < 5) {
    return { stability: 0, symmetry: 0, fluidity: 0, balance: 0 }
  }
  
  // Estabilidad basada en la varianza de posiciones clave
  const keyLandmarks = ['right_wrist', 'right_elbow', 'right_shoulder']
  const stabilityScores = keyLandmarks.map(landmark => 
    calculateStability(poses, landmark)
  )
  const avgStability = stabilityScores.reduce((sum, score) => sum + score, 0) / stabilityScores.length
  
  // Simetría promedio
  const symmetryScores = poses.map(pose => calculateSymmetry(pose))
  const avgSymmetry = symmetryScores.reduce((sum, score) => sum + score, 0) / symmetryScores.length
  
  // Fluidez basada en cambios suaves de velocidad
  const wristPositions = poses.map(p => p.right_wrist?.y || 0).filter(y => y !== 0)
  if (wristPositions.length < 3) {
    return { stability: avgStability, symmetry: avgSymmetry, fluidity: 0, balance: 0 }
  }
  
  const velocities = diffSeries(wristPositions, 1/30) // Asumiendo 30 FPS
  const accelerations = diffSeries2(wristPositions, 1/30)
  
  // Menor aceleración = mayor fluidez
  const avgAcceleration = accelerations.reduce((sum, acc) => sum + Math.abs(acc), 0) / accelerations.length
  const fluidity = Math.max(0, 1 - Math.min(avgAcceleration / 100, 1))
  
  // Balance basado en la distribución del peso
  const balance = calculateBalance(poses)
  
  return {
    stability: avgStability,
    symmetry: avgSymmetry,
    fluidity,
    balance
  }
}

// Calcular balance del cuerpo
export function calculateBalance(poses: Pose[]): number {
  if (poses.length === 0) return 0
  
  const lastPose = poses[poses.length - 1]
  if (!lastPose.left_hip || !lastPose.right_hip) return 0
  
  // Calcular el centro de masa aproximado
  const centerOfMass = {
    x: (lastPose.left_hip.x + lastPose.right_hip.x) / 2,
    y: (lastPose.left_hip.y + lastPose.right_hip.y) / 2,
    z: (lastPose.left_hip.z + lastPose.right_hip.z) / 2,
  }
  
  // Calcular la base de soporte (distancia entre pies)
  if (!lastPose.left_ankle || !lastPose.right_ankle) return 0
  
  const baseWidth = norm(sub(lastPose.left_ankle, lastPose.right_ankle))
  const centerToBase = norm(sub(centerOfMass, {
    x: (lastPose.left_ankle.x + lastPose.right_ankle.x) / 2,
    y: (lastPose.left_ankle.y + lastPose.right_ankle.y) / 2,
    z: (lastPose.left_ankle.z + lastPose.right_ankle.z) / 2,
  }))
  
  // Balance es mejor cuando el centro de masa está centrado sobre la base
  return Math.max(0, 1 - Math.min(centerToBase / (baseWidth * 0.5), 1))
}
