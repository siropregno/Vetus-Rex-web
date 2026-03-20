import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import './Options.css'

const Options = () => {
  const { t, i18n } = useTranslation()
  const { deleteAccount } = useAuthContext()
  const currentLang = i18n.language?.startsWith('es') ? 'es' : i18n.language?.startsWith('de') ? 'de' : 'en'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', step: null })

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
      window.location.href = '/'
    }
  }

  return (
    <div className="options-container">


      <div className="options-section">
        <h3>{t('options.preferences')}</h3>
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.darkTheme')}</h4>
            <p>{t('options.darkThemeDesc')}</p>
          </div>
          <button className="button-b" disabled>
            {t('options.comingSoon')}
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.notifications')}</h4>
            <p>{t('options.notificationsDesc')}</p>
          </div>
          <button className="button-b" disabled>
            {t('options.comingSoon')}
          </button>
        </div>
        
        <div className="option-item">
          <div className="option-info">
            <h4>{t('options.language')}</h4>
            <p>{t('options.languageDesc')}</p>
          </div>
          <div className="language-buttons">
            <button
              className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => i18n.changeLanguage('en')}
            >
              <svg className="lang-btn-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="30" fill="#B22234"/>
                <g fill="#FFF">
                  {[1,3,5,7,9,11].map(i => <rect key={i} y={i*30/13} width="60" height={30/13}/>)}
                </g>
                <rect width="24" height="16.15" fill="#3C3B6E"/>
              </svg>
              English
            </button>
            <button
              className={`lang-btn ${currentLang === 'es' ? 'active' : ''}`}
              onClick={() => i18n.changeLanguage('es')}
            >
              <svg className="lang-btn-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="30" fill="#FFF"/>
                <rect width="60" height="10" fill="#74ACDF"/>
                <rect y="20" width="60" height="10" fill="#74ACDF"/>
                <circle cx="30" cy="15" r="3.5" fill="#F6B40E"/>
              </svg>
              Español
            </button>
            <button
              className={`lang-btn ${currentLang === 'de' ? 'active' : ''}`}
              onClick={() => i18n.changeLanguage('de')}
            >
              <svg className="lang-btn-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="10" fill="#000"/>
                <rect y="10" width="60" height="10" fill="#DD0000"/>
                <rect y="20" width="60" height="10" fill="#FFCC00"/>
              </svg>
              Deutsch
            </button>
          </div>
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
