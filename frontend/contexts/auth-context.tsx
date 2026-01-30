import { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await apiClient.getCurrentUser();
      setUser({
        id: user.id.toString(),
        email: user.email,
        name: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error('Session validation failed:', error);
      apiClient.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ username: email, password });
      const user = response.user;

      setUser({
        id: user.id.toString(),
        email: user.email,
        name: user.username, // Backend returns username, not name
        role: user.role,
      });

      // After successful neural handshake, redirect to main operations dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout sync failed:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Update user profile via API
      const updatedUser = await apiClient.updateUserProfile({
        name: updates.name,
        email: updates.email,
        avatar: updates.avatar
      });

      // Update local user state with the response
      setUser(prevUser => ({
        ...prevUser!,
        ...updatedUser
      }));

      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error; // Re-throw to allow error handling in components
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the context for direct usage if needed
export { AuthContext as default };