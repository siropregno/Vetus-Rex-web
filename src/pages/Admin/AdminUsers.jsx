import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminSearchUsers } from '../../lib/database'
import { langPath, formatDate, isUserBanned } from '../../utils/helpers'

const PAGE_SIZE = 25

const AdminUsers = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchUsers = useCallback(async (reset = false) => {
    const offset = reset ? 0 : page * PAGE_SIZE
    setLoading(true)

    const { data, error } = await adminSearchUsers(search, PAGE_SIZE, offset)

    if (!error && data) {
      let filtered = data
      if (roleFilter) {
        filtered = filtered.filter((u) => u.role === roleFilter)
      }
      if (statusFilter === 'banned') {
        filtered = filtered.filter((u) => isUserBanned(u))
      } else if (statusFilter === 'active') {
        filtered = filtered.filter((u) => !isUserBanned(u))
      }
      setUsers(filtered)
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoading(false)
  }, [search, roleFilter, statusFilter, page])

  useEffect(() => {
    fetchUsers(true)
    setPage(0)
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    if (page > 0) fetchUsers()
  }, [page])

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  return (
    <div>
      <div className="admin-header">
        <h1>{t('admin.users')}</h1>
        <p>{t('admin.usersDesc')}</p>
      </div>

      <div className="admin-search-bar">
        <input
          type="text"
          className="admin-search-input"
          placeholder={t('admin.searchPlaceholder')}
          value={search}
          onChange={handleSearch}
        />
        <select
          className="admin-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">{t('admin.allRoles')}</option>
          <option value="user">{t('admin.roles.user')}</option>
          <option value="moderator">{t('admin.roles.moderator')}</option>
          <option value="admin">{t('admin.roles.admin')}</option>
        </select>
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('admin.allStatuses')}</option>
          <option value="active">{t('admin.statusActive')}</option>
          <option value="banned">{t('admin.statusBanned')}</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">{t('admin.loading')}</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">{t('admin.noUsersFound')}</div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.colUsername')}</th>
                  <th>{t('admin.colEmail')}</th>
                  <th>{t('admin.colRole')}</th>
                  <th>{t('admin.colStatus')}</th>
                  <th>{t('admin.colChars')}</th>
                  <th>{t('admin.colJoined')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const banned = isUserBanned(user)
                  return (
                    <tr key={user.id}>
                      <td>
                        <a
                          href={langPath(`/admin/users/${user.id}`)}
                          className="admin-table-link"
                        >
                          {user.username || t('common.unknown')}
                        </a>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-role-badge role-${user.role}`}>
                          {t(`admin.roles.${user.role}`)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${banned ? 'status-banned' : 'status-active'}`}>
                          {banned ? t('admin.statusBanned') : t('admin.statusActive')}
                        </span>
                      </td>
                      <td>{user.character_count}</td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  )
                })}
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

export default AdminUsers
