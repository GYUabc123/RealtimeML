import React, { useRef } from 'react';
import axios from 'axios';
import './Camera.css';

function Camera({ label, onCaptureImages, onTrainSuccess }) {
  const videoRef = useRef();
  const canvasRef = React.useRef();

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

    for (let i = 0; i < 100; i++) {
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const blob = await new Promise((res) =>
        canvasRef.current.toBlob(res, 'image/jpeg')
      );
      const hex = await blobToHex(blob);
      imgs.push(hex);
    }

    onCaptureImages(imgs, label);
  };


  const runModel = async () => {
    const ctx = canvasRef.current.getContext('2d'); // Ensure canvas context is available
    if (!videoRef.current) {
      alert("Please start the camera first.");
      return;
    }

    // Get image from video and convert to hex
    ctx.drawImage(videoRef.current, 0, 0, 128, 128); // Draw the current video frame to the canvas
    const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg')); // Convert canvas to blob
    const buffer = await blob.arrayBuffer(); // Convert blob to ArrayBuffer
    const hexImage = await blobToHex(blob); // Convert blob to hex string

    // Send POST request
    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', {
        image: hexImage
      });
      
      const { label: predictedLabel, confidence, available_classes } = response.data;
      const confidencePercent = (confidence * 100).toFixed(1);
      
      console.log('Prediction:', predictedLabel, 'Confidence:', confidencePercent + '%');
      
      alert(`Prediction: ${predictedLabel}\nConfidence: ${confidencePercent}%\nAvailable classes: ${available_classes.join(', ')}`);
    } catch (error) {
      console.error('Prediction error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Prediction failed: ${error.response.data.error}`);
      } else {
        alert('Prediction failed. Please try again.');
      }
    }
  }

  return (
    <div className="camera-container">
      <video ref={videoRef} width="300" height="200" className="camera-video" />
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
          onClick={runModel}
          className="camera-button predict-button"
        >
          Run Prediction
        </button>
      </div>
    </div>
  );
}

export default Camera;

