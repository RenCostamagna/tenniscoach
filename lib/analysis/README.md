# Sistema de Análisis Biomecánico Completo

Este sistema proporciona un análisis biomecánico completo para movimientos deportivos, especialmente diseñado para tenis pero adaptable a otros deportes.

## 🏗️ Arquitectura del Sistema

### Módulos Principales

1. **`biomechanics.ts`** - Cálculos biomecánicos básicos
2. **`segments.ts`** - Segmentación de fases del movimiento
3. **`compare.ts`** - Comparación y análisis de movimientos
4. **`dtw.ts`** - Algoritmo DTW para alineación temporal
5. **`pro-templates/`** - Templates profesionales para comparación

## 🚀 Uso Básico

### Análisis Completo de un Movimiento

```typescript
import { analyzeTennisForehand } from './example-usage'

const poseData = [/* datos de poses capturadas */]
const results = await analyzeTennisForehand(poseData)

console.log(`Puntuación general: ${results.analysis.overallScore}`)
console.log(`Recomendaciones:`, results.recommendations)
```

### Análisis en Tiempo Real

```typescript
import { createRealTimeAnalyzer } from './example-usage'

const analyzer = createRealTimeAnalyzer()

// Agregar poses en tiempo real
analyzer.addPose(Date.now(), poseData)

// Obtener análisis actual
const currentAnalysis = analyzer.getCurrentAnalysis()
if (currentAnalysis) {
  console.log(`Fase actual: ${currentAnalysis.currentPhase}`)
  console.log(`Estabilidad: ${currentAnalysis.biomechanics.stability}`)
}

// Obtener feedback inmediato
const feedback = analyzer.getImmediateFeedback()
feedback.forEach(msg => console.log(`💡 ${msg}`))
```

## 📊 Métricas Biomecánicas

### Métricas Principales

- **Estabilidad** (0-1): Consistencia del movimiento
- **Simetría** (0-1): Balance entre lados izquierdo y derecho
- **Fluidez** (0-1): Suavidad del movimiento
- **Balance** (0-1): Distribución del peso corporal

### Ángulos Específicos

- **X-Factor**: Separación entre rotación de hombros y caderas
- **Rotación de Hombro**: Ángulo de rotación del hombro
- **Rotación de Cadera**: Ángulo de rotación de la cadera
- **Estabilidad de Rodilla**: Flexión óptima de la rodilla
- **Ángulo del Codo**: Flexión del codo durante el swing

## 🎯 Análisis por Fases

### Fases del Forehand

1. **Early Preparation** (0-25%): Posición inicial y preparación
2. **Late Preparation** (25-60%): Carga y rotación
3. **Acceleration** (60-75%): Aceleración hacia la pelota
4. **Impact** (75%): Momento de contacto
5. **Early Follow-through** (75-90%): Seguimiento inicial
6. **Finish** (90-100%): Finalización del movimiento

### Detección de Eventos Clave

- Pico de velocidad de la mano
- Distancia mínima al tronco (impacto)
- Máxima rotación del torso
- Detección de contacto/impacto

## 🔍 Comparación con Templates Profesionales

### Templates Disponibles

- **Profesional**: Forma óptima para jugadores avanzados
- **Intermedio**: Forma modificada para jugadores intermedios
- **Principiante**: Forma simplificada para principiantes

### Validación Automática

```typescript
import { validateAgainstTemplate, getForehandTemplate } from '../pro-templates/forehand'

const template = getForehandTemplate()
const validation = validateAgainstTemplate(movement, template)

if (validation.isValid) {
  console.log(`✅ Forma válida: ${validation.score}`)
} else {
  console.log(`❌ Necesita mejora:`, validation.feedback)
}
```

## ⚙️ Configuración Avanzada

### Pesos Personalizados

```typescript
import { createCustomAnalyzer } from './example-usage'

const analyzer = createCustomAnalyzer({
  skillLevel: 'intermediate',
  focusAreas: ['shoulderRotation', 'hipRotation'],
  customWeights: {
    'torsoRot': 1.5,        // Rotación del torso muy importante
    'kneeStability': 1.2,   // Estabilidad de rodilla importante
    'wristPosition': 0.8    // Posición de muñeca menos crítica
  }
})

const results = analyzer.analyze(poseData)
```

