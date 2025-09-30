import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Auth from './Auth';
import WorkspaceSection from './WorkspaceSection';
import DatasetUpload from './DatasetUpload';
import AnnotationInterface from './AnnotationInterface';
import ModelTraining from './ModelTraining';
import TestModel from "../components/TestModel";
   // 👈 NEW IMPORT
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('workspace');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  if (loading) {
    return (
      <div className="dashboard">
        <LoadingSpinner size="large" text="Loading application..." />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const tabs = [
    { id: 'authentication', label: 'Authentication', disabled: true },
    { id: 'workspace', label: 'Workspace' },
    { id: 'dataset', label: 'Dataset Upload' },
    { id: 'annotation', label: 'Annotation Interface' },
    { id: 'training', label: 'Model Training' },
    { id: 'testmodel', label: 'Test Model' }   // 👈 NEW TAB
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'workspace':
        return (
          <WorkspaceSection 
            onWorkspaceSelect={setSelectedWorkspace}
            selectedWorkspace={selectedWorkspace}
          />
        );
      case 'dataset':
        return <DatasetUpload selectedWorkspace={selectedWorkspace} />;
      case 'annotation':
        return <AnnotationInterface selectedWorkspace={selectedWorkspace} />;
      case 'training':
        return <ModelTraining selectedWorkspace={selectedWorkspace} />;
      case 'testmodel':   // 👈 NEW CASE
        return <TestModel />;
      default:
        return <WorkspaceSection />;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-logo">
            <h1>🤖 NLU Trainer & Evaluator</h1>
          </div>
          
          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <div className="dashboard-user-name">{user.name}</div>
              <div className="dashboard-user-email">{user.email}</div>
            </div>
            <button onClick={logout} className="dashboard-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
