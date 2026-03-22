import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHandshake, faBan, faFolderOpen, faTriangleExclamation, faGamepad, faBullhorn } from '@fortawesome/free-solid-svg-icons'
import { langPath } from '../../utils/helpers'
import './ForumRules.css'

const RULES = [
  { key: 'rule1', icon: faHandshake },
  { key: 'rule2', icon: faBan },
  { key: 'rule3', icon: faFolderOpen },
  { key: 'rule4', icon: faTriangleExclamation },
  { key: 'rule5', icon: faGamepad },
  { key: 'rule6', icon: faBullhorn },
]

const ForumRules = () => {
  const { t } = useTranslation()

  useEffect(() => { document.title = t('forumRules.pageTitle') }, [t])

  return (
    <>
      <div className="content-header">
        <h1 className="content-header-title">{t('forumRules.title')}</h1>
        <p className="content-header-subtitle">{t('forumRules.subtitle')}</p>
      </div>

      <div className="content-body">
        <Link to={langPath('/forum')} className="forum-rules-back">
          {t('forumRules.backToForum')}
        </Link>

        <div className="forum-rules-list">
          {RULES.map(({ key, icon }) => (
            <div key={key} className="forum-rule-card">
              <span className="forum-rule-icon"><FontAwesomeIcon icon={icon} /></span>
              <div>
                <h3 className="forum-rule-title">{t(`forumRules.${key}Title`)}</h3>
                <p className="forum-rule-desc">{t(`forumRules.${key}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ForumRules
