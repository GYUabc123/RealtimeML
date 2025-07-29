import React, { useState } from 'react';
import axios from 'axios';

function TrainForm({ onCaptureImages }) {
  const [label, setLabel] = useState('');

  const handleCaptureImages = async (imgs) => {
    if (!label) {
      alert("Please enter a label before capturing.");
      return;
    }
    await axios.post('http://localhost:5000/upload', {
      images: imgs,
      label,
    });
    alert(`Added ${imgs.length} images to label "${label}"`);
  };

  const trainModel = async () => {
    await axios.post('http://localhost:5000/train');
    alert("Model trained!");
  };

  return (
    <div>
      {/* <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
      /> */}
      <button onClick={trainModel}>Train</button>
    </div>
  );
}

export default TrainForm;
