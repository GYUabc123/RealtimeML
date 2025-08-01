import React, { useState } from 'react';
import Camera from './components/Camera';
import TrainForm from './components/TrainForm';

function App() {
  const [label, setLabel] = useState('');

  // Callback to receive captured images from Camera
  const handleCaptureImages = async (imgs, label) => {
    if (!label) {
      alert("Please enter a label before capturing.");
      return;
    }
    try {
      await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imgs, label }),
      });
      alert(`Added ${imgs.length} images to label "${label}"`);
    } catch (error) {
      alert('Error uploading images');
    }
  };

  return (
    <div>
      <h1>Real Time ML</h1>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
      />
      <Camera label={label} onCaptureImages={handleCaptureImages} />
      <TrainForm />
    </div>
  );
}

export default App;
