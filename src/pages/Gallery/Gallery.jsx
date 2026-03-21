import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage } from '../../lib/database'
import Modal from '../../Components/Modal/Modal'
import DOMPurify from 'dompurify'
import logger from '../../utils/logger'
import './Gallery.css'

const PAGE_SIZE = 12

const Gallery = () => {
  const { t } = useTranslation()
  const { profile } = useAuthContext()

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [lightbox, setLightbox] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isAdmin = profile?.role === 'admin'

  const fetchImages = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const { data, count, error: fetchError } = await getGalleryImages(pageNum, PAGE_SIZE)

      if (fetchError) {
        logger.error('Error loading gallery:', fetchError)
        setError(t('gallery.failedToLoad'))
        return
      }

      setImages(prev => append ? [...prev, ...data] : data)
      setTotalCount(count || 0)
      setError(null)
    } catch (err) {
      logger.error('Unexpected error loading gallery:', err)
      setError(t('gallery.failedToLoad'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [t])

  useEffect(() => { document.title = t('gallery.pageTitle') }, [t])

  useEffect(() => {
    fetchImages(1)
  }, [fetchImages])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchImages(nextPage, true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError(t('gallery.invalidImage'))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('gallery.imageTooLarge'))
      return
    }

    setUploadFile(file)
    setUploadError('')
    const reader = new FileReader()
    reader.onload = (ev) => setUploadPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError(t('gallery.titleRequired'))
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const { error: upErr } = await uploadGalleryImage({
        file: uploadFile,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || null,
        authorId: profile.id
      })

      if (upErr) {
        setUploadError(upErr.message || t('gallery.uploadFailed'))
        return
      }

      setShowUpload(false)
      resetUploadForm()
      setPage(1)
      fetchImages(1)
    } catch {
      setUploadError(t('gallery.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const resetUploadForm = () => {
    setUploadTitle('')
    setUploadDesc('')
    setUploadFile(null)
    setUploadPreview(null)
    setUploadError('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const { error: delErr } = await deleteGalleryImage(deleteTarget.id, deleteTarget.image_url)
      if (delErr) {
        logger.error('Error deleting gallery image:', delErr)
        return
      }
      setImages(prev => prev.filter(img => img.id !== deleteTarget.id))
      setTotalCount(prev => prev - 1)
      if (lightbox?.id === deleteTarget.id) setLightbox(null)
    } catch (err) {
      logger.error('Unexpected error deleting gallery image:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const hasMore = images.length < totalCount

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('gallery.title')}</h1>
        <p className="content-header-subtitle">{t('gallery.subtitle')}</p>
      </div>

      <div className="content-body">
        {loading ? (
          <div className="gallery-loading">
            <p>{t('gallery.loading')}</p>
          </div>
        ) : error ? (
          <div className="gallery-error">
            <p>{error}</p>
            <button className="button-a" onClick={() => fetchImages(1)}>
              {t('gallery.retry')}
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="gallery-empty">
            <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('gallery.noImages')) }} />
            <p className="gallery-empty-hint">{t('gallery.noImagesHint')}</p>
            {isAdmin && (
              <button className="gallery-create-card" onClick={() => setShowUpload(true)}>
                <span className="gallery-create-card-icon">+</span>
                <span className="gallery-create-card-label">{t('gallery.upload')}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {isAdmin && (
                <button className="gallery-create-card" onClick={() => setShowUpload(true)}>
                  <div className="gallery-create-card-content">
                    <span className="gallery-create-card-icon">+</span>
                    <span className="gallery-create-card-label">{t('gallery.upload')}</span>
                  </div>
                </button>
              )}
              {images.map(img => (
                <div key={img.id} className="gallery-item" onClick={() => setLightbox(img)}>
                  <img src={img.image_url} alt={img.title} loading="lazy" />
                  <div className="gallery-item-overlay">
                    <span className="gallery-item-title">{img.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="gallery-load-more">
                <button className="button-b" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? t('gallery.loadingMore') : t('gallery.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="gallery-lightbox" onClick={() => setLightbox(null)}>
          <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox.image_url} alt={lightbox.title} />
            <div className="gallery-lightbox-info">
              <h3>{lightbox.title}</h3>
              {lightbox.description && <p>{lightbox.description}</p>}
            </div>
            {isAdmin && (
              <button className="button-danger gallery-lightbox-delete" onClick={() => { setDeleteTarget(lightbox); }}>
                {t('gallery.delete')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="gallery-lightbox" onClick={() => { setShowUpload(false); resetUploadForm() }}>
          <div className="gallery-upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('gallery.uploadTitle')}</h2>
            <form onSubmit={handleUpload}>
              <div className="gallery-upload-field">
                <label>{t('gallery.imageLabel')}</label>
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                {uploadPreview && (
                  <img src={uploadPreview} alt="Preview" className="gallery-upload-preview" />
                )}
              </div>
              <div className="gallery-upload-field">
                <label>{t('gallery.titleLabel')}</label>
                <input
                  type="text"
                  className="input-field"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={t('gallery.titlePlaceholder')}
                  disabled={uploading}
                  maxLength={100}
                  required
                />
              </div>
              <div className="gallery-upload-field">
                <label>{t('gallery.descLabel')}</label>
                <textarea
                  className="input-field"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder={t('gallery.descPlaceholder')}
                  disabled={uploading}
                  maxLength={500}
                  rows={3}
                />
              </div>
              {uploadError && (
                <div className="message error">{uploadError}</div>
              )}
              <div className="gallery-upload-actions">
                <button type="submit" className="button-a" disabled={uploading || !uploadFile}>
                  {uploading ? t('gallery.uploading') : t('gallery.publish')}
                </button>
                <button type="button" className="button-b" onClick={() => { setShowUpload(false); resetUploadForm() }} disabled={uploading}>
                  {t('gallery.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        title={t('gallery.deleteTitle')}
        message={t('gallery.deleteMessage')}
        type="confirm"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}

export default Gallery
