import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { langPath } from '../../utils/helpers'
import logger from '../../utils/logger'
import Info from '../../Components/Info/Info'
import Chars from '../../Components/Chars/Chars'
import Options from '../../Components/Options/Options'
import './Profile.css'

const Profile = () => {
  const { t } = useTranslation()
  const { user, loading } = useAuthContext()
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => { document.title = t('profile.pageTitle') }, [])


  useEffect(() => {
    if (!loading && !user) {
      logger.nav('User not authenticated, redirecting to home')
      window.location.href = langPath('/')
    }
  }, [loading, user])

  const handleTabClick = (tabName) => {
    setActiveTab(tabName)
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'info':
        return <Info />
      case 'chars':
        return <Chars />
      case 'options':
        return <Options />
      default:
        return <Info />
    }
  }


  if (loading || !user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('profile.loadingProfile')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='content-header'>
        <h1 className="content-header-title">{t('profile.title')}</h1>
        <p className="content-header-subtitle">{t('profile.subtitle')}</p>
      </div>
      <div className="content-body">
        <div className='bar-options'>
          <ul>
            <li className={activeTab === 'info' ? 'active' : ''} onClick={() => handleTabClick('info')}>
              {t('profile.tabInfo')}
            </li>
            <li className={activeTab === 'chars' ? 'active' : ''} onClick={() => handleTabClick('chars')}>
              {t('profile.tabChars')}
            </li>
            <li className={activeTab === 'options' ? 'active' : ''} onClick={() => handleTabClick('options')}>
              {t('profile.tabOptions')}
            </li>
          </ul>
        </div>
        
        <div className="profile-content">
          {renderActiveComponent()}
        </div>
      </div>
    </>
  )
}

export default Profile
