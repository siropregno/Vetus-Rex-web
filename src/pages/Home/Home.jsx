import React, { useState, useEffect } from 'react'
import { getLatestNews } from '../../lib/database'
import NewsCard from '../../Components/NewsCard/NewsCard'
import Separator from '../../Components/Separator/Separator'
import { faCrosshairs, faEarthAmericas, faGift } from '@fortawesome/free-solid-svg-icons'
import logger from '../../utils/logger'
import bannerImage from '../../assets/banner1.png'
import './Home.css'

const Home = () => {
  const [latestNews, setLatestNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

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
      {/* Hero Banner */}
      <section className="home-banner">
        <div className="home-banner-bg" style={{ backgroundImage: `url(${bannerImage})` }} />
        <div className="home-banner-overlay" />
        <div className="home-banner-inner">
          <div className="home-banner-content">
            <h1 className="home-banner-title">Embark on an <span className='color-acc'>Unforgettable</span> Adventure</h1>
            <p className="home-banner-text">
              Step into a vast, unexplored world and uncover the secrets hidden within
              the enigmatic lands of the Old King. Rise as the hero who will shape the fate
              of the world as we know it. Are you ready?
            </p>
            <a
              href="https://vetusrex.itch.io/game/download/eyJleHBpcmVzIjoxNzcyMDg5NDIxLCJpZCI6MzQwNDcxMX0%3d.48cEwzg6XEc5vxIIUdHVuHVkrfQ%3d"
              className="button-a home-banner-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Play Now
            </a>
          </div>
        </div>
      </section>

      <Separator items={[
        { icon: faCrosshairs, label: 'Epic Combat', desc: 'Master tab target-based battles against fearsome creatures' },
        { icon: faEarthAmericas, label: 'Vast World', desc: 'Explore a rich open world full of secrets and lore' },
        { icon: faGift, label: 'Amazing Rewards', desc: 'Collect unique items and unlock powerful abilities' },
      ]} />

      <section className="home-news">
        <div className="home-news-header">
          <h2 className="home-news-title">Latest News</h2>
          <button className="home-news-viewall" onClick={() => { window.location.href = '/news' }}>
            View All →
          </button>
        </div>

        {newsLoading ? (
          <div className="home-news-loading">
            <p>Loading news...</p>
          </div>
        ) : latestNews.length === 0 ? (
          <div className="home-news-empty">
            <p>No news yet. Stay tuned!</p>
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