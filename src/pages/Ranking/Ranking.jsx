import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getRanking, getUserCharacters } from '../../lib/database'
import { RANKING_TAGS } from '../../utils/helpers'
import './Ranking.css'

const Ranking = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthContext()
  const [activeTag, setActiveTag] = useState('gold')
  const [characters, setCharacters] = useState([])
  const [myCharacters, setMyCharacters] = useState([])
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

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    getUserCharacters(user.id).then(({ data }) => {
      if (data) setMyCharacters(data)
    })
  }, [isAuthenticated, user?.id])

  const getValue = (char) => (activeTag === 'experience' ? char.experience : char.gold) || 0

  const getPosition = (playerName) => {
    const idx = characters.findIndex(c => c.player_name === playerName)
    return idx >= 0 ? idx + 1 : null
  }

  const top10 = characters.slice(0, 10)

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
          <div className="empty-state">
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
          <div className="empty-state">
            <p>{t('ranking.noCharacters')}</p>
          </div>
        ) : (
          <>
            <div className="ranking-list">
              {top10.map((char, index) => (
                <div key={index} className={`ranking-item${index < 3 ? ` top-${index + 1}` : ''}`}>
                  <div className="ranking-left">
                    <p className="ranking-position">#{index + 1}</p>
                    <div className="ranking-info">
                      <p>{char.player_name}</p>
                      <p className="ranking-level">Lvl. {char.level}</p>
                    </div>
                  </div>
                  <div className="ranking-right">
                    <p className="ranking-value">{getValue(char).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {isAuthenticated && myCharacters.length > 0 && (
              <div className="my-chars-section">
                <h2 className="my-chars-title">{t('ranking.myCharacters')}</h2>
                <div className="my-chars-list">
                  {myCharacters.map((char) => {
                    const pos = getPosition(char.player_name)
                    return (
                      <div key={char.id} className="my-chars-row">
                        <p className='my-chars-name'>{char.player_name} (Lvl. {char.level})</p>
                        <div className="my-chars-sep"></div>
                        <p>{getValue(char).toLocaleString()}</p>
                        <div className="my-chars-sep"></div>
                        <p className={`${pos ? '' : 'not-listed'}`}>{pos ? `#${pos}` : t('ranking.notListed')}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Ranking