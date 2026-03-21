import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { langPath } from '../../utils/helpers'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import './Options.css'

const Options = () => {
  const { t, i18n } = useTranslation()
  const { deleteAccount, profile, updateProfile } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', step: null })
  const [togglingNotif, setTogglingNotif] = useState(false)

  const emailNotifications = profile?.email_notifications ?? true

  const handleToggleNotifications = async () => {
    setTogglingNotif(true)
    try {
      const { error } = await updateProfile({ email_notifications: !emailNotifications })
      if (error) {
        logger.error('Error toggling notifications:', error)
      }
    } catch (err) {
      logger.error('Unexpected error toggling notifications:', err)
    } finally {
      setTogglingNotif(false)
    }
  }

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: t('options.deleteAccountPromptTitle'),
      message: t('options.deleteAccountPromptMessage'),
      step: 'prompt'
    })
  }

  const handleModalConfirm = async (value) => {
    if (modal.step === 'prompt') {

      setModal({
        isOpen: true,
        type: 'confirm',
        title: t('options.finalConfirmTitle'),
        message: t('options.finalConfirmMessage'),
        step: 'final'
      })
    } else if (modal.step === 'final') {
      setModal(m => ({ ...m, isOpen: false }))
      setIsLoading(true)
      setError('')

      try {
        const { error } = await deleteAccount()
        
        if (error) {
          setError(error.message || t('options.unexpectedError'))
        } else {
          setModal({
            isOpen: true,
            type: 'alert',
            title: t('options.accountDeletedTitle'),
            message: t('options.accountDeletedMessage'),
            step: 'success'
          })
        }
      } catch (err) {
        setError(t('options.unexpectedError'))
        logger.error('Error deleting account:', err)
      } finally {
        setIsLoading(false)
      }
    } else if (modal.step === 'success') {
      setModal(m => ({ ...m, isOpen: false }))
      window.location.href = langPath('/')
    }
  }

  return (
    <div className="options-container">


      <div className="options-section">
        <h3>{t('options.preferences')}</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.notifications')}</h4>
            <p>{t('options.notificationsDesc')}</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={handleToggleNotifications}
              disabled={togglingNotif}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>


      <div className="options-section">
        <h3>{t('options.privacySecurity')}</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.changePassword')}</h4>
            <p>{t('options.changePasswordDesc')}</p>
          </div>
          <button className="button-b" disabled>
            {t('options.comingSoon')}
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.twoFactor')}</h4>
            <p>{t('options.twoFactorDesc')}</p>
          </div>
          <button className="button-b" disabled>
            {t('options.comingSoon')}
          </button>
        </div>
      </div>


      <div className="options-section">
        <h3>{t('options.data')}</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.exportData')}</h4>
            <p>{t('options.exportDataDesc')}</p>
          </div>
          <button className="button-b" disabled>
            {t('options.comingSoon')}
          </button>
        </div>
      </div>


      <div className="danger-zone">
        <h3>{t('options.dangerZone')}</h3>
        <div className="danger-content">
          <div className="danger-item">
            <div className="danger-info">
              <h4>{t('options.deleteAccount')}</h4>
              <p>{t('options.deleteAccountDesc')}</p>
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
              {isLoading ? t('options.deleting') : t('common.delete')}
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
        confirmText={modal.step === 'success' ? t('modal.ok') : modal.step === 'prompt' ? t('options.continue') : t('options.deleteForever')}
        promptPlaceholder={t('options.promptPlaceholder')}
        promptMatch="DELETE"
      />
    </div>
  )
}

export default Options
