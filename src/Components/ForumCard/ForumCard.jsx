import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { stripHtml, truncateText, formatDate, isProfileAdmin, getAuthorName, FORUM_CATEGORIES, langPath } from '../../utils/helpers'
import './ForumCard.css'

const ForumCard = ({ post }) => {
  const { t } = useTranslation()

  const category = FORUM_CATEGORIES[post.category]
  const excerpt = truncateText(stripHtml(post.content), 120)
  const commentCount = post.forum_comments?.[0]?.count || 0

  return (
    <article className="forum-card">
      <Link to={langPath(`/forum/${post.id}`)} className="forum-card-link">
        <div className="forum-card-header">
          {category && (
            <span
              className="forum-card-category"
              style={{ backgroundColor: category.color }}
            >
              <FontAwesomeIcon icon={category.icon} /> {t(`forumCategories.${post.category}`)}
            </span>
          )}
          <span className="forum-card-date">{formatDate(post.created_at)}</span>
        </div>

        <h3 className="forum-card-title">{post.title}</h3>
        <p className="forum-card-excerpt">{excerpt}</p>

        <div className="forum-card-footer">
          <div className="forum-card-author">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt=""
                className="forum-card-avatar"
              />
            ) : (
              <span className="forum-card-avatar-fallback">
                {post.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span>
              {isProfileAdmin(post.profiles) && <span className="gm-tag">[GM]</span>}
              {' '}{getAuthorName(post.profiles)}
            </span>
          </div>
          <span className="forum-card-comments">
            💬 {commentCount}
          </span>
        </div>
      </Link>
    </article>
  )
}

export default ForumCard
