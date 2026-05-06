import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DOMPurify from 'dompurify'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getTicketById, getTicketMessages, addTicketMessage, adminUpdateTicketStatus } from '../../lib/database'
import { TICKET_TAGS, TICKET_STATUSES, TICKET_PRIORITIES, langPath, formatDate } from '../../utils/helpers'
import logger from '../../utils/logger'
import supportAvatar from '../../assets/pfp-vetus.png'

const AdminTicketDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuthContext()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [ticketRes, messagesRes] = await Promise.all([
        getTicketById(id),
        getTicketMessages(id),
      ])

      if (!ticketRes.error) {
        setTicket(ticketRes.data)
        setNewStatus(ticketRes.data.status)
      }
      if (!messagesRes.error) setMessages(messagesRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const handleStatusChange = async () => {
    if (newStatus === ticket.status) return
    const { error } = await adminUpdateTicketStatus(id, newStatus)
    if (error) {
      logger.error('Error updating ticket status:', error)
      setStatusMsg(t('adminTickets.statusUpdateFailed'))
    } else {
      setTicket((prev) => ({ ...prev, status: newStatus }))
      setStatusMsg(t('adminTickets.statusUpdated'))
      setTimeout(() => setStatusMsg(null), 3000)
    }
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    const { data, error } = await addTicketMessage(id, reply.trim(), user.id, true)
    if (error) {
      logger.error('Error sending staff reply:', error)
    } else {
      setMessages((prev) => [...prev, data])
      setReply('')
    }
    setSending(false)
  }

  if (loading) return <div className="admin-loading">{t('admin.loading')}</div>

  if (!ticket) {
    return (
      <div>
        <a href={langPath('/admin/support')} className="admin-back">← {t('adminTickets.title')}</a>
        <div className="admin-empty">Ticket not found.</div>
      </div>
    )
  }

  const tag = TICKET_TAGS[ticket.tag]
  const status = TICKET_STATUSES[ticket.status]
  const priority = TICKET_PRIORITIES[ticket.priority]

  return (
    <div>
      <a href={langPath('/admin/support')} className="admin-back">
        ← {t('adminTickets.title')}
      </a>

      {/* Ticket Header */}
      <div className="admin-section" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>{ticket.subject}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {tag && (
                <span className="admin-status-badge" style={{ background: `${tag.color}18`, color: tag.color }}>
                  <FontAwesomeIcon icon={tag.icon} /> {t(tag.label)}
                </span>
              )}
              {status && (
                <span className="admin-status-badge" style={{ background: `${status.color}18`, color: status.color }}>
                  {t(status.label)}
                </span>
              )}
              {priority && (
                <span className="admin-status-badge" style={{ background: `${priority.color}18`, color: priority.color }}>
                  {t(priority.label)}
                </span>
              )}
              <span style={{ color: 'var(--a-text-muted)', fontSize: '0.8rem' }}>
                {t('adminTickets.ticketBy')} {ticket.profiles?.username || t('common.unknown')} · {formatDate(ticket.created_at)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="admin-filter-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {Object.entries(TICKET_STATUSES).map(([key, s]) => (
                <option key={key} value={key}>{t(s.label)}</option>
              ))}
            </select>
            <button className="admin-btn admin-btn-primary" onClick={handleStatusChange} disabled={newStatus === ticket.status}>
              {t('adminTickets.updateStatus')}
            </button>
          </div>
        </div>
        {statusMsg && <div className="admin-success" style={{ marginTop: 12 }}>{statusMsg}</div>}
      </div>

      {/* Messages */}
      <div className="admin-section">
        <h3 className="admin-section-title">{t('support.messages')} ({messages.length})</h3>
        {messages.map((msg) => {
          const author = msg.profiles
          const isStaffMsg = msg.is_staff_reply
          const displayName = isStaffMsg ? t('support.supportTeamName') : (author?.username || t('common.unknown'))
          const displayAvatar = isStaffMsg ? supportAvatar : author?.avatar_url
          const initial = isStaffMsg ? 'V' : (author?.username?.charAt(0)?.toUpperCase() || '?')
          return (
            <div
              key={msg.id}
              className={`admin-activity-item admin-ticket-msg${isStaffMsg ? ' staff-reply' : ''}`}
            >
              <div className="admin-ticket-msg-header">
                <div className="admin-ticket-msg-avatar">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} />
                  ) : initial}
                </div>
                <span className="admin-ticket-msg-author">{displayName}</span>
                {isStaffMsg && (
                  <span className="admin-ticket-msg-muted">({author?.username})</span>
                )}
                {isStaffMsg && (
                  <span className="admin-role-badge role-moderator" style={{ fontSize: '0.6rem' }}>
                    {t('support.staffReply')}
                  </span>
                )}
                <span className="admin-ticket-msg-time">{formatDate(msg.created_at)}</span>
              </div>
              <div
                className="admin-ticket-msg-body"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
              />
            </div>
          )
        })}
      </div>

      {/* Staff Reply */}
      <div className="admin-section">
        <h3 className="admin-section-title">{t('adminTickets.replyAsStaff')}</h3>
        <textarea
          className="admin-inline-input admin-reply-textarea"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t('support.replyPlaceholder')}
          maxLength={10000}
        />
        <div className="admin-reply-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleReply}
            disabled={sending || !reply.trim()}
          >
            {sending ? t('support.sending') : t('support.sendReply')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminTicketDetail
