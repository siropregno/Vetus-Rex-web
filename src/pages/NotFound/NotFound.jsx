import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpider } from '@fortawesome/free-solid-svg-icons';
import { langPath } from '../../utils/helpers';
import './NotFound.css';

const NotFound = () => {
  const { t } = useTranslation()
  useEffect(() => { document.title = t('notFound.pageTitle') }, [])

  return (
    <div className="notfound">
      <FontAwesomeIcon icon={faSpider} className="notfound-icon" />
      <p className="notfound-message" dangerouslySetInnerHTML={{ __html: t('notFound.message') }} />
      <p className="notfound-hint">{t('notFound.hint')}</p>
      <a href={langPath('/')} className="button-a notfound-home">{t('notFound.returnHome')}</a>
    </div>
  );
};

export default NotFound;
