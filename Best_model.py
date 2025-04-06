import cv2
import numpy as np
import time

# Import DeepFace library for emotion detection
try:
    from deepface import DeepFace
except ImportError:
    print("Error: DeepFace or its dependencies are not installed.")
    exit()

# Load the Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize webcam capture
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

# Initialize variables for FPS calculation and scan line animation
prev_time = time.time()
scan_line_y = 0
scan_direction = 5

while True:
    # Capture a frame from the webcam
    ret, frame = cap.read()
    if not ret:
        break

    # Resize and preprocess the frame
    frame = cv2.resize(frame, (640, 480))
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    
    # Set parameters for face detection based on frame size
    frame_height, frame_width = gray.shape[:2]
    scale_factor = 1.1 if frame_width > 640 else 1.2
    min_neighbors = 8 if frame_width > 640 else 6
    min_size = (int(frame_width * 0.08), int(frame_height * 0.08))
    
    # Detect faces in the frame
    faces = face_cascade.detectMultiScale(gray, scaleFactor=scale_factor, minNeighbors=min_neighbors, minSize=min_size)

    # Create a copy of the frame for overlay effects
    overlay = frame.copy()
    face_rois = []  # List to store regions of interest (faces)
    for (x, y, w, h) in faces:
        # Extract face regions with a margin
        margin = int(0.2 * w)
        x1, y1 = max(x - margin, 0), max(y - margin, 0)
        x2, y2 = min(x + w + margin, frame.shape[1]), min(y + h + margin, frame.shape[0])
        face_rois.append(frame[y1:y2, x1:x2])
    
    # Initialize a list to store detected emotions
    dominant_emotions = ["Neutral"] * len(faces)
    
    try:
        # Analyze emotions for each detected face
        for i, roi in enumerate(face_rois):
            result = DeepFace.analyze(img_path=roi, actions=['emotion'], enforce_detection=True, detector_backend='mtcnn')
            if isinstance(result, list) and len(result) > 0:
                emotions = result[0]['emotion']
                dominant_emotion = max(emotions, key=emotions.get)
                confidence = emotions[dominant_emotion]
                dominant_emotions[i] = dominant_emotion if confidence > 40 else "Uncertain"
    except Exception as e:
        print(f"DeepFace analysis error: {str(e)}")
    
    # Draw rectangles and display emotions on the frame
    for i, (x, y, w, h) in enumerate(faces):
        dominant_emotion = dominant_emotions[i]
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, f"Emotion: {dominant_emotion.upper()}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Apply overlay effects based on detected emotion
        if dominant_emotion in ["angry", "fear", "sad", "disgust"]:
            cv2.rectangle(overlay, (0, 0), (640, 480), (0, 0, 255), -1)
            alpha = 0.3
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
            cv2.putText(frame, "Warning: High Stress Detected!", (50, 450), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
        elif dominant_emotion in ["happy", "surprise", "excited"]:
            cv2.rectangle(overlay, (0, 0), (640, 480), (0, 255, 0), -1)
            alpha = 0.2
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
        elif dominant_emotion in ["neutral", "calm"]:
            cv2.rectangle(overlay, (0, 0), (640, 480), (255, 255, 0), -1)
            alpha = 0.1
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
    
    # Draw a moving scan line for visual effect
    cv2.line(frame, (0, scan_line_y), (640, scan_line_y), (0, 255, 255), 2)
    scan_line_y += scan_direction
    if scan_line_y > 480 or scan_line_y < 0:
        scan_direction *= -1

    # Calculate and display FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time
    
    cv2.rectangle(frame, (5, 5), (85, 30), (0, 0, 0), -1)
    cv2.putText(frame, f"FPS: {int(fps)}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # Display the processed frame
    cv2.imshow("Enhanced Face Scan & Emotion Detection", frame)
    
    # Clear data to ensure no cache is retained (useful for memory management)
    face_rois.clear()
    dominant_emotions.clear()
    
    # Exit the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources and close all OpenCV windows
cap.release()
cv2.destroyAllWindows()
