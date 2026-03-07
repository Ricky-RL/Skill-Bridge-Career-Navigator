import {
  JobRole,
  JobPosting,
  UserProfile,
  ProfileCreate,
  ProfileUpdate,
  AnalysisResult,
  AnalysisRequest,
  LearningResource,
  ResumeUploadResponse,
  InterviewQuestion,
  DescriptionAnalysisRequest,
  DescriptionAnalysisResponse,
  SavedAnalysisCreate,
  SavedAnalysis,
  SavedAnalysisListItem,
  ChatRequest,
  ChatResponse,
  BulkComparisonRequest,
  BulkComparisonResult,
  MentorProfile,
  MentorProfileCreate,
  MentorProfileUpdate,
  MentorMatch,
  MentorshipRequestCreate,
  MentorshipConnection,
  SessionCreate,
  MentorshipSession,
  MenteeDetails,
  MentorDetails,
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

  async uploadResume(userId: string, file: File): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/profiles/upload-resume?user_id=${encodeURIComponent(userId)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

  // Job postings endpoints
  async getJobPostings(params?: {
    search?: string;
    company?: string;
    industry?: string;
    industries?: string[];
    experience_level?: string;
    limit?: number;
    offset?: number;
  }): Promise<JobPosting[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.company) searchParams.append('company', params.company);
    if (params?.industry) searchParams.append('industry', params.industry);
    if (params?.industries?.length) searchParams.append('industries', params.industries.join(','));
    if (params?.experience_level) searchParams.append('experience_level', params.experience_level);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<JobPosting[]>(`/api/job-postings${query ? `?${query}` : ''}`);
  }

  async getJobPosting(postingId: string): Promise<JobPosting> {
    return this.request<JobPosting>(`/api/job-postings/${postingId}`);
  }

  async getSuggestedPostings(userId: string, limit?: number): Promise<JobPosting[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<JobPosting[]>(`/api/job-postings/suggested/${userId}${params}`);
  }

  async getIndustries(): Promise<{ industries: string[] }> {
    return this.request<{ industries: string[] }>('/api/job-postings/industries');
  }

  async getCompanies(): Promise<{ companies: string[] }> {
    return this.request<{ companies: string[] }>('/api/job-postings/companies');
  }

  // Analysis endpoints
  async analyzeSkills(request: AnalysisRequest): Promise<AnalysisResult> {
    return this.request<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeFromDescription(request: DescriptionAnalysisRequest): Promise<DescriptionAnalysisResponse> {
    return this.request<DescriptionAnalysisResponse>('/api/analyze/from-description', {
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

  async generateInterviewQuestions(params: {
    job_posting_id?: string;
    job_title?: string;
    job_company?: string;
    job_required_skills?: string[];
    job_responsibilities?: string[];
    skills_to_focus?: string[];
  }): Promise<InterviewQuestion[]> {
    const response = await this.request<{ questions: InterviewQuestion[] }>('/api/analyze/interview-questions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.questions;
  }

  // Saved analyses endpoints
  async saveAnalysis(data: SavedAnalysisCreate): Promise<SavedAnalysis> {
    return this.request<SavedAnalysis>('/api/saved-analyses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavedAnalyses(userId: string, limit?: number): Promise<SavedAnalysisListItem[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (limit) params.append('limit', limit.toString());
    return this.request<SavedAnalysisListItem[]>(`/api/saved-analyses?${params.toString()}`);
  }

  async getSavedAnalysis(analysisId: string, userId: string): Promise<SavedAnalysis> {
    return this.request<SavedAnalysis>(`/api/saved-analyses/${analysisId}?user_id=${userId}`);
  }

  async deleteSavedAnalysis(analysisId: string, userId: string): Promise<void> {
    return this.request(`/api/saved-analyses/${analysisId}?user_id=${userId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Chat
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Bulk comparison
  async bulkCompare(request: BulkComparisonRequest): Promise<BulkComparisonResult> {
    return this.request<BulkComparisonResult>('/api/compare', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCompareIndustries(): Promise<{ industries: string[] }> {
    return this.request<{ industries: string[] }>('/api/compare/industries');
  }

  async getRoleTypes(): Promise<{ role_types: string[] }> {
    return this.request<{ role_types: string[] }>('/api/compare/role-types');
  }

  // Mentorship
  async becomeMentor(profile: MentorProfileCreate): Promise<MentorProfile> {
    return this.request<MentorProfile>('/api/mentorship/mentors', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async listMentors(params?: { expertise?: string; industry?: string; limit?: number }): Promise<MentorProfile[]> {
    const searchParams = new URLSearchParams();
    if (params?.expertise) searchParams.append('expertise', params.expertise);
    if (params?.industry) searchParams.append('industry', params.industry);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<MentorProfile[]>(`/api/mentorship/mentors${query ? `?${query}` : ''}`);
  }

  async findMentorMatches(userId: string, limit?: number): Promise<MentorMatch[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<MentorMatch[]>(`/api/mentorship/mentors/matches/${userId}${params}`);
  }

  async getMentor(mentorId: string): Promise<MentorProfile> {
    return this.request<MentorProfile>(`/api/mentorship/mentors/${mentorId}`);
  }

  async getUserMentorProfile(userId: string): Promise<MentorProfile | null> {
    return this.request<MentorProfile | null>(`/api/mentorship/mentor-profile/${userId}`);
  }

  async updateMentorProfile(userId: string, update: MentorProfileUpdate): Promise<MentorProfile> {
    return this.request<MentorProfile>(`/api/mentorship/mentor-profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  async requestMentorship(request: MentorshipRequestCreate): Promise<MentorshipConnection> {
    return this.request<MentorshipConnection>('/api/mentorship/connections', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async acceptMentorship(connectionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/mentorship/connections/${connectionId}/accept`, {
      method: 'PUT',
    });
  }

  async declineMentorship(connectionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/mentorship/connections/${connectionId}/decline`, {
      method: 'PUT',
    });
  }

  async getConnections(userId: string, role?: 'mentor' | 'mentee' | 'both'): Promise<MentorshipConnection[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (role) params.append('role', role);
    return this.request<MentorshipConnection[]>(`/api/mentorship/connections?${params.toString()}`);
  }

  async scheduleSession(session: SessionCreate): Promise<MentorshipSession> {
    return this.request<MentorshipSession>('/api/mentorship/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async getSessions(connectionId: string): Promise<MentorshipSession[]> {
    return this.request<MentorshipSession[]>(`/api/mentorship/sessions?connection_id=${connectionId}`);
  }

  async getMenteeDetails(connectionId: string): Promise<MenteeDetails> {
    return this.request<MenteeDetails>(`/api/mentorship/mentee/${connectionId}`);
  }

  async getMentorDetails(connectionId: string): Promise<MentorDetails> {
    return this.request<MentorDetails>(`/api/mentorship/mentor-details/${connectionId}`);
  }
}

export const api = new ApiClient();
export default api;
