"use client"

import type React from "react"
import { useState } from "react"
import "./styles.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isEmergency?: boolean
  isFollowUp?: boolean
  isFalseAlarm?: boolean
}

interface FollowUpQuestion {
  question: string
  answered: boolean
  answer?: string
}

export default function MedAI() {
  // React State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([])
  const [isInFollowUpMode, setIsInFollowUpMode] = useState(false)

  // Emergency keywords detection
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

  const checkForEmergency = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    const hasEmergency = emergencyKeywords.some((keyword) => lowerText.includes(keyword))
    const isFalseAlarm = falseAlarmKeywords.some((keyword) => lowerText.includes(keyword))
    return hasEmergency && !isFalseAlarm
  }

  const checkForFalseAlarm = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return falseAlarmKeywords.some((keyword) => lowerText.includes(keyword))
  }

  // React Functions
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const isEmergency = checkForEmergency(messageText)
    const isFalseAlarm = checkForFalseAlarm(messageText)

    if (isEmergency) {
      setShowEmergencyAlert(true)
    }

    // If it's a false alarm, dismiss any existing emergency alert
    if (isFalseAlarm) {
      setShowEmergencyAlert(false)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      isEmergency,
      isFalseAlarm,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          isEmergency,
          followUpQuestions: followUpQuestions
            .filter((q) => q.answered)
            .map((q) => `${q.question}: ${q.answer}`)
            .join(", "),
          isInFollowUpMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          isEmergency: data.isEmergency,
          isFollowUp: data.hasFollowUp,
          isFalseAlarm: data.isFalseAlarm,
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Handle follow-up questions
        if (data.followUpQuestions && data.followUpQuestions.length > 0) {
          setFollowUpQuestions(
            data.followUpQuestions.map((q: string) => ({
              question: q,
              answered: false,
            })),
          )
          setIsInFollowUpMode(true)
        } else {
          setIsInFollowUpMode(false)
        }

        // If it's a false alarm response, dismiss emergency alert
        if (data.isFalseAlarm) {
          setShowEmergencyAlert(false)
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to get response")
    } finally {
      setIsLoading(false)
    }
  }

  const answerFollowUp = (questionIndex: number, answer: string) => {
    const updatedQuestions = [...followUpQuestions]
    updatedQuestions[questionIndex].answered = true
    updatedQuestions[questionIndex].answer = answer
    setFollowUpQuestions(updatedQuestions)

    // Send the answer as a message
    sendMessage(`${updatedQuestions[questionIndex].question} ${answer}`)

    // Check if all questions are answered
    if (updatedQuestions.every((q) => q.answered)) {
      setIsInFollowUpMode(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const dismissEmergencyAlert = () => {
    setShowEmergencyAlert(false)
  }

  const examples = [
    "I have a massive bulge in my arm",
    "I have a severe headache",
    "My chest hurts when I breathe",
    "I have a persistent cough",
  ]

  // HTML Structure (JSX)
  return (
    <div className="container">
      {/* Emergency Alert */}
      {showEmergencyAlert && (
        <div className="emergency-alert">
          <div className="emergency-content">
            <div className="emergency-icon">🚨</div>
            <div className="emergency-text">
              <h3>MEDICAL EMERGENCY DETECTED</h3>
              <p>If this is a life-threatening emergency:</p>
              <div className="emergency-actions">
                <a href="tel:911" className="emergency-call">
                  📞 CALL 911 NOW
                </a>
                <a href="tel:911" className="emergency-call">
                  🚑 Emergency Services
                </a>
              </div>
              <p className="emergency-note">For non-emergency urgent care, contact your doctor or visit urgent care.</p>
              <p className="emergency-joke">💡 If you were just joking, type "just kidding" to dismiss this alert.</p>
            </div>
            <button onClick={dismissEmergencyAlert} className="emergency-close">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-icon">🏥</div>
          <h1 className="header-title">MedAI</h1>
        </div>
        <p className="header-subtitle">Your AI-powered medical assistant for symptom analysis and health guidance</p>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">{error}</span>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="alert alert-warning">
        <span className="alert-icon">⚠️</span>
        <span className="alert-text">
          MedAI provides general health information only. Always consult healthcare professionals for medical advice.
        </span>
      </div>

      {/* Follow-up Questions */}
      {isInFollowUpMode && followUpQuestions.some((q) => !q.answered) && (
        <div className="followup-container">
          <h3 className="followup-title">🎯 Help me understand better:</h3>
          <div className="followup-questions">
            {followUpQuestions.map(
              (q, index) =>
                !q.answered && (
                  <div key={index} className="followup-question">
                    <p className="followup-text">{q.question}</p>
                    <div className="followup-buttons">
                      <button onClick={() => answerFollowUp(index, "Yes")} className="followup-btn followup-yes">
                        Yes
                      </button>
                      <button onClick={() => answerFollowUp(index, "No")} className="followup-btn followup-no">
                        No
                      </button>
                      <button onClick={() => answerFollowUp(index, "Not sure")} className="followup-btn followup-maybe">
                        Not sure
                      </button>
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Chat Box */}
      <div className="chat-container">
        <div className="chat-header">
          <span className="chat-icon">💬</span>
          <h2 className="chat-title">Chat with MedAI</h2>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <p className="empty-text">Start by describing your symptoms...</p>
              <p className="empty-subtext">MedAI will analyze and provide helpful guidance</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role} ${message.isEmergency ? "emergency" : ""} ${
                message.isFalseAlarm ? "false-alarm" : ""
              }`}
            >
              <div className="message-avatar">
                {message.role === "user" ? "👤" : message.isEmergency ? "🚨" : message.isFalseAlarm ? "😅" : "🤖"}
              </div>
              <div className="message-content">
                {message.isEmergency && message.role === "assistant" && (
                  <div className="message-emergency-badge">⚠️ Emergency Response</div>
                )}
                {message.isFalseAlarm && message.role === "assistant" && (
                  <div className="message-false-alarm-badge">😅 False Alarm Detected</div>
                )}
                {message.content}
                {message.isFollowUp && <div className="message-followup-badge">🎯 Follow-up Analysis</div>}
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content loading">
                <div className="spinner"></div>
                <span>MedAI is analyzing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isInFollowUpMode ? "Answer the questions above or describe more symptoms..." : "Describe your symptoms..."
            }
            disabled={isLoading}
            className="input-field"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="send-button">
            📤
          </button>
        </form>
      </div>

      {/* Quick Examples */}
      <div className="examples-container">
        <h3 className="examples-title">Try These Examples</h3>
        <div className="examples-grid">
          {examples.map((example, index) => (
            <button key={index} onClick={() => sendMessage(example)} disabled={isLoading} className="example-button">
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">© 2024 MedAI - Powered by AI for better health insights</p>
      </footer>
    </div>
  )
}
