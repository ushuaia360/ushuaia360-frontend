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

  getTrailReviews: async (
    trailId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.limit != null) queryParams.append('limit', params.limit.toString());
    if (params?.offset != null) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return apiRequest<{
      reviews: Array<{
        id: string;
        trail_id: string;
        user_id: string | null;
        name: string | null;
        avatar_url: string | null;
        rating: number;
        comment: string | null;
        created_at: string;
      }>;
      total: number;
      average_rating: number;
      rating_counts: {
        one_star: number;
        two_star: number;
        three_star: number;
        four_star: number;
        five_star: number;
      };
      limit: number;
      offset: number;
    }>(`/trails/${trailId}/reviews${query ? `?${query}` : ''}`);
  },

  deleteTrailReview: async (trailId: string, reviewId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}/reviews/${reviewId}`, {
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

  deleteAllRouteSegments: async (trailId: string, routeId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}/routes/${routeId}/segments`, {
      method: 'DELETE',
    });
  },

  // Trail Points
  createTrailPoint: async (trailId: string, data: any) => {
    return apiRequest<{ message: string; point: any }>(`/trails/${trailId}/points`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTrailPoint: async (trailId: string, pointId: string, data: any) => {
    return apiRequest<{ message: string; point: any }>(`/trails/${trailId}/points/${pointId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTrailPoint: async (trailId: string, pointId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}/points/${pointId}`, {
      method: 'DELETE',
    });
  },

  // Trail Media
  createTrailMedia: async (
    trailId: string,
    data: { media_type: string; url: string; thumbnail_url?: string; order_index?: number }
  ) => {
    return apiRequest<{ message: string; media: any }>(`/trails/${trailId}/media`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTrailMedia: async (trailId: string) => {
    return apiRequest<{ media: any[] }>(`/trails/${trailId}/media`);
  },

  deleteTrailMedia: async (trailId: string, mediaId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  // Trail Point Media
  createTrailPointMedia: async (
    trailId: string,
    pointId: string,
    data: { media_type: string; url: string; thumbnail_url?: string; order_index?: number }
  ) => {
    return apiRequest<{ message: string; media: any }>(
      `/trails/${trailId}/points/${pointId}/media`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  getTrailPointMedia: async (trailId: string, pointId: string) => {
    return apiRequest<{ media: any[] }>(`/trails/${trailId}/points/${pointId}/media`);
  },

  deleteTrailPointMedia: async (trailId: string, pointId: string, mediaId: string) => {
    return apiRequest<{ message: string }>(`/trails/${trailId}/points/${pointId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  // Places (Puntos Turísticos)
  getPlaces: async (params?: {
    category?: string;
    region?: string;
    country?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return apiRequest<{ places: any[]; total: number; limit: number; offset: number }>(
      `/places${query ? `?${query}` : ''}`
    );
  },

  getPlace: async (placeId: string) => {
    return apiRequest<{ place: any }>(`/places/${placeId}`);
  },

  createPlace: async (data: {
    name: string;
    description?: string;
    slug?: string;
    category: 'categoria_1' | 'categoria_2' | 'categoria_3';
    region?: string;
    country?: string;
    location: { latitude: number; longitude: number };
    is_premium?: boolean;
  }) => {
    return apiRequest<{ message: string; place: any }>('/places', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createPlaceMedia: async (
    placeId: string,
    data: {
      media_type: string;
      url: string;
      thumbnail_url?: string;
      order_index?: number;
    }
  ) => {
    return apiRequest<{ message: string; media: any }>(`/places/${placeId}/media`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePlace: async (
    placeId: string,
    data: {
      name?: string;
      description?: string;
      slug?: string;
      category?: string;
      region?: string;
      country?: string;
      location?: { latitude: number; longitude: number };
      is_premium?: boolean;
    }
  ) => {
    return apiRequest<{ message: string; place: any }>(`/places/${placeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePlace: async (placeId: string) => {
    return apiRequest<{ message: string }>(`/places/${placeId}`, {
      method: 'DELETE',
    });
  },

  deletePlaceMedia: async (placeId: string, mediaId: string) => {
    return apiRequest<{ message: string }>(`/places/${placeId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  // Users
  getUsers: async () => {
    return apiRequest<{ users: any[] }>('/users');
  },

  suspendUser: async (userId: string, isSuspended: boolean) => {
    return apiRequest<{ message: string; user: any }>(`/users/${userId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ is_suspended: isSuspended }),
    });
  },

  createAdminUser: async (data: { email: string; full_name: string; password: string }) => {
    return apiRequest<{ message: string; user: any }>('/users/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
