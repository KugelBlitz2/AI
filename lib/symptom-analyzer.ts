import type { HealthAnalysis, Language } from "../types/health"

interface SymptomPattern {
  keywords: string[]
  conditions: Array<{
    name: string
    description: string
    severity: "low" | "medium" | "high"
  }>
  careTips: string[]
  seekHelp: string[]
}

const symptomDatabase: Record<string, SymptomPattern> = {
  headache: {
    keywords: ["headache", "head pain", "migraine", "dolor de cabeza", "mal de tête"],
    conditions: [
      {
        name: "Tension Headache",
        description: "Most common type of headache, often caused by stress or muscle tension",
        severity: "low",
      },
      {
        name: "Migraine",
        description: "Severe headache often accompanied by nausea and light sensitivity",
        severity: "medium",
      },
    ],
    careTips: [
      "Rest in a quiet, dark room",
      "Apply cold or warm compress to head/neck",
      "Stay hydrated",
      "Practice relaxation techniques",
      "Get adequate sleep",
    ],
    seekHelp: [
      "Sudden, severe headache unlike any before",
      "Headache with fever, stiff neck, confusion",
      "Headache after head injury",
      "Progressive worsening over days/weeks",
    ],
  },
  fever: {
    keywords: ["fever", "high temperature", "fiebre", "fièvre", "hot", "chills"],
    conditions: [
      {
        name: "Viral Infection",
        description: "Common cause of fever, usually resolves on its own",
        severity: "low",
      },
      {
        name: "Bacterial Infection",
        description: "May require antibiotic treatment",
        severity: "medium",
      },
    ],
    careTips: [
      "Rest and get plenty of sleep",
      "Drink lots of fluids",
      "Use fever-reducing medication if needed",
      "Wear light clothing",
      "Take lukewarm baths",
    ],
    seekHelp: [
      "Fever above 103°F (39.4°C)",
      "Fever lasting more than 3 days",
      "Difficulty breathing",
      "Severe dehydration",
      "Persistent vomiting",
    ],
  },
  cough: {
    keywords: ["cough", "coughing", "tos", "toux"],
    conditions: [
      {
        name: "Common Cold",
        description: "Viral infection affecting upper respiratory tract",
        severity: "low",
      },
      {
        name: "Bronchitis",
        description: "Inflammation of bronchial tubes",
        severity: "medium",
      },
    ],
    careTips: [
      "Stay hydrated with warm liquids",
      "Use honey for soothing (not for children under 1 year)",
      "Humidify the air",
      "Avoid irritants like smoke",
      "Rest your voice",
    ],
    seekHelp: [
      "Cough with blood",
      "Difficulty breathing or wheezing",
      "High fever with cough",
      "Cough lasting more than 3 weeks",
      "Chest pain with coughing",
    ],
  },
  stomach: {
    keywords: ["stomach pain", "abdominal pain", "nausea", "vomiting", "dolor de estómago", "mal d'estomac"],
    conditions: [
      {
        name: "Gastroenteritis",
        description: "Inflammation of stomach and intestines, often called stomach flu",
        severity: "low",
      },
      {
        name: "Food Poisoning",
        description: "Illness caused by contaminated food",
        severity: "medium",
      },
    ],
    careTips: [
      "Stay hydrated with clear fluids",
      "Eat bland foods (BRAT diet: bananas, rice, applesauce, toast)",
      "Rest and avoid solid foods initially",
      "Avoid dairy and fatty foods",
      "Take small, frequent sips of liquid",
    ],
    seekHelp: [
      "Severe dehydration",
      "Blood in vomit or stool",
      "High fever with abdominal pain",
      "Severe abdominal pain",
      "Signs of appendicitis (pain in lower right abdomen)",
    ],
  },
}

