import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(req: Request) {
  try {
    console.log("API route hit")

    const { message } = await req.json()
    console.log("Received message:", message)

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 })
    }

    console.log("Calling Groq...")

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are a medical assistant AI. 

If the user describes actual symptoms, pain, or health concerns, provide:
- 2-3 possible causes
- Basic care tips  
- When to see a doctor

If the user just says greetings like "hello", "hi", or asks non-medical questions, respond normally as a friendly medical assistant and ask how you can help with their health concerns.

User message: "${message}"

Keep responses under 100 words.`,
      maxTokens: 150,
    })

    console.log("Groq response:", text)

    return Response.json({ response: text })
  } catch (error) {
    console.error("API Error:", error)
    return Response.json(
      {
        error: "Failed to get AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
