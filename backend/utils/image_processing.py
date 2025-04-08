import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

def base64_to_image(base64_string):
    """
    Convert a base64 image string to an OpenCV image.
    
    Args:
        base64_string (str): Base64 encoded image string
        
    Returns:
        numpy.ndarray: OpenCV image (BGR format)
    """
    # If the string contains a header (e.g., data:image/jpeg;base64,), remove it
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
        
    # Decode base64 string to bytes
    image_bytes = base64.b64decode(base64_string)
    
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode numpy array as image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    return image

def image_to_base64(image, format="JPEG", quality=90):
    """
    Convert an OpenCV image to a base64 string.
    
    Args:
        image (numpy.ndarray): OpenCV image (BGR format)
        format (str): Image format (JPEG, PNG)
        quality (int): Quality for JPEG compression (0-100)
        
    Returns:
        str: Base64 encoded image string with header
    """
    # Convert BGR to RGB (PIL uses RGB)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Convert numpy array to PIL Image
    pil_image = Image.fromarray(image_rgb)
    
    # Save image to bytes buffer
    buffer = BytesIO()
    pil_image.save(buffer, format=format, quality=quality)
    
    # Get bytes from buffer and encode as base64
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    # Return with appropriate header
    return f"data:image/{format.lower()};base64,{img_base64}"

def resize_image(image, width=None, height=None, max_size=None):
    """
    Resize an image while maintaining aspect ratio.
    
    Args:
        image (numpy.ndarray): OpenCV image
        width (int, optional): Target width
        height (int, optional): Target height
        max_size (int, optional): Maximum dimension size
        
    Returns:
        numpy.ndarray: Resized image
    """
    # Get original dimensions
    h, w = image.shape[:2]
    
    # Calculate new dimensions
    if max_size:
        if h > w:
            height = max_size
            width = int(w * (height / h))
        else:
            width = max_size
            height = int(h * (width / w))
    elif width and not height:
        height = int(h * (width / w))
    elif height and not width:
        width = int(w * (height / h))
    
    # Resize image
    resized = cv2.resize(image, (width, height), interpolation=cv2.INTER_AREA)
    
    return resized

def detect_faces(image, detector='opencv'):
    """
    Detect faces in an image using specified detector.
    
    Args:
        image (numpy.ndarray): OpenCV image
        detector (str): 'opencv', 'mtcnn', or 'retinaface'
        
    Returns:
        list: List of detected face regions (x, y, w, h)
    """
    if detector == 'opencv':
        # Load OpenCV's Haar Cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        return faces
    
    elif detector == 'mtcnn' or detector == 'retinaface':
        # Use DeepFace's built-in detection
        from deepface import DeepFace
        from deepface.detectors import FaceDetector
        
        # Initialize detector
        face_detector = FaceDetector.build_model(detector)
        
        # Detect faces
        faces = FaceDetector.detect_faces(face_detector, detector, image)
        
        # Convert to (x, y, w, h) format
        result = []
        for face in faces:
            if detector == 'mtcnn':
                x, y, w, h = face['box']
                result.append((x, y, w, h))
            else:  # retinaface
                x1, y1, x2, y2 = face[1]
                result.append((int(x1), int(y1), int(x2-x1), int(y2-y1)))
                
        return result

def draw_face_emotions(image, emotions, face_box=None):
    """
    Draw emotion labels and face rectangle on image.
    
    Args:
        image (numpy.ndarray): OpenCV image
        emotions (dict): Dictionary of emotions and their scores
        face_box (tuple, optional): Face region as (x, y, w, h)
        
    Returns:
        numpy.ndarray: Image with annotations
    """
    result_image = image.copy()
    
    # Draw face rectangle if provided
    if face_box:
        x, y, w, h = face_box
        cv2.rectangle(result_image, (x, y), (x+w, y+h), (0, 255, 0), 2)
    
    # Get dominant emotion
    dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
    
    # Draw dominant emotion text
    cv2.putText(result_image, f"{dominant_emotion.upper()}", 
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    
    # Draw emotion scores
    y_offset = 60
    for emotion, score in sorted(emotions.items(), key=lambda x: x[1], reverse=True):
        text = f"{emotion}: {score:.2f}%"
        cv2.putText(result_image, text, (10, y_offset), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 1)
        y_offset += 25
    
    return result_image

def normalize_image(image):
    """
    Normalize image for better emotion detection.
    
    Args:
        image (numpy.ndarray): OpenCV image
        
    Returns:
        numpy.ndarray: Normalized image
    """
    # Convert to grayscale if the image has 3 channels
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Apply histogram equalization for better contrast
    equalized = cv2.equalizeHist(gray)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(equalized, (5, 5), 0)
    
    # Convert back to BGR if original was color
    if len(image.shape) == 3:
        result = cv2.cvtColor(blurred, cv2.COLOR_GRAY2BGR)
    else:
        result = blurred
    
    return result

def preprocess_for_emotion(image, face_box=None):
    """
    Preprocess image for emotion detection.
    
    Args:
        image (numpy.ndarray): OpenCV image
        face_box (tuple, optional): Face region as (x, y, w, h)
        
    Returns:
        numpy.ndarray: Preprocessed face image
    """
    # If face box is provided, crop to face
    if face_box:
        x, y, w, h = face_box
        # Add some margin around the face
        margin = int(min(w, h) * 0.2)
        x = max(0, x - margin)
        y = max(0, y - margin)
        w = min(image.shape[1] - x, w + 2 * margin)
        h = min(image.shape[0] - y, h + 2 * margin)
        face_img = image[y:y+h, x:x+w]
    else:
        face_img = image
    
    # Resize to expected size for DeepFace models (usually 48x48 for emotion)
    resized = cv2.resize(face_img, (48, 48), interpolation=cv2.INTER_AREA)
    
    # Normalize pixel values
    normalized = resized / 255.0
    
    return normalized