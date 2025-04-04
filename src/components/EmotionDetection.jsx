"use client"

import { useState, useRef, useEffect } from "react"
import Button from "./ui/Button"
import Card from "./ui/Card"
import Badge from "./ui/Badge"
import Progress from "./ui/Progress"
import "./EmotionDetection.css"

// Icon components
const CameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
)

const CameraOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M21 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3m3-3h5l2.5 3H19a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path>
  </svg>
)

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
  </svg>
)

export default function EmotionDetection() {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emotions, setEmotions] = useState([
    { type: "Happy", confidence: 0.8, color: "#22c55e" },
    { type: "Sad", confidence: 0.1, color: "#3b82f6" },
    { type: "Angry", confidence: 0.05, color: "#ef4444" },
    { type: "Surprised", confidence: 0.03, color: "#eab308" },
    { type: "Neutral", confidence: 0.02, color: "#6b7280" },
  ])
  const [dominantEmotion, setDominantEmotion] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Find the emotion with highest confidence
    if (emotions.length > 0) {
      const dominant = emotions.reduce((prev, current) => (prev.confidence > current.confidence ? prev : current))
      setDominantEmotion(dominant)
    }
  }, [emotions])

  const startCamera = async () => {
    setIsLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsActive(true)

        // Simulate emotion detection
        simulateEmotionDetection()
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      const tracks = stream.getTracks()

      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsActive(false)
    }
  }

  const simulateEmotionDetection = () => {
    const updateInterval = setInterval(() => {
      if (!isActive) {
        clearInterval(updateInterval)
        return
      }

      // Capture frame from video to canvas
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext("2d")
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }

      // Simulate changing emotions
      setEmotions((prev) => {
        return prev
          .map((emotion) => {
            // Randomly adjust confidence levels for demo purposes
            let newConfidence = emotion.confidence + (Math.random() * 0.1 - 0.05)
            newConfidence = Math.max(0.01, Math.min(0.95, newConfidence))
            return { ...emotion, confidence: newConfidence }
          })
          .sort((a, b) => b.confidence - a.confidence)
      })
    }, 1000)

    return () => clearInterval(updateInterval)
  }

  const resetDetection = () => {
    stopCamera()
    setEmotions([
      { type: "Happy", confidence: 0.8, color: "#22c55e" },
      { type: "Sad", confidence: 0.1, color: "#3b82f6" },
      { type: "Angry", confidence: 0.05, color: "#ef4444" },
      { type: "Surprised", confidence: 0.03, color: "#eab308" },
      { type: "Neutral", confidence: 0.02, color: "#6b7280" },
    ])
    startCamera()
  }

  return (
    <div className="emotion-detection-container">
      <Card>
        <Card.Header>
          <Card.Title>Camera Feed</Card.Title>
          <Card.Description>Your webcam feed will appear here</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="camera-container">
            {!isActive && !isLoading && <div className="camera-placeholder">Camera is off</div>}
            {isLoading && (
              <div className="loading-indicator">
                <RefreshIcon />
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className={`camera-video ${!isActive ? "hidden" : ""}`} />
            <canvas ref={canvasRef} className="hidden" />

            {dominantEmotion && isActive && (
              <div className="emotion-badge-container">
                <Badge style={{ backgroundColor: dominantEmotion.color }}>{dominantEmotion.type}</Badge>
              </div>
            )}
          </div>
        </Card.Content>
        <Card.Footer>
          {!isActive ? (
            <Button onClick={startCamera} disabled={isLoading}>
              <CameraIcon /> Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="danger">
              <CameraOffIcon /> Stop Camera
            </Button>
          )}
          <Button onClick={resetDetection} variant="outline" disabled={!isActive}>
            <RefreshIcon /> Reset
          </Button>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Detected Emotions</Card.Title>
          <Card.Description>Real-time emotion analysis results</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="emotions-list">
            {emotions.map((emotion, index) => (
              <div key={index} className="emotion-item">
                <div className="emotion-header">
                  <span>{emotion.type}</span>
                  <span>{Math.round(emotion.confidence * 100)}%</span>
                </div>
                <Progress value={emotion.confidence * 100} color={emotion.color} />
              </div>
            ))}
          </div>
        </Card.Content>
        <Card.Footer>
          <p className="status-text">
            {isActive ? "Analyzing facial expressions in real-time..." : "Start the camera to begin emotion detection"}
          </p>
        </Card.Footer>
      </Card>
    </div>
  )
}

