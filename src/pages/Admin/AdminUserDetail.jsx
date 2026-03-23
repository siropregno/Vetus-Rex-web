import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import {
  adminGetUserDetail,
  adminChangeRole,
  adminBanUser,
  adminUnbanUser,
  adminRenameCharacter,
  adminDeleteAccount,
  adminDeletePost,
  adminDeleteComment,
} from '../../lib/database'
import { langPath, formatDate, isUserBanned } from '../../utils/helpers'
import Modal from '../../Components/Modal/Modal'

const AdminUserDetail = () => {
  const { userId } = useParams()
  const { t } = useTranslation()
  const { isAdmin } = useAuthContext()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [modal, setModal] = useState(null)

  // Ban form
  const [banDays, setBanDays] = useState(7)
  const [banReason, setBanReason] = useState('')

  // Rename form
  const [renameCharId, setRenameCharId] = useState(null)
  const [renameName, setRenameName] = useState('')
  const [renameReason, setRenameReason] = useState('')

  const fetchDetail = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await adminGetUserDetail(userId)
    if (err) {
      setError(err.message)
    } else {
      setDetail(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchDetail()
  }, [userId])

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleChangeRole = async (newRole) => {
    setModal({
      type: 'confirm',
      title: t('admin.confirmRoleChange'),
      message: t('admin.confirmRoleChangeMsg', { role: t(`admin.roles.${newRole}`) }),
      onConfirm: async () => {
        setModal(null)
        const { error: err } = await adminChangeRole(userId, newRole)
        if (err) {
          setError(err.message)
        } else {
          showSuccess(t('admin.roleChanged'))
          fetchDetail()
        }
      },
    })
  }

  const handleBan = async () => {
    if (!banReason.trim()) {
      setError(t('admin.reasonRequired'))
      return
    }
    const { error: err } = await adminBanUser(userId, banDays, banReason)
    if (err) {
      setError(err.message)
    } else {
      showSuccess(t('admin.userBanned'))
      setBanDays(7)
      setBanReason('')
      fetchDetail()
    }
  }

  const handlePermaBan = async () => {
    setModal({
      type: 'confirm',
      title: t('admin.confirmPermaBan'),
      message: t('admin.confirmPermaBanMsg', { username: detail?.profile?.username }),
      variant: 'danger',
      onConfirm: async () => {
        setModal(null)
        if (!banReason.trim()) {
          setError(t('admin.reasonRequired'))
          return
        }
        const { error: err } = await adminBanUser(userId, 0, banReason)
        if (err) {
          setError(err.message)
        } else {
          showSuccess(t('admin.userBanned'))
          setBanReason('')
          fetchDetail()
        }
      },
    })
  }

  const handleUnban = async () => {
    const { error: err } = await adminUnbanUser(userId)
    if (err) {
      setError(err.message)
    } else {
      showSuccess(t('admin.userUnbanned'))
      fetchDetail()
    }
  }

  const handleRename = async () => {
    if (!renameName.trim()) return
    const { error: err } = await adminRenameCharacter(renameCharId, renameName, renameReason)
    if (err) {
      setError(err.message)
    } else {
      showSuccess(t('admin.charRenamed'))
      setRenameCharId(null)
      setRenameName('')
      setRenameReason('')
      fetchDetail()
    }
  }

  const handleDeleteAccount = () => {
    setModal({
      type: 'prompt',
      title: t('admin.confirmDeleteAccount'),
      message: t('admin.confirmDeleteAccountMsg', { username: detail?.profile?.username }),
      variant: 'danger',
      promptMatch: detail?.profile?.username,
      onConfirm: async () => {
        setModal(null)
        const { error: err } = await adminDeleteAccount(userId)
        if (err) {
          setError(err.message)
        } else {
          window.location.href = langPath('/admin/users')
        }
      },
    })
  }

  const handleDeletePost = async (postId) => {
    setModal({
      type: 'confirm',
      title: t('admin.confirmDeletePost'),
      message: t('admin.confirmDeletePostMsg'),
      variant: 'danger',
      onConfirm: async () => {
        setModal(null)
        const { error: err } = await adminDeletePost(postId)
        if (err) {
          setError(err.message)
        } else {
          showSuccess(t('admin.postDeleted'))
          fetchDetail()
        }
      },
    })
  }

  const handleDeleteComment = async (commentId) => {
    setModal({
      type: 'confirm',
      title: t('admin.confirmDeleteComment'),
      message: t('admin.confirmDeleteCommentMsg'),
      variant: 'danger',
      onConfirm: async () => {
        setModal(null)
        const { error: err } = await adminDeleteComment(commentId)
        if (err) {
          setError(err.message)
        } else {
          showSuccess(t('admin.commentDeleted'))
          fetchDetail()
        }
      },
    })
  }

  if (loading) {
    return <div className="admin-loading">{t('admin.loading')}</div>
  }

  if (error) {
    return <div className="admin-error">{error}</div>
  }

  if (!detail?.profile) {
    return <div className="admin-empty">{t('admin.userNotFound')}</div>
  }

  const { profile: userProfile, characters, recent_posts, recent_comments } = detail
  const banned = isUserBanned(userProfile)

  return (
    <div>
      <a href={langPath('/admin/users')} className="admin-back">
        ← {t('admin.backToUsers')}
      </a>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {/* User Header */}
      <div className="admin-user-header">
        <div className="admin-user-avatar">
          {userProfile.avatar_url ? (
            <img src={userProfile.avatar_url} alt={userProfile.username} />
          ) : (
            userProfile.username?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>
        <div className="admin-user-info">
          <h2>
            {userProfile.username || t('common.unknown')}
            <span className={`admin-role-badge role-${userProfile.role}`}>
              {t(`admin.roles.${userProfile.role}`)}
            </span>
            {banned && (
              <span className="admin-status-badge status-banned">
                {t('admin.statusBanned')}
              </span>
            )}
          </h2>
          <p>{userProfile.email} · {t('admin.memberSince')} {formatDate(userProfile.created_at)}</p>
          {banned && userProfile.ban_reason && (
            <p style={{ color: '#fca5a5' }}>
              {t('admin.banReason')}: {userProfile.ban_reason}
            </p>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="admin-section">
        <h3 className="admin-section-title">{t('admin.actions')}</h3>

        {/* Role Change - Admin only */}
        {isAdmin && (
          <div className="admin-field-group">
            <div className="admin-field-label">{t('admin.changeRole')}</div>
            <select
              className="admin-role-select"
              value={userProfile.role}
              onChange={(e) => handleChangeRole(e.target.value)}
            >
              <option value="user">{t('admin.roles.user')}</option>
              <option value="moderator">{t('admin.roles.moderator')}</option>
              <option value="admin">{t('admin.roles.admin')}</option>
            </select>
          </div>
        )}

        {/* Ban / Unban */}
        {banned ? (
          <div className="admin-actions">
            <button className="admin-btn admin-btn-success" onClick={handleUnban}>
              {t('admin.unban')}
            </button>
          </div>
        ) : (
          <div>
            <div className="admin-inline-form" style={{ marginBottom: 8 }}>
              <input
                type="number"
                className="admin-inline-input"
                min="1"
                max="365"
                value={banDays}
                onChange={(e) => setBanDays(parseInt(e.target.value) || 1)}
                style={{ width: 80 }}
              />
              <span className="admin-field-label" style={{ margin: 0 }}>
                {t('admin.days')}
              </span>
              <input
                type="text"
                className="admin-inline-input"
                placeholder={t('admin.banReasonPlaceholder')}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{ flex: 1, minWidth: 150 }}
              />
            </div>
            <div className="admin-actions">
              <button className="admin-btn admin-btn-warn" onClick={handleBan}>
                {t('admin.banTemp')}
              </button>
              {isAdmin && (
                <button className="admin-btn admin-btn-danger" onClick={handlePermaBan}>
                  {t('admin.banPerm')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delete Account - Admin only */}
        {isAdmin && (
          <div className="admin-danger-zone">
            <button className="admin-btn admin-btn-danger" onClick={handleDeleteAccount}>
              {t('admin.deleteAccount')}
            </button>
          </div>
        )}
      </div>

      {/* Characters Section */}
      <div className="admin-section">
        <h3 className="admin-section-title">
          {t('admin.characters')} ({characters?.length || 0})
        </h3>
        {!characters || characters.length === 0 ? (
          <div className="admin-empty">{t('admin.noCharacters')}</div>
        ) : (
          <div className="admin-char-list">
            {characters.map((char) => (
              <div key={char.id} className="admin-char-card">
                <div className="admin-char-info">
                  {renameCharId === char.id ? (
                    <div className="admin-inline-form">
                      <input
                        type="text"
                        className="admin-inline-input"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        placeholder={t('admin.newName')}
                      />
                      <input
                        type="text"
                        className="admin-inline-input"
                        value={renameReason}
                        onChange={(e) => setRenameReason(e.target.value)}
                        placeholder={t('admin.reason')}
                      />
                      <button className="admin-btn admin-btn-primary" onClick={handleRename}>
                        {t('admin.save')}
                      </button>
                      <button className="admin-btn" onClick={() => setRenameCharId(null)}>
                        {t('admin.cancel')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="admin-char-name">{char.player_name}</span>
                      <span className="admin-char-stats">
                        Lv.{char.level} · {char.gold} gold · {char.experience} exp
                      </span>
                    </>
                  )}
                </div>
                {renameCharId !== char.id && (
                  <button
                    className="admin-btn"
                    onClick={() => {
                      setRenameCharId(char.id)
                      setRenameName(char.player_name)
                      setRenameReason('')
                    }}
                  >
                    {t('admin.rename')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="admin-section">
        <h3 className="admin-section-title">{t('admin.recentPosts')}</h3>
        {!recent_posts || recent_posts.length === 0 ? (
          <div className="admin-empty">{t('admin.noPosts')}</div>
        ) : (
          recent_posts.map((post) => (
            <div key={post.id} className="admin-activity-item">
              <div className="admin-activity-text">
                <div className="admin-activity-title">{post.title}</div>
                <div className="admin-activity-meta">
                  {post.category} · {formatDate(post.created_at)}
                </div>
              </div>
              <div className="admin-activity-actions">
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDeletePost(post.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Comments */}
      <div className="admin-section">
        <h3 className="admin-section-title">{t('admin.recentComments')}</h3>
        {!recent_comments || recent_comments.length === 0 ? (
          <div className="admin-empty">{t('admin.noComments')}</div>
        ) : (
          recent_comments.map((comment) => (
            <div key={comment.id} className="admin-activity-item">
              <div className="admin-activity-text">
                <div className="admin-activity-title">
                  {comment.content?.replace(/<[^>]*>/g, '').substring(0, 100)}
                </div>
                <div className="admin-activity-meta">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              <div className="admin-activity-actions">
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDeleteComment(comment.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          isOpen={true}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
          promptMatch={modal.promptMatch}
          onConfirm={modal.onConfirm}
          onClose={() => setModal(null)}
          confirmText={t('modal.confirm')}
          cancelText={t('modal.cancel')}
        />
      )}
    </div>
  )
}

export default AdminUserDetail
