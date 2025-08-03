import React, { useState } from 'react';
import axios from 'axios';
import './TrainForm.css';

function TrainForm({ onTrainSuccess }) {
  const [isTraining, setIsTraining] = useState(false);

  const trainModel = async () => {
    setIsTraining(true);
    try {
      const response = await axios.post('http://localhost:5000/train');
      alert(`Model trained successfully!\nClasses: ${response.data.classes.join(', ')}\nTotal samples: ${response.data.total_samples}`);
      if (onTrainSuccess) {
        onTrainSuccess();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Training failed: ${error.response.data.error}`);
      } else {
        alert('Training failed. Please try again.');
      }
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="train-form">
      <button 
        onClick={trainModel} 
        disabled={isTraining}
        className="train-button"
      >
        {isTraining ? 'Training...' : 'Train Model'}
      </button>
      <p className="train-note">
        Note: You need at least 2 different classes and 10 total samples to train the model.
      </p>
    </div>
  );
}

export default TrainForm;
