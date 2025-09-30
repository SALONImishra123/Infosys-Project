import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workspaceService } from '../services/workspaceService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const WorkspaceSection = ({ onWorkspaceSelect, selectedWorkspace }) => {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadWorkspaces();
  }, [token]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await workspaceService.getUserWorkspaces(token);
      setWorkspaces(response.workspaces);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setCreateLoading(true);
      setError('');
      await workspaceService.createWorkspace(
        formData.name.trim(),
        formData.description.trim(),
        token
      );
      
      // Reset form and reload workspaces
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      await loadWorkspaces();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleWorkspaceSelect = (workspace) => {
    onWorkspaceSelect(workspace);
    setError('');
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading workspaces..." />;
  }

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">Project Workspaces</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
          disabled={createLoading}
        >
          + Create New Workspace
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadWorkspaces} />}

      {showCreateForm && (
        <div className="workspace-form fade-in">
          <form onSubmit={handleCreateWorkspace}>
            <div className="form-group">
              <label className="form-label">Workspace Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., HR Bot, Travel Assistant"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your NLU project"
                rows="3"
              />
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={createLoading}
              >
                {createLoading ? <LoadingSpinner size="small" /> : 'Create Workspace'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '' });
                  setError('');
                }}
                className="btn btn-outline"
                disabled={createLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="workspaces-grid">
        {workspaces.map(workspace => (
          <div
            key={workspace._id}
            className={`workspace-card ${selectedWorkspace?._id === workspace._id ? 'active' : ''}`}
            onClick={() => handleWorkspaceSelect(workspace)}
          >
            <div className="workspace-name">{workspace.name}</div>
            <div className="workspace-date">
              Created {formatDate(workspace.createdAt)}
            </div>
            {workspace.description && (
              <p className="workspace-description">{workspace.description}</p>
            )}
            <div className="workspace-stats">
              <div className="workspace-stat">
                <span className="workspace-stat-value">
                  {workspace.datasets?.length || 0}
                </span>
                <span className="workspace-stat-label">Datasets</span>
              </div>
              <div className="workspace-stat">
                <span className="workspace-stat-value">
                  {workspace.annotations?.length || 0}
                </span>
                <span className="workspace-stat-label">Annotations</span>
              </div>
              <div className="workspace-stat">
                <span className="workspace-stat-value">
                  {workspace.models?.length || 0}
                </span>
                <span className="workspace-stat-label">Models</span>
              </div>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <div className="empty-state col-12">
            <div className="empty-state-icon">📁</div>
            <h3>No Workspaces Yet</h3>
            <p>Create your first workspace to start training NLU models</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSection;
