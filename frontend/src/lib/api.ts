import {
  JobRole,
  UserProfile,
  ProfileCreate,
  ProfileUpdate,
  AnalysisResult,
  AnalysisRequest,
  LearningResource,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Profile endpoints
  async createProfile(profile: ProfileCreate): Promise<UserProfile> {
    return this.request<UserProfile>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async getProfile(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/profiles/${userId}`);
  }

  async updateProfile(userId: string, profile: ProfileUpdate): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    return this.request(`/api/profiles/${userId}`, {
      method: 'DELETE',
    });
  }

  // Job roles endpoints
  async getRoles(params?: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<JobRole[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<JobRole[]>(`/api/roles${query ? `?${query}` : ''}`);
  }

  async getRole(roleId: string): Promise<JobRole> {
    return this.request<JobRole>(`/api/roles/${roleId}`);
  }

  async getCategories(): Promise<{ categories: string[] }> {
    return this.request<{ categories: string[] }>('/api/roles/categories');
  }

  // Analysis endpoints
  async analyzeSkills(request: AnalysisRequest): Promise<AnalysisResult> {
    return this.request<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getResources(params?: {
    skill?: string;
    is_free?: boolean;
    platform?: string;
    limit?: number;
  }): Promise<LearningResource[]> {
    const searchParams = new URLSearchParams();
    if (params?.skill) searchParams.append('skill', params.skill);
    if (params?.is_free !== undefined) searchParams.append('is_free', params.is_free.toString());
    if (params?.platform) searchParams.append('platform', params.platform);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<LearningResource[]>(`/api/analyze/resources${query ? `?${query}` : ''}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const api = new ApiClient();
export default api;
