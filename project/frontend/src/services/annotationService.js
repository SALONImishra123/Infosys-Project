// services/annotationService.js
const API_BASE_URL = '/api';

class AnnotationService {
  async createAnnotation(data, token) {
    // data must contain workspaceId
    const { workspaceId } = data;
    if (!workspaceId) throw new Error('workspaceId required');

    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: data.text,
        intent: data.intent,
        entities: data.entities
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save annotation' }));
      throw new Error(error.message || 'Failed to save annotation');
    }

    return response.json();
  }

  async getWorkspaceAnnotations(workspaceId, params, token) {
    const queryString = new URLSearchParams(params || {}).toString();
    const url = `${API_BASE_URL}/workspaces/${workspaceId}/annotations${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch annotations' }));
      throw new Error(error.message || 'Failed to fetch annotations');
    }

    return response.json();
  }

  async getAnnotationById(id, token) {
    const response = await fetch(`${API_BASE_URL}/annotations/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch annotation' }));
      throw new Error(error.message || 'Failed to fetch annotation');
    }

    return response.json();
  }

  async updateAnnotation(id, data, token) {
    const response = await fetch(`${API_BASE_URL}/annotations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update annotation' }));
      throw new Error(error.message || 'Failed to update annotation');
    }

    return response.json();
  }

  async deleteAnnotation(id, token) {
    const response = await fetch(`${API_BASE_URL}/annotations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete annotation' }));
      throw new Error(error.message || 'Failed to delete annotation');
    }

    return response.json();
  }

  async getAnnotationStats(workspaceId, token) {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/annotations/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch annotation stats' }));
      throw new Error(error.message || 'Failed to fetch annotation stats');
    }

    return response.json();
  }
}

export const annotationService = new AnnotationService();
