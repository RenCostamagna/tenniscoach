// analysis/dtw.ts

export interface DTWOptions {
  band?: number // ancho de banda relativo (p.ej. 0.1 => 10%)
  weights?: number[] // pesos por feature
  distanceMetric?: 'euclidean' | 'manhattan' | 'cosine' | 'correlation'
  normalize?: boolean // normalizar por longitud de secuencia
  smoothWindow?: number // ventana de suavizado para las series
}

// Métricas de distancia
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

function manhattanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i])
  }
  return sum
}

function cosineDistance(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 1
  
  const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return 1 - cosine // Convertir similitud a distancia
}

function correlationDistance(a: number[], b: number[]): number {
  const n = a.length
  if (n < 2) return 1
  
  const meanA = a.reduce((sum, val) => sum + val, 0) / n
  const meanB = b.reduce((sum, val) => sum + val, 0) / n
  
  let numerator = 0
  let denomA = 0
  let denomB = 0
  
  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA
    const diffB = b[i] - meanB
    numerator += diffA * diffB
    denomA += diffA * diffA
    denomB += diffB * diffB
  }
  
  if (denomA === 0 || denomB === 0) return 1
  
  const correlation = numerator / Math.sqrt(denomA * denomB)
  return 1 - correlation // Convertir similitud a distancia
}

// Función principal DTW mejorada
export function dtwCost(
  A: number[][],
  B: number[][],
  options: DTWOptions = {}
): { cost: number; path: [number, number][]; normalizedCost: number } {
  const {
    band = 0.12,
    weights = new Array(A[0]?.length || 0).fill(1),
    distanceMetric = 'euclidean',
    normalize = true,
    smoothWindow = 1
  } = options
  
  const n = A.length
  const m = B.length
  
  if (n === 0 || m === 0) {
    return { cost: Infinity, path: [], normalizedCost: 1 }
  }
  
  // Aplicar suavizado si se especifica
  if (smoothWindow > 1) {
    A = smoothSeries(A, smoothWindow)
    B = smoothSeries(B, smoothWindow)
  }
  
  // Normalizar las series si se especifica
  if (normalize) {
    A = normalizeSeries(A)
    B = normalizeSeries(B)
  }
  
  const W = Math.max(1, Math.floor(band * Math.max(n, m)))
  const INF = 1e12
  
  // Matriz de costos acumulativos
  const D = Array.from({ length: n + 1 }, () => Array(m + 1).fill(INF))
  D[0][0] = 0
  
  // Matriz de backtracking para reconstruir el camino
  const backtrack = Array.from({ length: n + 1 }, () => Array(m + 1).fill([-1, -1]))
  
  // Seleccionar métrica de distancia
  const distanceFn = getDistanceFunction(distanceMetric)
  
  // Calcular matriz de costos
  for (let i = 1; i <= n; i++) {
    const jLo = Math.max(1, i - W)
    const jHi = Math.min(m, i + W)
    
    for (let j = jLo; j <= jHi; j++) {
      const d = weightedDistance(A[i - 1], B[j - 1], weights, distanceFn)
      
      // Encontrar el costo mínimo de los tres movimientos posibles
      const costs = [
        { cost: D[i - 1][j], move: [i - 1, j] },
        { cost: D[i][j - 1], move: [i, j - 1] },
        { cost: D[i - 1][j - 1], move: [i - 1, j - 1] }
      ]
      
      const minCost = Math.min(...costs.map(c => c.cost))
      const bestMove = costs.find(c => c.cost === minCost)!.move
      
      D[i][j] = d + minCost
      backtrack[i][j] = bestMove
    }
  }
  
  // Reconstruir el camino óptimo
  const path: [number, number][] = []
  let [i, j] = [n, m]
  
  while (i > 0 || j > 0) {
    path.unshift([i - 1, j - 1])
    if (i > 0 && j > 0) {
      [i, j] = backtrack[i][j]
    } else if (i > 0) {
      i--
    } else {
      j--
    }
  }
  
  const cost = D[n][m]
  const normalizedCost = normalize ? cost / (n + m) : cost
  
  return { cost, path, normalizedCost }
}

