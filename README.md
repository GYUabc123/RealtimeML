<<<<<<< HEAD
# Real-Time Machine Learning System
=======
 # Real-Time Machine Learning System
>>>>>>> 123c93f16d9fa412ed5bc2754a3f0298a70bb4e0

This is a real-time machine learning system that can classify objects using your webcam. It uses a K-Nearest Neighbors (KNN) algorithm to classify images.

## Features

- **Multi-class classification**: Train the model on multiple different classes (e.g., human, cup, phone, etc.)
- **Real-time prediction**: Use your webcam to get instant predictions
- **Confidence scoring**: See how confident the model is in its predictions
- **Visual feedback**: Clear status indicators and progress tracking

## How to Use

### 1. Setup

1. Install backend dependencies:
   ```bash
   cd backend
   pip install flask flask-cors opencv-python numpy scikit-learn
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### 2. Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser to `http://localhost:3000`

### 3. Training Multiple Classes

**Step 1: Add your first class**
- Enter a label (e.g., "human") in the input field
- Click "Start Camera" to activate your webcam
- Click "Capture Images" to take 40 training images
- The system will show you've added 40 images for "human"

**Step 2: Add your second class**
- Change the label to something else (e.g., "cup")
- Click "Capture Images" again to take 40 images of the cup
- Now you have 80 total samples across 2 classes

**Step 3: Train the model**
- Click "Train Model" to train the KNN classifier
- The system will confirm training with the classes and sample count

**Step 4: Test predictions**
- Click "Run Prediction" to test the model with your webcam
- You'll see the predicted class and confidence score

### 4. Adding More Classes

You can add as many classes as you want:
- Simply change the label and capture more images
- Each class should have at least 20-40 images for good results
- Retrain the model after adding new classes

### 5. Clearing Data

- Use the "Clear All Data" button to start fresh
- This removes all training data and the trained model

## Requirements

- **Backend**: Python 3.7+, Flask, OpenCV, NumPy, scikit-learn
- **Frontend**: Node.js, React
- **Hardware**: Webcam for image capture

## How It Works

1. **Image Processing**: Images are captured at 128x128 pixels, converted to grayscale, and resized to 64x64 for processing
2. **Feature Extraction**: Each image is flattened into a 4096-dimensional feature vector
3. **Training**: KNN algorithm learns from the training data with k=3 neighbors
4. **Prediction**: New images are classified based on similarity to training examples
5. **Confidence**: Confidence is calculated based on distance to nearest neighbor

## Tips for Better Results

- **Good lighting**: Ensure your webcam area is well-lit
- **Consistent positioning**: Try to capture objects from similar angles
- **Multiple samples**: Capture 40+ images per class for better accuracy
- **Clear backgrounds**: Use a simple, consistent background
- **Variety**: Capture objects from slightly different angles and positions

## Troubleshooting

- **"Need at least 2 different classes"**: Add more classes before training
- **"Need at least 10 samples"**: Capture more images before training
- **Low confidence predictions**: Add more training samples or improve image quality
<<<<<<< HEAD
- **Camera not working**: Check browser permissions for camera access 
=======
- **Camera not working**: Check browser permissions for camera access 
>>>>>>> 123c93f16d9fa412ed5bc2754a3f0298a70bb4e0
