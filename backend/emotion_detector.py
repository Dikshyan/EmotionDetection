import cv2
from deepface import DeepFace
import matplotlib.pyplot as plt

def detect_emotion_from_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    
    # Convert from BGR to RGB (DeepFace works with RGB)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    try:
        # Analyze the image for emotions
        result = DeepFace.analyze(img_rgb, actions=['emotion'])
        
        # Get the dominant emotion
        dominant_emotion = result[0]['dominant_emotion']
        emotion_scores = result[0]['emotion']
        
        # Display the image with the emotion
        plt.figure(figsize=(8, 6))
        plt.imshow(img_rgb)
        plt.title(f"Dominant Emotion: {dominant_emotion.capitalize()}")
        plt.axis('off')
        plt.show()
        
        print(f"Dominant Emotion: {dominant_emotion}")
        print("Emotion Scores:")
        for emotion, score in emotion_scores.items():
            print(f"- {emotion}: {score:.2f}%")
        
        return dominant_emotion, emotion_scores
        
    except Exception as e:
        print(f"Error in emotion detection: {str(e)}")
        return None, None

# For real-time webcam emotion detection
def detect_emotion_realtime():
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    while True:
        # Read frame from webcam
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Could not read frame")
            break
        
        try:
            # Analyze every 10th frame to reduce processing load
            # Using a smaller face detector model for speed
            result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, detector_backend='opencv')
            
            # Get the dominant emotion
            emotion = result[0]['dominant_emotion']
            
            # Display emotion on frame
            cv2.putText(frame, f"Emotion: {emotion}", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
        except Exception as e:
            # If face not detected or other error
            cv2.putText(frame, "No face detected", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Display the frame
        cv2.imshow('Emotion Detection', frame)
        
        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Release the webcam and close windows
    cap.release()
    cv2.destroyAllWindows()

# Example usage:
# detect_emotion_from_image('path/to/your/image.jpg')
# Or for real-time:
# detect_emotion_realtime()