// Función auxiliar para obtener la función de distancia
function getDistanceFunction(metric: string) {
  switch (metric) {
    case 'manhattan':
      return manhattanDistance
    case 'cosine':
      return cosineDistance
    case 'correlation':
      return correlationDistance
    case 'euclidean':
    default:
      return euclideanDistance
  }
}

// Función auxiliar para calcular distancia ponderada
function weightedDistance(a: number[], b: number[], weights: number[], distanceFn: Function): number {
  if (a.length !== b.length || a.length !== weights.length) {
    throw new Error('Dimension mismatch in weightedDistance')
  }
  
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += weights[i] * diff * diff
  }
  
  return Math.sqrt(sum)
}

// Función auxiliar para normalizar series
function normalizeSeries(series: number[][]): number[][] {
  if (series.length === 0) return series
  
  const numFeatures = series[0].length
  const normalized = Array.from({ length: series.length }, () => new Array(numFeatures).fill(0))
  
  // Normalizar cada feature por separado
  for (let f = 0; f < numFeatures; f++) {
    const values = series.map(row => row[f])
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )
    
    for (let i = 0; i < series.length; i++) {
      normalized[i][f] = std > 0 ? (series[i][f] - mean) / std : 0
    }
  }
  
  return normalized
}

// Función auxiliar para suavizar series
function smoothSeries(series: number[][], windowSize: number): number[][] {
  if (windowSize <= 1) return series
  
  const smoothed = Array.from({ length: series.length }, () => new Array(series[0].length).fill(0))
  const halfWindow = Math.floor(windowSize / 2)
  
  for (let i = 0; i < series.length; i++) {
    for (let f = 0; f < series[0].length; f++) {
      let sum = 0
      let count = 0
      
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(series.length - 1, i + halfWindow); j++) {
        sum += series[j][f]
        count++
      }
      
      smoothed[i][f] = sum / count
    }
  }
  
  return smoothed
}

// Función de conveniencia para comparación simple
export function dtwCostSimple(
  A: number[][],
  B: number[][],
  w: number[] = [],
  band: number = 0.12
): number {
  const weights = w.length > 0 ? w : new Array(A[0]?.length || 0).fill(1)
  const result = dtwCost(A, B, { band, weights })
  return result.normalizedCost
}

// Función para calcular similitud entre dos secuencias
export function calculateSimilarity(
  A: number[][],
  B: number[][],
  options: DTWOptions = {}
): number {
  const result = dtwCost(A, B, options)
  
  // Convertir costo a similitud (0-1, donde 1 es idéntico)
  const maxCost = Math.sqrt(A[0]?.length || 1) * Math.max(A.length, B.length)
  const similarity = Math.max(0, 1 - (result.normalizedCost / maxCost))
  
  return similarity
}

// Función para encontrar la mejor alineación entre dos secuencias
export function findBestAlignment(
  A: number[][],
  B: number[][],
  options: DTWOptions = {}
): { similarity: number; alignment: [number, number][]; phaseShift: number } {
  const result = dtwCost(A, B, options)
  
  // Calcular el desplazamiento de fase promedio
  let totalShift = 0
  let validPairs = 0
  
  for (let i = 1; i < result.path.length; i++) {
    const [prevA, prevB] = result.path[i - 1]
    const [currA, currB] = result.path[i]
    
    if (currA > prevA && currB > prevB) {
      const shift = (currA - prevA) - (currB - prevB)
      totalShift += shift
      validPairs++
    }
  }
  
  const avgPhaseShift = validPairs > 0 ? totalShift / validPairs : 0
  const similarity = calculateSimilarity(A, B, options)
  
  return {
    similarity,
    alignment: result.path,
    phaseShift: avgPhaseShift
  }
}
