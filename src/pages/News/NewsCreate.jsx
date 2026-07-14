import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { createNews, updateNews, getNewsById, uploadNewsImage, deleteNewsImage } from '../../lib/database'
import { NEWS_TAGS, NEWS_LANGS, langPath, getLang } from '../../utils/helpers'
import NewsEditor from '../../Components/NewsEditor/NewsEditor'
import logger from '../../utils/logger'
import './NewsCreate.css'

const emptyLangMap = () => NEWS_LANGS.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {})

const NewsCreate = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuthContext()

  const isEditMode = Boolean(id)
  const isAdmin = profile?.role === 'admin'

  // One title + one content per language.
  const [titles, setTitles] = useState(emptyLangMap)
  const [contents, setContents] = useState(emptyLangMap)
  const [activeLang, setActiveLang] = useState(() => (NEWS_LANGS.includes(getLang()) ? getLang() : 'en'))
  const [tag, setTag] = useState('update')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = t('newsCreate.pageTitle') }, [t])


  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      logger.nav('Non-admin redirected from news create/edit')
      navigate(langPath('/news'))
    }
    if (!authLoading && !user) {
      logger.nav('Unauthenticated user redirected from news create/edit')
      navigate(langPath('/news'))
    }
  }, [authLoading, user, profile, isAdmin, navigate])


  useEffect(() => {
    if (isEditMode) {
      const loadArticle = async () => {
        setLoadingArticle(true)
        const { data, error: fetchError } = await getNewsById(id)

        if (fetchError || !data) {
          logger.error('Error loading article for edit:', fetchError)
          setError(t('newsCreate.articleNotFound'))
          setLoadingArticle(false)
          return
        }

        // Hydrate from i18n maps, falling back to the legacy flat columns
        // (English) so a not-yet-translated legacy article opens cleanly.
        const titleMap = emptyLangMap()
        const contentMap = emptyLangMap()
        for (const lang of NEWS_LANGS) {
          titleMap[lang] = data.title_i18n?.[lang] ?? (lang === 'en' ? (data.title || '') : '')
          contentMap[lang] = data.content_i18n?.[lang] ?? (lang === 'en' ? (data.content || '') : '')
        }
        setTitles(titleMap)
        setContents(contentMap)
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

    const reader = new FileReader()
    reader.onload = (ev) => setCoverPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview('')
    setCoverImageUrl('')
  }

  const setTitleFor = (lang, value) => setTitles(prev => ({ ...prev, [lang]: value }))
  const setContentFor = (lang, value) => setContents(prev => ({ ...prev, [lang]: value }))

  // Return the first language that is missing a title or a body, or null.
  const firstIncompleteLang = () => {
    for (const lang of NEWS_LANGS) {
      const hasTitle = titles[lang]?.trim()
      const body = contents[lang]?.trim()
      const hasBody = body && body !== '<p></p>'
      if (!hasTitle || !hasBody) return lang
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const incomplete = firstIncompleteLang()
    if (incomplete) {
      setActiveLang(incomplete)
      setError(t('newsCreate.allLanguagesRequired', { lang: t(`newsCreate.langNames.${incomplete}`) }))
      return
    }

    setSubmitting(true)

    try {
      let finalCoverUrl = coverImageUrl


      if (coverFile) {

        if (isEditMode && coverImageUrl) {
          await deleteNewsImage(coverImageUrl)
        }

        const { data: imageUrl, error: uploadError } = await uploadNewsImage(coverFile)
        if (uploadError) {
          setError(t('newsCreate.coverUploadFailed'))
          setSubmitting(false)
          return
        }
        finalCoverUrl = imageUrl
      }


      if (isEditMode && !coverPreview && coverImageUrl) {
        await deleteNewsImage(coverImageUrl)
        finalCoverUrl = null
      }

      const title_i18n = {}
      const content_i18n = {}
      for (const lang of NEWS_LANGS) {
        title_i18n[lang] = titles[lang].trim()
        content_i18n[lang] = contents[lang]
      }

      if (isEditMode) {
        const { error: updateError } = await updateNews(id, {
          title_i18n,
          content_i18n,
          cover_image_url: finalCoverUrl || null,
          tag,
        })

        if (updateError) {
          setError(updateError.message || t('newsCreate.updateFailed'))
          setSubmitting(false)
          return
        }

        logger.success('Article updated')
        navigate(langPath(`/news/${id}`))
      } else {
        const { data: newArticle, error: createError } = await createNews({
          title_i18n,
          content_i18n,
          cover_image_url: finalCoverUrl || null,
          tag,
          author_id: user.id,
        })

        if (createError) {
          setError(createError.message || t('newsCreate.createFailed'))
          setSubmitting(false)
          return
        }

        logger.success('Article created', { id: newArticle.id })
        navigate(langPath(`/news/${newArticle.id}`))
      }
    } catch (err) {
      logger.error('Error submitting article:', err)
      setError(t('newsCreate.unexpectedError'))
      setSubmitting(false)
    }
  }

  if (authLoading || loadingArticle || (user && !profile)) {
    return (
      <div className="news-create-page">
        <div className="news-create-loading">
          <p>{loadingArticle ? t('newsCreate.loadingArticle') : t('newsCreate.loadingGeneric')}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  const isLangComplete = (lang) => {
    const body = contents[lang]?.trim()
    return Boolean(titles[lang]?.trim()) && Boolean(body) && body !== '<p></p>'
  }

  return (
    <div className="news-create-page">
      <button className="news-detail-back" onClick={() => { navigate(isEditMode ? langPath(`/news/${id}`) : langPath('/news')) }}>
        {t(isEditMode ? 'newsCreate.backToArticle' : 'newsCreate.backToNews')}
      </button>

      <h1 className="content-header-title">
        {t(isEditMode ? 'newsCreate.editTitle' : 'newsCreate.newTitle')}
      </h1>

      <form className="news-create-form" onSubmit={handleSubmit}>
        {error && <div className="news-create-error">{error}</div>}


        <div className="form-group">
          <label htmlFor="news-tag">{t('newsCreate.categoryLabel')}</label>
          <select
            id="news-tag"
            className="input-field"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {Object.entries(NEWS_TAGS).map(([key, tagDef]) => (
              <option key={key} value={key}>
                {t(tagDef.label)}
              </option>
            ))}
          </select>
        </div>


        <div className="form-group">
          <label>{t('newsCreate.coverLabel')}</label>
          {coverPreview ? (
            <div className="cover-preview">
              <img src={coverPreview} alt="Cover preview" />
              <button type="button" className="cover-remove" onClick={removeCover}>
                {t('newsCreate.removeCover')}
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
                {t('newsCreate.chooseCover')}
              </label>
            </div>
          )}
        </div>


        {/* Language tabs — one title + body per language, all required. */}
        <div className="news-lang-tabs" role="tablist">
          {NEWS_LANGS.map(lang => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={activeLang === lang}
              className={`news-lang-tab ${activeLang === lang ? 'active' : ''} ${isLangComplete(lang) ? 'complete' : 'incomplete'}`}
              onClick={() => setActiveLang(lang)}
            >
              {t(`newsCreate.langNames.${lang}`)}
              <span className="news-lang-tab-status" aria-hidden="true">
                {isLangComplete(lang) ? '✓' : '•'}
              </span>
            </button>
          ))}
        </div>

        {NEWS_LANGS.map(lang => (
          <div
            key={lang}
            className="news-lang-panel"
            style={{ display: activeLang === lang ? 'block' : 'none' }}
          >
            <div className="form-group">
              <label htmlFor={`news-title-${lang}`}>
                {t('newsCreate.titleLabel')} — {t(`newsCreate.langNames.${lang}`)}
              </label>
              <input
                id={`news-title-${lang}`}
                type="text"
                className="input-field"
                value={titles[lang]}
                onChange={(e) => setTitleFor(lang, e.target.value)}
                placeholder={t('newsCreate.titlePlaceholder')}
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label>
                {t('newsCreate.contentLabel')} — {t(`newsCreate.langNames.${lang}`)}
              </label>
              <NewsEditor
                content={contents[lang]}
                onChange={(html) => setContentFor(lang, html)}
                uploadImage={uploadNewsImage}
              />
            </div>
          </div>
        ))}


        <div className="news-create-actions">
          <button
            type="button"
            className="button-b"
            onClick={() => { navigate(isEditMode ? langPath(`/news/${id}`) : langPath('/news')) }}
          >
            {t('newsCreate.cancel')}
          </button>
          <button
            type="submit"
            className="button-a"
            disabled={submitting}
          >
            {submitting
              ? t(isEditMode ? 'newsCreate.updating' : 'newsCreate.publishing')
              : t(isEditMode ? 'newsCreate.update' : 'newsCreate.publish')
            }
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewsCreate
