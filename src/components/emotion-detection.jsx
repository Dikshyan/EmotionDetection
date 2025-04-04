"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, CameraOff, RefreshCw } from "lucide-react"

export default function EmotionDetection() {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emotions, setEmotions] = useState([
    { type: "Happy", confidence: 0.8, color: "bg-green-500" },
    { type: "Sad", confidence: 0.1, color: "bg-blue-500" },
    { type: "Angry", confidence: 0.05, color: "bg-red-500" },
    { type: "Surprised", confidence: 0.03, color: "bg-yellow-500" },
    { type: "Neutral", confidence: 0.02, color: "bg-gray-500" },
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

        // Simulate emotion detection (in a real app, you'd connect to an API here)
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
    // This function simulates emotion detection
    // In a real application, you would call your emotion detection API here

    const updateInterval = setInterval(() => {
      if (!isActive) {
        clearInterval(updateInterval)
        return
      }

      // Capture frame from video to canvas (for demonstration)
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
      { type: "Happy", confidence: 0.8, color: "bg-green-500" },
      { type: "Sad", confidence: 0.1, color: "bg-blue-500" },
      { type: "Angry", confidence: 0.05, color: "bg-red-500" },
      { type: "Surprised", confidence: 0.03, color: "bg-yellow-500" },
      { type: "Neutral", confidence: 0.02, color: "bg-gray-500" },
    ])
    startCamera()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Camera Feed</CardTitle>
          <CardDescription>Your webcam feed will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="relative w-full aspect-video bg-slate-950 rounded-md overflow-hidden flex items-center justify-center">
            {!isActive && !isLoading && <div className="text-slate-500">Camera is off</div>}
            {isLoading && (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isActive ? "hidden" : ""}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {dominantEmotion && isActive && (
              <div className="absolute top-2 right-2">
                <Badge className={`${dominantEmotion.color} text-white`}>{dominantEmotion.type}</Badge>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isActive ? (
            <Button onClick={startCamera} disabled={isLoading}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
          )}
          <Button onClick={resetDetection} variant="outline" disabled={!isActive}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Detected Emotions</CardTitle>
          <CardDescription>Real-time emotion analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emotions.map((emotion, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span>{emotion.type}</span>
                  <span>{Math.round(emotion.confidence * 100)}%</span>
                </div>
                <Progress value={emotion.confidence * 100} className={`h-2 ${emotion.color}`} />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Analyzing facial expressions in real-time..." : "Start the camera to begin emotion detection"}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

