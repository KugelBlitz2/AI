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

    // Determine severity based on keywords
    const determineSeverity = (text: string): "low" | "medium" | "high" => {
      const lowerText = text.toLowerCase()

      // High severity keywords
      const highSeverityKeywords = [
        "severe",
        "intense",
        "unbearable",
        "excruciating",
        "emergency",
        "can't",
        "cannot",
        "blood",
        "bleeding",
        "unconscious",
        "chest pain",
        "heart attack",
        "stroke",
        "allergic reaction",
      ]

      // Medium severity keywords
      const mediumSeverityKeywords = [
        "moderate",
        "persistent",
        "concerning",
        "worsening",
        "fever",
        "pain",
        "difficulty",
        "trouble",
        "nausea",
        "vomiting",
        "dizzy",
        "headache",
        "migraine",
      ]

      if (highSeverityKeywords.some((keyword) => lowerText.includes(keyword))) {
        return "high"
      } else if (mediumSeverityKeywords.some((keyword) => lowerText.includes(keyword))) {
        return "medium"
      } else {
        return "low"
      }
    }

    const isFalseAlarm = detectFalseAlarm(message)
    const isEmergencyDetected = isEmergency || detectEmergency(message)
    const severity = determineSeverity(message)

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
        // Enhanced medical response with more conditions
        prompt = `You are MedAI. The user said: "${message}"

Provide medical information in this format:

**About the condition/Possible causes:**
- [2-3 specific points about the condition or causes]

**Management/Care tips:**
- [2-3 specific management recommendations]

**When to see a doctor:**
- [2-3 specific warning signs with clear urgency levels]

EXPANDED CONDITION KNOWLEDGE:

HASHIMOTO'S: Autoimmune thyroid disorder causing hypothyroidism. Management: Daily levothyroxine, consistent timing, avoid soy/calcium. See doctor: Severe fatigue, rapid weight changes, heart palpitations.

DIABETES: Type 1 (autoimmune), Type 2 (insulin resistance). Management: Blood sugar monitoring, medication compliance, exercise, carb counting. See doctor: Blood sugar >300, ketones, vision changes, frequent infections.

ASTHMA: Chronic airway inflammation. Management: Daily controller inhaler, rescue inhaler, avoid triggers, peak flow monitoring. See doctor: Using rescue inhaler >2x/week, severe attacks, night symptoms.

HYPERTENSION: Often no symptoms until severe. Management: DASH diet, limit sodium, exercise, medication compliance. See doctor: BP >180/120, severe headaches, chest pain, vision problems.

MIGRAINE: Severe headaches with neurological symptoms. Triggers: stress, foods, hormones, weather. Management: Avoid triggers, dark quiet room, prescribed medications. See doctor: Sudden severe headache, vision changes, fever with headache.

UTI (Urinary Tract Infection): Bacterial infection of urinary system. Symptoms: burning urination, frequent urination, pelvic pain. Management: Drink lots of water, cranberry juice, complete antibiotic course. See doctor: Blood in urine, fever, back pain, symptoms worsen.

ALLERGIES: Immune system overreaction to substances. Types: food, environmental, drug allergies. Management: Avoid allergens, antihistamines, epinephrine for severe reactions. See doctor: Difficulty breathing, swelling, severe reactions, new allergies.

ANXIETY: Mental health condition with excessive worry/fear. Symptoms: racing heart, sweating, panic attacks, restlessness. Management: Deep breathing, exercise, therapy, medication if needed. See doctor: Panic attacks, can't function daily, thoughts of self-harm.

CHEST PAIN: Could be costochondritis, pneumonia, heart issues, GERD. Management: Rest, warm compress, avoid strain, antacids for GERD. See doctor: Severe pain, shortness of breath, radiating pain to arm/jaw.

DEPRESSION: Mental health disorder affecting mood, energy, interest. Symptoms: sadness, hopelessness, fatigue, sleep changes. Management: Therapy, medication, exercise, social support. See doctor: Thoughts of self-harm, can't function, symptoms persist >2 weeks.

STOMACH PAIN: Could be gastritis, food poisoning, appendicitis, IBS. Management: Bland diet, hydration, avoid irritants. See doctor: Severe pain, fever, vomiting blood, pain in lower right abdomen.

RASH: Could be eczema, allergic reaction, infection, autoimmune. Management: Keep clean/dry, avoid irritants, moisturize, antihistamines. See doctor: Spreading rapidly, fever, blistering, severe itching.

For urgency levels, specify:
- 🔴 CALL 911 NOW: Life-threatening symptoms
- 🟡 URGENT CARE (Same Day): Concerning symptoms that need prompt attention
- 🟢 SCHEDULE APPOINTMENT: Routine symptoms that can wait for regular appointment

Do NOT ask follow-up questions. Give direct medical information.

Keep response under 150 words.`
      }
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      maxTokens: 250,
    })

    return Response.json({
      response: text,
      isEmergency: isEmergencyDetected,
      isFalseAlarm,
      severity: isEmergencyDetected ? "high" : severity,
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