const translations = {
  en: {
    conditions: {
      "Tension Headache": "Tension Headache",
      Migraine: "Migraine",
      "Viral Infection": "Viral Infection",
      "Bacterial Infection": "Bacterial Infection",
      "Common Cold": "Common Cold",
      Bronchitis: "Bronchitis",
      Gastroenteritis: "Gastroenteritis",
      "Food Poisoning": "Food Poisoning",
    },
  },
  es: {
    conditions: {
      "Tension Headache": "Dolor de Cabeza Tensional",
      Migraine: "Migraña",
      "Viral Infection": "Infección Viral",
      "Bacterial Infection": "Infección Bacteriana",
      "Common Cold": "Resfriado Común",
      Bronchitis: "Bronquitis",
      Gastroenteritis: "Gastroenteritis",
      "Food Poisoning": "Intoxicación Alimentaria",
    },
  },
  fr: {
    conditions: {
      "Tension Headache": "Céphalée de Tension",
      Migraine: "Migraine",
      "Viral Infection": "Infection Virale",
      "Bacterial Infection": "Infection Bactérienne",
      "Common Cold": "Rhume",
      Bronchitis: "Bronchite",
      Gastroenteritis: "Gastro-entérite",
      "Food Poisoning": "Intoxication Alimentaire",
    },
  },
}

export function analyzeSymptoms(symptoms: string, language: Language = "en"): HealthAnalysis {
  const lowerSymptoms = symptoms.toLowerCase()
  const matchedPatterns: SymptomPattern[] = []

  // Find matching symptom patterns
  Object.values(symptomDatabase).forEach((pattern) => {
    const hasMatch = pattern.keywords.some((keyword) => lowerSymptoms.includes(keyword.toLowerCase()))
    if (hasMatch) {
      matchedPatterns.push(pattern)
    }
  })

  // If no specific matches, provide general guidance
  if (matchedPatterns.length === 0) {
    return {
      conditions: [
        {
          name:
            language === "es" ? "Síntomas Generales" : language === "fr" ? "Symptômes Généraux" : "General Symptoms",
          description:
            language === "es"
              ? "Síntomas que requieren evaluación adicional"
              : language === "fr"
                ? "Symptômes nécessitant une évaluation supplémentaire"
                : "Symptoms that require further evaluation",
          severity: "medium" as const,
        },
      ],
      careTips:
        language === "es"
          ? ["Descansa adecuadamente", "Mantente hidratado", "Monitorea tus síntomas", "Evita el estrés"]
          : language === "fr"
            ? ["Reposez-vous suffisamment", "Restez hydraté", "Surveillez vos symptômes", "Évitez le stress"]
            : ["Get adequate rest", "Stay hydrated", "Monitor your symptoms", "Avoid stress"],
      seekHelp:
        language === "es"
          ? [
              "Si los síntomas empeoran",
              "Si desarrollas fiebre alta",
              "Si tienes dificultad para respirar",
              "Si los síntomas persisten por más de una semana",
            ]
          : language === "fr"
            ? [
                "Si les symptômes s'aggravent",
                "Si vous développez une forte fièvre",
                "Si vous avez des difficultés respiratoires",
                "Si les symptômes persistent plus d'une semaine",
              ]
            : [
                "If symptoms worsen",
                "If you develop high fever",
                "If you have difficulty breathing",
                "If symptoms persist for more than a week",
              ],
    }
  }

  // Combine all matched patterns
  const allConditions = matchedPatterns.flatMap((pattern) => pattern.conditions)
  const allCareTips = [...new Set(matchedPatterns.flatMap((pattern) => pattern.careTips))]
  const allSeekHelp = [...new Set(matchedPatterns.flatMap((pattern) => pattern.seekHelp))]

  // Translate condition names if needed
  const translatedConditions = allConditions.map((condition) => ({
    ...condition,
    name: translations[language]?.conditions[condition.name] || condition.name,
  }))

  return {
    conditions: translatedConditions,
    careTips: allCareTips,
    seekHelp: allSeekHelp,
  }
}
