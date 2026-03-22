import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuthContext } from '../../hooks/useAuthContext'
import { createForumPost, updateForumPost, getForumPostById } from '../../lib/database'
import { FORUM_CATEGORIES, langPath, isUserBanned, getBanExpiry } from '../../utils/helpers'
import NewsEditor from '../../Components/NewsEditor/NewsEditor'
import logger from '../../utils/logger'
import './ForumCreate.css'

const ForumCreate = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, isAuthenticated } = useAuthContext()

  const isEditMode = Boolean(id)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = t('forumCreate.pageTitle') }, [t])

  const isBanned = isUserBanned(profile)

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = langPath('/forum')
    }
  }, [authLoading, user])

  useEffect(() => {
    if (isEditMode) {
      const loadPost = async () => {
        setLoadingPost(true)
        const { data, error: fetchError } = await getForumPostById(id)

        if (fetchError || !data) {
          logger.error('Error loading forum post for edit:', fetchError)
          setError(t('forumCreate.postNotFound'))
          setLoadingPost(false)
          return
        }

        // Only the OP or admin can edit
        if (user && data.author_id !== user.id && profile?.role !== 'admin') {
          navigate(langPath('/forum'))
          return
        }

        setTitle(data.title)
        setContent(data.content)
        setCategory(data.category)
        setLoadingPost(false)
      }

      loadPost()
    }
  }, [id, isEditMode, user, profile, navigate, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError(t('forumCreate.titleRequired'))
      return
    }

    if (!content.trim() || content === '<p></p>') {
      setError(t('forumCreate.contentRequired'))
      return
    }

    setSubmitting(true)

    try {
      if (isEditMode) {
        const { error: updateError } = await updateForumPost(id, {
          title: title.trim(),
          content,
          category,
        })

        if (updateError) {
          setError(t('forumCreate.updateFailed'))
          setSubmitting(false)
          return
        }

        logger.success('Forum post updated')
        navigate(langPath(`/forum/${id}`))
      } else {
        const { data: newPost, error: createError } = await createForumPost({
          title: title.trim(),
          content,
          category,
          author_id: user.id,
        })

        if (createError) {
          setError(t('forumCreate.createFailed'))
          setSubmitting(false)
          return
        }

        logger.success('Forum post created', { id: newPost.id })
        navigate(langPath(`/forum/${newPost.id}`))
      }
    } catch (err) {
      logger.error('Error submitting forum post:', err)
      setError(t('forumCreate.unexpectedError'))
      setSubmitting(false)
    }
  }

  if (authLoading || loadingPost || (user && !profile)) {
    return (
      <div className="forum-create-page">
        <div className="forum-create-loading">
          <p>{loadingPost ? t('forumCreate.loadingPost') : t('forum.loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (isBanned) {
    return (
      <div className="forum-create-page">
        <button className="forum-detail-back" onClick={() => navigate(langPath('/forum'))}>
          {t('forumCreate.backToForum')}
        </button>
        <p className="forum-banned-message">
          {t('forumCreate.bannedMessage', { date: getBanExpiry(profile)?.toLocaleDateString() })}
        </p>
      </div>
    )
  }

  return (
    <div className="forum-create-page">
      <button
        className="forum-detail-back"
        onClick={() => navigate(isEditMode ? langPath(`/forum/${id}`) : langPath('/forum'))}
      >
        {t(isEditMode ? 'forumCreate.backToPost' : 'forumCreate.backToForum')}
      </button>

      <h1 className="content-header-title">
        {t(isEditMode ? 'forumCreate.editTitle' : 'forumCreate.newTitle')}
      </h1>

      <form className="forum-create-form" onSubmit={handleSubmit}>
        {error && <div className="forum-create-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="forum-title">{t('forumCreate.titleLabel')}</label>
          <input
            id="forum-title"
            type="text"
            className="input-field"
            placeholder={t('forumCreate.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label>{t('forumCreate.categoryLabel')}</label>
          <div className="forum-create-categories">
            {Object.entries(FORUM_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                className={`tag-filter-btn ${category === key ? 'active' : ''}`}
                style={category === key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                onClick={() => setCategory(key)}
              >
                <FontAwesomeIcon icon={cat.icon} /> {t(`forumCategories.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('forumCreate.contentLabel')}</label>
          <NewsEditor
            content={content}
            onChange={setContent}
            placeholder={t('forumCreate.editorPlaceholder')}
          />
        </div>

        <div className="forum-create-actions">
          <button
            type="button"
            className="button-b"
            onClick={() => navigate(isEditMode ? langPath(`/forum/${id}`) : langPath('/forum'))}
          >
            {t('forumCreate.cancel')}
          </button>
          <button type="submit" className="button-a" disabled={submitting}>
            {submitting
              ? t(isEditMode ? 'forumCreate.updating' : 'forumCreate.publishing')
              : t(isEditMode ? 'forumCreate.update' : 'forumCreate.publish')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ForumCreate
