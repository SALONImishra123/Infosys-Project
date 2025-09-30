const API_BASE_URL = '/api';

class DatasetService {
  async uploadDataset(workspaceId, name, format, data, token) {
    const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspaceId,
        name,
        format,
        data
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload dataset');
    }

    return response.json();
  }

  async getWorkspaceDatasets(workspaceId, token) {
    const response = await fetch(`${API_BASE_URL}/datasets/workspace/${workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch datasets');
    }

    return response.json();
  }

  async getDatasetById(id, token) {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dataset');
    }

    return response.json();
  }

  async deleteDataset(id, token) {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete dataset');
    }

    return response.json();
  }

  async getDatasetStats(id, token) {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dataset stats');
    }

    return response.json();
  }
}

export const datasetService = new DatasetService();