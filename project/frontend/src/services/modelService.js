const API_BASE_URL = '/api';

class ModelService {
  async trainModel(data, token) {
    const response = await fetch(`${API_BASE_URL}/models/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start model training');
    }

    return response.json();
  }

  async getWorkspaceModels(workspaceId, token) {
    const response = await fetch(`${API_BASE_URL}/models/workspace/${workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch models');
    }

    return response.json();
  }

  async getModelById(id, token) {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch model');
    }

    return response.json();
  }

  async getModelStatus(id, token) {
    const response = await fetch(`${API_BASE_URL}/models/${id}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch model status');
    }

    return response.json();
  }

  async updateModel(id, data, token) {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update model');
    }

    return response.json();
  }

  async deleteModel(id, token) {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete model');
    }

    return response.json();
  }
}

export const modelService = new ModelService();