import './Separator.css'

const Separator = ({ items }) => {
  return (
    <section className="separator">
      <div className="separator-inner">
        {items.map((item, index) => (
          <div className="separator-item" key={index}>
            <span className="separator-icon">{item.icon}</span>
            <h3 className="separator-label">{item.label}</h3>
            <p className="separator-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Separator
