"use client"

import type React from "react"
import { useState } from "react"
import "./styles.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isEmergency?: boolean
  isFalseAlarm?: boolean
}

export default function MedAI() {
  // React State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)

  // Emergency keywords detection
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
          isEmergency: isEmergency,
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
          isFalseAlarm: data.isFalseAlarm,
        }
        setMessages((prev) => [...prev, assistantMessage])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const dismissEmergencyAlert = () => {
    setShowEmergencyAlert(false)
  }

  const examples = [
    "I have a severe headache",
    "My chest hurts when I breathe",
    "I have a persistent cough",
    "I have diabetes",
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
            placeholder="Describe your symptoms or health concerns..."
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
