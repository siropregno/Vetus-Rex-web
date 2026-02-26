import React, { useState } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import './Options.css'

const Options = () => {
  const { deleteAccount } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', step: null })

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Delete Account',
      message: 'Are you absolutely sure you want to delete your account?\n\nThis action CANNOT be undone. The following will be deleted:\n- Your profile\n- Your profile picture\n- All your data\n\nType "DELETE" to confirm:',
      step: 'prompt'
    })
  }

  const handleModalConfirm = async (value) => {
    if (modal.step === 'prompt') {
      // value is the typed input — promptMatch handles validation
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'Final Confirmation',
        message: 'Do you really want to delete your account forever?',
        step: 'final'
      })
    } else if (modal.step === 'final') {
      setModal(m => ({ ...m, isOpen: false }))
      setIsLoading(true)
      setError('')

      try {
        const { error } = await deleteAccount()
        
        if (error) {
          setError(error.message || 'Error deleting account')
        } else {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Account Deleted',
            message: 'Your account has been successfully deleted.',
            step: 'success'
          })
        }
      } catch (err) {
        setError('Unexpected error while deleting account')
        logger.error('Error deleting account:', err)
      } finally {
        setIsLoading(false)
      }
    } else if (modal.step === 'success') {
      setModal(m => ({ ...m, isOpen: false }))
      window.location.href = '/'
    }
  }

  return (
    <div className="options-container">

      {/* General Settings */}
      <div className="options-section">
        <h3>Preferences</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Dark Theme</h4>
            <p>Switch between light and dark theme</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Notifications</h4>
            <p>Configure email notifications</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Language</h4>
            <p>Change application language</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="options-section">
        <h3>Privacy & Security</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Change Password</h4>
            <p>Update your access password</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>Two-Factor Authentication</h4>
            <p>Set up two-factor authentication</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="options-section">
        <h3>Data</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>Export Data</h4>
            <p>Download a copy of all your data</p>
          </div>
          <button className="button-b" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <div className="danger-content">
          <div className="danger-item">
            <div className="danger-info">
              <h4>Delete Account</h4>
              <p>This action will permanently delete your account and all associated data. It cannot be undone.</p>
            </div>
            
            {error && (
              <div className="message error">
                {error}
              </div>
            )}
            
            <button
              onClick={handleDeleteAccount}
              className="button-danger"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(m => ({ ...m, isOpen: false }))}
        onConfirm={handleModalConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        variant="danger"
        confirmText={modal.step === 'success' ? 'OK' : modal.step === 'prompt' ? 'Continue' : 'Delete Forever'}
        promptPlaceholder='Type "DELETE"'
        promptMatch="DELETE"
      />
    </div>
  )
}

export default Options
