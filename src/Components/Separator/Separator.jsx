import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Separator.css'

const Separator = ({ items }) => {
  return (
    <section className="separator">
      <div className="separator-inner">
        {items.map((item, index) => (
          <div className="separator-item" key={index}>
            <FontAwesomeIcon icon={item.icon} className="separator-icon" />
            <h3 className="separator-label">{item.label}</h3>
            <p className="separator-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Separator
