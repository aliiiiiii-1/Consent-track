import React from 'react'

const QRGenerator = ({ qrData, onGenerate, isLoading }) => {
  return (
    <div className="space-y-4">
      <button
        onClick={onGenerate}
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
          <p className="text-slate-300 text-center mt-2 text-sm">
            Scan this QR code with WhatsApp
          </p>
        </div>
      )}
    </div>
  )
}

export default QRGenerator
