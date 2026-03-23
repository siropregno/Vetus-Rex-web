import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getUserTickets } from '../../lib/database'
import { TICKET_TAGS, TICKET_STATUSES, langPath, formatDate } from '../../utils/helpers'
import logger from '../../utils/logger'
import './Support.css'

const Support = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthContext()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTag, setFilterTag] = useState('')

  useEffect(() => { document.title = t('support.pageTitle') }, [t])

  useEffect(() => {
    if (!user) return
    const fetchTickets = async () => {
      setLoading(true)
      const { data, error } = await getUserTickets(
        user.id,
        filterStatus || null,
        filterTag || null
      )
      if (error) {
        logger.error('Error loading tickets:', error)
      } else {
        setTickets(data || [])
      }
      setLoading(false)
    }
    fetchTickets()
  }, [user, filterStatus, filterTag])

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('support.title')}</h1>
        <p className="content-header-subtitle">{t('support.subtitle')}</p>
      </div>

      <div className="content-body">
        {!isAuthenticated ? (
          <div className="support-login-prompt">
            <p>{t('support.loginRequired')}</p>
            <Link to={langPath('/login')}>{t('nav.signIn')}</Link>
          </div>
        ) : (
          <>
            <div className="support-toolbar">
              <div className="support-toolbar-left">
                <select
                  className="support-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">{t('support.allStatuses')}</option>
                  {Object.entries(TICKET_STATUSES).map(([key, s]) => (
                    <option key={key} value={key}>{t(s.label)}</option>
                  ))}
                </select>
                <select
                  className="support-filter-select"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                >
                  <option value="">{t('support.allTags')}</option>
                  {Object.entries(TICKET_TAGS).map(([key, tag]) => (
                    <option key={key} value={key}>{t(tag.label)}</option>
                  ))}
                </select>
              </div>
              <div className="support-toolbar-right">
                <button
                  className="support-new-btn"
                  onClick={() => navigate(langPath('/support/create'))}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  {t('support.newTicket')}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="support-empty">
                <p>{t('forum.loading')}</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="support-empty">
                <p>{t('support.noTickets')}</p>
                <p className="support-empty-hint">{t('support.noTicketsHint')}</p>
              </div>
            ) : (
              <div className="support-ticket-list">
                {tickets.map((ticket) => {
                  const tag = TICKET_TAGS[ticket.tag]
                  const status = TICKET_STATUSES[ticket.status]
                  const msgCount = ticket.ticket_messages?.[0]?.count || 0
                  return (
                    <Link
                      key={ticket.id}
                      to={langPath(`/support/${ticket.id}`)}
                      className="support-ticket-card"
                    >
                      <div className="support-ticket-info">
                        <div className="support-ticket-subject">{ticket.subject}</div>
                        <div className="support-ticket-meta">
                          <span className="support-ticket-date">
                            {t('support.created')} {formatDate(ticket.created_at)}
                          </span>
                          {msgCount > 0 && (
                            <span className="support-ticket-messages">
                              {msgCount} {t('support.messages')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="support-ticket-badges">
                        {tag && (
                          <span
                            className="support-badge"
                            style={{ background: `${tag.color}20`, color: tag.color }}
                          >
                            <FontAwesomeIcon icon={tag.icon} />
                            {t(tag.label)}
                          </span>
                        )}
                        {status && (
                          <span
                            className="support-badge"
                            style={{ background: `${status.color}20`, color: status.color }}
                          >
                            {t(status.label)}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Support
