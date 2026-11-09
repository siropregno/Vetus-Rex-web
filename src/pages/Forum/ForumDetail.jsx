import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpider, faPen, faTrash, faReply, faGavel, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import {
  getForumPostById, deleteForumPost,
  getCommentsByPostId, createComment, updateComment, deleteComment, tempBanUser,
  getForumMessageCounts
} from '../../lib/database'
import { formatDate, isUserBanned, getBanExpiry, isBanPermanent, getAuthorName, FORUM_CATEGORIES, langPath, stripHtml } from '../../utils/helpers'
import { buildNestedThread, getRankKey, getForumRank, getForumLevel } from '../../utils/forumThread'
import Modal from '../../Components/Modal/Modal'
import ForumBreadcrumbs from '../../Components/ForumBreadcrumbs/ForumBreadcrumbs'
import logger from '../../utils/logger'
import './ForumDetail.css'

/**
 * Nivel de foro como una sola gema en rombo, tallada en facetas; su color marca el nivel.
 * El nombre del rango queda como texto accesible y tooltip.
 */
const ForumGem = ({ messageCount, t }) => {
  if (!Number.isFinite(messageCount)) return null
  const level = getForumLevel(messageCount)
  const label = t(`forum.forumRank.${getForumRank(messageCount)}`)
  return (
    <span className={`forum-gem forum-gem-level-${level}`} role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="forum-gem-body" d="M12 1L23 12L12 23L1 12Z" />
        <path d="M1 12L12 1V6.5L6.5 12Z" fill="#fff" fillOpacity=".45" />
        <path d="M12 1L23 12H17.5L12 6.5Z" fill="#fff" fillOpacity=".15" />
        <path d="M23 12L12 23V17.5L17.5 12Z" fill="#000" fillOpacity=".4" />
        <path d="M1 12H6.5L12 17.5V23Z" fill="#000" fillOpacity=".18" />
        <path d="M12 6.5L17.5 12L12 17.5L6.5 12Z" fill="#fff" fillOpacity=".1" />
        <path d="M12 1L23 12L12 23L1 12Z" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth=".8" />
      </svg>
    </span>
  )
}

/** Tag del staff que ya usa el sitio ([GM] / [MOD]), a la izquierda del nombre. */
const StaffTag = ({ profile }) => {
  const rank = getRankKey(profile)
  if (rank === 'gm') return <span className="gm-tag">[GM]</span>
  if (rank === 'mod') return <span className="mod-tag">[MOD]</span>
  return null
}

/** Nombre del autor con el tag del staff delante. */
const AuthorName = ({ profile, className }) => (
  <span className={className}>
    <StaffTag profile={profile} />
    <span>{getAuthorName(profile)}</span>
  </span>
)

/** Columna del autor: avatar en medallón, nombre, rango y cantidad de mensajes. */
const ForumAuthor = ({ profile, messageCount, t }) => {
  const isGm = getRankKey(profile) === 'gm'
  return (
    <div className="forum-post-author">
      <span className={`forum-author-avatar${isGm ? ' is-staff' : ''}`}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" />
          : (profile?.username?.charAt(0)?.toUpperCase() || '?')}
      </span>
      <AuthorName profile={profile} className="forum-author-name" />
      <ForumGem messageCount={messageCount} t={t} />
      {Number.isFinite(messageCount) && (
        <span className="forum-author-count">{t('forum.messageCount', { count: messageCount })}</span>
      )}
    </div>
  )
}

const ForumDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isAuthenticated } = useAuthContext()
  const commentsEndRef = useRef(null)
  const commentFormRef = useRef(null)

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ isOpen: false })

  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState('')
  const [moderateTarget, setModerateTarget] = useState(null)
  const [messageCounts, setMessageCounts] = useState({})
  const [collapsed, setCollapsed] = useState({})

  const isAuthor = user && post?.author_id === user.id
  const isAdmin = profile?.role === 'admin'
  const canModify = isAuthor || isAdmin
  const isBanned = isUserBanned(profile)
  const canComment = isAuthenticated && !isBanned

  useEffect(() => { document.title = t('forum.pageTitle') }, [t])

  useEffect(() => {
    if (post?.title) {
      document.title = `Vetus Rex | ${stripHtml(post.title).substring(0, 80)}`
    }
  }, [post])

  const fetchComments = useCallback(async () => {
    const { data } = await getCommentsByPostId(id)
    if (data) {
      setComments(data)
      if (location.hash === '#comments') {
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
  }, [id, location.hash])

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      const { data, error: fetchError } = await getForumPostById(id)
      if (fetchError || !data) {
        logger.error('Error loading forum post:', fetchError)
        setError(t('forum.postNotFound'))
        setLoading(false)
        return
      }
      setPost(data)
      setLoading(false)
    }

    fetchPost()
    fetchComments()
  }, [id, fetchComments, t])

  // Cantidad de mensajes de cada autor del hilo (para el rango de foro). Se recalcula si cambian los autores.
  const authorKey = [post?.author_id, ...comments.map(c => c.author_id)].filter(Boolean).sort().join(',')
  useEffect(() => {
    if (!authorKey) return
    let cancelled = false
    getForumMessageCounts(authorKey.split(',')).then(({ data }) => {
      if (!cancelled) setMessageCounts(data || {})
    })
    return () => { cancelled = true }
  }, [authorKey, comments.length])

  /** Lleva al formulario de respuesta; si se pasa un comentario, lo cita. */
  const focusReply = (quoted = null) => {
    setReplyTo(quoted)
    const form = commentFormRef.current
    if (!form) return
    form.scrollIntoView({ behavior: 'smooth', block: 'center' })
    form.querySelector('textarea')?.focus({ preventScroll: true })
  }

  const handleDeletePost = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: t('forum.deleteTitle'),
      message: t('forum.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        const { error: deleteError } = await deleteForumPost(id)
        if (deleteError) {
          logger.error('Error deleting post:', deleteError)
          setModal({ isOpen: false })
          return
        }
        logger.success('Forum post deleted')
        setModal({ isOpen: false })
        navigate(langPath('/forum'))
      },
    })
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || submitting) return

    setSubmitting(true)
    const { data, error: createError } = await createComment({
      post_id: id,
      parent_comment_id: replyTo?.id || null,
      content: commentText.trim(),
      author_id: user.id,
    })

    if (createError) {
      logger.error('Error creating comment:', createError)
    } else {
      setComments(prev => [...prev, data])
      setCommentText('')
      setReplyTo(null)
    }
    setSubmitting(false)
  }

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return
    const { data, error: editError } = await updateComment(commentId, editText.trim())
    if (editError) {
      logger.error('Error updating comment:', editError)
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? data : c))
      setEditingComment(null)
      setEditText('')
    }
  }

  // Tras borrar se recarga la lista desde la base: así refleja exactamente lo que la base
  // hizo con las respuestas que citaban ese comentario.
  const handleDeleteComment = (commentId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: t('forum.deleteCommentTitle'),
      message: t('forum.deleteCommentMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        const { error: deleteError } = await deleteComment(commentId)
        if (deleteError) {
          logger.error('Error deleting comment:', deleteError)
        } else {
          if (replyTo?.id === commentId) setReplyTo(null)
          await fetchComments()
        }
        setModal({ isOpen: false })
      },
    })
  }

  const handleModerateDelete = async () => {
    if (!moderateTarget) return
    const { error: deleteError } = await deleteComment(moderateTarget.id)
    if (deleteError) {
      logger.error('Error deleting comment:', deleteError)
    } else {
      await fetchComments()
    }
    setModerateTarget(null)
  }

  const handleModerateBan = (days) => {
    if (!moderateTarget) return
    setModal({
      isOpen: true,
      type: 'confirm',
      title: t('forum.banConfirmTitle'),
      message: t('forum.banConfirmMessage', { username: getAuthorName(moderateTarget.profiles), days }),
      variant: 'danger',
      confirmText: t('forum.banConfirm'),
      onConfirm: async () => {
        const { error: banError } = await tempBanUser(moderateTarget.author_id, days)
        if (banError) {
          logger.error('Error banning user:', banError)
        }
        // Also delete the offending comment
        const { error: deleteError } = await deleteComment(moderateTarget.id)
        if (!deleteError) {
          await fetchComments()
        }
        setModal({ isOpen: false })
        setModerateTarget(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="forum-detail-page">
        <div className="forum-detail-loading"><p>{t('forum.loading')}</p></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="forum-detail-page">
        <div className="notfound">
          <FontAwesomeIcon icon={faSpider} className="notfound-icon" />
          <p className="notfound-message" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('forum.postNotFoundDesc')) }} />
          <a href={langPath('/forum')} className="button-a notfound-home">{t('forum.backToForum')}</a>
        </div>
      </div>
    )
  }

  const category = FORUM_CATEGORIES[post.category]
  const sanitizedContent = DOMPurify.sanitize(post.content)
  const thread = buildNestedThread(comments)

  /** Cuerpo del mensaje o, si se está editando, el formulario de edición. */
  const renderBody = (comment) => (
    editingComment === comment.id ? (
      <div className="forum-comment-edit">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="forum-comment-textarea"
          maxLength={10000}
        />
        <div className="forum-comment-edit-actions">
          <button className="button-a btn-sm" onClick={() => handleEditComment(comment.id)}>
            {t('forum.saveEdit')}
          </button>
          <button className="button-b btn-sm" onClick={() => setEditingComment(null)}>
            {t('forum.cancelEdit')}
          </button>
        </div>
      </div>
    ) : (
      <div
        className="forum-post-body forum-comment-body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
      />
    )
  )

  /** Fecha, marca de editado y número de mensaje con enlace permanente. */
  const renderDate = (comment, number) => {
    const isEdited = comment.updated_at && comment.updated_at !== comment.created_at
    return (
      <>
        <span>{formatDate(comment.created_at)}</span>
        {isEdited && <span className="forum-post-edited">{t('forum.edited')}</span>}
        <span aria-hidden="true">·</span>
        <a href={`#post-${number}`} className="forum-post-number" title={t('forum.postNumber', { number })}>#{number}</a>
      </>
    )
  }

  /** Acciones de un comentario: responder (lo deja como padre), editar/borrar propio, moderar. */
  const renderActions = (comment) => {
    const isCommentAuthor = user && comment.author_id === user.id
    return (
      <div className="forum-post-actions">
        {canComment && (
          <button className="forum-action" onClick={() => focusReply(comment)}>
            <FontAwesomeIcon icon={faReply} />{t('forum.reply')}
          </button>
        )}
        {isCommentAuthor && (
          <>
            <button className="forum-action" onClick={() => { setEditingComment(comment.id); setEditText(comment.content) }}>
              <FontAwesomeIcon icon={faPen} />{t('forum.editComment')}
            </button>
            <button className="forum-action danger" onClick={() => handleDeleteComment(comment.id)}>
              <FontAwesomeIcon icon={faTrash} />{t('forum.deleteComment')}
            </button>
          </>
        )}
        {isAdmin && !isCommentAuthor && (
          <button className="forum-action danger" onClick={() => setModerateTarget(comment)}>
            <FontAwesomeIcon icon={faGavel} />{t('forum.moderate')}
          </button>
        )}
      </div>
    )
  }

  /** Respuesta compacta dentro del hilo de su comentario. */
  const renderReply = ({ comment, number, replyTo: repliedTo }) => {
    const rank = getRankKey(comment.profiles)
    return (
      <div key={comment.id} id={`post-${number}`} className={`forum-reply${rank === 'gm' ? ' is-staff' : ''}`}>
        <span className={`forum-reply-avatar${rank === 'gm' ? ' is-staff' : ''}`}>
          {comment.profiles?.avatar_url
            ? <img src={comment.profiles.avatar_url} alt="" />
            : (comment.profiles?.username?.charAt(0)?.toUpperCase() || '?')}
        </span>
        <div className="forum-reply-msg">
          <div className="forum-reply-head">
            <AuthorName profile={comment.profiles} className="forum-reply-name" />
            <ForumGem messageCount={messageCounts[comment.author_id]} t={t} />
            <span className="forum-post-date">{renderDate(comment, number)}</span>
          </div>
          {repliedTo && (
            <span className="forum-reply-to">
              <FontAwesomeIcon icon={faReply} />{t('forum.replyTo', { username: getAuthorName(repliedTo.profiles) })}
            </span>
          )}
          {renderBody(comment)}
          {renderActions(comment)}
        </div>
      </div>
    )
  }

  /** Comentario raíz como tarjeta, con sus respuestas desplegables debajo. */
  const renderComment = ({ comment, number, replies }) => {
    const isCollapsed = collapsed[comment.id] === true
    return (
      <article key={comment.id} id={`post-${number}`} className={`forum-post${getRankKey(comment.profiles) === 'gm' ? ' is-staff' : ''}`}>
        <ForumAuthor profile={comment.profiles} messageCount={messageCounts[comment.author_id]} t={t} />

        <div className="forum-post-msg">
          <div className="forum-post-date">{renderDate(comment, number)}</div>
          {renderBody(comment)}
          {renderActions(comment)}
        </div>

        {replies.length > 0 && (
          <div className="forum-replies">
            <button
              type="button"
              className="forum-replies-toggle"
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed(prev => ({ ...prev, [comment.id]: !isCollapsed }))}
            >
              <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
              {isCollapsed ? t('forum.showReplies', { count: replies.length }) : t('forum.hideReplies')}
            </button>
            {!isCollapsed && (
              <div className="forum-replies-list">
                {replies.map(renderReply)}
              </div>
            )}
          </div>
        )}
      </article>
    )
  }

  return (
    <div className="forum-detail-page">
      <ForumBreadcrumbs items={[
        { label: t('nav.forum'), to: langPath('/forum') },
        ...(category ? [{ label: t(`forumCategories.${post.category}`), to: langPath(`/forum/category/${post.category}`) }] : []),
        { label: stripHtml(post.title) },
      ]} />

      <header className="forum-detail-header">
        {category && (
          <span className="forum-detail-category" style={{ '--tag-color': category.color }}>
            <FontAwesomeIcon icon={category.icon} /> {t(`forumCategories.${post.category}`)}
          </span>
        )}
        <h2 className="forum-detail-title">{post.title}</h2>
      </header>

      <div className="forum-thread">
        {/* Mensaje #1: el post original */}
        <article id="post-1" className={`forum-post${getRankKey(post.profiles) === 'gm' ? ' is-staff' : ''}`}>
          <ForumAuthor profile={post.profiles} messageCount={messageCounts[post.author_id]} t={t} />
          <div className="forum-post-msg">
            <div className="forum-post-date">
              <span>{formatDate(post.created_at)}</span>
              <span aria-hidden="true">·</span>
              <a href="#post-1" className="forum-post-number" title={t('forum.postNumber', { number: 1 })}>#1</a>
            </div>
            <div className="forum-post-body forum-detail-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
            <div className="forum-post-actions">
              {canComment && (
                <button className="forum-action" onClick={() => focusReply(null)}>
                  <FontAwesomeIcon icon={faReply} />{t('forum.reply')}
                </button>
              )}
              {canModify && (
                <>
                  <button className="forum-action" onClick={() => navigate(langPath(`/forum/edit/${post.id}`))}>
                    <FontAwesomeIcon icon={faPen} />{t('forum.edit')}
                  </button>
                  <button className="forum-action danger" onClick={handleDeletePost}>
                    <FontAwesomeIcon icon={faTrash} />{t('forum.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
        </article>

        <div className="forum-comments-section">
          <h3 className="forum-comments-title">{t('forum.commentsTitle')} ({comments.length})</h3>

          <div className="forum-comments-list">
            {thread.length === 0
              ? <p className="forum-no-comments">{t('forum.noComments')}</p>
              : thread.map(renderComment)}
            <div ref={commentsEndRef} />
          </div>

          {/* Respuesta rápida al final del hilo, como en los foros clásicos */}
          {isBanned ? (
            <div className="suspended-banner">
              <p className="suspended-banner-title">{t('common.accountSuspended')}</p>
              <p>{isBanPermanent(profile)
                ? t('common.banExpires', { date: t('common.banPermanent') })
                : t('common.banExpires', { date: getBanExpiry(profile)?.toLocaleDateString() })}
              </p>
              {profile?.ban_reason && (
                <p>{t('common.banReason', { reason: profile.ban_reason })}</p>
              )}
            </div>
          ) : isAuthenticated ? (
            <form className="forum-comment-form" onSubmit={handleSubmitComment} ref={commentFormRef}>
              {replyTo && (
                <div className="forum-reply-indicator">
                  <span>{t('forum.replyTo', { username: getAuthorName(replyTo.profiles) })}</span>
                  <button type="button" onClick={() => setReplyTo(null)}>{t('forum.cancelReply')}</button>
                </div>
              )}
              <textarea
                className="forum-comment-textarea"
                placeholder={t('forum.writeComment')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                maxLength={10000}
              />
              <button className="button-a" type="submit" disabled={submitting || !commentText.trim()}>
                {submitting ? t('forum.submitting') : t('forum.submitComment')}
              </button>
            </form>
          ) : (
            <p className="forum-login-prompt">
              <Link to={langPath('/login')}>{t('forum.loginToComment')}</Link>
            </p>
          )}
        </div>
      </div>

      {moderateTarget && (
        <div className="moderate-overlay" onClick={() => setModerateTarget(null)}>
          <div className="moderate-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="moderate-title">{t('forum.moderateTitle')}</h3>
            <p className="moderate-user">
              {t('forum.moderateUser', { username: getAuthorName(moderateTarget.profiles) })}
            </p>
            <div className="moderate-actions">
              <button className="button-b moderate-btn" onClick={handleModerateDelete}>
                {t('forum.moderateDelete')}
              </button>
              <button className="button-b moderate-btn danger" onClick={() => handleModerateBan(1)}>
                {t('forum.ban1Day')}
              </button>
              <button className="button-b moderate-btn danger" onClick={() => handleModerateBan(7)}>
                {t('forum.ban7Days')}
              </button>
              <button className="button-b moderate-btn danger" onClick={() => handleModerateBan(30)}>
                {t('forum.ban30Days')}
              </button>
            </div>
            <button className="button-b moderate-cancel" onClick={() => setModerateTarget(null)}>
              {t('common.cancel')}
            </button>
          </div>
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

export default ForumDetail
