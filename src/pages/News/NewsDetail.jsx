import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getNewsById, deleteNews, deleteNewsImage } from '../../lib/database'
import { formatDate, isProfileAdmin, getAuthorName, NEWS_TAGS, langPath } from '../../utils/helpers'
import Modal from '../../Components/Modal/Modal'
import logger from '../../utils/logger'
import './NewsDetail.css'

const NewsDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { profile } = useAuthContext()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ isOpen: false })

  const isAdmin = profile?.role === 'admin'

  useEffect(() => { document.title = t('newsDetail.pageTitle') }, [])

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      const { data, error: fetchError } = await getNewsById(id)

      if (fetchError) {
        logger.error('Error loading article:', fetchError)
        setError(t('newsDetail.articleNotFound'))
        setLoading(false)
        return
      }

      setArticle(data)
      setLoading(false)
    }

    fetchArticle()
  }, [id])

  const handleDelete = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: t('newsDetail.deleteTitle'),
      message: t('newsDetail.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {

        if (article.cover_image_url) {
          await deleteNewsImage(article.cover_image_url)
        }

        const { error: deleteError } = await deleteNews(id)
        if (deleteError) {
          logger.error('Error deleting article:', deleteError)
          setModal({ isOpen: false })
          setError(t('newsDetail.failedToDelete'))
          return
        }

        logger.success('Article deleted')
        setModal({ isOpen: false })
        window.location.href = langPath('/news')
      },
    })
  }

  if (loading) {
    return (
      <div className="news-detail-page">
        <div className="news-detail-loading">
          <p>{t('newsDetail.loadingArticle')}</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="news-detail-page">
        <div className="news-detail-error">
          <p>{error || t('newsDetail.articleNotFound')}</p>
          <button className="button-a" onClick={() => { window.location.href = langPath('/news') }}>
            {t('newsDetail.backToNews')}
          </button>
        </div>
      </div>
    )
  }

  const tag = NEWS_TAGS[article.tag]
  const sanitizedContent = DOMPurify.sanitize(article.content)

  return (
    <div className="news-detail-page">
      <button className="news-detail-back" onClick={() => { window.location.href = langPath('/news') }}>
        {t('newsDetail.backToNews')}
      </button>

      {article.cover_image_url && (
        <div className="news-detail-cover">
          <img src={article.cover_image_url} alt={article.title} />
        </div>
      )}

      <div className="news-detail-header">
        {tag && (
          <span
            className="news-detail-tag"
            style={{ backgroundColor: tag.color }}
          >
            {t(tag.label)}
          </span>
        )}

        <h2 className="news-detail-title">{article.title}</h2>

        <div className="news-detail-meta">
          <div className="news-detail-author">
            {article.profiles?.avatar_url ? (
              <img
                src={article.profiles.avatar_url}
                alt=""
                className="news-detail-avatar"
              />
            ) : (
              <span className="news-detail-avatar-fallback">
                {article.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span>
              {isProfileAdmin(article.profiles) && <span className="gm-tag">[GM]</span>}
              {' '}{getAuthorName(article.profiles)}
            </span>
          </div>
          <span className="news-detail-date">{formatDate(article.created_at)}</span>
        </div>
      </div>

      <div
        className="news-detail-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {isAdmin && (
        <div className="news-detail-admin-actions">
          <button
            className="button-a"
            onClick={() => { window.location.href = langPath(`/news/edit/${article.id}`) }}
          >
            {t('newsDetail.edit')}
          </button>
          <button className="button-danger" onClick={handleDelete}>
            {t('newsDetail.delete')}
          </button>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        variant={modal.variant}
      />
    </div>
  )
}

export default NewsDetail
