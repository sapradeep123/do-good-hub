// API Client for Do Good Hub Backend
// Replaces Supabase client with custom API client

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  access_token: string;
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
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: any = null;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim()) {
          data = JSON.parse(text);
        }
      }

      if (!response.ok) {
        // Extract error message from backend response
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      // Return proper ApiResponse structure
      return data || { success: true, data: null };
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
    // Transform field names to match backend schema
    const backendData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'user'
    };
    
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });

    if (response && response.data) {
      const { access_token, user } = response.data;
      this.token = access_token;
      localStorage.setItem('authToken', access_token);
      return {
        user: user,
        access_token: access_token
      };
    }

    throw new Error(response?.message || response?.error || 'Registration failed');
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response && response.data) {
      const { access_token, user } = response.data;
      this.token = access_token;
      localStorage.setItem('authToken', access_token);
      return {
        user: user,
        access_token: access_token
      };
    }

    throw new Error(response?.message || response?.error || 'Login failed');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/api/auth/me');
    
    if (response && response.data) {
      return response.data;
    }

    throw new Error(response?.error || 'Failed to get user');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    const response = await this.request<{ status: string; timestamp: string; environment: string }>('/health');
    
    if (response && response.data) {
      return response.data;
    }

    throw new Error('Health check failed');
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint);
    
    if (response && response.data) {
      return response.data;
    }

    throw new Error(response?.error || 'GET request failed');
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response && response.data) {
      return response.data;
    }

    throw new Error(response?.error || 'POST request failed');
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response && response.data) {
      return response.data;
    }

    throw new Error(response?.error || 'PUT request failed');
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
    });

    if (response && response.data) {
      return response.data;
    }

    throw new Error(response?.error || 'DELETE request failed');
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