import { buildPhaseSeries } from "../lib/pro-templates/ingest"
import { loadTemplate } from "../lib/pro-templates/loader"
import * as fs from "fs"
import * as path from "path"

// TODO: reemplazar con los datos reales que voy a pegar ahora mismo:
const earlyPrepFrames = [
  {
    timestamp: 0,
    keypoints: [
      { x: 0.408, y: 0.2773, z: -0.2551, visibility: 1, name: "nose" },
      { x: 0.4037, y: 0.263, z: -0.2328, visibility: 1, name: "left_eye_inner" },
      { x: 0.4038, y: 0.2625, z: -0.2328, visibility: 1, name: "left_eye" },
      { x: 0.4039, y: 0.2619, z: -0.2328, visibility: 1, name: "left_eye_outer" },
      { x: 0.3996, y: 0.2637, z: -0.2437, visibility: 1, name: "right_eye_inner" },
      { x: 0.3968, y: 0.2638, z: -0.2439, visibility: 1, name: "right_eye" },
      { x: 0.3937, y: 0.2643, z: -0.2439, visibility: 1, name: "right_eye_outer" },
      { x: 0.3948, y: 0.2688, z: -0.1089, visibility: 1, name: "left_ear" },
      { x: 0.3777, y: 0.2745, z: -0.1608, visibility: 1, name: "right_ear" },
      { x: 0.4074, y: 0.2915, z: -0.2084, visibility: 1, name: "mouth_left" },
      { x: 0.401, y: 0.2926, z: -0.2236, visibility: 1, name: "mouth_right" },
      { x: 0.4239, y: 0.3472, z: -0.054, visibility: 1, name: "left_shoulder" },
      { x: 0.3345, y: 0.3754, z: -0.0935, visibility: 1, name: "right_shoulder" },
      { x: 0.4592, y: 0.4594, z: -0.1153, visibility: 0.9806, name: "left_elbow" },
      { x: 0.2879, y: 0.4661, z: -0.137, visibility: 0.9962, name: "right_elbow" },
      { x: 0.4007, y: 0.4547, z: -0.3263, visibility: 0.9698, name: "left_wrist" },
      { x: 0.3239, y: 0.5166, z: -0.2775, visibility: 0.9721, name: "right_wrist" },
      { x: 0.3872, y: 0.4569, z: -0.377, visibility: 0.9443, name: "left_pinky" },
      { x: 0.3334, y: 0.5299, z: -0.3166, visibility: 0.9389, name: "right_pinky" },
      { x: 0.3843, y: 0.4427, z: -0.3786, visibility: 0.9443, name: "left_index" },
      { x: 0.3419, y: 0.5147, z: -0.321, visibility: 0.9362, name: "right_index" },
      { x: 0.3874, y: 0.4386, z: -0.3307, visibility: 0.9161, name: "left_thumb" },
      { x: 0.3391, y: 0.5091, z: -0.2805, visibility: 0.9029, name: "right_thumb" },
      { x: 0.4116, y: 0.5855, z: 0.0181, visibility: 0.9999, name: "left_hip" },
      { x: 0.3549, y: 0.5852, z: -0.0182, visibility: 0.9999, name: "right_hip" },
      { x: 0.4633, y: 0.7452, z: -0.1115, visibility: 0.996, name: "left_knee" },
      { x: 0.3283, y: 0.746, z: -0.1555, visibility: 0.997, name: "right_knee" },
      { x: 0.4355, y: 0.8282, z: 0.2212, visibility: 0.9871, name: "left_ankle" },
      { x: 0.2981, y: 0.8814, z: 0.0671, visibility: 0.9956, name: "right_ankle" },
      { x: 0.4193, y: 0.8343, z: 0.2505, visibility: 0.9368, name: "left_heel" },
      { x: 0.3001, y: 0.8994, z: 0.084, visibility: 0.9044, name: "right_heel" },
      { x: 0.4572, y: 0.9022, z: 0.1649, visibility: 0.9804, name: "left_foot_index" },
      { x: 0.2918, y: 0.9456, z: -0.0409, visibility: 0.9887, name: "right_foot_index" },
    ],
  },
]

async function ingestTemplate() {
  try {
    console.log("Building phase series from early-prep frames...")
    const earlyPrepSeries = buildPhaseSeries(earlyPrepFrames, 30)

    console.log("Loading existing forehand template...")
    // Load existing template or use fallback
    const existingTemplate = await loadTemplate("forehand")

    // Update the early-prep phase
    existingTemplate.byPhase["early-prep"] = earlyPrepSeries

    // Ensure public/templates directory exists
    const templatesDir = path.join(process.cwd(), "public", "templates")
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true })
    }

    // Save updated template
    const templatePath = path.join(templatesDir, "forehand.json")
    fs.writeFileSync(templatePath, JSON.stringify(existingTemplate, null, 2))

    console.log(`✅ Template saved to ${templatePath}`)
    console.log(`📊 Early-prep phase has ${earlyPrepSeries.length} data points`)
  } catch (error) {
    console.error("❌ Failed to ingest template:", error)
    process.exit(1)
  }
}

// Run the ingestion
ingestTemplate()
