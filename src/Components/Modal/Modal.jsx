import React, { useState, useEffect } from 'react'
import './Modal.css'

/**
 * Reusable Modal component
 * 
 * Types:
 * - "alert"   → message + OK button
 * - "confirm" → message + Cancel/Confirm buttons
 * - "prompt"  → message + text input + Cancel/Confirm buttons
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '', 
  message = '', 
  type = 'alert',        // 'alert' | 'confirm' | 'prompt'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  promptPlaceholder = '',
  promptMatch = '',       // if set, input must match this to enable confirm
  variant = 'default'     // 'default' | 'danger'
}) => {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue)
    } else {
      onConfirm()
    }
  }

  const isConfirmDisabled = type === 'prompt' && promptMatch && inputValue !== promptMatch

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 className={`modal-title ${variant === 'danger' ? 'modal-title-danger' : ''}`}>
            {title}
          </h3>
        )}
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          
          {type === 'prompt' && (
            <input
              type="text"
              className="input-field modal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={promptPlaceholder}
              autoFocus
            />
          )}
        </div>

        <div className="modal-actions">
          {type !== 'alert' && (
            <button className="button-b" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button 
            className={variant === 'danger' ? 'button-danger' : 'button-a'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
