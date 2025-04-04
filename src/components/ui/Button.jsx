"use client"
import "./Button.css"

const Button = ({ children, variant = "default", disabled = false, onClick }) => {
  return (
    <button className={`custom-button ${variant} ${disabled ? "disabled" : ""}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button

