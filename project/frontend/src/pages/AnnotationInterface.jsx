import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { annotationService } from '../services/annotationService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/Annotation.css';

const AnnotationInterface = ({ selectedWorkspace }) => {
  const { token } = useAuth();
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Annotation state
  const [currentText, setCurrentText] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('');
  const [customIntent, setCustomIntent] = useState('');
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [annotationMode, setAnnotationMode] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  // Sample data for demo
  const sampleIntents = [
    'book_flight', 'check_weather', 'find_restaurant', 
    'book_hotel', 'cancel_reservation', 'get_directions'
  ];

  const entityTypes = [
    { type: 'location', color: 'teal' },
    { type: 'date', color: 'orange' },
    { type: 'person', color: 'purple' },
    { type: 'organization', color: 'pink' }
  ];

  useEffect(() => {
    if (selectedWorkspace) {
      loadAnnotations();
    }
  }, [selectedWorkspace, token]);

  const loadAnnotations = async () => {
    if (!selectedWorkspace) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await annotationService.getWorkspaceAnnotations(
        selectedWorkspace._id,
        { limit: 10 },
        token
      );
      setAnnotations(response.annotations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && annotationMode) {
      const range = selection.getRangeAt(0);
      const start = range.startOffset;
      const end = range.endOffset;
      
      // Add entity
      const newEntity = {
        entity: annotationMode,
        value: selectedText,
        start,
        end
      };

      setSelectedEntities(prev => [...prev, newEntity]);
      setAnnotationMode(null);
      selection.removeAllRanges();
    }
  };

  const renderAnnotatedText = () => {
    if (!currentText) return '';

    let annotatedText = currentText;
    const sortedEntities = [...selectedEntities].sort((a, b) => b.start - a.start);

    sortedEntities.forEach(entity => {
      const before = annotatedText.substring(0, entity.start);
      const highlighted = annotatedText.substring(entity.start, entity.end);
      const after = annotatedText.substring(entity.end);
      
      const entityClass = `entity-highlight entity-${entity.entity}`;
      annotatedText = `${before}<span class="${entityClass}" title="${entity.entity}">${highlighted}</span>${after}`;
    });

    return annotatedText;
  };

  const handleSave = async () => {
    if (!selectedWorkspace) {
      setError('Please select a workspace first');
      return;
    }

    if (!currentText.trim()) {
      setError('Please enter text to annotate');
      return;
    }

    if (!selectedIntent && !customIntent) {
      setError('Please select or enter an intent');
      return;
    }

    try {
      setSaveLoading(true);
      setError('');
      setSuccess('');

      const annotationData = {
        text: currentText.trim(),
        intent: {
          name: selectedIntent || customIntent,
          confidence: 1.0
        },
        entities: selectedEntities,
        workspaceId: selectedWorkspace._id,
        notes: ''
      };

      await annotationService.createAnnotation(annotationData, token);
      
      setSuccess('Annotation saved successfully!');
      await loadAnnotations();
      
      // Clear form
      setCurrentText('');
      setSelectedIntent('');
      setCustomIntent('');
      setSelectedEntities([]);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNext = () => {
    // In real implementation, this would load the next example
    setCurrentText('');
    setSelectedIntent('');
    setCustomIntent('');
    setSelectedEntities([]);
    setError('');
    setSuccess('');
  };

  const removeEntity = (index) => {
    setSelectedEntities(prev => prev.filter((_, i) => i !== index));
  };

  if (!selectedWorkspace) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <div className="empty-state-icon">✏️</div>
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to start annotating</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="annotation-interface">
        <div className="annotation-header">
          <div className="annotation-title">
            ✏️ Annotation & Model Integration
          </div>
          <div className="annotation-progress">
            Workspace: {selectedWorkspace.name}
          </div>
        </div>

        <div className="annotation-content">
          {error && <ErrorMessage message={error} />}
          {success && <div className="success-message">{success}</div>}

          {/* Text Annotation Section */}
          <div className="annotation-section">
            <div className="section-header">
              <div className="section-icon">📝</div>
              <h3 className="section-title">Text Annotation</h3>
            </div>

            <div className="text-input-container">
              <textarea
                className="text-input"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onMouseUp={handleTextSelection}
                placeholder="I want to book a flight to New York on June 15th"
              />
            </div>

            {currentText && (
              <div 
                className="annotation-display"
                dangerouslySetInnerHTML={{ __html: renderAnnotatedText() }}
              />
            )}

            {/* Selected entities display */}
            {selectedEntities.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Selected Entities:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedEntities.map((entity, index) => (
                    <span 
                      key={index}
                      className={`entity-highlight entity-${entity.entity}`}
                      onClick={() => removeEntity(index)}
                      style={{ cursor: 'pointer' }}
                      title="Click to remove"
                    >
                      {entity.value} ({entity.entity})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Intent Selection */}
          <div className="annotation-section">
            <div className="section-header">
              <div className="section-icon">🎯</div>
              <h3 className="section-title">Select Intent</h3>
            </div>

            <div className="intent-buttons">
              {sampleIntents.map(intent => (
                <button
                  key={intent}
                  className={`intent-button ${selectedIntent === intent ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedIntent(intent);
                    setCustomIntent('');
                  }}
                >
                  {intent}
                </button>
              ))}
              <input
                type="text"
                className="custom-intent-input"
                value={customIntent}
                onChange={(e) => {
                  setCustomIntent(e.target.value);
                  setSelectedIntent('');
                }}
                placeholder="Custom intent..."
              />
            </div>
          </div>

          {/* Entity Tools */}
          <div className="annotation-section">
            <div className="section-header">
              <div className="section-icon">🏷️</div>
              <h3 className="section-title">Entity Tools</h3>
            </div>

            <div className="entity-tools">
              {entityTypes.map(entity => (
                <button
                  key={entity.type}
                  className={`entity-tool ${annotationMode === entity.type ? 'active' : ''}`}
                  onClick={() => setAnnotationMode(
                    annotationMode === entity.type ? null : entity.type
                  )}
                >
                  {entity.type}
                </button>
              ))}
            </div>

            {annotationMode && (
              <div className="entity-instructions">
                Select text above to mark it as <strong>{annotationMode}</strong>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="annotation-actions">
            <button
              className="action-button action-save"
              onClick={handleSave}
              disabled={saveLoading || !currentText.trim()}
            >
              {saveLoading ? <LoadingSpinner size="small" /> : '💾'} Save
            </button>
            <button
              className="action-button action-next"
              onClick={handleNext}
              disabled={saveLoading}
            >
              ⏭️ Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationInterface;