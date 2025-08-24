import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: string = 'user') => {
    console.log('Starting signup process for:', { email, firstName, lastName, role });
    
    try {
      // Validate input data
      if (!email || !password || !firstName || !lastName) {
        const missingFields = [];
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        console.error('Signup validation error:', errorMsg);
        return { error: { message: errorMsg } };
      }
      
      console.log('Sending registration request to API...');
      const authData = await apiClient.register({ email, password, firstName, lastName, role });
      
      console.log('Registration successful:', { userId: authData.user?.id, email: authData.user?.email });
      setUser(authData.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
        stack: error.stack
      });
      
      // Extract meaningful error message
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid registration data. Please check your input.';
      } else if (error.status === 409) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      console.error('Final error message:', errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await apiClient.login({ email, password });
      setUser(authData.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error.message || 'Login failed' };
    }
  };

  const signOut = async () => {
    apiClient.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};