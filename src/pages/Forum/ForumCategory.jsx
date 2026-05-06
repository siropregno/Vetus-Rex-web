import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getAllForumPosts } from '../../lib/database'
import { FORUM_CATEGORIES, langPath, formatDate, getAuthorName, isProfileAdmin } from '../../utils/helpers'
import logger from '../../utils/logger'
import './ForumCategory.css'

const PAGE_SIZE = 20

const ForumCategory = () => {
  const { t } = useTranslation()
  const { category: categoryKey } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthContext()

  const category = FORUM_CATEGORIES[categoryKey]

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const searchTimeout = useRef(null)

  const fetchPosts = useCallback(async (pageNum = 1, searchTerm = null, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const { data, count, error: fetchError } = await getAllForumPosts(pageNum, PAGE_SIZE, categoryKey, searchTerm)

      if (fetchError) {
        logger.error('Error loading forum posts:', fetchError)
        setError(t('forum.failedToLoad'))
        return
      }

      setPosts(prev => append ? [...prev, ...data] : data)
      setTotalCount(count || 0)
      setError(null)
    } catch (err) {
      logger.error('Unexpected error loading forum posts:', err)
      setError(t('forum.failedToLoad'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [categoryKey, t])

  useEffect(() => {
    if (!category) return
    document.title = `Vetus Rex | ${t(`forumCategories.${categoryKey}`)}`
  }, [t, categoryKey, category])

  useEffect(() => {
    if (!category) return
    setPage(1)
    fetchPosts(1, searchQuery)
  }, [categoryKey, searchQuery, fetchPosts, category])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value.trim() || null)
    }, 400)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage, searchQuery, true)
  }

  if (!category) {
    navigate(langPath('/forum'), { replace: true })
    return null
  }

  const hasMore = posts.length < totalCount

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">
          <span className="fc-header-icon" style={{ backgroundColor: category.color }}><FontAwesomeIcon icon={category.icon} /></span>
          {t(`forumCategories.${categoryKey}`)}
        </h1>
        <p className="content-header-subtitle">{t(`forumCategories.${categoryKey}Desc`)}</p>
      </div>

      <div className="content-body">
        <div className="fc-toolbar">
          <Link to={langPath('/forum')} className="fc-back">{t('forum.backToForum')}</Link>
          <div className="fc-toolbar-right">
            <input
              type="text"
              className="fc-search"
              placeholder={t('forum.searchPlaceholder')}
              value={search}
              onChange={handleSearchChange}
            />
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
          <div className="empty-state">
            <p>{t('forum.loading')}</p>
          </div>
        ) : error ? (
          <div className="forum-error">
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? t('forum.noPostsForSearch', { search: searchQuery }) : t('forum.noPosts')}</p>
          </div>
        ) : (
          <>
            <div className="fc-post-list">
              <div className="fc-post-header">
                <span className="fc-col-thread">{t('forum.columnThread')}</span>
                <span className="fc-col-replies">{t('forum.columnReplies')}</span>
                <span className="fc-col-last">{t('forum.columnLastPost')}</span>
              </div>
              {posts.map(post => {
                const commentCount = post.forum_comments?.[0]?.count || 0
                return (
                  <Link
                    key={post.id}
                    to={langPath(`/forum/${post.id}`)}
                    className="fc-post-row"
                  >
                    <div className="fc-col-thread">
                      <div className="fc-thread-info">
                        <span className="fc-thread-title">{post.title}</span>
                        <span className="fc-thread-author">
                          {isProfileAdmin(post.profiles) && <span className="gm-tag">[GM]</span>}
                          {' '}{getAuthorName(post.profiles)}
                        </span>
                      </div>
                    </div>
                    <div className="fc-col-replies">
                      <span className="fc-reply-count">{commentCount}</span>
                    </div>
                    <div className="fc-col-last">
                      <span className="fc-last-date">{formatDate(post.created_at)}</span>
                      <span className="fc-last-author">{t('forum.by')} {getAuthorName(post.profiles)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {hasMore && (
              <div className="fc-load-more">
                <button
                  className="button-b"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? t('forum.loadingMore') : t('forum.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default ForumCategory
