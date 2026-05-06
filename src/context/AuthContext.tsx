import React, { useState } from 'react';
import type { User, AuthenticationResponse, ApiResponse } from '../types/auth';
import { AuthContext } from './useAuth';
import api from '../api/axios';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    return token && role ? { accessToken: token, role } : null;
  });
  const loading = false;

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
