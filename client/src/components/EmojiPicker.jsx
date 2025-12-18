import React, { useState } from 'react'

const EmojiPicker = ({ selectedEmoji, onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false)

  const popularEmojis = [
    '👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥', '💯', '🎉',
    '😊', '😍', '🤔', '😎', '🤗', '😴', '😱', '🤯', '😇', '🙌',
    '🤔', '😭', '😤', '😆', '😒', '😅', '😊', '😘', '😃', '🙂',
    '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋', '😛',
    '🤪', '😜', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒'
  ]

  const additionalEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'
  ]

  const allEmojis = [...popularEmojis, ...additionalEmojis]

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Selected emoji display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl min-w-[3rem] text-center bg-slate-700 rounded-lg p-2">
          {selectedEmoji}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white 
                   rounded-lg transition duration-200 flex items-center gap-2"
        >
          <span className="text-lg">😊</span>
          Choose Emoji
        </button>
      </div>

      {/* Emoji picker dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-2">
          <div className="bg-slate-700 rounded-lg border border-slate-600 p-4 shadow-xl max-w-md">
            <p className="text-slate-300 text-sm mb-3">Select an emoji:</p>
            <div className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto">
              {allEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-2 hover:bg-slate-600 rounded transition duration-150 
                           text-2xl flex items-center justify-center hover:scale-110"
                  title={`Select ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white 
                         rounded-lg transition duration-150 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmojiPicker
