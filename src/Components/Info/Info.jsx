import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { supabase } from '../../lib/supabase'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import './Info.css'

const Info = () => {
  const { user, profile, updateProfile, uploadAvatar, deleteAvatar, loading } = useAuthContext()
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: profile?.username || user.user_metadata?.username || '',
        email: user.email || ''
      })
    }
  }, [user, profile])

  const showSuccessToast = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setTimeout(() => setToastMessage(''), 300) // Time for exit animation
    }, 3000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await updateProfile({
        username: formData.username,
        full_name: formData.username
      })

      if (error) {
        setError(error.message)
      } else {
        showSuccessToast('Profile updated successfully')
        setIsEditing(false)
      }
    } catch (err) {
      setError('Unexpected error while updating profile')
      logger.error('Error updating profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setError('')
    if (user && profile) {
      setFormData({
        username: profile.username || '',
        email: user.email || ''
      })
    }
  }

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.trim()[0].toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    handleAvatarUpload(file)
  }

  const handleAvatarUpload = async (file) => {
    setIsUploadingAvatar(true)
    setError('')

    try {
      const { error } = await uploadAvatar(file)
      
      if (error) {
        setError(error.message || 'Error uploading image')
      } else {
        showSuccessToast('Avatar updated successfully')
      }
    } catch {
      setError('Unexpected error while uploading image')
    } finally {
      setIsUploadingAvatar(false)
      setAvatarPreview(null)
    }
  }

  const handleDeleteAvatar = async () => {
    setShowDeleteAvatarModal(true)
  }

  const confirmDeleteAvatar = async () => {
    setShowDeleteAvatarModal(false)
    setIsUploadingAvatar(true)
    setError('')

    try {
      const { error } = await deleteAvatar()
      
      if (error) {
        setError(error.message || 'Error deleting image')
      } else {
        showSuccessToast('Avatar deleted successfully')
      }
    } catch {
      setError('Unexpected error while deleting image')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="info-container">
      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-circle">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="avatar-img" />
          ) : profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="avatar-img"
            />
          ) : (
            <span className="avatar-initials">
              {getInitials(formData.username, formData.email)}
            </span>
          )}
          {isUploadingAvatar && (
            <div className="avatar-loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        <div className="avatar-actions">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="avatar-input"
            id="avatar-upload"
            disabled={isUploadingAvatar}
          />
          <label htmlFor="avatar-upload" className="button-a">
            {isUploadingAvatar ? 'Uploading...' : 'Change photo'}
          </label>
          {profile?.avatar_url && (
            <button
              onClick={handleDeleteAvatar}
              className="button-b"
              disabled={isUploadingAvatar}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              className="input-field"
              value={formData.email}
              disabled
              readOnly
            />
          ) : (
            <span className="field-value">{formData.email}</span>
          )}
        </div>

        <div className="form-group">
          <label>Username:</label>
          {isEditing ? (
            <input
              type="text"
              className="input-field"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Your username"
              disabled={isLoading}
              required
            />
          ) : (
            <span className="field-value">{formData.username}</span>
          )}
        </div>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}



        <div className="form-actions">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="button-a"
            >
              Edit profile
            </button>
          ) : (
            <div className="button-group">
              <button
                type="submit"
                className="button-a"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="button-b"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Account Info */}
      <div className="account-info">
        <div className="info-item">
          <span className="label">Member since</span>
          <span className="value">{formatDate(profile?.created_at)}</span>
        </div>
      </div>

      {/* Debug Section - Solo si no hay perfil */}
      {user && !profile && !loading && (
        <div className="debug-section">
          <p>Profile not found. The profile needs to be created in the database.</p>
          <button
            onClick={async () => {
              setIsLoading(true)
              setError('')
              
              try {
                const defaultProfile = {
                  id: user.id,
                  email: user.email,
                  username: user.user_metadata?.username || '',
                  full_name: user.user_metadata?.username || '',
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                
                const { error } = await supabase
                  .from('profiles')
                  .insert([defaultProfile])
                  .select()
                  .single()
                
                if (error) {
                  setError('Error: ' + error.message)
                } else {
                  showSuccessToast('Profile created successfully')
                  setTimeout(() => window.location.reload(), 1500)
                }
              } catch {
                setError('Unexpected error')
              } finally {
                setIsLoading(false)
              }
            }}
            className="button-a"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create profile'}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${showToast ? 'toast-show' : ''}`}>
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-message">{toastMessage}</span>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteAvatarModal}
        onClose={() => setShowDeleteAvatarModal(false)}
        onConfirm={confirmDeleteAvatar}
        title="Delete Avatar"
        message="Are you sure you want to delete your profile picture?"
        type="confirm"
        variant="danger"
        confirmText="Delete"
      />
    </div>
  )
}

export default Info
