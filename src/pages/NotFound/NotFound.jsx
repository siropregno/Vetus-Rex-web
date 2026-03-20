import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpider } from '@fortawesome/free-solid-svg-icons';
import './NotFound.css';

const NotFound = () => {
  useEffect(() => { document.title = '404 | Vetus Rex' }, [])

  return (
    <div className="notfound">
      <FontAwesomeIcon icon={faSpider} className="notfound-icon" />
      <p className="notfound-message">
        Error 404. Looks like a <strong>Forest Spider</strong> devoured this page before you could find it. 
        There's nothing left but cobwebs here.
      </p>
      <p className="notfound-hint">Perhaps it never existed... or perhaps it was delicious.</p>
      <a href="/" className="button-a notfound-home">Return to Safety</a>
    </div>
  );
};

export default NotFound;
