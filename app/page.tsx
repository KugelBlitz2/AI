"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./styles.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isEmergency?: boolean
  isFalseAlarm?: boolean
  severity?: "low" | "medium" | "high"
  timestamp: number
}

interface SymptomEntry {
  id: string
  symptom: string
  severity?: "low" | "medium" | "high"
  timestamp: number
  response: string
}

export default function MedAI() {
  // React State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const [symptomHistory, setSymptomHistory] = useState<SymptomEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load symptom history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("medai-symptom-history")
    if (savedHistory) {
      try {
        setSymptomHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Error loading symptom history:", error)
      }
    }
  }, [])

  // Save symptom history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("medai-symptom-history", JSON.stringify(symptomHistory))
  }, [symptomHistory])

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

  // Progress indicator simulation
  const simulateProgress = () => {
    setLoadingProgress(0)
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)
    return interval
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
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    // Start progress indicator
    const progressInterval = simulateProgress()

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
          severity: data.severity,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Add to symptom history (only for non-emergency, non-greeting messages)
        if (!data.isEmergency && !data.isFalseAlarm && messageText.length > 10) {
          const newSymptomEntry: SymptomEntry = {
            id: Date.now().toString(),
            symptom: messageText,
            severity: data.severity,
            timestamp: Date.now(),
            response: data.response,
          }
          setSymptomHistory((prev) => [newSymptomEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
        }

        // If it's a false alarm response, dismiss emergency alert
        if (data.isFalseAlarm) {
          setShowEmergencyAlert(false)
        }
      }

      // Complete progress
      setLoadingProgress(100)
      setTimeout(() => setLoadingProgress(0), 500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to get response")
      clearInterval(progressInterval)
      setLoadingProgress(0)
    } finally {
      setIsLoading(false)
      clearInterval(progressInterval)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const dismissEmergencyAlert = () => {
    setShowEmergencyAlert(false)
  }

  const clearHistory = () => {
    setSymptomHistory([])
    localStorage.removeItem("medai-symptom-history")
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "severity-high"
      case "medium":
        return "severity-medium"
      case "low":
        return "severity-low"
      default:
        return ""
    }
  }

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "high":
        return "🔴"
      case "medium":
        return "🟡"
      case "low":
        return "🟢"
      default:
        return "🤖"
    }
  }

  // Enhanced examples with more diversity
  const examples = [
    "I have a severe headache with nausea",
    "My chest hurts when I breathe",
    "I have a persistent cough for 2 weeks",
    "I have diabetes and feel dizzy",
    "Burning sensation when I urinate",
    "I'm having anxiety and panic attacks",
    "Severe allergic reaction to food",
    "Migraine with visual disturbances",
    "I have Hashimoto's thyroiditis",
    "Stomach pain after eating",
    "I can't sleep and feel depressed",
    "Rash on my arms and legs",
  ]

  // HTML Structure (JSX)
  return (
    <div className="container">
      {/* Progress Bar */}
      {isLoading && loadingProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${loadingProgress}%` }}>
            <span className="progress-text">Analyzing symptoms... {Math.round(loadingProgress)}%</span>
          </div>
        </div>
      )}

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
          <button onClick={() => setShowHistory(!showHistory)} className="history-toggle">
            📊 History
          </button>
        </div>
        <p className="header-subtitle">Your AI-powered medical assistant for symptom analysis and health guidance</p>
      </header>

      {/* Symptom History */}
      {showHistory && (
        <div className="history-container">
          <div className="history-header">
            <h3 className="history-title">📊 Symptom History</h3>
            <button onClick={clearHistory} className="clear-history-btn">
              🗑️ Clear
            </button>
          </div>
          {symptomHistory.length === 0 ? (
            <p className="history-empty">No symptom history yet. Start chatting to track your symptoms over time.</p>
          ) : (
            <div className="history-list">
              {symptomHistory.slice(0, 10).map((entry) => (
                <div key={entry.id} className={`history-item ${getSeverityColor(entry.severity)}`}>
                  <div className="history-item-header">
                    <span className="history-severity">{getSeverityIcon(entry.severity)}</span>
                    <span className="history-date">{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="history-symptom">{entry.symptom}</div>
                  <div className="history-response">{entry.response.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Urgency Guide */}
      <div className="urgency-guide">
        <h3 className="urgency-title">🚦 When to Seek Care</h3>
        <div className="urgency-levels">
          <div className="urgency-level emergency-level">
            <span className="urgency-icon">🔴</span>
            <div className="urgency-content">
              <strong>CALL 911 NOW</strong>
              <p>Breathing problems, chest pain, severe bleeding, unconscious</p>
            </div>
          </div>
          <div className="urgency-level urgent-level">
            <span className="urgency-icon">🟡</span>
            <div className="urgency-content">
              <strong>Urgent Care (Same Day)</strong>
              <p>High fever, severe pain, persistent vomiting, concerning symptoms</p>
            </div>
          </div>
          <div className="urgency-level routine-level">
            <span className="urgency-icon">🟢</span>
            <div className="urgency-content">
              <strong>Schedule Appointment</strong>
              <p>Mild symptoms, routine check-ups, ongoing conditions</p>
            </div>
          </div>
        </div>
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
              } ${getSeverityColor(message.severity)}`}
            >
              <div className="message-avatar">
                {message.role === "user"
                  ? "👤"
                  : message.isEmergency
                    ? "🚨"
                    : message.isFalseAlarm
                      ? "😅"
                      : getSeverityIcon(message.severity)}
              </div>
              <div className="message-content">
                {message.isEmergency && message.role === "assistant" && (
                  <div className="message-emergency-badge">⚠️ Emergency Response</div>
                )}
                {message.isFalseAlarm && message.role === "assistant" && (
                  <div className="message-false-alarm-badge">😅 False Alarm Detected</div>
                )}
                {message.severity && message.role === "assistant" && (
                  <div className={`message-severity-badge ${getSeverityColor(message.severity)}`}>
                    {getSeverityIcon(message.severity)} {message.severity.toUpperCase()} PRIORITY
                  </div>
                )}
                {message.content}
                <div className="message-timestamp">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content loading">
                <div className="spinner"></div>
                <span>MedAI is analyzing your symptoms...</span>
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

      {/* Enhanced Examples */}
      <div className="examples-container">
        <h3 className="examples-title">💡 Try These Examples</h3>
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
