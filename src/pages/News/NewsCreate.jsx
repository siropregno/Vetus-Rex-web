import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import { createNews, updateNews, getNewsById, uploadNewsImage, deleteNewsImage } from '../../lib/database'
import { NEWS_TAGS } from '../../utils/helpers'
import NewsEditor from '../../Components/NewsEditor/NewsEditor'
import logger from '../../utils/logger'
import './NewsCreate.css'

const NewsCreate = () => {
  const { id } = useParams()
  const { user, profile, loading: authLoading } = useAuthContext()

  const isEditMode = Boolean(id)
  const isAdmin = profile?.role === 'admin'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('update')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [error, setError] = useState(null)

  // Redirect non-admins (wait for both auth and profile to load)
  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      logger.nav('Non-admin redirected from news create/edit')
      window.location.href = '/news'
    }
    if (!authLoading && !user) {
      logger.nav('Unauthenticated user redirected from news create/edit')
      window.location.href = '/news'
    }
  }, [authLoading, user, profile, isAdmin])

  // Load existing article in edit mode
  useEffect(() => {
    if (isEditMode) {
      const loadArticle = async () => {
        setLoadingArticle(true)
        const { data, error: fetchError } = await getNewsById(id)

        if (fetchError || !data) {
          logger.error('Error loading article for edit:', fetchError)
          setError('Article not found.')
          setLoadingArticle(false)
          return
        }

        setTitle(data.title)
        setContent(data.content)
        setTag(data.tag)
        setCoverImageUrl(data.cover_image_url || '')
        setCoverPreview(data.cover_image_url || '')
        setLoadingArticle(false)
      }

      loadArticle()
    }
  }, [id, isEditMode])

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    // Create local preview
    const reader = new FileReader()
    reader.onload = (ev) => setCoverPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview('')
    setCoverImageUrl('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (!content.trim() || content === '<p></p>') {
      setError('Content is required.')
      return
    }

    setSubmitting(true)

    try {
      let finalCoverUrl = coverImageUrl

      // Upload new cover image if selected
      if (coverFile) {
        // Delete old cover image if replacing in edit mode
        if (isEditMode && coverImageUrl) {
          await deleteNewsImage(coverImageUrl)
        }

        const { data: imageUrl, error: uploadError } = await uploadNewsImage(coverFile)
        if (uploadError) {
          setError('Failed to upload cover image.')
          setSubmitting(false)
          return
        }
        finalCoverUrl = imageUrl
      }

      // If cover was removed (no file, no url), delete old one
      if (isEditMode && !coverPreview && coverImageUrl) {
        await deleteNewsImage(coverImageUrl)
        finalCoverUrl = null
      }

      if (isEditMode) {
        const { error: updateError } = await updateNews(id, {
          title: title.trim(),
          content,
          cover_image_url: finalCoverUrl || null,
          tag,
        })

        if (updateError) {
          setError('Failed to update article.')
          setSubmitting(false)
          return
        }

        logger.success('Article updated')
        window.location.href = `/news/${id}`
      } else {
        const { data: newArticle, error: createError } = await createNews({
          title: title.trim(),
          content,
          cover_image_url: finalCoverUrl || null,
          tag,
          author_id: user.id,
        })

        if (createError) {
          setError('Failed to create article.')
          setSubmitting(false)
          return
        }

        logger.success('Article created', { id: newArticle.id })
        window.location.href = `/news/${newArticle.id}`
      }
    } catch (err) {
      logger.error('Error submitting article:', err)
      setError('An unexpected error occurred.')
      setSubmitting(false)
    }
  }

  if (authLoading || loadingArticle || (user && !profile)) {
    return (
      <div className="news-create-page">
        <div className="news-create-loading">
          <p>{loadingArticle ? 'Loading article...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="news-create-page">
      <button className="news-detail-back" onClick={() => { window.location.href = isEditMode ? `/news/${id}` : '/news' }}>
        ← {isEditMode ? 'Back to Article' : 'Back to News'}
      </button>

      <h1 className="content-header-title">
        {isEditMode ? 'Edit Article' : 'New Article'}
      </h1>

      <form className="news-create-form" onSubmit={handleSubmit}>
        {error && <div className="news-create-error">{error}</div>}

        {/* Title */}
        <div className="form-group">
          <label htmlFor="news-title">Title</label>
          <input
            id="news-title"
            type="text"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            maxLength={200}
          />
        </div>

        {/* Tag */}
        <div className="form-group">
          <label htmlFor="news-tag">Category</label>
          <select
            id="news-tag"
            className="input-field"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {Object.entries(NEWS_TAGS).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cover image */}
        <div className="form-group">
          <label>Cover Image (optional)</label>
          {coverPreview ? (
            <div className="cover-preview">
              <img src={coverPreview} alt="Cover preview" />
              <button type="button" className="cover-remove" onClick={removeCover}>
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="cover-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                id="cover-file-input"
                className="cover-file-input"
              />
              <label htmlFor="cover-file-input" className="cover-upload-label">
                📷 Choose an image
              </label>
            </div>
          )}
        </div>

        {/* Content (TipTap Editor) */}
        <div className="form-group">
          <label>Content</label>
          <NewsEditor content={content} onChange={setContent} />
        </div>

        {/* Actions */}
        <div className="news-create-actions">
          <button
            type="button"
            className="button-b"
            onClick={() => { window.location.href = isEditMode ? `/news/${id}` : '/news' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-a"
            disabled={submitting}
          >
            {submitting
              ? (isEditMode ? 'Updating...' : 'Publishing...')
              : (isEditMode ? 'Update' : 'Publish')
            }
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewsCreate
