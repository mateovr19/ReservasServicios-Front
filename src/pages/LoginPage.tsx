import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './LoginPage.css';
import illustration from '../assets/login-illustration.jpg';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-content">
          <header className="login-header">
            <div className="logo">
              <span className="logo-icon"></span>
              <span className="logo-text">EAP09 - Servicios de Reservas</span>
            </div>
          </header>

          <main className="login-form-section">
            <h1 className="welcome-title">Hola,<br />Bienvenido</h1>
            <p className="welcome-subtitle">Bienvenido de nuevo a tu plataforma de reservas</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Recordarme</span>
                </label>
                <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="signin-button" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            <footer className="form-footer">
              <p>¿No tienes una cuenta? <Link to="/register" className="signup-link">Regístrate</Link></p>
            </footer>
          </main>
        </div>
      </div>

      <div className="login-right">
        <div className="illustration-wrapper">
          <img src={illustration} alt="Illustration" className="illustration-img" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
