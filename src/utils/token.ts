export interface DecodedToken {
  sub?: string;      // usually email or username
  id?: number;       // user ID
  userId?: number;   // user ID
  idUsuario?: number;// user ID
  id_usuario?: number;
  role?: string;     // role
  rol?: string;
  exp?: number;
  nombres?: string;
  apellidos?: string;
  correo?: string;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token', error);
    return null;
  }
};
