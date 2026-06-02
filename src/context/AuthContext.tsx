import React, { useState } from 'react';
import type { User, AuthenticationResponse, ApiResponse } from '../types/auth';
import { AuthContext } from './useAuth';
import api from '../api/axios';
import { decodeToken } from '../utils/token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const idStr = localStorage.getItem('userId');
    const nombres_usuario = localStorage.getItem('nombres_usuario') || undefined;
    const correo = localStorage.getItem('correo') || undefined;
    
    if (token && role) {
      return {
        accessToken: token,
        role,
        id: idStr ? parseInt(idStr, 10) : undefined,
        nombres_usuario,
        correo,
      };
    }
    return null;
  });
  const loading = false;

  const login = async (correoInput: string, contrasena: string) => {
    try {
      const response = await api.post<ApiResponse<AuthenticationResponse>>('/api/v1/auth/sessions', {
        correo: correoInput,
        contrasena,
      });

      const { accessToken, role } = response.data.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('role', role);

      // Decode the JWT to fetch extra information (like user ID)
      const decoded = decodeToken(accessToken);
      let userId: number | undefined = undefined;
      let userEmail = correoInput;
      let userName = '';

      if (decoded) {
        userId = decoded.id || decoded.userId || decoded.idUsuario || decoded.id_usuario;
        userEmail = decoded.sub || decoded.correo || correoInput;
        if (decoded.nombres) {
          userName = `${decoded.nombres} ${decoded.apellidos || ''}`.trim();
        }
      }

      if (userId) {
        localStorage.setItem('userId', userId.toString());
      }
      if (userEmail) {
        localStorage.setItem('correo', userEmail);
      }
      
      // Let's call standard name if it exists, or just use the email username part as a fallback
      if (!userName) {
        userName = userEmail.split('@')[0];
      }
      localStorage.setItem('nombres_usuario', userName);

      setUser({
        accessToken,
        role,
        id: userId,
        nombres_usuario: userName,
        correo: userEmail,
      });
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
      localStorage.removeItem('userId');
      localStorage.removeItem('correo');
      localStorage.removeItem('nombres_usuario');
      setUser(null);
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
