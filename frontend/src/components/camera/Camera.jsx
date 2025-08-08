import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './Camera.css';
import Model from '../displayModel/Model';

function Camera({ label, onCaptureImages, onTrainSuccess }) {
  const videoRef = useRef();
  const canvasRef = React.useRef();
  const [isRunning, setIsRunning] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const blobToHex = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        resolve(hex);
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  const captureImages = async () => {
    if (!label.trim()) {   // Check if label is empty and trim = if it is a space
      alert("Please enter a label before capturing.");
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    let imgs = [];

    for (let i = 0; i < 40; i++) {
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const blob = await new Promise((res) =>
        canvasRef.current.toBlob(res, 'image/jpeg')
      );
      const hex = await blobToHex(blob);
      imgs.push(hex);
    }

    onCaptureImages(imgs, label);
  };

  const predictFrame = async () => {
    if (!videoRef.current || !isRunning) return;

    try {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg'));
      const hexImage = await blobToHex(blob);

      const response = await axios.post('http://127.0.0.1:5000/predict-stream', {
        image: hexImage
      });
      
      const { label: predictedLabel, confidence: conf } = response.data;
      setPrediction(predictedLabel);
      setConfidence(conf);
    } catch (error) {
      console.error('Prediction error:', error);
      setPrediction('Error');
      setConfidence(0);
    }
  };

  // Real-time prediction loop
  useEffect(() => {
    let intervalId;
    
    if (isRunning && videoRef.current) {
      // Start prediction loop
      intervalId = setInterval(predictFrame, 500); // Predict every 500ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const handleStartStopPrediction = () => {
    if (!videoRef.current) {
      alert("Please start the camera first.");
      return;
    }

    setIsRunning(prev => !prev);
    
    if (!isRunning) {
      setPrediction('');
      setConfidence(0);
    }
  };

  return (
    <div className="camera-container">
      <div className="camera-and-model">
        <div className="left-camera-and-model">
          <video ref={videoRef} width="500" height="350" className="camera-video" />
          <canvas ref={canvasRef} width="128" height="128" style={{ display: 'none' }} />
          <div className="camera-buttons">
            <button 
              onClick={startCamera}
              className="camera-button start-camera-button"
            >
              Start Camera
            </button>

            <button 
              onClick={captureImages}
              className="camera-button capture-button"
            >
              Capture Images
            </button>

            <button 
              onClick={handleStartStopPrediction}
              className={`camera-button predict-button ${isRunning ? 'stop' : 'run'}`}
            >
              {isRunning ? 'Stop Prediction' : 'Run Prediction'}
            </button>
          </div>        
        </div>
        
        <div className="right-camera-and-model">
          <Model />
        </div>
      </div>
      {/* Prediction Display */}
      {isRunning && (
        <div className="prediction-display">
          <div className="prediction-text">
            <span className="prediction-label">Detected:</span>
            <span className="prediction-value">{prediction || 'Processing...'}</span>
          </div>
          {confidence > 0 && (
            <div className="confidence-text">
              <span className="confidence-label">Confidence:</span>
              <span className="confidence-value">{(confidence * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Camera;

