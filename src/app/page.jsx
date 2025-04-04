import EmotionDetection from "../components/emotion-detection"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-8">Emotion Detection</h1>
        <EmotionDetection />
      </div>
    </main>
  )
}

