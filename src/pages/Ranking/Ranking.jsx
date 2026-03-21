import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getRanking } from '../../lib/database'
import { RANKING_TAGS } from '../../utils/helpers'
import './Ranking.css'

const Ranking = () => {
  const { t } = useTranslation()
  const [activeTag, setActiveTag] = useState('gold')
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = t('ranking.pageTitle') }, [t])

  const fetchRanking = useCallback(async (sortBy) => {
    setLoading(true)
    const { data, error: fetchError } = await getRanking(sortBy)
    if (fetchError) {
      setError(t('ranking.failedToLoad'))
    } else {
      setCharacters(data || [])
      setError(null)
    }
    setLoading(false)
  }, [t])

  useEffect(() => {
    fetchRanking(activeTag)
  }, [activeTag, fetchRanking])

  const getValue = (char) => (activeTag === 'experience' ? char.experience : char.gold) || 0

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('ranking.title')}</h1>
        <p className="content-header-subtitle">
          {t('ranking.subtitle')}
        </p>
      </div>

      <div className="content-body">
        <div className="news-tags-filter">
          {Object.entries(RANKING_TAGS).map(([key, tag]) => (
            <button
              key={key}
              className={`tag-filter-btn ${activeTag === key ? 'active' : ''}`}
              style={activeTag === key ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
              onClick={() => setActiveTag(key)}
            >
              {t(tag.label)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ranking-loading">
            <p>{t('ranking.loading')}</p>
          </div>
        ) : error ? (
          <div className="ranking-error">
            <p>{error}</p>
            <button className="button-a" onClick={() => fetchRanking(activeTag)}>
              {t('ranking.retry')}
            </button>
          </div>
        ) : characters.length === 0 ? (
          <div className="ranking-empty">
            <p>{t('ranking.noCharacters')}</p>
          </div>
        ) : (
          <div className="ranking-list">
            {characters.map((char, index) => (
              <div key={index} className={`ranking-item${index < 3 ? ` top-${index + 1}` : ''}`}>
                <div className="ranking-left">
                  <span className="ranking-position">#{index + 1}</span>
                  <div className="ranking-info">
                    <span className="ranking-name">{char.player_name}</span>
                    <span className="ranking-level">Lvl. {char.level}</span>
                  </div>
                </div>
                <div className="ranking-right">
                  <span className="ranking-value">{getValue(char).toLocaleString()}</span>
                  <span className="ranking-value-label">
                    {activeTag === 'experience' ? 'XP' : t('rankingTags.gold')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Ranking