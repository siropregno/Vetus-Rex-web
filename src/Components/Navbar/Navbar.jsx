import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../hooks/useAuthContext';
import { SUPPORTED_LANGS, langPath } from '../../utils/helpers';
import NotificationBell from '../NotificationBell/NotificationBell';
import logger from '../../utils/logger';
import './Navbar.css';
import logo from '../../assets/logo-big.png';

const FlagUS = () => (
  <svg className="lang-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#B22234"/>
    <g fill="#FFF">
      {[1,3,5,7,9,11].map(i => <rect key={i} y={i*30/13} width="60" height={30/13}/>)}
    </g>
    <rect width="24" height="16.15" fill="#3C3B6E"/>
  </svg>
);

const FlagAR = () => (
  <svg className="lang-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#FFF"/>
    <rect width="60" height="10" fill="#74ACDF"/>
    <rect y="20" width="60" height="10" fill="#74ACDF"/>
    <circle cx="30" cy="15" r="3.5" fill="#F6B40E"/>
  </svg>
);

const FlagDE = () => (
  <svg className="lang-flag" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="10" fill="#000"/>
    <rect y="10" width="60" height="10" fill="#DD0000"/>
    <rect y="20" width="60" height="10" fill="#FFCC00"/>
  </svg>
);

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const currentLang = i18n.language?.startsWith('es') ? 'es' : i18n.language?.startsWith('de') ? 'de' : 'en';

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    const path = window.location.pathname;
    const segments = path.split('/');
    if (SUPPORTED_LANGS.includes(segments[1])) {
      segments[1] = lang;
    } else {
      segments.splice(1, 0, lang);
    }
    window.location.href = segments.join('/') || `/${lang}`;
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuthContext();

  const currentPath = window.location.pathname.replace(/^\/(en|es|de)/, '');


  useEffect(() => {
    document.body.classList.toggle('modal-open', isMenuOpen);
    return () => document.body.classList.remove('modal-open');
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isLangOpen) return;
    const close = () => setIsLangOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [isLangOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleProfile = () => {
    window.location.href = langPath('/profile');
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsMenuOpen(false);
    
    try {
      await signOut();
      window.location.replace(window.location.href);
    } catch (error) {
      logger.error('Error signing out:', error);
      window.location.replace(window.location.href);
    }
  };

  return (
    <>
      <nav className="navbar" translate="no">
        <div className="navbar-container">

          <div className="brand-section">
            <a href={langPath('/')} className="brand-link">
              <img src={logo} alt="Vetus Rex" />
            </a>
            <div className={`lang-dropdown ${isLangOpen ? 'open' : ''}`}>
              <button className="lang-toggle" aria-label={t('nav.changeLanguage', 'Change language')} onClick={(e) => { e.stopPropagation(); setIsLangOpen(!isLangOpen); }}>
                {currentLang === 'es' ? <FlagAR /> : currentLang === 'de' ? <FlagDE /> : <FlagUS />}
                <span className="lang-arrow">▼</span>
              </button>
              <div className={`lang-menu ${isLangOpen ? 'open' : ''}`}>
                <button className={`lang-option ${currentLang === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>
                  <FlagUS /> English
                </button>
                <div className="dropdown-divider"></div>
                <button className={`lang-option ${currentLang === 'es' ? 'active' : ''}`} onClick={() => changeLanguage('es')}>
                  <FlagAR /> Español
                </button>
                <div className="dropdown-divider"></div>
                <button className={`lang-option ${currentLang === 'de' ? 'active' : ''}`} onClick={() => changeLanguage('de')}>
                  <FlagDE /> Deutsch
                </button>
              </div>
            </div>
          </div>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <a href={langPath('/')} className={`nav-link${currentPath === '/' || currentPath === '' ? ' active' : ''}`}>{t('nav.home')}</a>
              <a href={langPath('/news')} className={`nav-link${currentPath.startsWith('/news') ? ' active' : ''}`}>{t('nav.news')}</a>
              <a href={langPath('/ranking')} className={`nav-link${currentPath.startsWith('/ranking') ? ' active' : ''}`}>{t('nav.ranking')}</a>
              <a href={langPath('/gallery')} className={`nav-link${currentPath.startsWith('/gallery') ? ' active' : ''}`}>{t('nav.gallery')}</a>
              <a href={langPath('/forum')} className={`nav-link${currentPath.startsWith('/forum') ? ' active' : ''}`}>{t('nav.forum')}</a>
              <a href="https://vetusrex.itch.io/game/download/eyJleHBpcmVzIjoxNzcyMDg5NDIxLCJpZCI6MzQwNDcxMX0%3d.48cEwzg6XEc5vxIIUdHVuHVkrfQ%3d" className="nav-link" target="_blank" rel="noopener noreferrer">{t('nav.download')}</a>
            </div>
            

            <div className="auth-section">
              {isAuthenticated && <span className="bell-desktop"><NotificationBell /></span>}
              {isAuthenticated ? (
                <div className="user-dropdown">
                  <button className="user-button">
                    <span className="user-avatar">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile?.username || 'User avatar'}
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
                      {profile?.role === 'moderator' && <span className="gm-tag" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>[MOD]</span>}
                      {' '}{profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  <div className="dropdown-menu">
                    <button onClick={handleProfile} className="dropdown-item">
                      {t('nav.myProfile')}
                    </button>
                    {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                      <>
                        <div className="dropdown-divider"></div>
                        <button onClick={() => { window.location.href = langPath('/admin'); setIsMenuOpen(false); }} className="dropdown-item">
                          {t('nav.admin')}
                        </button>
                      </>
                    )}
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleSignOut} 
                      className="dropdown-item logout-item"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? t('nav.signingOut') : t('nav.signOut')}
                    </button>
                  </div>
                </div>
              ) : (
                <a href={langPath('/login')} className="button-a">
                  {t('nav.signIn')}
                </a>
              )}
            </div>
          </div>


          <div className="navbar-right">
            {isAuthenticated && <span className="bell-mobile"><NotificationBell /></span>}
            <button 
              className={`mobile-toggle ${isMenuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label={t('nav.toggleMenu')}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

    </>
  );
};

export default Navbar;
