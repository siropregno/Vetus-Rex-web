import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import Info from '../../Components/Info/Info'
import Chars from '../../Components/Chars/Chars'
import Options from '../../Components/Options/Options'
import './Profile.css'

const Profile = () => {
  const { user, loading } = useAuthContext()
  const [activeTab, setActiveTab] = useState('info')

  // Redirect to home if not authenticated (only after loading finishes)
  useEffect(() => {
    if (!loading && !user) {
      logger.nav('User not authenticated, redirecting to home')
      window.location.href = '/'
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

  // Mientras carga la sesión, mostrar spinner
  if (loading || !user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='content-header'>
        <h1 className="content-header-title">My Profile</h1>
        <p className="content-header-subtitle">Here you can view and edit your account information.</p>
      </div>
      <div className="content-body">
        <div className='bar-options'>
          <ul>
            <li className={activeTab === 'info' ? 'active' : ''} onClick={() => handleTabClick('info')}>
              Info
            </li>
            <li className={activeTab === 'chars' ? 'active' : ''} onClick={() => handleTabClick('chars')}>
              Characters
            </li>
            <li className={activeTab === 'options' ? 'active' : ''} onClick={() => handleTabClick('options')}>
              Options
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
