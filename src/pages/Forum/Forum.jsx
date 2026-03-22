import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getForumCategoryStats } from '../../lib/database'
import { FORUM_CATEGORIES, langPath, formatDate } from '../../utils/helpers'
import logger from '../../utils/logger'
import './Forum.css'

const Forum = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthContext()

  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = t('forum.pageTitle') }, [t])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const { data, error: fetchError } = await getForumCategoryStats()
      if (fetchError) {
        logger.error('Error loading forum stats:', fetchError)
        setError(t('forum.failedToLoad'))
      } else {
        setStats(data || {})
        setError(null)
      }
      setLoading(false)
    }
    fetchStats()
  }, [t])

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('forum.title')}</h1>
        <p className="content-header-subtitle">{t('forum.subtitle')}</p>
      </div>

      <div className="content-body">
        <div className="forum-toolbar">
          <div className="forum-toolbar-left">
            <button
              className="button-b forum-rules-btn"
              onClick={() => navigate(langPath('/forum/rules'))}
            >
              📜 {t('forum.rulesButton')}
            </button>
          </div>
          <div className="forum-toolbar-right">
            {isAuthenticated && (
              <button
                className="button-a"
                onClick={() => navigate(langPath('/forum/create'))}
              >
                {t('forum.newPost')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="forum-loading">
            <p>{t('forum.loading')}</p>
          </div>
        ) : error ? (
          <div className="forum-error">
            <p>{error}</p>
          </div>
        ) : (
          <div className="forum-category-list">
            <div className="forum-category-header">
              <span className="forum-col-category">{t('forum.columnCategory')}</span>
              <span className="forum-col-posts">{t('forum.columnPosts')}</span>
              <span className="forum-col-last">{t('forum.columnLastPost')}</span>
            </div>
            {Object.entries(FORUM_CATEGORIES).map(([key, cat]) => {
              const catStats = stats[key] || { count: 0, lastPost: null }
              return (
                <Link
                  key={key}
                  to={langPath(`/forum/category/${key}`)}
                  className="forum-category-row"
                >
                  <div className="forum-col-category">
                    <span className="forum-category-icon" style={{ backgroundColor: cat.color }}>
                      <FontAwesomeIcon icon={cat.icon} />
                    </span>
                    <div className="forum-category-info">
                      <span className="forum-category-name">{t(`forumCategories.${key}`)}</span>
                      <span className="forum-category-desc">{t(`forumCategories.${key}Desc`)}</span>
                    </div>
                  </div>
                  <div className="forum-col-posts">
                    <span className="forum-stat-number">{catStats.count}</span>
                    <span className="forum-stat-label">{t('forum.columnPosts')}</span>
                  </div>
                  <div className="forum-col-last">
                    {catStats.lastPost ? (
                      <>
                        <span className="forum-last-title">{catStats.lastPost.title}</span>
                        <span className="forum-last-meta">
                          {t('forum.by')} {catStats.lastPost.author} — {formatDate(catStats.lastPost.created_at)}
                        </span>
                      </>
                    ) : (
                      <span className="forum-last-meta">{t('forum.noPosts')}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export default Forum
