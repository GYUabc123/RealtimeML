// import React, { useRef, useState } from 'react';
// import axios from 'axios';

// function Camera() {
//   const videoRef = useRef();
//   const canvasRef = useRef();
//   const [label, setLabel] = useState('');

//   const startCamera = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     videoRef.current.srcObject = stream;
//     videoRef.current.play();
//   };

//   const captureImages = async () => {
//     const ctx = canvasRef.current.getContext('2d');
//     let imgs = [];

//     for (let i = 0; i < 40; i++) {
//       ctx.drawImage(videoRef.current, 0, 0, 128, 128);
//       const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg'));
//       const buffer = await blob.arrayBuffer();
//       imgs.push(Buffer.from(buffer).toString('hex'));
//     }

//     await axios.post('http://localhost:5000/upload', {
//       images: imgs,
//       label
//     });
//   };

//   const trainModel = async () => {
//     await axios.post('http://localhost:5000/train');
//     alert("Model trained!");
//   };

//   return (
//     <div>
//       <video ref={videoRef} width="300" height="200" />
//       <canvas ref={canvasRef} width="128" height="128" style={{ display: 'none' }} />
//       <div>
//         <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
//         <button onClick={startCamera}>Start Camera</button>
//         <button onClick={captureImages}>Capture Images</button>
//         <button onClick={trainModel}>Train</button>
//       </div>
//     </div>
//   );
// }

// export default Camera;

import React, { useRef } from 'react';
import axios from 'axios';

function Camera({ label, onCaptureImages }) {
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
      console.log('Prediction:', response.data.label);
      alert(`Prediction: ${response.data.label}`);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  }

  return (
    <div>
      <video ref={videoRef} width="300" height="200" />
      <canvas ref={canvasRef} width="128" height="128" style={{ display: 'none' }} />
      <div>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={captureImages}>Capture Images</button>
        <button onClick={runModel}>Run</button>
      </div>
    </div>
  );
}

export default Camera;

