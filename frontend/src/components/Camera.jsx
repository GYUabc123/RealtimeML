import React, { useRef, useState } from 'react';
import axios from 'axios';

function Camera() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [label, setLabel] = useState('');

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const captureImages = async () => {
    const ctx = canvasRef.current.getContext('2d');
    let imgs = [];

    for (let i = 0; i < 40; i++) {
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg'));
      const buffer = await blob.arrayBuffer();
      imgs.push(Buffer.from(buffer).toString('hex'));
    }

    await axios.post('http://localhost:5000/upload', {
      images: imgs,
      label
    });
  };

  const trainModel = async () => {
    await axios.post('http://localhost:5000/train');
    alert("Model trained!");
  };

  return (
    <div>
      <video ref={videoRef} width="300" height="200" />
      <canvas ref={canvasRef} width="128" height="128" style={{ display: 'none' }} />
      <div>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={captureImages}>Capture Images</button>
        <button onClick={trainModel}>Train</button>
      </div>
    </div>
  );
}

export default Camera;
