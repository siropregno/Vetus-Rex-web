import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary'
import Navbar from './Components/Navbar/Navbar'
import Profile from './pages/profile/Profile'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import News from './pages/News/News'
import Ranking from './pages/Ranking/Ranking'
import Gallery from './pages/Gallery/Gallery'
import NewsDetail from './pages/News/NewsDetail'
import NewsCreate from './pages/News/NewsCreate'
import Forum from './pages/Forum/Forum'
import ForumCategory from './pages/Forum/ForumCategory'
import ForumDetail from './pages/Forum/ForumDetail'
import ForumCreate from './pages/Forum/ForumCreate'
import ForumRules from './pages/Forum/ForumRules'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminUserDetail from './pages/Admin/AdminUserDetail'
import AdminLog from './pages/Admin/AdminLog'
import AdminTickets from './pages/Admin/AdminTickets'
import AdminTicketDetail from './pages/Admin/AdminTicketDetail'
import Support from './pages/Support/Support'
import SupportCreate from './pages/Support/SupportCreate'
import SupportDetail from './pages/Support/SupportDetail'
import NotFound from './pages/NotFound/NotFound'
import { SUPPORTED_LANGS, getLang } from './utils/helpers'

function LangLayout() {
  const { lang } = useParams()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (SUPPORTED_LANGS.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  if (!SUPPORTED_LANGS.includes(lang)) {
    return <Navigate to={`/${getLang()}`} replace />
  }

  return <Outlet />
}

function ContentZoneLayout() {
  return (
    <div className="content-zone">
      <Outlet />
    </div>
  )
}

function AppContent() {
  const { t } = useTranslation()
  const location = useLocation()
  const isAdmin = /^\/[a-z]{2}\/admin/.test(location.pathname)

  return (
    <div className="app">
      <Navbar />
      <main>
          <Routes>
            <Route path="/" element={<Navigate to={`/${getLang()}`} replace />} />
            <Route path="/:lang" element={<LangLayout />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="log" element={<AdminLog />} />
                <Route path="support" element={<AdminTickets />} />
                <Route path="support/:id" element={<AdminTicketDetail />} />
              </Route>
              <Route element={<ContentZoneLayout />}>
                <Route index element={<Home />} />
                <Route path="profile" element={<Profile />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="news" element={<News />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="news/create" element={<NewsCreate />} />
                <Route path="news/edit/:id" element={<NewsCreate />} />
                <Route path="news/:id" element={<NewsDetail />} />
                <Route path="forum" element={<Forum />} />
                <Route path="forum/rules" element={<ForumRules />} />
                <Route path="forum/create" element={<ForumCreate />} />
                <Route path="forum/edit/:id" element={<ForumCreate />} />
                <Route path="forum/category/:category" element={<ForumCategory />} />
                <Route path="forum/:id" element={<ForumDetail />} />
                <Route path="support" element={<Support />} />
                <Route path="support/create" element={<SupportCreate />} />
                <Route path="support/:id" element={<SupportDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
      </main>
      {!isAdmin && (
        <footer>
          <div className="footer">
            <div className="footer-inner">
              <nav className="footer-links">
                <a href={`/${getLang()}`}>{t('nav.home')}</a>
                <a href={`/${getLang()}/news`}>{t('nav.news')}</a>
                <a href={`/${getLang()}/ranking`}>{t('nav.ranking')}</a>
                <a href={`/${getLang()}/gallery`}>{t('nav.gallery')}</a>
                <a href={`/${getLang()}/forum`}>{t('nav.forum')}</a>
                <a href={`/${getLang()}/support`}>{t('nav.support')}</a>
                <a href="https://vetusrex.itch.io/game/download/eyJleHBpcmVzIjoxNzcyMDg5NDIxLCJpZCI6MzQwNDcxMX0%3d.48cEwzg6XEc5vxIIUdHVuHVkrfQ%3d" target="_blank" rel="noopener noreferrer">{t('nav.download')}</a>
              </nav>
              <p className="footer-copy">{t('footer.rights')}</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
