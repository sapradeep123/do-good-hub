// API Client for Do Good Hub Backend
// Replaces Supabase client with custom API client

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      console.log('Making API request to:', url);
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/api/auth/me');
    
    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to get user');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    const response = await this.request<{ status: string; timestamp: string; environment: string }>('/health');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Health check failed');
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint);
    
    if (response.success) {
      return response.data || response;
    }

    throw new Error(response.error || 'GET request failed');
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return response.data || response;
    }

    throw new Error(response.error || 'POST request failed');
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return response.data || response;
    }

    throw new Error(response.error || 'PUT request failed');
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'DELETE request failed');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get stored token
  getToken(): string | null {
    return this.token;
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { User, AuthResponse, ApiResponse }; 