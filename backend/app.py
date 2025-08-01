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


@app.route('/train', methods=['POST'])
def train():
    global model
    model = KNeighborsClassifier(n_neighbors=3)
    model.fit(features, labels)
    with open('model/model.pkl', 'wb') as f:
        pickle.dump(model, f)
    return jsonify({'status': 'trained'})


@app.route('/predict', methods=['POST'])
def predict():
    global model
    model_path = 'model/model.pkl'
    if not os.path.exists(model_path):
        return jsonify({'error': 'Model not found. Please train the model first.'}), 404
    
    if model is None:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

    data = request.get_json()
    img_base64 = data['image']
    nparr = np.frombuffer(bytes.fromhex(img_base64), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (64, 64))
    prediction = model.predict([img.flatten()])
    return jsonify({'label': prediction[0]})

if __name__ == '__main__':
    app.run(debug=True)