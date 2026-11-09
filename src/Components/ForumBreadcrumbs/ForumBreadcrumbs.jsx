import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import './ForumBreadcrumbs.css'

/**
 * Migas de pan del foro: Foro › Categoría › Tema.
 * @param {{ items: Array<{ label: string, to?: string }> }} props el último ítem es la página actual (sin enlace)
 */
const ForumBreadcrumbs = ({ items }) => {
  const { t } = useTranslation()
  return (
    <nav className="forum-crumbs" aria-label={t('forum.breadcrumb')}>
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`}>
              {item.to && !isLast
                ? <Link to={item.to}>{item.label}</Link>
                : <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>}
              {!isLast && <FontAwesomeIcon icon={faChevronRight} className="forum-crumbs-sep" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default ForumBreadcrumbs
