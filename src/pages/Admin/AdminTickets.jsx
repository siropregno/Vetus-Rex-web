import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { adminGetAllTickets } from '../../lib/database'
import { TICKET_TAGS, TICKET_STATUSES, TICKET_PRIORITIES, langPath, formatDate } from '../../utils/helpers'

const PAGE_SIZE = 25

const AdminTickets = () => {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [search, setSearch] = useState('')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const { data, count, error } = await adminGetAllTickets({
      status: filterStatus || null,
      tag: filterTag || null,
      priority: filterPriority || null,
      search: search || null,
      page,
      pageSize: PAGE_SIZE,
    })
    if (!error) {
      setTickets(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [filterStatus, filterTag, filterPriority, search, page])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterTag, filterPriority, search])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div>
      <div className="admin-header">
        <h1>{t('adminTickets.title')}</h1>
        <p>{t('adminTickets.subtitle')}</p>
      </div>

      <div className="admin-search-bar">
        <input
          type="text"
          className="admin-search-input"
          placeholder={t('admin.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">{t('support.allStatuses')}</option>
          {Object.entries(TICKET_STATUSES).map(([key, s]) => (
            <option key={key} value={key}>{t(s.label)}</option>
          ))}
        </select>
        <select className="admin-filter-select" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="">{t('support.allTags')}</option>
          {Object.entries(TICKET_TAGS).map(([key, tag]) => (
            <option key={key} value={key}>{t(tag.label)}</option>
          ))}
        </select>
        <select className="admin-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">{t('adminTickets.allPriorities')}</option>
          {Object.entries(TICKET_PRIORITIES).map(([key, p]) => (
            <option key={key} value={key}>{t(p.label)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">{t('admin.loading')}</div>
      ) : tickets.length === 0 ? (
        <div className="admin-empty">{t('adminTickets.noTickets')}</div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('support.subject')}</th>
                  <th>{t('adminTickets.ticketBy')}</th>
                  <th>{t('support.tag')}</th>
                  <th>{t('support.priority')}</th>
                  <th>Status</th>
                  <th>{t('support.messages')}</th>
                  <th>{t('support.lastUpdate')}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const tag = TICKET_TAGS[ticket.tag]
                  const status = TICKET_STATUSES[ticket.status]
                  const priority = TICKET_PRIORITIES[ticket.priority]
                  const msgCount = ticket.ticket_messages?.[0]?.count || 0
                  return (
                    <tr key={ticket.id}>
                      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--a-text-muted)' }}>
                        {ticket.id.substring(0, 8)}
                      </td>
                      <td>
                        <a href={langPath(`/admin/support/${ticket.id}`)} className="admin-table-link">
                          {ticket.subject}
                        </a>
                      </td>
                      <td>{ticket.profiles?.username || t('common.unknown')}</td>
                      <td>
                        {tag && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: tag.color, fontSize: '0.8rem' }}>
                            <FontAwesomeIcon icon={tag.icon} /> {t(tag.label)}
                          </span>
                        )}
                      </td>
                      <td>
                        {priority && (
                          <span className="admin-status-badge" style={{ background: `${priority.color}18`, color: priority.color }}>
                            {t(priority.label)}
                          </span>
                        )}
                      </td>
                      <td>
                        {status && (
                          <span className="admin-status-badge" style={{ background: `${status.color}18`, color: status.color }}>
                            {t(status.label)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{msgCount}</td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--a-text-muted)', fontSize: '0.8rem' }}>
                        {formatDate(ticket.updated_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              {page > 1 && (
                <button className="admin-btn" onClick={() => setPage(page - 1)}>
                  ← {t('admin.prev')}
                </button>
              )}
              <span style={{ padding: '8px 12px', color: 'var(--a-text-muted)', fontSize: '0.85rem' }}>
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <button className="admin-btn" onClick={() => setPage(page + 1)}>
                  {t('admin.next')} →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminTickets
