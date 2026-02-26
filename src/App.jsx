import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './Components/Navbar/navbar'
import Profile from './pages/profile/Profile'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import News from './pages/News/News'
import NewsDetail from './pages/News/NewsDetail'
import NewsCreate from './pages/News/NewsCreate'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main>
            <div className="content-zone">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/create" element={<NewsCreate />} />
                <Route path="/news/edit/:id" element={<NewsCreate />} />
                <Route path="/news/:id" element={<NewsDetail />} />
              </Routes>
            </div>
          </main>
          <footer>
            <div className="footer">
              <p>&copy; 2025 TikiTiki Studios. all rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
