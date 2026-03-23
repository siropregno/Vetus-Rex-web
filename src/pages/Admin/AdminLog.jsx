import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetActionLog } from '../../lib/database'
import { langPath, formatDate } from '../../utils/helpers'

const ACTION_TYPES = [
  'ban_temp', 'ban_perm', 'unban',
  'role_change', 'char_rename',
  'account_delete', 'post_delete', 'comment_delete',
]

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

const PAGE_SIZE = 50

const AdminLog = () => {
  const { t } = useTranslation()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    const { data, error } = await adminGetActionLog(
      filter || null,
      PAGE_SIZE,
      page * PAGE_SIZE
    )
    if (!error && data) {
      setEntries(data)
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [filter, page])

  useEffect(() => {
    setPage(0)
  }, [filter])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  const formatDetails = (entry) => {
    const d = entry.details || {}
    switch (entry.action_type) {
      case 'ban_temp':
        return `${d.ban_days} ${t('admin.days')}${d.reason ? ` - ${d.reason}` : ''}`
      case 'ban_perm':
        return d.reason || t('admin.permanent')
      case 'unban':
        return ''
      case 'role_change':
        return `${d.old_role} → ${d.new_role}`
      case 'char_rename':
        return `"${d.old_name}" → "${d.new_name}"${d.reason ? ` (${d.reason})` : ''}`
      case 'account_delete':
        return d.username || ''
      case 'post_delete':
        return d.post_title || ''
      case 'comment_delete':
        return d.content_preview || ''
      default:
        return JSON.stringify(d)
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1>{t('admin.actionLog')}</h1>
        <p>{t('admin.actionLogDesc')}</p>
      </div>

      <div className="admin-search-bar">
        <select
          className="admin-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">{t('admin.allActions')}</option>
          {ACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTION_ICONS[type]} {t(`admin.actionTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">{t('admin.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="admin-empty">{t('admin.noActions')}</div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.colDate')}</th>
                  <th>{t('admin.colAdmin')}</th>
                  <th>{t('admin.colAction')}</th>
                  <th>{t('admin.colTarget')}</th>
                  <th>{t('admin.colDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="admin-nowrap">{formatDate(entry.created_at)}</td>
                    <td>{entry.admin_username || t('common.unknown')}</td>
                    <td>
                      {ACTION_ICONS[entry.action_type]}{' '}
                      {t(`admin.actionTypes.${entry.action_type}`)}
                    </td>
                    <td>
                      {entry.target_user_id ? (
                        <a
                          href={langPath(`/admin/users/${entry.target_user_id}`)}
                          className="admin-table-link"
                        >
                          {entry.target_username || t('admin.deletedUser')}
                        </a>
                      ) : (
                        <span className="admin-muted">
                          {t('admin.deletedUser')}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="admin-log-details" title={formatDetails(entry)}>
                        {formatDetails(entry)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            {page > 0 && (
              <button className="admin-btn" onClick={() => setPage(page - 1)}>
                ← {t('admin.prev')}
              </button>
            )}
            {hasMore && (
              <button className="admin-btn" onClick={() => setPage(page + 1)}>
                {t('admin.next')} →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminLog
