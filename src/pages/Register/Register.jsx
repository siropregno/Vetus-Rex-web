import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import logger from '../../utils/logger'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp, user } = useAuthContext()

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

    if (!formData.username.trim()) {
      setError('Username is required')
      setLoading(false)
      return
    }

    if (formData.username.trim().includes(' ')) {
      setError('Username cannot contain spaces')
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
        window.location.href = '/'
      }
    } catch (err) {
      setError('Unexpected error. Please try again.')
      logger.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="content-container">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join the community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder="Username"
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
            />
            <small className="form-help">
              3-20 characters, no spaces
            </small>
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Email"
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
              minLength={8}
            />
            <small className="form-help">
              Minimum 8 characters
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="register-footer">
          <p className="toggle-text">
            Already have an account?
            <a href="/login" className="toggle-btn">
              Sign In
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

export default Register
