import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import illustration from '../assets/login-illustration.jpg';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
            <h1 className="welcome-title">Hello,<br />Welcome</h1>
            <p className="welcome-subtitle">Welcome back to your special place of reservations</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="stanley@gmail.com"
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
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="signin-button" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <footer className="form-footer">
              <p>Don't have an account? <a href="#" className="signup-link">Sign Up</a></p>
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
