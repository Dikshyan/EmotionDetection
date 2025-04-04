import "./Progress.css"

const Progress = ({ value = 0, color = "#3b82f6" }) => {
  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        style={{
          width: `${value}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

export default Progress

