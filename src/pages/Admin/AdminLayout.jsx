import React from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { langPath } from '../../utils/helpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGauge, faUsers, faClipboardList } from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

const AdminLayout = () => {
  const { t } = useTranslation()
  const { profile, isStaff, loading } = useAuthContext()
  const currentPath = window.location.pathname.replace(/^\/(en|es|de)/, '')

  if (loading) {
    return <div className="admin-loading">{t('admin.loading')}</div>
  }

  if (!isStaff) {
    return (
      <div className="admin-guard">
        <div>
          <h2>{t('admin.unauthorized')}</h2>
          <p>{t('admin.unauthorizedDesc')}</p>
          <a href={langPath('/')} className="admin-btn admin-btn-primary" style={{ marginTop: 16 }}>
            {t('admin.backHome')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">{t('admin.panelTitle')}</div>
        <nav className="admin-sidebar-nav">
          <a
            href={langPath('/admin')}
            className={`admin-sidebar-link${currentPath === '/admin' ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faGauge} />
            {t('admin.dashboard')}
          </a>
          <a
            href={langPath('/admin/users')}
            className={`admin-sidebar-link${currentPath.startsWith('/admin/users') ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faUsers} />
            {t('admin.users')}
          </a>
          <a
            href={langPath('/admin/log')}
            className={`admin-sidebar-link${currentPath === '/admin/log' ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faClipboardList} />
            {t('admin.actionLog')}
          </a>
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
