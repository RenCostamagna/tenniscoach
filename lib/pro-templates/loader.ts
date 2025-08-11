export async function loadTemplate(strokeType: "forehand" | "backhand" | "serve") {
  try {
    const response = await fetch(`/templates/${strokeType}.json`)

    if (!response.ok) {
      console.warn(`Template ${strokeType}.json not found, using fallback`)
      return getFallbackTemplate()
    }

    return await response.json()
  } catch (error) {
    console.warn(`Failed to load template ${strokeType}.json:`, error)
    return getFallbackTemplate()
  }
}

function getFallbackTemplate() {
  return {
    byPhase: {
      "early-prep": [],
      "late-prep": [],
      accel: [],
      impact: [],
      "early-follow": [],
      finish: [],
    },
  }
}
