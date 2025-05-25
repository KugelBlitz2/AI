import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(req: Request) {
  try {
    const { message, isEmergency } = await req.json()

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 })
    }

    // Emergency keywords for detection
    const emergencyKeywords = [
      "can't breathe",
      "cannot breathe",
      "can not breathe",
      "canot breath",
      "canot breathe",
      "cant breath",
      "cant breathe",
      "i cannot breath",
      "i canot breath",
      "i cant breath",
      "difficulty breathing",
      "trouble breathing",
      "hard to breathe",
      "struggling to breathe",
      "gasping",
      "choking",
      "chest pain",
      "severe bleeding",
      "unconscious",
      "heart attack",
      "stroke",
      "severe burn",
      "poisoning",
      "overdose",
      "severe allergic reaction",
      "broken bone",
      "head injury",
      "suicide",
      "self harm",
      "dying",
      "help me",
      "emergency",
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
      const lowerText = text.toLowerCase().replace(/[^a-z\s]/g, " ")
      return emergencyKeywords.some((keyword) => lowerText.includes(keyword))
    }

    const detectFalseAlarm = (text: string): boolean => {
      const lowerText = text.toLowerCase()
      return falseAlarmKeywords.some((keyword) => lowerText.includes(keyword))
    }

    const isFalseAlarm = detectFalseAlarm(message)
    const isEmergencyDetected = isEmergency || detectEmergency(message)

    let prompt = ""

    if (isFalseAlarm) {
      prompt = `The user said: "${message}"

This appears to be someone saying they were joking. Respond in a friendly way and remind them not to joke about medical emergencies.

Keep response under 50 words.`
    } else if (isEmergencyDetected) {
      prompt = `🚨🚨🚨 CRITICAL MEDICAL EMERGENCY 🚨🚨🚨

User message: "${message}"

This person has a life-threatening emergency.

RESPOND WITH URGENT EMERGENCY INSTRUCTIONS:

🚨 **CALL 911 IMMEDIATELY** - This is a medical emergency
📞 **Emergency Services NOW** - Don't wait
🆘 **Immediate Actions:**
- Sit upright, lean forward
- Loosen tight clothing
- Stay calm, breathe slowly
- Don't lie down

⚠️ **What NOT to do:**
- Don't panic
- Don't leave them alone
- Don't give food/water

This is LIFE-THREATENING. Use urgent language.

Keep response under 150 words but be URGENT and DIRECT.`
    } else {
      // Check if it's a simple greeting
      const simpleGreetings = ["hello", "hi", "hey"]
      const isSimpleGreeting = simpleGreetings.some((greeting) => message.toLowerCase().trim() === greeting)

      if (isSimpleGreeting) {
        prompt = `The user said: "${message}"

Respond as MedAI and ask how you can help with their health concerns.

Keep response under 30 words.`
      } else {
        // Main medical response - simplified, no follow-up questions
        prompt = `You are MedAI. The user said: "${message}"

Provide medical information in this format:

**About the condition/Possible causes:**
- [2-3 specific points about the condition or causes]

**Management/Care tips:**
- [2-3 specific management recommendations]

**When to see a doctor:**
- [2-3 specific warning signs or situations]

CONDITION KNOWLEDGE:

HASHIMOTO'S: Autoimmune thyroid disorder. Management: Daily levothyroxine, consistent timing. See doctor: Severe fatigue, rapid weight changes, heart palpitations.

DIABETES: Type 1 (autoimmune), Type 2 (insulin resistance). Management: Blood sugar monitoring, medication compliance, exercise. See doctor: Blood sugar >300, ketones, vision changes.

ASTHMA: Chronic airway inflammation. Management: Daily controller inhaler, rescue inhaler, avoid triggers. See doctor: Using rescue inhaler >2x/week, severe attacks.

HYPERTENSION: Often no symptoms until severe. Management: DASH diet, limit sodium, exercise, medication. See doctor: BP >180/120, severe headaches, chest pain.

CHEST PAIN: Could be costochondritis, pneumonia, heart issues. Management: Rest, warm compress, avoid strain. See doctor: Severe pain, shortness of breath, radiating pain.

Do NOT ask follow-up questions. Give direct medical information.

Keep response under 120 words.`
      }
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      maxTokens: 200,
    })

    return Response.json({
      response: text,
      isEmergency: isEmergencyDetected,
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
