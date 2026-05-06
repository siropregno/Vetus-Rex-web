import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuthContext } from '../../hooks/useAuthContext'
import { createTicket } from '../../lib/database'
import { TICKET_TAGS, TICKET_PRIORITIES, langPath } from '../../utils/helpers'
import logger from '../../utils/logger'
import './Support.css'

const SupportCreate = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthContext()

  const [subject, setSubject] = useState('')
  const [tag, setTag] = useState('')
  const [priority, setPriority] = useState('normal')
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!subject.trim()) return setError(t('support.subjectRequired'))
    if (!tag) return setError(t('support.tagRequired'))
    if (!content.trim()) return setError(t('support.contentRequired'))

    setSubmitting(true)
    const { data, error: createError } = await createTicket({
      subject: subject.trim(),
      tag,
      priority,
      content: content.trim(),
      user_id: user.id,
    })

    if (createError) {
      logger.error('Error creating ticket:', createError)
      setError(t('support.createFailed'))
      setSubmitting(false)
      return
    }

    navigate(langPath(`/support/${data.id}`))
  }

  if (!isAuthenticated) {
    return (
      <div className="support-create-page">
        <div className="support-login-prompt">
          <p>{t('support.loginRequired')}</p>
          <Link to={langPath('/login')}>{t('nav.signIn')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="support-create-page">
      <Link to={langPath('/support')} className="back-link">
        {t('support.backToSupport')}
      </Link>

      <h2>{t('support.createTitle')}</h2>

      <form className="support-form" onSubmit={handleSubmit}>
        <div className="support-form-group">
          <label>{t('support.subject')}</label>
          <input
            className="support-filter-select support-subject-input"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('support.subjectPlaceholder')}
            maxLength={200}
          />
        </div>

        <div className="support-form-group">
          <label>{t('support.tag')}</label>
          <div className="support-tag-options">
            {Object.entries(TICKET_TAGS).map(([key, tagDef]) => (
              <button
                key={key}
                type="button"
                className={`support-tag-btn${tag === key ? ' active' : ''}`}
                onClick={() => setTag(key)}
              >
                <FontAwesomeIcon icon={tagDef.icon} />
                {t(tagDef.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="support-form-group">
          <label>{t('support.priorityLabel')}</label>
          <div className="support-priority-options">
            {Object.entries(TICKET_PRIORITIES).map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={`support-priority-btn${priority === key ? ' active' : ''}`}
                style={priority === key ? { borderColor: p.color, color: p.color, background: `${p.color}15` } : {}}
                onClick={() => setPriority(key)}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="support-form-group">
          <label>{t('support.content')}</label>
          <textarea
            className="support-content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('support.subjectPlaceholder')}
            maxLength={10000}
          />
        </div>

        {error && <div className="support-form-error">{error}</div>}

        <div className="support-form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(langPath('/support'))}
          >
            {t('support.cancel')}
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? t('support.submitting') : t('support.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SupportCreate
