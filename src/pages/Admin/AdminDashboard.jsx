import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetStats, adminGetActionLog } from '../../lib/database'
import { langPath, formatDate } from '../../utils/helpers'

const ACTION_ICONS = {
  ban_temp: '🔨',
  ban_perm: '⛔',
  unban: '✅',
  role_change: '🛡️',
  char_rename: '✏️',
  account_delete: '🗑️',
  post_delete: '📝',
  comment_delete: '💬',
}

const AdminDashboard = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [recentLog, setRecentLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [statsRes, logRes] = await Promise.all([
        adminGetStats(),
        adminGetActionLog(null, 10, 0),
      ])
      if (statsRes.data) setStats(statsRes.data)
      if (logRes.data) setRecentLog(logRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="admin-loading">{t('admin.loading')}</div>
  }

  return (
    <div>
      <div className="admin-header">
        <h1>{t('admin.dashboard')}</h1>
        <p>{t('admin.dashboardDesc')}</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card" data-color="blue">
            <div className="admin-stat-value">{stats.total_users}</div>
            <div className="admin-stat-label">{t('admin.statUsers')}</div>
          </div>
          <div className="admin-stat-card" data-color="purple">
            <div className="admin-stat-value">{stats.total_characters}</div>
            <div className="admin-stat-label">{t('admin.statCharacters')}</div>
          </div>
          <div className="admin-stat-card" data-color="red">
            <div className="admin-stat-value">{stats.banned_users}</div>
            <div className="admin-stat-label">{t('admin.statBanned')}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{stats.total_posts}</div>
            <div className="admin-stat-label">{t('admin.statPosts')}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{stats.total_comments}</div>
            <div className="admin-stat-label">{t('admin.statComments')}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{stats.total_news}</div>
            <div className="admin-stat-label">{t('admin.statNews')}</div>
          </div>
          <div className="admin-stat-card" data-color="blue">
            <div className="admin-stat-value">{stats.moderators}</div>
            <div className="admin-stat-label">{t('admin.statModerators')}</div>
          </div>
          <div className="admin-stat-card" data-color="amber">
            <div className="admin-stat-value">{stats.admins}</div>
            <div className="admin-stat-label">{t('admin.statAdmins')}</div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <h3 className="admin-section-title">{t('admin.recentActions')}</h3>
        {recentLog.length === 0 ? (
          <div className="admin-empty">{t('admin.noActions')}</div>
        ) : (
          <div>
            {recentLog.map((entry) => (
              <div key={entry.id} className="admin-activity-item">
                <div className="admin-activity-text">
                  <div className="admin-activity-title">
                    {ACTION_ICONS[entry.action_type] || '📋'}{' '}
                    <strong>{entry.admin_username || t('common.unknown')}</strong>
                    {' → '}
                    {t(`admin.actionTypes.${entry.action_type}`)}
                    {entry.target_username && (
                      <> {t('admin.on')} <a href={langPath(`/admin/users/${entry.target_user_id}`)} className="admin-table-link">{entry.target_username}</a></>
                    )}
                  </div>
                  <div className="admin-activity-meta">
                    {formatDate(entry.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a href={langPath('/admin/log')} className="admin-btn">
                {t('admin.viewAllActions')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
