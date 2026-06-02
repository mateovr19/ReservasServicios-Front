export interface AuthenticationResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
  nombres_usuario?: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  traceId: string;
}

export interface User {
  id?: number;
  accessToken: string;
  role: 'CLIENTE' | 'PROVEEDOR' | string;
  nombres_usuario?: string;
  correo?: string;
}

export interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: string[];
  traceId: string;
}

