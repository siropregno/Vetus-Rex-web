import React, { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getAllNews } from '../../lib/database'
import { NEWS_TAGS } from '../../utils/helpers'
import NewsCard from '../../Components/NewsCard/NewsCard'
import logger from '../../utils/logger'
import './News.css'

const PAGE_SIZE = 9

const News = () => {
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
        setError('Failed to load news. Please try again.')
        return
      }

      setNews(prev => append ? [...prev, ...data] : data)
      setTotalCount(count || 0)
      setError(null)
    } catch (err) {
      logger.error('Unexpected error loading news:', err)
      setError('Failed to load news. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

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
    <div className="news-page">
      <div className="news-page-header">
        <div className="news-page-title-row">
          <h1 className="content-header-title">News</h1>
          {isAdmin && (
            <button
              className="button-a"
              onClick={() => { window.location.href = '/news/create' }}
            >
              + New Post
            </button>
          )}
        </div>
        <p className="content-header-subtitle">
          Stay up to date with the latest updates, patches, and events
        </p>
      </div>

      {/* Tag filters */}
      <div className="news-tags-filter">
        <button
          className={`tag-filter-btn ${activeTag === null ? 'active' : ''}`}
          onClick={() => setActiveTag(null)}
        >
          All
        </button>
        {Object.entries(NEWS_TAGS).map(([key, tag]) => (
          <button
            key={key}
            className={`tag-filter-btn ${activeTag === key ? 'active' : ''}`}
            style={activeTag === key ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
            onClick={() => setActiveTag(key)}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="news-loading">
          <p>Loading news...</p>
        </div>
      ) : error ? (
        <div className="news-error">
          <p>{error}</p>
          <button className="button-a" onClick={() => fetchNews(1, activeTag)}>
            Retry
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="news-empty">
          <p>No news articles found{activeTag ? ` for "${NEWS_TAGS[activeTag]?.label}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="news-grid">
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
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default News
