import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { getLatestNews } from '../../lib/database'
import NewsCard from '../../Components/NewsCard/NewsCard'
import Separator from '../../Components/Separator/Separator'
import { faCrosshairs, faEarthAmericas, faGift } from '@fortawesome/free-solid-svg-icons'
import { langPath } from '../../utils/helpers'
import logger from '../../utils/logger'
import bannerImage from '../../assets/banner1.png'
import './Home.css'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [latestNews, setLatestNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  useEffect(() => { document.title = t('home.pageTitle') }, [t])

  useEffect(() => {
    const fetchLatestNews = async () => {
      setNewsLoading(true)
      const { data, error } = await getLatestNews(3)

      if (error) {
        logger.error('Error fetching latest news for home:', error)
      } else {
        setLatestNews(data || [])
      }

      setNewsLoading(false)
    }

    fetchLatestNews()
  }, [])

  return (
    <div className="home-container">

      <section className="home-banner">
        <div className="home-banner-bg" style={{ backgroundImage: `url(${bannerImage})` }} />
        <div className="home-banner-overlay" />
        <div className="home-banner-inner">
          <div className="home-banner-content">
            <h1 className="home-banner-title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('home.bannerTitle').replace('<accent>', '<span class="color-acc">').replace('</accent>', '</span>')) }} />
            <p className="home-banner-text">
              {t('home.bannerText')}
            </p>
            <a
              href="https://vetusrex.itch.io/game/download/eyJleHBpcmVzIjoxNzcyMDg5NDIxLCJpZCI6MzQwNDcxMX0%3d.48cEwzg6XEc5vxIIUdHVuHVkrfQ%3d"
              className="button-a home-banner-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('home.bannerCta')}
            </a>
          </div>
        </div>
      </section>

      <Separator items={[
        { icon: faCrosshairs, label: t('home.epicCombat'), desc: t('home.epicCombatDesc') },
        { icon: faEarthAmericas, label: t('home.vastWorld'), desc: t('home.vastWorldDesc') },
        { icon: faGift, label: t('home.amazingRewards'), desc: t('home.amazingRewardsDesc') },
      ]} />

      <section className="home-news">
        <div className="home-news-header">
          <h2 className="home-news-title">{t('home.latestNews')}</h2>
          <button className="home-news-viewall" onClick={() => { navigate(langPath('/news')) }}>
            {t('home.viewAll')}
          </button>
        </div>

        {newsLoading ? (
          <div className="home-news-loading">
            <p>{t('home.loadingNews')}</p>
          </div>
        ) : latestNews.length === 0 ? (
          <div className="home-news-empty">
            <p>{t('home.noNews')}</p>
          </div>
        ) : (
          <div className="home-news-grid">
            {latestNews.map(article => (
              <NewsCard key={article.id} news={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
