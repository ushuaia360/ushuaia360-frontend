const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getAuthToken(): Promise<string | null> {
  // Obtener el token de las cookies o localStorage
  if (typeof document !== 'undefined') {
    // Intentar obtener de cookies
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    // Intentar obtener de localStorage
    return localStorage.getItem('token');
  }
  return null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Para incluir cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Trails (Senderos)
  getTrails: async (params?: { difficulty?: string; status_id?: number; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.status_id) queryParams.append('status_id', params.status_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return apiRequest<{ trails: any[]; total: number; limit: number; offset: number }>(
      `/trails${query ? `?${query}` : ''}`
    );
  },

  getTrail: async (trailId: string) => {
    return apiRequest<{ trail: any }>(`/trails/${trailId}`);
  },

  createTrail: async (data: any) => {
    return apiRequest<{ message: string; trail: any }>('/trails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTrail: async (trailId: string, data: any) => {
    return apiRequest<{ message: string; trail: any }>(`/trails/${trailId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTrail: async (trailId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}`, {
      method: 'DELETE',
    });
  },

  // Trail Routes
  createTrailRoute: async (trailId: string, data: any) => {
    return apiRequest<{ message: string; route: any }>(`/trails/${trailId}/routes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Route Segments
  createRouteSegment: async (trailId: string, routeId: string, data: any) => {
    return apiRequest<{ message: string; segment: any }>(`/trails/${trailId}/routes/${routeId}/segments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Trail Points
  createTrailPoint: async (trailId: string, data: any) => {
    return apiRequest<{ message: string; point: any }>(`/trails/${trailId}/points`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Users
  getUsers: async () => {
    return apiRequest<{ users: any[] }>('/users');
  },
};
