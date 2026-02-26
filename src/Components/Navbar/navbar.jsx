import React, { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import logger from '../../utils/logger';
import './navbar.css';
import logo from '../../assets/logo-big.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuthContext();

  const currentPath = window.location.pathname;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleAuth = () => {
    window.location.href = '/login';
    setIsMenuOpen(false);
  };

  const handleProfile = () => {
    window.location.href = '/profile';
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsMenuOpen(false);
    
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(window.location.href);
    } catch (error) {
      logger.error('Error signing out:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(window.location.href);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand */}
          <a href="/" className="brand-link">
          <img src={logo} alt="" />
          </a>
          
          {/* Navigation Menu */}
          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <a href="/" className={`nav-link${currentPath === '/' ? ' active' : ''}`}>Home</a>
              <a href="/news" className={`nav-link${currentPath.startsWith('/news') ? ' active' : ''}`}>News</a>
              <a href="https://vetusrex.itch.io/game/download/eyJleHBpcmVzIjoxNzcyMDg5NDIxLCJpZCI6MzQwNDcxMX0%3d.48cEwzg6XEc5vxIIUdHVuHVkrfQ%3d" className="nav-link" target="_blank" rel="noopener noreferrer">Download</a>
            </div>
            
            {/* Auth Section */}
            <div className="auth-section">
              {isAuthenticated ? (
                <div className="user-dropdown">
                  <button className="user-button">
                    <span className="user-avatar">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="user-avatar-img"
                          onLoad={() => logger.success('Avatar loaded successfully')}
                          onError={(e) => {
                            logger.warn('Avatar loading failed, using fallback');
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <span 
                        className="user-avatar-initials"
                        style={{ display: profile?.avatar_url ? 'none' : 'inline' }}
                      >
                        {profile?.username?.charAt(0)?.toUpperCase() || 
                         user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </span>
                    <span className="user-name">
                      {profile?.role === 'admin' && <span className="gm-tag">[GM]</span>}
                      {' '}{profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  <div className="dropdown-menu">
                    <button onClick={handleProfile} className="dropdown-item">
                      My Profile
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleSignOut} 
                      className="dropdown-item logout-item"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              ) : (
                <a href="/login" className="button-a">
                  Sign In
                </a>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`mobile-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

    </>
  );
};

export default Navbar;
