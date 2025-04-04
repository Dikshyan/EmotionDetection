import "./Card.css"

const Card = ({ children, className = "" }) => {
  return <div className={`custom-card ${className}`}>{children}</div>
}

const CardHeader = ({ children }) => {
  return <div className="card-header">{children}</div>
}

const CardTitle = ({ children }) => {
  return <h2 className="card-title">{children}</h2>
}

const CardDescription = ({ children }) => {
  return <p className="card-description">{children}</p>
}

const CardContent = ({ children }) => {
  return <div className="card-content">{children}</div>
}

const CardFooter = ({ children }) => {
  return <div className="card-footer">{children}</div>
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card

