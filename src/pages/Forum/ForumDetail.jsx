import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpider, faPen, faTrash, faReply, faGavel } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import {
  getForumPostById, deleteForumPost,
  getCommentsByPostId, createComment, updateComment, deleteComment, tempBanUser
} from '../../lib/database'
import { formatDate, isProfileAdmin, isUserBanned, getBanExpiry, getAuthorName, FORUM_CATEGORIES, langPath } from '../../utils/helpers'
import Modal from '../../Components/Modal/Modal'
import logger from '../../utils/logger'
import './ForumDetail.css'

const ForumDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isAuthenticated } = useAuthContext()
  const commentsEndRef = useRef(null)

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

  const isAuthor = user && post?.author_id === user.id
  const isAdmin = profile?.role === 'admin'
  const canModify = isAuthor || isAdmin
  const isBanned = isUserBanned(profile)

  useEffect(() => { document.title = t('forum.pageTitle') }, [t])

  useEffect(() => {
    if (post?.title) {
      document.title = `Vetus Rex | ${post.title}`
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
          setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId))
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
      setComments(prev => prev.filter(c => c.id !== moderateTarget.id && c.parent_comment_id !== moderateTarget.id))
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
          setComments(prev => prev.filter(c => c.id !== moderateTarget.id && c.parent_comment_id !== moderateTarget.id))
        }
        setModal({ isOpen: false })
        setModerateTarget(null)
      },
    })
  }

  // Build threaded structure
  const topLevelComments = comments.filter(c => !c.parent_comment_id)
  const getReplies = (parentId) => comments.filter(c => c.parent_comment_id === parentId)

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

  const renderComment = (comment, isReply = false) => {
    const isCommentAuthor = user && comment.author_id === user.id
    const isPostAuthor = post.author_id === comment.author_id
    const canModifyComment = isCommentAuthor || isAdmin

    return (
      <div key={comment.id} className={`forum-comment ${isReply ? 'forum-comment-reply' : ''}`}>
        <div className="forum-comment-header">
          <div className="forum-comment-author">
            {comment.profiles?.avatar_url ? (
              <img src={comment.profiles.avatar_url} alt="" className="forum-comment-avatar" />
            ) : (
              <span className="forum-comment-avatar-fallback">
                {comment.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span className="forum-comment-username">
              {isProfileAdmin(comment.profiles) && <span className="gm-tag">[GM]</span>}
              {' '}{getAuthorName(comment.profiles)}
              {isPostAuthor && <span className="op-tag">OP</span>}
            </span>
            <span className="forum-comment-date">
              {formatDate(comment.created_at)}
              {comment.updated_at !== comment.created_at && (
                <span className="forum-comment-edited"> {t('forum.edited')}</span>
              )}
            </span>
          </div>
          <div className="forum-comment-actions">
            {isAuthenticated && !isReply && (
              <button
                className="icon-btn"
                onClick={() => { setReplyTo(comment); setCommentText('') }}
                title={t('forum.reply')}
              >
                <FontAwesomeIcon icon={faReply} />
              </button>
            )}
            {isCommentAuthor && (
              <>
                <button
                  className="icon-btn"
                  onClick={() => { setEditingComment(comment.id); setEditText(comment.content) }}
                  title={t('forum.editComment')}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => handleDeleteComment(comment.id)}
                  title={t('forum.deleteComment')}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
            {isAdmin && !isCommentAuthor && (
              <button
                className="icon-btn danger"
                onClick={() => setModerateTarget(comment)}
                title={t('forum.moderate')}
              >
                <FontAwesomeIcon icon={faGavel} />
              </button>
            )}
          </div>
        </div>

        {editingComment === comment.id ? (
          <div className="forum-comment-edit">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="forum-comment-textarea"
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
            className="forum-comment-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
          />
        )}

        {!isReply && getReplies(comment.id).map(reply => renderComment(reply, true))}
      </div>
    )
  }

  return (
    <div className="forum-detail-page">
      <button className="forum-detail-back" onClick={() => navigate(langPath(`/forum/category/${post.category}`))}>
        {t('forum.backToForum')}
      </button>

      <div className="forum-detail-header">
        {category && (
          <span className="forum-detail-category" style={{ backgroundColor: category.color }}>
            <FontAwesomeIcon icon={category.icon} /> {t(`forumCategories.${post.category}`)}
          </span>
        )}
        <h2 className="forum-detail-title">{post.title}</h2>
        <div className="forum-detail-meta">
          <div className="forum-detail-author">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="forum-detail-avatar" />
            ) : (
              <span className="forum-detail-avatar-fallback">
                {post.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span>
              {isProfileAdmin(post.profiles) && <span className="gm-tag">[GM]</span>}
              {' '}{getAuthorName(post.profiles)}
            </span>
          </div>
          <span className="forum-detail-date">{formatDate(post.created_at)}</span>
        </div>
      </div>

      <div className="forum-detail-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

      {canModify && (
        <div className="forum-detail-actions">
          <button className="button-a" onClick={() => navigate(langPath(`/forum/edit/${post.id}`))}>
            {t('forum.edit')}
          </button>
          <button className="button-danger" onClick={handleDeletePost}>
            {t('forum.delete')}
          </button>
        </div>
      )}

      <div className="forum-comments-section">
        <h3 className="forum-comments-title">{t('forum.commentsTitle')} ({comments.length})</h3>

        {isBanned ? (
          <p className="forum-banned-message">
            {t('forum.bannedMessage', { date: getBanExpiry(profile)?.toLocaleDateString() })}
          </p>
        ) : isAuthenticated ? (
          <form className="forum-comment-form" onSubmit={handleSubmitComment}>
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
              rows={3}
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

        <div className="forum-comments-list">
          {topLevelComments.length === 0 ? (
            <p className="forum-no-comments">{t('forum.noComments')}</p>
          ) : (
            topLevelComments.map(comment => renderComment(comment))
          )}
          <div ref={commentsEndRef} />
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
