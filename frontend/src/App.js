import React, { useState, useEffect } from 'react';
import Camera from './components/camera/Camera';
import TrainForm from './components/trainForm/TrainForm';
import axios from 'axios';
import './App.css';

function App() {
  const [label, setLabel] = useState('');
  const [classes, setClasses] = useState({});
  const [totalSamples, setTotalSamples] = useState(0);
  const [isTrained, setIsTrained] = useState(false);

  // Load current classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/classes');
      setClasses(response.data.classes);
      setTotalSamples(response.data.total_samples);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  // Callback to receive captured images from Camera
  const handleCaptureImages = async (imgs, label) => {
    if (!label) {
      alert("Please enter a label before capturing.");
      return;
    }
    try {
      await axios.post('http://localhost:5000/upload', {
        images: imgs,
        label,
      });
      alert(`Added ${imgs.length} images to label "${label}"`);
      loadClasses(); // Refresh the classes display
    } catch (error) {
      alert('Error uploading images');
    }
  };

  const clearData = async () => {
    if (window.confirm('Are you sure you want to clear all training data?')) {
      try {
        await axios.post('http://localhost:5000/clear');
        setClasses({});
        setTotalSamples(0);
        setIsTrained(false);
        alert('All training data cleared!');
      } catch (error) {
        alert('Error clearing data');
      }
    }
  };

  return (
    <div className="app-container">
      <h1>Real Time ML</h1>
      
      {/* Current Status */}
      <div className="status-dashboard">
        <h3>Current Training Status:</h3>
        <p><strong>Total Samples:</strong> {totalSamples}</p>
        <p><strong>Classes:</strong> {Object.keys(classes).length > 0 ? 
          Object.entries(classes).map(([cls, count]) => `${cls} (${count})`).join(', ') : 
          'None'}</p>
        <p><strong>Model Status:</strong> {isTrained ? '✅ Trained' : '❌ Not Trained'}</p>
        {Object.keys(classes).length >= 2 && totalSamples >= 10 && !isTrained && (
          <p className="ready-to-train">✅ Ready to train! (Need at least 2 classes and 10 samples)</p>
        )}
      </div>

      {/* Input for new class */}
      <div className="input-section">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter class label (e.g., 'human', 'cup', 'phone')"
          className="label-input"
        />
        <button 
          onClick={clearData}
          className="clear-button"
        >
          Clear All Data
        </button>
      </div>

      <Camera 
        label={label} 
        onCaptureImages={handleCaptureImages}
        onTrainSuccess={() => setIsTrained(true)}
      />
      <TrainForm onTrainSuccess={() => setIsTrained(true)} />
    </div>
  );
}

export default App;
