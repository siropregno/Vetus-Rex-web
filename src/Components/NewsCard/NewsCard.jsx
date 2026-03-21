import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { stripHtml, truncateText, formatDate, isProfileAdmin, getAuthorName, NEWS_TAGS, langPath } from '../../utils/helpers'
import './NewsCard.css'

const NewsCard = ({ news }) => {
  const { t } = useTranslation()

  const tag = NEWS_TAGS[news.tag]
  const excerpt = truncateText(stripHtml(news.content), 150)

  return (
    <article className="news-card">
      <Link to={langPath(`/news/${news.id}`)} className="news-card-link">
      <div className="news-card-image">
        {news.cover_image_url ? (
          <img src={news.cover_image_url} alt={news.title} />
        ) : (
          <div className="news-card-placeholder">
            <span>📰</span>
          </div>
        )}
        {tag && (
          <span
            className="news-card-tag"
            style={{ backgroundColor: tag.color }}
          >
            {t(tag.label)}
          </span>
        )}
      </div>

      <div className="news-card-body">
        <h3 className="news-card-title">{news.title}</h3>
        <p className="news-card-excerpt">{excerpt}</p>

        <div className="news-card-meta">
          <div className="news-card-author">
            {news.profiles?.avatar_url ? (
              <img
                src={news.profiles.avatar_url}
                alt=""
                className="news-card-avatar"
              />
            ) : (
              <span className="news-card-avatar-fallback">
                {news.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span>
              {isProfileAdmin(news.profiles) && <span className="gm-tag">[GM]</span>}
              {' '}{getAuthorName(news.profiles)}
            </span>
          </div>
          <span className="news-card-date">{formatDate(news.created_at)}</span>
        </div>
      </div>
      </Link>
    </article>
  )
}

export default NewsCard
