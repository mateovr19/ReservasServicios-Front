import { createContext, useContext } from 'react';
import type { User } from '../types/auth';

interface AuthContextType {
   user: User | null;
   login: (correo: string, contrasena: string) => Promise<void>;
   logout: () => Promise<void>;
   loading: boolean;
 }

 export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};