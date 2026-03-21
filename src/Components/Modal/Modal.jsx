import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Modal.css'


const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '', 
  message = '', 
  type = 'alert',
  confirmText,
  cancelText,
  promptPlaceholder = '',
  promptMatch = '',
  variant = 'default'
}) => {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')

  const resolvedConfirmText = confirmText || t('modal.confirm')
  const resolvedCancelText = cancelText || t('modal.cancel')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      document.body.classList.add('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
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
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 id="modal-title" className={`modal-title ${variant === 'danger' ? 'modal-title-danger' : ''}`}>
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
              {resolvedCancelText}
            </button>
          )}
          <button 
            className={variant === 'danger' ? 'button-danger' : 'button-a'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
