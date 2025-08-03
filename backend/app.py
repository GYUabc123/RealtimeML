from flask import Flask, request, jsonify        # Flask web server and request handling
from flask_cors import CORS                      # Enables Cross-Origin Resource Sharing (CORS)
import cv2                                       # OpenCV for image decoding and processing
import numpy as np                               # Numerical operations and array handling
import os                                        # File system operations
import pickle                                    # Saving/loading trained model
from sklearn.neighbors import KNeighborsClassifier  # KNN algorithm for classification

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
    
    # Get prediction confidence (distance to nearest neighbor)
    distances, indices = model.kneighbors([img.flatten()])
    confidence = 1 / (1 + distances[0][0])  # Convert distance to confidence
    
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
    
    # Get prediction confidence (distance to nearest neighbor)
    distances, indices = model.kneighbors([img.flatten()])
    confidence = 1 / (1 + distances[0][0])  # Convert distance to confidence
    
    return jsonify({
        'label': prediction[0],
        'confidence': float(confidence)
    })

if __name__ == '__main__':
    app.run(debug=True)