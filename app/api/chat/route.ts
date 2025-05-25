import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(req: Request) {
  try {
    const { message, isEmergency, followUpQuestions, isFollowUpMode } = await req.json()

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 })
    }

    // Emergency keywords for detection
    const emergencyKeywords = [
      "chest pain",
      "can't breathe",
      "difficulty breathing",
      "severe bleeding",
      "unconscious",
      "heart attack",
      "stroke",
      "choking",
      "severe burn",
      "poisoning",
      "overdose",
      "severe allergic reaction",
      "broken bone",
      "head injury",
      "suicide",
      "self harm",
    ]

    // False alarm keywords
    const falseAlarmKeywords = [
      "just kidding",
      "just joking",
      "jk",
      "kidding",
      "joking",
      "not really",
      "false alarm",
      "nevermind",
      "never mind",
      "joke",
      "lol",
      "haha",
      "😂",
      "🤣",
      "😄",
    ]

    const detectEmergency = (text: string): boolean => {
      const lowerText = text.toLowerCase()
      return emergencyKeywords.some((keyword) => lowerText.includes(keyword))
    }

    const detectFalseAlarm = (text: string): boolean => {
      const lowerText = text.toLowerCase()
      return falseAlarmKeywords.some((keyword) => lowerText.includes(keyword))
    }

    const isFalseAlarm = detectFalseAlarm(message)
    const isEmergencyDetected = isEmergency || (detectEmergency(message) && !isFalseAlarm)

    let prompt = ""

    if (isFalseAlarm) {
      prompt = `The user said: "${message}"

This appears to be someone saying they were joking or not serious about a previous message. Respond in a friendly, understanding way. Maybe give a gentle reminder about not joking about medical emergencies, but keep it light and friendly.

Keep response under 50 words.`
    } else if (isEmergencyDetected) {
      prompt = `EMERGENCY MEDICAL SITUATION DETECTED.

User message: "${message}"
${followUpQuestions ? `Additional info: ${followUpQuestions}` : ""}

Provide:
1. Immediate emergency actions (call 911, first aid steps)
2. What NOT to do
3. How to stay safe until help arrives

Keep response under 150 words. Be direct and clear.`
    } else if (isFollowUpMode) {
      prompt = `You are a medical assistant. Based on the initial symptoms and follow-up answers, provide a comprehensive analysis.

User message: "${message}"
Follow-up information: ${followUpQuestions}

Provide:
- Updated possible causes based on all information
- Specific care recommendations
- When to seek medical help
- Any warning signs

Keep response under 150 words.`
    } else {
      // Check if it's a greeting or casual conversation
      const casualKeywords = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"]
      const isCasual = casualKeywords.some((keyword) => message.toLowerCase().includes(keyword))

      if (isCasual || message.length < 10) {
        prompt = `The user said: "${message}"

This appears to be a greeting or casual conversation. Respond as a friendly medical assistant and ask how you can help with their health concerns today.

Keep response under 50 words.`
      } else {
        prompt = `You are a medical assistant AI. 

User message: "${message}"

If this describes symptoms, provide:
1. 2-3 possible causes
2. Basic care tips
3. When to see a doctor

Then ask 2-3 relevant follow-up questions to better understand the symptoms (like duration, severity, associated symptoms).

Keep response under 100 words.`
      }
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      maxTokens: 200,
    })

    // Generate follow-up questions for non-emergency symptoms
    let followUpQuestions_generated: string[] = []
    let hasFollowUp = false

    if (!isEmergencyDetected && !isFollowUpMode && !isFalseAlarm && message.length > 10) {
      // Check if this is actually a symptom description
      const symptomIndicators = [
        "pain",
        "hurt",
        "ache",
        "feel",
        "sick",
        "nausea",
        "fever",
        "cough",
        "headache",
        "dizzy",
        "tired",
        "swollen",
        "rash",
        "bleeding",
        "burning",
        "itchy",
      ]

      const hasSymptoms = symptomIndicators.some((indicator) => message.toLowerCase().includes(indicator))

      if (hasSymptoms) {
        // Generate follow-up questions based on the symptom
        const followUpPrompt = `Based on this symptom: "${message}"

Generate 2-3 specific follow-up questions to better understand the condition. Format as a simple array.

Examples:
- "How long have you had this symptom?"
- "Is the pain constant or does it come and go?"
- "Do you have any fever?"
- "Does anything make it better or worse?"

Return only the questions, one per line.`

        try {
          const followUpResponse = await generateText({
            model: groq("llama-3.1-8b-instant"),
            prompt: followUpPrompt,
            maxTokens: 100,
          })

          followUpQuestions_generated = followUpResponse.text
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) =>
              line
                .replace(/^[-*•]\s*/, "")
                .replace(/^\d+\.\s*/, "")
                .trim(),
            )
            .filter((line) => line.endsWith("?"))
            .slice(0, 3)

          hasFollowUp = followUpQuestions_generated.length > 0
        } catch (error) {
          console.error("Error generating follow-up questions:", error)
        }
      }
    }

    return Response.json({
      response: text,
      isEmergency: isEmergencyDetected,
      hasFollowUp,
      followUpQuestions: followUpQuestions_generated,
      isFalseAlarm,
    })
  } catch (error) {
    return Response.json(
      {
        error: "Failed to get AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
