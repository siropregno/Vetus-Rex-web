import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import './Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, user } = useAuthContext()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = '/'
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
        window.location.href = '/'
      }
    } catch (err) {
      setError('Unexpected error. Please try again.')
      logger.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="content-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">Sign In</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Email or username"
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
              placeholder="Password"
              required
              disabled={loading}
              minLength={6}
            />
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="login-footer">
          <p className="toggle-text">
            Don't have an account?
            <a href="/register" className="toggle-btn">
              Create Account
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="back-home">
          <button
            type="button"
            onClick={() => { window.location.href = '/' }}
            className="back-btn"
            disabled={loading}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login
