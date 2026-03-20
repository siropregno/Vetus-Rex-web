import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { langPath } from '../../utils/helpers'
import logger from '../../utils/logger'
import './Register.css'

const Register = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp, user } = useAuthContext()

  useEffect(() => { document.title = t('register.pageTitle') }, [])


  useEffect(() => {
    if (user) {
      window.location.href = langPath('/')
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.username.trim()) {
      setError(t('register.usernameRequired'))
      setLoading(false)
      return
    }

    if (formData.username.trim().includes(' ')) {
      setError(t('register.usernameNoSpaces'))
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username.trim()
      })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = langPath('/')
      }
    } catch (err) {
      setError(t('register.unexpectedError'))
      logger.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="content-container">
      <div className="register-card">

        <div className="register-header">
          <h1 className="register-title">{t('register.title')}</h1>
          <p className="register-subtitle">{t('register.subtitle')}</p>
        </div>


        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder={t('register.usernamePlaceholder')}
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
            />
            <small className="form-help">
              {t('register.usernameHelp')}
            </small>
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder={t('register.emailPlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder={t('register.passwordPlaceholder')}
              required
              disabled={loading}
              minLength={8}
            />
            <small className="form-help">
              {t('register.passwordHelp')}
            </small>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`button-a ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                {t('register.submitLoading')}
              </>
            ) : (
              t('register.submit')
            )}
          </button>
        </form>


        <div className="register-footer">
          <p className="toggle-text">
            {t('register.hasAccount')}
            <a href={langPath('/login')} className="toggle-btn">
              {t('register.signIn')}
            </a>
          </p>
        </div>


        <div className="back-home">
          <button
            type="button"
            onClick={() => { window.location.href = langPath('/') }}
            className="back-btn"
            disabled={loading}
          >
            {t('register.backHome')}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default Register
