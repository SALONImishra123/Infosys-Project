const API_BASE_URL = '/api';

class WorkspaceService {
  async createWorkspace(name, description, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create workspace');
    }

    return response.json();
  }

  async getUserWorkspaces(token) {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch workspaces');
    }

    return response.json();
  }

  async getWorkspaceById(id, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch workspace');
    }

    return response.json();
  }

  async updateWorkspace(id, data, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update workspace');
    }

    return response.json();
  }

  async deleteWorkspace(id, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete workspace');
    }

    return response.json();
  }

  async getWorkspaceStats(id, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch workspace stats');
    }

    return response.json();
  }
}

export const workspaceService = new WorkspaceService();