"use client";

import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

const SOCKET_SERVER_URL = "http://127.0.0.1:5000";

export default function EmotionDetection() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emotions, setEmotions] = useState([]);
  const [dominantEmotion, setDominantEmotion] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const sendIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup function
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsLoading(true);
    try {
      // Initialize Socket.IO connection
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_SERVER_URL);
        
        socketRef.current.on('connect', () => {
          console.log('Connected to emotion detection server');
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socketRef.current.on('emotion_result', (data) => {
          if (data.success) {
            const emotionData = Object.entries(data.emotions).map(([type, confidence]) => ({
              type,
              confidence,
              color: getEmotionColor(type),
            }));
            setEmotions(emotionData);

            const dominant = emotionData.reduce((prev, current) =>
              prev.confidence > current.confidence ? prev : current
            );
            setDominantEmotion(dominant);
          } else {
            console.error("Emotion detection error:", data.error);
          }
        });
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsActive(true);
          sendFramesToBackend();
        };
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
    }
    setIsActive(false);
    setEmotions([]);
    setDominantEmotion(null);
  };

  const sendFramesToBackend = () => {
    sendIntervalRef.current = setInterval(() => {
      if (!isActive || !videoRef.current || !canvasRef.current || !socketRef.current) {
        clearInterval(sendIntervalRef.current);
        return;
      }

      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const base64Image = canvasRef.current.toDataURL("image/jpeg", 0.8);
        socketRef.current.emit("video_frame", { image: base64Image });
      }
    }, 500);
  };

  const getEmotionColor = (emotion) => {
    switch (emotion.toLowerCase()) {
      case "happy":
        return "bg-green-500";
      case "sad":
        return "bg-blue-500";
      case "angry":
        return "bg-red-500";
      case "surprised":
        return "bg-yellow-500";
      case "neutral":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

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
                <Badge className={`${dominantEmotion.color} text-white`}>
                  {dominantEmotion.type}
                </Badge>
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
                <Progress 
                  value={emotion.confidence * 100} 
                  className={`h-2 ${emotion.color}`} 
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {isActive 
              ? "Analyzing facial expressions in real-time..." 
              : "Start the camera to begin emotion detection"
            }
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}