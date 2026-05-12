import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { isUserBanned, getBanExpiry, isBanPermanent } from '../../utils/helpers'
import './Info.css'

const Info = () => {
  const { t } = useTranslation()
  const { user, profile, updateProfile, uploadAvatar, deleteAvatar } = useAuthContext()
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
        showSuccessToast(t('info.profileUpdated'))
        setIsEditing(false)
      }
    } catch (err) {
      setError(t('info.unexpectedError'))
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
      setError(t('info.invalidImage'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('info.imageTooLarge'))
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
        setError(error.message || t('info.uploadError'))
      } else {
        showSuccessToast(t('info.avatarUpdated'))
      }
    } catch {
      setError(t('info.unexpectedUploadError'))
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
        setError(error.message || t('info.deleteError'))
      } else {
        showSuccessToast(t('info.avatarDeleted'))
      }
    } catch {
      setError(t('info.unexpectedDeleteError'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('info.dateNotAvailable')
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="info-container">

      <div className="avatar-section">
        <div className="avatar-circle">
          {avatarPreview ? (
            <img src={avatarPreview} alt={t('info.avatarPreview', 'Avatar preview')} className="avatar-img" />
          ) : profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={formData.username || t('info.avatar', 'User avatar')}
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
          <label htmlFor="avatar-upload" className="icon-btn" title={t('info.changePhoto')} aria-label={t('info.changePhoto')}>
            <FontAwesomeIcon icon={faPen} />
          </label>
          {profile?.avatar_url && (
            <button
              onClick={handleDeleteAvatar}
              className="icon-btn danger"
              disabled={isUploadingAvatar}
              title={t('info.delete')}
              aria-label={t('info.delete')}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>


      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>{t('info.email')}</label>
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
          <label>{t('info.username')}</label>
          {isEditing ? (
            <input
              type="text"
              className="input-field"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('info.usernamePlaceholder')}
              disabled={isLoading}
              required
            />
          ) : (
            <span className="field-value">{formData.username}</span>
          )}
        </div>

        {error && (
          <div className="message error" role="alert" aria-live="polite">
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
              {t('info.editProfile')}
            </button>
          ) : (
            <div className="button-group">
              <button
                type="submit"
                className="button-a"
                disabled={isLoading}
              >
                {isLoading ? t('info.saving') : t('info.save')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="button-b"
                disabled={isLoading}
              >
                {t('info.cancel')}
              </button>
            </div>
          )}
        </div>
      </form>


      <div className="account-info">
        <div className="info-item">
          <span className="label">{t('info.memberSince')}</span>
          <span className="value">{formatDate(profile?.created_at)}</span>
        </div>
      </div>

      {isUserBanned(profile) && (
        <div className="suspended-banner">
          <p className="suspended-banner-title">{t('common.accountSuspended')}</p>
          <p>{isBanPermanent(profile)
            ? t('common.banExpires', { date: t('common.banPermanent') })
            : t('common.banExpires', { date: getBanExpiry(profile)?.toLocaleDateString() })}
          </p>
          {profile?.ban_reason && (
            <p>{t('common.banReason', { reason: profile.ban_reason })}</p>
          )}
        </div>
      )}


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
        title={t('info.deleteAvatarTitle')}
        message={t('info.deleteAvatarMessage')}
        type="confirm"
        variant="danger"
        confirmText={t('common.delete')}
      />
    </div>
  )
}

export default Info
