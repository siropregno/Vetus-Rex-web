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

  useEffect(() => { document.title = t('profile.pageTitle') }, [t])


  useEffect(() => {
    if (!loading && !user) {
      logger.nav('User not authenticated, redirecting to home')
      window.location.href = langPath('/')
    }
  }, [loading, user])

  const tabs = ['info', 'chars', 'options']

  const handleTabClick = (tabName) => {
    setActiveTab(tabName)
  }

  const handleTabKeyDown = (e, tabName) => {
    const idx = tabs.indexOf(tabName)
    let newIdx = idx
    if (e.key === 'ArrowRight') newIdx = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + tabs.length) % tabs.length
    else return
    e.preventDefault()
    setActiveTab(tabs[newIdx])
    e.target.parentElement.parentElement.querySelectorAll('[role="tab"]')[newIdx]?.focus()
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
          <ul role="tablist">
            <li role="tab" aria-selected={activeTab === 'info'} tabIndex={activeTab === 'info' ? 0 : -1} className={activeTab === 'info' ? 'active' : ''} onClick={() => handleTabClick('info')} onKeyDown={(e) => handleTabKeyDown(e, 'info')}>
              {t('profile.tabInfo')}
            </li>
            <li role="tab" aria-selected={activeTab === 'chars'} tabIndex={activeTab === 'chars' ? 0 : -1} className={activeTab === 'chars' ? 'active' : ''} onClick={() => handleTabClick('chars')} onKeyDown={(e) => handleTabKeyDown(e, 'chars')}>
              {t('profile.tabChars')}
            </li>
            <li role="tab" aria-selected={activeTab === 'options'} tabIndex={activeTab === 'options' ? 0 : -1} className={activeTab === 'options' ? 'active' : ''} onClick={() => handleTabClick('options')} onKeyDown={(e) => handleTabKeyDown(e, 'options')}>
              {t('profile.tabOptions')}
            </li>
          </ul>
        </div>
        
        <div className="profile-content" role="tabpanel">
          {renderActiveComponent()}
        </div>
      </div>
    </>
  )
}

export default Profile