### Opciones DTW

```typescript
import { comparePoses } from './index'

const results = comparePoses(studentPoses, proPoses, {
  dtwOptions: {
    band: 0.1,                    // Ancho de banda más estricto
    distanceMetric: 'cosine',     // Métrica de distancia coseno
    normalize: true,              // Normalizar series
    smoothWindow: 3               // Ventana de suavizado
  },
  minConfidence: 0.7,            // Solo fases con alta confianza
  enableBiomechanicalAnalysis: true,
  enablePhaseAnalysis: true
})
```

## 📈 Seguimiento del Progreso

### Tracker de Rendimiento

```typescript
import { createPerformanceTracker } from './example-usage'

const tracker = createPerformanceTracker()

// Registrar sesión de entrenamiento
tracker.recordSession(analysis, duration)

// Obtener progreso
const progress = tracker.getProgress()
if (progress) {
  console.log(`Mejora general: ${progress.overallImprovement}`)
  console.log(`Sesiones totales: ${progress.totalSessions}`)
}
```

## 📤 Exportación de Resultados

### Formatos Disponibles

- **JSON**: Datos completos para análisis posterior
- **CSV**: Datos tabulares para hojas de cálculo
- **Resumen**: Formato legible para usuarios

```typescript
import { exportAnalysisResults } from './example-usage'

const exports = exportAnalysisResults(analysis, biomechanics, phaseBreakdown)

// Guardar como archivo
fs.writeFileSync('analysis.json', exports.json)
fs.writeFileSync('analysis.csv', exports.csv)
console.log(exports.summary)
```

## 🧪 Testing y Validación

### Tests Unitarios

```bash
npm run test:biomechanics
npm run test:segments
npm run test:compare
npm run test:dtw
```

### Validación de Datos

- Verificación de landmarks válidos
- Comprobación de rangos de ángulos
- Validación de secuencias temporales
- Detección de outliers

## 🔧 Personalización

### Nuevos Deportes

Para agregar soporte para un nuevo deporte:

1. Crear template en `pro-templates/`
2. Definir fases específicas del deporte
3. Ajustar métricas biomecánicas relevantes
4. Configurar pesos apropiados

### Nuevas Métricas

Para agregar nuevas métricas:

1. Implementar en `biomechanics.ts`
2. Agregar a `computeAngles()`
3. Incluir en templates profesionales
4. Actualizar funciones de comparación

## 📚 Referencias Técnicas

### Algoritmos Utilizados

- **DTW (Dynamic Time Warping)**: Alineación temporal de secuencias
- **Suavizado de Series**: Filtrado de ruido en datos temporales
- **Normalización Z-Score**: Estandarización de características
- **Detección de Eventos**: Identificación de momentos clave

### Optimizaciones

- **Web Workers**: Procesamiento en segundo plano
- **Ring Buffer**: Almacenamiento eficiente de frames
- **Lazy Evaluation**: Cálculos solo cuando es necesario
- **GPU Acceleration**: Soporte para MediaPipe GPU

## 🚨 Solución de Problemas

### Problemas Comunes

1. **FPS bajo**: Reducir `smoothWindow` y `band` en DTW
2. **Detección incorrecta de fases**: Ajustar umbrales de confianza
3. **Métricas inestables**: Aumentar ventana de estabilidad
4. **Comparación lenta**: Usar `band` más estricto en DTW

### Debug

```typescript
// Habilitar logs detallados
if (process.env.NODE_ENV === 'development') {
  console.debug('[ANALYSIS]', {
    poseCount: poseData.length,
    features: features.length,
    phases: phases.length,
    confidence: phases.map(p => p.confidence)
  })
}
```

## 🤝 Contribución

### Estándares de Código

- TypeScript estricto
- Tests unitarios para nuevas funcionalidades
- Documentación JSDoc
- Manejo de errores robusto

### Flujo de Desarrollo

1. Crear feature branch
2. Implementar funcionalidad
3. Agregar tests
4. Actualizar documentación
5. Crear pull request

---

**Nota**: Este sistema está diseñado para ser extensible y adaptable. Consulta los ejemplos en `example-usage.ts` para casos de uso más específicos.
