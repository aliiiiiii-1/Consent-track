import React, { useEffect, useRef } from 'react'

const Console = ({ messages }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getMessageStyle = (type) => {
    switch (type) {
      case 'connected':
        return 'text-green-400 bg-green-900/20 border-green-400/30'
      case 'disconnected':
        return 'text-red-400 bg-red-900/20 border-red-400/30'
      case 'success':
        return 'text-green-400 bg-green-900/20 border-green-400/30'
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-400/30'
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-400/30'
      case 'info':
      default:
        return 'text-blue-400 bg-blue-900/20 border-blue-400/30'
    }
  }

  return (
    <div className="h-96 overflow-y-auto bg-slate-900 rounded-lg p-4 border border-slate-600">
      {messages.length === 0 ? (
        <div className="text-slate-400 text-center py-8">
          <p>No messages yet. Console will display status updates here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border ${getMessageStyle(message.type)} transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm flex-1">{message.message}</p>
                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}

export default Console
