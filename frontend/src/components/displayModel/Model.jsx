import React, { useState, useEffect } from 'react';
import './Model.css';

function Model() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setModels(data.models);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className='model-container'>
                <h1>Models</h1>
                <div className="loading">Loading models...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='model-container'>
                <h1>Models</h1>
                <div className="error">Error: {error}</div>
                <button onClick={fetchModels} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className='model-container'>
            <h1>Models</h1>
            <div className="models-header">
                <p>Found {models.length} model(s)</p>
                <button onClick={fetchModels} className="refresh-btn">Refresh</button>
            </div>
            
            {models.length === 0 ? (
                <div className="no-models">
                    <p>No models found in the backend/models directory.</p>
                    <p>Train a model first to see it here.</p>
                </div>
            ) : (
                <div className="models-grid">
                    {models.map((model, index) => (
                        <div key={index} className="model-card">
                            <div className="model-header">
                                <h3>{model.name}</h3>
                                <span className="model-size">{model.size_mb} MB</span>
                            </div>
                            
                            <div className="model-details">
                                <div className="detail-item">
                                    <strong>Path:</strong> {model.path}
                                </div>
                                
                                {model.model_type && (
                                    <div className="detail-item">
                                        <strong>Type:</strong> {model.model_type}
                                    </div>
                                )}
                                
                                {model.classes && (
                                    <div className="detail-item">
                                        <strong>Classes:</strong> {model.classes.join(', ')}
                                    </div>
                                )}
                                
                                {model.total_samples && (
                                    <div className="detail-item">
                                        <strong>Total Samples:</strong> {model.total_samples}
                                    </div>
                                )}
                                
                                {model.error && (
                                    <div className="detail-item error">
                                        <strong>Error:</strong> {model.error}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Model;