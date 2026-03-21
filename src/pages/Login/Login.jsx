import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { langPath } from '../../utils/helpers'
import logger from '../../utils/logger'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, user } = useAuthContext()

  useEffect(() => { document.title = t('login.pageTitle') }, [t])


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

    try {
      const { error } = await signIn(formData.email.trim(), formData.password)
      if (error) {
        setError(error.message)
      } else {
        window.location.href = langPath('/')
      }
    } catch (err) {
      setError(t('login.unexpectedError'))
      logger.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="content-container">
      <div className="login-card">

        <div className="login-header">
          <h2 className="login-title">{t('login.title')}</h2>
        </div>


        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder={t('login.emailPlaceholder')}
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
              placeholder={t('login.passwordPlaceholder')}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="error-message" role="alert" aria-live="polite">
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
                {t('login.submitLoading')}
              </>
            ) : (
              t('login.submit')
            )}
          </button>
        </form>


        <div className="login-footer">
          <p className="toggle-text">
            {t('login.noAccount')}
            <a href={langPath('/register')} className="toggle-btn">
              {t('login.createAccount')}
            </a>
          </p>
        </div>


        <div className="back-home">
          <button
            type="button"
            onClick={() => { navigate(langPath('/')) }}
            className="back-btn"
            disabled={loading}
          >
            {t('login.backHome')}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login
