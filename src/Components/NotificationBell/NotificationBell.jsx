import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../../lib/database'
import { timeAgo, langPath } from '../../utils/helpers'
import './NotificationBell.css'

const NotificationBell = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    const { count } = await getUnreadNotificationCount(user.id)
    setUnreadCount(count)
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await getNotifications(user.id, 20)
    if (data) setNotifications(data)
  }, [user])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n))
    }
    setIsOpen(false)
    if (notification.post_id) {
      navigate(langPath(`/forum/${notification.post_id}`))
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(user.id)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const getNotificationText = (notification) => {
    const username = notification.profiles?.username || '?'
    if (notification.type === 'comment') {
      return t('notifications.commentedOn', { username })
    }
    if (notification.type === 'reply') {
      return t('notifications.repliedTo', { username })
    }
    return ''
  }

  const getTimeText = (dateString) => {
    const { unit, value } = timeAgo(dateString)
    if (unit === 'now') return t('notifications.justNow')
    if (unit === 'minutes') return t('notifications.minutesAgo', { count: value })
    if (unit === 'hours') return t('notifications.hoursAgo', { count: value })
    return t('notifications.daysAgo', { count: value })
  }

  if (!user) return null

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('notifications.title')}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={handleMarkAllRead}>
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">{t('notifications.empty')}</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notification-item-avatar">
                    {n.profiles?.avatar_url ? (
                      <img src={n.profiles.avatar_url} alt="" />
                    ) : (
                      <span>{n.profiles?.username?.charAt(0)?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="notification-item-content">
                    <p className="notification-item-text">{getNotificationText(n)}</p>
                    <span className="notification-item-time">{getTimeText(n.created_at)}</span>
                  </div>
                  {!n.is_read && <span className="notification-item-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
