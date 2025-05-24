export interface Condition {
  name: string
  description: string
  severity: "low" | "medium" | "high"
}

export interface HealthAnalysis {
  conditions: Condition[]
  careTips: string[]
  seekHelp: string[]
}

export type Language = "en" | "es" | "fr"
