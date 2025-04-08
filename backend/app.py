from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from utils.image_processing import base64_to_image
from emotion_detector import detect_emotion_realtime
import eventlet
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Use eventlet as the async mode for Socket.IO
eventlet.monkey_patch()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)
detector = detect_emotion_realtime()

# Track active connections and processed frames
active_connections = 0
processed_frames = 0
last_process_time = None

@socketio.on('connect')
def handle_connect():
    global active_connections
    active_connections += 1
    logger.info(f'Client connected. Active connections: {active_connections}')
    # Notify client of successful connection
    emit('connection_status', {
        'status': 'connected',
        'timestamp': datetime.now().isoformat(),
        'client_id': active_connections
    })

@socketio.on('disconnect')
def handle_disconnect():
    global active_connections
    active_connections -= 1
    logger.info(f'Client disconnected. Active connections: {active_connections}')

@socketio.on('video_frame')
def process_frame(data):
    global processed_frames, last_process_time
    try:
        start_time = datetime.now()
        
        # Log frame receipt
        logger.info(f'Received frame at {start_time.isoformat()}')
        
        # Convert base64 image to OpenCV format
        img = base64_to_image(data['image'])
        
        # Analyze emotion
        result = detector.detect_emotion(img)
        
        # Track processed frames
        processed_frames += 1
        last_process_time = datetime.now()
        
        # Calculate processing time
        processing_time = (last_process_time - start_time).total_seconds()
        
        # Send results back to client
        if result['success']:
            emit('emotion_result', {
                'success': True,
                'emotion': result['emotion'],
                'emotions': result['emotions'],
                'frame_number': processed_frames,
                'processing_time': processing_time,
                'timestamp': last_process_time.isoformat()
            })
            logger.info(f'Frame {processed_frames} processed successfully. '
                       f'Emotion detected: {result["emotion"]} '
                       f'Processing time: {processing_time:.3f}s')
        else:
            emit('error', {
                'success': False,
                'message': result['error'],
                'frame_number': processed_frames,
                'timestamp': last_process_time.isoformat()
            })
            logger.error(f'Frame {processed_frames} processing failed: {result["error"]}')
            
    except Exception as e:
        logger.error(f'Error processing frame: {str(e)}')
        emit('error', {
            'success': False,
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        })

@app.route('/health')
def health_check():
    """Health check endpoint to verify server is running"""
    return jsonify({
        'status': 'ok',
        'active_connections': active_connections,
        'processed_frames': processed_frames,
        'last_process_time': last_process_time.isoformat() if last_process_time else None,
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f'Server error: {str(error)}')
    return jsonify({
        'success': False,
        'error': str(error),
        'timestamp': datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    logger.info("Starting emotion detection server...")
    try:
        socketio.run(
            app,
            host='127.0.0.1',  # Using IP address instead of localhost
            port=5000,
            debug=True,
            use_reloader=False  # Disable reloader to avoid duplicate processes
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")