"use client"

import type React from "react"
import { useState } from "react"
import "./styles.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function HealthChatbot() {
  // React State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Functions
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
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
        }
        setMessages((prev) => [...prev, assistantMessage])
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

  const examples = [
    "I have a massive bulge in my arm",
    "I have a severe headache",
    "My chest hurts when I breathe",
    "I have a persistent cough",
  ]

  // HTML Structure (JSX)
  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-icon">❤️</div>
          <h1 className="header-title">AI Health Assistant</h1>
        </div>
        <p className="header-subtitle">Describe your symptoms for AI-powered health guidance</p>
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
          This AI provides general health information only. Always consult healthcare professionals for medical advice.
        </span>
      </div>

      {/* Chat Box */}
      <div className="chat-container">
        <div className="chat-header">
          <span className="chat-icon">💬</span>
          <h2 className="chat-title">Chat with AI Health Assistant</h2>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <p className="empty-text">Start by describing your symptoms...</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">{message.role === "user" ? "👤" : "🤖"}</div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content loading">
                <div className="spinner"></div>
                <span>AI is analyzing...</span>
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
            placeholder="Describe your symptoms..."
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
    </div>
  )
}
