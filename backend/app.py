from flask import Flask, request, jsonify        # Flask web server and request handling
from flask_cors import CORS                      # Enables Cross-Origin Resource Sharing (CORS)
import cv2                                       # OpenCV for image decoding and processing
import numpy as np                               # Numerical operations and array handling
import os                                        # File system operations
import pickle                                    # Saving/loading trained model
from sklearn.neighbors import KNeighborsClassifier  # KNN algorithm for classification
import glob                                      # For finding files with patterns

app = Flask(__name__)   # Create a Flask web server instance
CORS(app)               # Enable CORS so this API can be called from other domains (e.g., a frontend)


model = None        # Will store the trained KNN model
labels = []         # List to store image labels (e.g., "cat", "dog")
features = []       # List to store processed image data (as 1D arrays)


@app.route('/upload', methods=['POST'])
def upload():
    """
    Endpoint to upload an image file, process it, and return a prediction.
    """
    global model, labels, features

    data = request.get_json()
    imgs = data['images']
    label = data['label']

    for img_base64 in imgs:
        nparr = np.frombuffer(bytes.fromhex(img_base64), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        img = cv2.resize(img, (64, 64))
        features.append(img.flatten())
        labels.append(label)

    return jsonify({'status': 'added', 'count': len(features)})


@app.route('/clear', methods=['POST'])
def clear_data():
    """
    Clear all training data to start fresh.
    """
    global model, labels, features
    model = None
    labels = []
    features = []
    
    # Remove existing model file
    model_path = 'model/model.pkl'
    if os.path.exists(model_path):
        os.remove(model_path)
    
    return jsonify({'status': 'cleared'})


@app.route('/classes', methods=['GET'])
def get_classes():
    """
    Get the current classes and their counts.
    """
    global labels
    from collections import Counter
    class_counts = Counter(labels)
    return jsonify({'classes': dict(class_counts), 'total_samples': len(labels)})


@app.route('/train', methods=['POST'])
def train():
    global model, labels, features
    
    if len(set(labels)) < 2:
        return jsonify({'error': 'Need at least 2 different classes to train the model'}), 400
    
    if len(features) < 10:
        return jsonify({'error': 'Need at least 10 samples to train the model'}), 400
    
    model = KNeighborsClassifier(n_neighbors=3)
    model.fit(features, labels)
    
    # Save model and training data
    model_data = {
        'model': model,
        'labels': labels,
        'features': features
    }
    
    with open('model/model.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    return jsonify({
        'status': 'trained',
        'classes': list(set(labels)),
        'total_samples': len(features)
    })


@app.route('/predict', methods=['POST'])
def predict():
    global model, labels, features
    model_path = 'model/model.pkl'
    
    if not os.path.exists(model_path):
        return jsonify({'error': 'Model not found. Please train the model first.'}), 404
    
    if model is None:
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
            model = model_data['model']
            labels = model_data['labels']
            features = model_data['features']

    data = request.get_json()
    img_base64 = data['image']
    nparr = np.frombuffer(bytes.fromhex(img_base64), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (64, 64))
    prediction = model.predict([img.flatten()])
    
    # Get prediction confidence using k-nearest neighbors
    k = min(3, len(features))  # Use k=3 or all available samples if less than 3
    distances, indices = model.kneighbors([img.flatten()], n_neighbors=k)
    
    # Calculate confidence based on the nearest neighbor distance
    nearest_distance = distances[0][0]
    
    # Use a simpler confidence calculation based on distance magnitude
    # Normalize by a reasonable distance scale for 64x64 grayscale images
    # Maximum possible distance is sqrt(4096 * 255^2) ≈ 16320
    max_possible_distance = 255 * np.sqrt(64 * 64)
    
    if nearest_distance > 0:
        # Normalize distance and use exponential decay
        normalized_distance = nearest_distance / max_possible_distance
        confidence = np.exp(-normalized_distance * 10)  # Scale factor for better sensitivity
    else:
        confidence = 1.0  # Perfect match
    
    return jsonify({
        'label': prediction[0],
        'confidence': float(confidence),
        'available_classes': list(set(labels))
    })

# This is the optimized endpoint for real-time streaming predictions.
@app.route('/predict-stream', methods=['POST'])
def predict_stream():
    """
    Optimized endpoint for real-time streaming predictions.
    """
    global model, labels, features
    model_path = 'model/model.pkl'
    
    if not os.path.exists(model_path):
        return jsonify({'error': 'Model not found. Please train the model first.'}), 404
    
    if model is None:
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
            model = model_data['model']
            labels = model_data['labels']
            features = model_data['features']

    data = request.get_json()
    img_base64 = data['image']
    nparr = np.frombuffer(bytes.fromhex(img_base64), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (64, 64))
    prediction = model.predict([img.flatten()])
    
    # Get prediction confidence using k-nearest neighbors
    k = min(3, len(features))  # Use k=3 or all available samples if less than 3
    distances, indices = model.kneighbors([img.flatten()], n_neighbors=k)
    
    # Calculate confidence based on the nearest neighbor distance
    nearest_distance = distances[0][0]
    
    # Use a simpler confidence calculation based on distance magnitude
    # Normalize by a reasonable distance scale for 64x64 grayscale images
    # Maximum possible distance is sqrt(4096 * 255^2) ≈ 16320
    max_possible_distance = 255 * np.sqrt(64 * 64)
    
    if nearest_distance > 0:
        # Normalize distance and use exponential decay
        normalized_distance = nearest_distance / max_possible_distance
        confidence = np.exp(-normalized_distance * 10)  # Scale factor for better sensitivity
    else:
        confidence = 1.0  # Perfect match
    
    return jsonify({
        'label': prediction[0],
        'confidence': float(confidence)
    })

@app.route('/models', methods=['GET'])
def get_models():
    """
    Get all available models from the model directory.
    """
    model_dir = 'model'
    models = []
    
    if os.path.exists(model_dir):
        # Get all .pkl files in the model directory
        model_files = glob.glob(os.path.join(model_dir, '*.pkl'))
        
        for model_file in model_files:
            try:
                # Get file info
                file_size = os.path.getsize(model_file)
                file_name = os.path.basename(model_file)
                file_path = model_file
                
                # Try to load model info if possible
                model_info = {
                    'name': file_name,
                    'path': file_path,
                    'size': file_size,
                    'size_mb': round(file_size / (1024 * 1024), 2)
                }
                
                # Try to get model details if it's a valid pickle file
                try:
                    with open(model_file, 'rb') as f:
                        model_data = pickle.load(f)
                        if isinstance(model_data, dict):
                            if 'labels' in model_data:
                                model_info['classes'] = list(set(model_data['labels']))
                                model_info['total_samples'] = len(model_data['labels'])
                            if 'model' in model_data:
                                model_info['model_type'] = type(model_data['model']).__name__
                except Exception as e:
                    model_info['error'] = f"Could not load model details: {str(e)}"
                
                models.append(model_info)
                
            except Exception as e:
                models.append({
                    'name': os.path.basename(model_file),
                    'path': model_file,
                    'error': f"Error reading file: {str(e)}"
                })
    
    return jsonify({
        'models': models,
        'total_count': len(models)
    })

if __name__ == '__main__':
    app.run(debug=True)