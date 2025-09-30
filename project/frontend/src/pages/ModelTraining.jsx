import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { modelService } from '../services/modelService';
import { annotationService } from '../services/annotationService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/Annotation.css';

const ModelTraining = ({ selectedWorkspace }) => {
  const { token } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBackend, setSelectedBackend] = useState('rasa');
  const [annotationStats, setAnnotationStats] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null); // For modal
  const [showModal, setShowModal] = useState(false);

  const backends = [
    {
      id: 'rasa',
      name: 'Rasa',
      description: 'Open source NLP framework with advanced intent classification and entity extraction'
    },
    {
      id: 'spacy',
      name: 'spaCy',
      description: 'Industrial-strength Natural Language Processing with custom model training'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Transformers library with pre-trained models for various NLP tasks'
    }
  ];

  useEffect(() => {
    if (selectedWorkspace) {
      loadModels();
      loadAnnotationStats();
    }
  }, [selectedWorkspace, token]);

  const loadModels = async () => {
    if (!selectedWorkspace) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await modelService.getWorkspaceModels(selectedWorkspace._id, token);
      setModels(response.models);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotationStats = async () => {
    if (!selectedWorkspace) return;
    
    try {
      const response = await annotationService.getAnnotationStats(selectedWorkspace._id, token);
      setAnnotationStats(response.stats);
    } catch (err) {
      console.error('Failed to load annotation stats:', err);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedWorkspace) {
      setError('Please select a workspace first');
      return;
    }

    if (!annotationStats || annotationStats.total === 0) {
      setError('No annotations available. Please annotate some data first.');
      return;
    }

    try {
      setTrainLoading(true);
      setError('');
      setSuccess('');

      const modelName = `${selectedWorkspace.name}_${selectedBackend}_${Date.now()}`;
      const trainingData = {
        name: modelName,
        workspaceId: selectedWorkspace._id,
        backend: selectedBackend,
        configuration: {
          pipeline: selectedBackend === 'rasa' ? 
            ['WhitespaceTokenizer', 'RegexFeaturizer', 'LexicalSyntacticFeaturizer', 'CountVectorsFeaturizer', 'DIETClassifier'] :
            selectedBackend === 'spacy' ?
            ['tok2vec', 'tagger', 'parser', 'ner'] :
            ['tokenizer', 'model']
        }
      };

      await modelService.trainModel(trainingData, token);
      setSuccess('Model training started successfully!');
      await loadModels();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setTrainLoading(false);
    }
  };

  const getModelStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return '✅';
      case 'training':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return '#38a169';
      case 'training':
        return '#ed8936';
      case 'failed':
        return '#e53e3e';
      default:
        return '#718096';
    }
  };

  const openModal = (model) => {
    setSelectedModel(model);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedModel(null);
    setShowModal(false);
  };

  const handleTestModel = (model) => {
    alert(`Testing model: ${model.name}\nBackend: ${model.backend}`);
    // Here you can integrate a proper test interface later
  };

  if (!selectedWorkspace) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to train models</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="annotation-interface">
        <div className="annotation-header">
          <div className="annotation-title">🤖 Model Training</div>
          <div className="annotation-progress">
            Workspace: {selectedWorkspace.name}
          </div>
        </div>

        <div className="annotation-content">
          {error && <ErrorMessage message={error} />}
          {success && <div className="success-message">{success}</div>}

          {/* Training Data Stats */}
          {annotationStats && (
            <div className="annotation-section">
              <div className="section-header">
                <div className="section-icon">📊</div>
                <h3 className="section-title">Training Data Statistics</h3>
              </div>
              <div className="workspace-stats" style={{ justifyContent: 'flex-start', gap: '2rem' }}>
                <div className="workspace-stat">
                  <span className="workspace-stat-value">{annotationStats.total}</span>
                  <span className="workspace-stat-label">Total Annotations</span>
                </div>
                <div className="workspace-stat">
                  <span className="workspace-stat-value">{annotationStats.intents?.length || 0}</span>
                  <span className="workspace-stat-label">Unique Intents</span>
                </div>
                <div className="workspace-stat">
                  <span className="workspace-stat-value">{annotationStats.entities?.length || 0}</span>
                  <span className="workspace-stat-label">Entity Types</span>
                </div>
                <div className="workspace-stat">
                  <span className="workspace-stat-value">{annotationStats.validated}</span>
                  <span className="workspace-stat-label">Validated</span>
                </div>
              </div>
            </div>
          )}

          {/* NLU Backend Selection */}
          <div className="annotation-section">
            <div className="section-header">
              <div className="section-icon">⚙️</div>
              <h3 className="section-title">NLU Backend Selection</h3>
            </div>

            <div className="model-backends">
              {backends.map(backend => (
                <div
                  key={backend.id}
                  className={`backend-card ${selectedBackend === backend.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBackend(backend.id)}
                >
                  <div className="backend-logo">{backend.name.charAt(0)}</div>
                  <div className="backend-name">{backend.name}</div>
                  <div className="backend-description">{backend.description}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="train-button"
                onClick={handleTrainModel}
                disabled={trainLoading || !annotationStats || annotationStats.total === 0}
              >
                {trainLoading ? (
                  <>
                    <LoadingSpinner size="small" /> Training Model...
                  </>
                ) : (
                  <>▶️ Train Model</>
                )}
              </button>

              {annotationStats && annotationStats.total > 0 ? (
                <div className="training-status">
                  <div className="status-icon status-ready">✅</div>
                  Ready to train
                </div>
              ) : (
                <div className="training-status" style={{ color: '#ed8936' }}>
                  <div className="status-icon status-training">⚠️</div>
                  Need annotations to train
                </div>
              )}
            </div>
          </div>

          {/* Trained Models */}
          <div className="annotation-section">
            <div className="section-header">
              <div className="section-icon">🗂️</div>
              <h3 className="section-title">Trained Models</h3>
            </div>

            {loading ? (
              <LoadingSpinner text="Loading models..." />
            ) : models.length > 0 ? (
              <div className="dataset-list">
                {models.map(model => (
                  <div key={model._id} className="dataset-item">
                    <div className="dataset-info">
                      <div className="dataset-icon" style={{ background: getStatusColor(model.status) }}>
                        {getModelStatusIcon(model.status)}
                      </div>
                      <div className="dataset-details">
                        <h4>{model.name}</h4>
                        <div className="dataset-meta">
                          Backend: {model.backend.toUpperCase()} • Status: {model.status} • Training Data: {model.trainingData.annotationsCount} annotations
                        </div>
                        <div className="dataset-meta">
                          Created {new Date(model.createdAt).toLocaleDateString()}
                          {model.trainingCompleted && (
                            <> • Completed {new Date(model.trainingCompleted).toLocaleDateString()}</>
                          )}
                        </div>
                        {model.performance && (
                          <div className="dataset-meta">
                            Accuracy: {(model.performance.accuracy * 100).toFixed(1)}% • F1-Score: {(model.performance.f1Score * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="dataset-actions">
                      {model.status === 'ready' && (
                        <button className="btn btn-primary btn-small" onClick={() => handleTestModel(model)}>
                          Test Model
                        </button>
                      )}
                      <button className="btn btn-outline btn-small" onClick={() => openModal(model)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🤖</div>
                <h3>No Models Trained</h3>
                <p>Train your first model using the training data above</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Model Details */}
      {showModal && selectedModel && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedModel.name}</h3>
            <p>Backend: {selectedModel.backend}</p>
            <p>Status: {selectedModel.status}</p>
            <p>Created: {new Date(selectedModel.createdAt).toLocaleString()}</p>
            {selectedModel.trainingCompleted && <p>Completed: {new Date(selectedModel.trainingCompleted).toLocaleString()}</p>}
            {selectedModel.performance && (
              <>
                <p>Accuracy: {(selectedModel.performance.accuracy * 100).toFixed(1)}%</p>
                <p>F1-Score: {(selectedModel.performance.f1Score * 100).toFixed(1)}%</p>
              </>
            )}
            <button className="btn btn-primary" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTraining;
