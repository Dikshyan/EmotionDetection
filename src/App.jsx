import EmotionDetection from "./components/EmotionDetection"
import "./App.css"

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Emotion Detection</h1>
      </header>
      <main className="app-content">
        <EmotionDetection />
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Emotion Detection App</p>
      </footer>
    </div>
  )
}

export default App

