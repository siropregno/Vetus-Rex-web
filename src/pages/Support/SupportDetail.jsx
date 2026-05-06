import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DOMPurify from 'dompurify'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getTicketById, getTicketMessages, addTicketMessage } from '../../lib/database'
import { TICKET_TAGS, TICKET_STATUSES, TICKET_PRIORITIES, langPath, formatDate, stripHtml } from '../../utils/helpers'
import logger from '../../utils/logger'
import supportAvatar from '../../assets/pfp-vetus.png'
import './Support.css'

const SupportDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user, profile, isAuthenticated } = useAuthContext()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [ticketRes, messagesRes] = await Promise.all([
        getTicketById(id),
        getTicketMessages(id),
      ])

      if (ticketRes.error) {
        logger.error('Error loading ticket:', ticketRes.error)
      } else {
        setTicket(ticketRes.data)
        document.title = `${stripHtml(ticketRes.data.subject).substring(0, 80)} | ${t('support.title')}`
      }

      if (!messagesRes.error) {
        setMessages(messagesRes.data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [id, t])

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)

    const { data, error } = await addTicketMessage(id, reply.trim(), user.id, isStaff)

    if (error) {
      logger.error('Error sending reply:', error)
      setSending(false)
      return
    }

    setMessages((prev) => [...prev, data])
    setReply('')
    setSending(false)
  }

  if (loading) {
    return (
      <div className="support-detail-page">
        <div className="empty-state"><p>{t('forum.loading')}</p></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="support-detail-page">
        <Link to={langPath('/support')} className="back-link">{t('support.backToSupport')}</Link>
        <div className="empty-state"><p>Ticket not found.</p></div>
      </div>
    )
  }

  const tag = TICKET_TAGS[ticket.tag]
  const status = TICKET_STATUSES[ticket.status]
  const priorityDef = TICKET_PRIORITIES[ticket.priority]
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'

  return (
    <div className="support-detail-page">
      <Link to={langPath('/support')} className="back-link">
        {t('support.backToSupport')}
      </Link>

      <div className="support-detail-header">
        <h2>{ticket.subject}</h2>
        <div className="support-detail-meta">
          {tag && (
            <span className="support-badge" style={{ background: `${tag.color}20`, color: tag.color }}>
              <FontAwesomeIcon icon={tag.icon} /> {t(tag.label)}
            </span>
          )}
          {status && (
            <span className="support-badge" style={{ background: `${status.color}20`, color: status.color }}>
              {t(status.label)}
            </span>
          )}
          {priorityDef && (
            <span className="support-badge" style={{ background: `${priorityDef.color}20`, color: priorityDef.color }}>
              {t(priorityDef.label)}
            </span>
          )}
          <span className="support-detail-date">
            {t('support.created')} {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>

      <div className="support-messages">
        {messages.map((msg) => {
          const authorProfile = msg.profiles
          const isStaffMsg = msg.is_staff_reply
          const displayName = isStaffMsg ? t('support.supportTeamName') : (authorProfile?.username || t('common.unknown'))
          const displayAvatar = isStaffMsg ? supportAvatar : authorProfile?.avatar_url
          const initial = isStaffMsg ? 'V' : (authorProfile?.username?.charAt(0)?.toUpperCase() || '?')
          return (
            <div key={msg.id} className={`support-message${isStaffMsg ? ' staff-message' : ''}`}>
              <div className="support-message-avatar">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} />
                ) : (
                  <span className="support-message-avatar-initial">{initial}</span>
                )}
              </div>
              <div className="support-message-body">
                <div className="support-message-header">
                  <span className="support-message-author">
                    {displayName}
                  </span>
                  {isStaffMsg && (
                    <span className="support-message-staff-tag">{t('support.staffReply')}</span>
                  )}
                  <span className="support-message-time">{formatDate(msg.created_at)}</span>
                </div>
                <div
                  className="support-message-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {isClosed ? (
        <div className="support-closed-notice">{t('support.closedMessage')}</div>
      ) : isAuthenticated ? (
        <div className="support-reply-form">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t('support.replyPlaceholder')}
            maxLength={10000}
          />
          <div className="support-reply-actions">
            <button
              className="support-reply-btn"
              onClick={handleReply}
              disabled={sending || !reply.trim()}
            >
              {sending ? t('support.sending') : t('support.sendReply')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SupportDetail
