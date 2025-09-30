import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetService } from '../services/datasetService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const DatasetUpload = ({ selectedWorkspace }) => {
  const { token } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    format: 'json',
    fileContent: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (selectedWorkspace) {
      loadDatasets();
    }
  }, [selectedWorkspace, token]);

  const loadDatasets = async () => {
    if (!selectedWorkspace) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await datasetService.getWorkspaceDatasets(
        selectedWorkspace._id,
        token
      );
      setDatasets(response.datasets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    let format = 'json';
    if (fileExtension === 'csv') format = 'csv';
    else if (fileExtension === 'yml' || fileExtension === 'yaml') format = 'rasa';

    reader.onload = (e) => {
      setUploadData({
        name: file.name.replace(/\.[^/.]+$/, ''),
        format,
        fileContent: e.target.result
      });
      setShowUploadForm(true);
      setError('');
      setSuccess('');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedWorkspace) {
      setError('Please select a workspace first');
      return;
    }

    if (!uploadData.name.trim() || !uploadData.fileContent) {
      setError('Please provide dataset name and file content');
      return;
    }

    try {
      setUploadLoading(true);
      setError('');
      setSuccess('');

      await datasetService.uploadDataset(
        selectedWorkspace._id,
        uploadData.name.trim(),
        uploadData.format,
        uploadData.fileContent,
        token
      );

      setSuccess('Dataset uploaded successfully!');
      setShowUploadForm(false);
      setUploadData({ name: '', format: 'json', fileContent: '' });
      await loadDatasets();

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!selectedWorkspace) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to upload datasets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">
          Dataset Upload - {selectedWorkspace.name}
        </h2>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">☁️</div>
        <div className="upload-text">Upload dataset in CSV, JSON, or Rasa format</div>
        <div className="upload-hint">
          Click here or drag and drop your dataset file
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.yml,.yaml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {showUploadForm && (
        <div className="upload-form fade-in">
          <form onSubmit={handleUpload}>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Dataset Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={uploadData.name}
                    onChange={(e) => setUploadData(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                    required
                    placeholder="Enter dataset name"
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select
                    className="form-control"
                    value={uploadData.format}
                    onChange={(e) => setUploadData(prev => ({ 
                      ...prev, 
                      format: e.target.value 
                    }))}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="rasa">Rasa YAML</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    Uploading...
                  </>
                ) : (
                  'Upload Dataset'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadData({ name: '', format: 'json', fileContent: '' });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="btn btn-outline"
                disabled={uploadLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>Uploaded Datasets</h3>
        {loading ? (
          <LoadingSpinner text="Loading datasets..." />
        ) : (
          <div className="dataset-list">
            {datasets.length > 0 ? (
              datasets.map(dataset => (
                <div key={dataset._id} className="dataset-item">
                  <div className="dataset-info">
                    <div className="dataset-icon">
                      {dataset.format.toUpperCase().charAt(0)}
                    </div>
                    <div className="dataset-details">
                      <h4>{dataset.name}</h4>
                      <div className="dataset-meta">
                        Format: {dataset.format.toUpperCase()} • 
                        Examples: {dataset.statistics.totalExamples} • 
                        Intents: {dataset.statistics.totalIntents} • 
                        Entities: {dataset.statistics.totalEntities}
                      </div>
                      <div className="dataset-meta">
                        Uploaded {new Date(dataset.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="dataset-actions">
                    <button className="btn btn-outline btn-small">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>No Datasets</h3>
                <p>Upload your first dataset to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetUpload;