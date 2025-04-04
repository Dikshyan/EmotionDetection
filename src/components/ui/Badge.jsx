import "./Badge.css"

const Badge = ({ children, className = "", ...props }) => {
  return (
    <span className={`custom-badge ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge

