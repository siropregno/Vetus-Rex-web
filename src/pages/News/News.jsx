import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getAllNews } from '../../lib/database'
import { NEWS_TAGS, langPath } from '../../utils/helpers'
import NewsCard from '../../Components/NewsCard/NewsCard'
import logger from '../../utils/logger'
import './News.css'

const PAGE_SIZE = 9

const News = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuthContext()

  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const isAdmin = profile?.role === 'admin'

  const fetchNews = useCallback(async (pageNum = 1, tag = null, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const { data, count, error: fetchError } = await getAllNews(pageNum, PAGE_SIZE, tag)

      if (fetchError) {
        logger.error('Error loading news:', fetchError)
        setError(t('news.failedToLoad'))
        return
      }

      setNews(prev => append ? [...prev, ...data] : data)
      setTotalCount(count || 0)
      setError(null)
    } catch (err) {
      logger.error('Unexpected error loading news:', err)
      setError(t('news.failedToLoad'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { document.title = t('news.pageTitle') }, [t])

  useEffect(() => {
    setPage(1)
    fetchNews(1, activeTag)
  }, [activeTag, fetchNews])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchNews(nextPage, activeTag, true)
  }

  const hasMore = news.length < totalCount

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('news.title')}</h1>
        <p className="content-header-subtitle">
          {t('news.subtitle')}
        </p>
      </div>

      <div className="content-body">
        <div className="news-tags-filter">
          <button
            className={`tag-filter-btn ${activeTag === null ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            {t('news.all')}
          </button>
          {Object.entries(NEWS_TAGS).map(([key, tag]) => (
            <button
              key={key}
              className={`tag-filter-btn ${activeTag === key ? 'active' : ''}`}
              style={activeTag === key ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
              onClick={() => setActiveTag(key)}
            >
              {t(tag.label)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">
            <p>{t('news.loadingNews')}</p>
          </div>
        ) : error ? (
          <div className="news-error">
            <p>{error}</p>
            <button className="button-a" onClick={() => fetchNews(1, activeTag)}>
              {t('news.retry')}
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <p>{activeTag ? t('news.noArticlesForTag', { tag: t(NEWS_TAGS[activeTag]?.label) }) : t('news.noArticles')}</p>
            {isAdmin && (
              <button
                className="news-create-card"
                onClick={() => { navigate(langPath('/news/create')) }}
              >
                <span className="news-create-card-icon">+</span>
                <span className="news-create-card-label">{t('news.createNews')}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="news-grid">
              {isAdmin && (
                <button
                  className="news-create-card"
                  onClick={() => { navigate(langPath('/news/create')) }}
                >
                  <div className="news-create-card-content">
                    <span className="news-create-card-icon">+</span>
                    <span className="news-create-card-label">{t('news.createNews')}</span>
                  </div>
                </button>
              )}
              {news.map(article => (
                <NewsCard key={article.id} news={article} />
              ))}
            </div>

            {hasMore && (
              <div className="news-load-more">
                <button
                  className="button-b"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? t('news.loading') : t('news.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default News
