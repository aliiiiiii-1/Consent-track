import React, { useState, useEffect, useRef } from 'react'
import QRGenerator from './components/QRGenerator'
import EmojiPicker from './components/EmojiPicker'
import Console from './components/Console'

function App() {
  const [selectedEmoji, setSelectedEmoji] = useState('👍')
  const [qrData, setQrData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [consoleMessages, setConsoleMessages] = useState([])
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    const wsUrl = 'ws://localhost:8080'
    
    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        addConsoleMessage('WebSocket connected', 'connected')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          addConsoleMessage(data.message || data.type || 'Unknown message', data.type || 'info')
        } catch (error) {
          addConsoleMessage(event.data, 'info')
        }
      }
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        addConsoleMessage('WebSocket disconnected', 'disconnected')
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
        addConsoleMessage('WebSocket error', 'error')
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setIsConnected(false)
      addConsoleMessage('Failed to connect to WebSocket', 'error')
    }
  }

  const addConsoleMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleMessages(prev => [...prev, { id: Date.now(), message, type, timestamp }])
  }

  const handleGenerateQR = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }
      
      const data = await response.json()
      setQrData(data.qrDataUrl)
      addConsoleMessage('QR code generated successfully', 'success')
    } catch (error) {
      console.error('Error generating QR:', error)
      addConsoleMessage(`Error generating QR: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartAutoReact = () => {
    if (!selectedEmoji) {
      addConsoleMessage('Please select an emoji first', 'warning')
      return
    }
    
    addConsoleMessage(`Starting auto-react with emoji: ${selectedEmoji}`, 'success')
    addConsoleMessage('Auto-react functionality would start here', 'info')
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            WhatsApp Channel Auto-Reactor
          </h1>
          <p className="text-slate-300 text-lg md:text-xl">
            Generate QR codes and auto-react to WhatsApp channel messages
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* QR Generation */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">QR Code Generation</h2>
              <div className="space-y-4">
                <button
                  onClick={handleGenerateQR}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 
                           text-white font-medium py-3 px-6 rounded-lg transition duration-200
                           flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate QR'
                  )}
                </button>
                
                {qrData && (
                  <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                    <img 
                      src={qrData} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto border-2 border-slate-600 rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Emoji Picker */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Emoji Selection</h2>
              <EmojiPicker 
                selectedEmoji={selectedEmoji}
                onEmojiSelect={setSelectedEmoji}
              />
            </div>

            {/* Action Button */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <button
                onClick={handleStartAutoReact}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium 
                         py-3 px-6 rounded-lg transition duration-200 flex items-center 
                         justify-center gap-2"
              >
                <span className="text-2xl">{selectedEmoji}</span>
                Start Auto React
              </button>
            </div>
          </div>

          {/* Right Column - Console */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Live Console</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <Console messages={consoleMessages} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Built with React, Tailwind CSS, and WebSocket integration
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
