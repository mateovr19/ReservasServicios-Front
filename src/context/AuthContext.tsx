import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthenticationResponse, ApiResponse } from '../types/auth';
import api from '../api/axios';

interface AuthContextType {
  user: User | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setUser({ accessToken: token, role });
    }
    setLoading(false);
  }, []);

  const login = async (correo: string, contrasena: string) => {
    try {
      const response = await api.post<ApiResponse<AuthenticationResponse>>('/api/v1/auth/sessions', {
        correo,
        contrasena,
      });

      const { accessToken, role } = response.data.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('role', role);
      setUser({ accessToken, role });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.delete('/api/v1/auth/sessions/current');
    } catch (error) {
      console.error('Logout API call failed', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
