import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import './RegisterPage.css';
import illustration from '../assets/login-illustration.jpg';

const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'CLIENTE' | 'PROVEEDOR'>('CLIENTE');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    // Al menos una minúscula, una mayúscula, un número, un carácter especial, entre 8 y 64 caracteres.
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
    return pattern.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombres.trim() || !apellidos.trim() || !correo.trim() || !contrasena) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!validatePassword(contrasena)) {
      setError(
        'La contraseña debe tener entre 8 y 64 caracteres, incluir al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.'
      );
      return;
    }

    setLoading(true);

    try {
      const endpoint = role === 'CLIENTE' ? '/api/v1/clients' : '/api/v1/providers';
      await api.post(endpoint, {
        nombres,
        apellidos,
        correo,
        contrasena,
      });

      setSuccess('¡Registro completado con éxito! Redirigiendo al inicio de sesión...');
      
      // Clear inputs
      setNombres('');
      setApellidos('');
      setCorreo('');
      setContrasena('');
      setConfirmarContrasena('');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || 
          err.response?.data?.details?.join(', ') || 
          'Hubo un error al registrar la cuenta. Inténtalo de nuevo.'
        );
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="register-content">
          <header className="register-header">
            <div className="logo">
              <span className="logo-icon"></span>
              <span className="logo-text">Servicio de Reservas</span>
            </div>
          </header>

          <main className="register-form-section">
            <h1 className="welcome-title">Crea tu cuenta</h1>
            <p className="welcome-subtitle">Únete a nuestra plataforma de reservas de servicios</p>

            {/* Role Selection Tabs */}
            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${role === 'CLIENTE' ? 'active' : ''}`}
                onClick={() => setRole('CLIENTE')}
              >
                Soy Cliente
              </button>
              <button
                type="button"
                className={`role-tab ${role === 'PROVEEDOR' ? 'active' : ''}`}
                onClick={() => setRole('PROVEEDOR')}
              >
                Soy Proveedor
              </button>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombres">Nombres</label>
                  <input
                    id="nombres"
                    type="text"
                    placeholder="Stanley"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellidos">Apellidos</label>
                  <input
                    id="apellidos"
                    type="text"
                    placeholder="Yelnats"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="correo">Correo Electrónico</label>
                <input
                  id="correo"
                  type="email"
                  placeholder="stanley@example.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contrasena">Contraseña</label>
                  <input
                    id="contrasena"
                    type="password"
                    placeholder="••••••••••••"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
                  <input
                    id="confirmarContrasena"
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <button type="submit" className="signup-button" disabled={loading}>
                {loading ? 'Registrando...' : `Registrarse como ${role === 'CLIENTE' ? 'Cliente' : 'Proveedor'}`}
              </button>
            </form>

            <footer className="form-footer">
              <p>¿Ya tienes una cuenta? <Link to="/login" className="login-link">Iniciar Sesión</Link></p>
            </footer>
          </main>
        </div>
      </div>

      <div className="register-right">
        <div className="illustration-wrapper">
          <img src={illustration} alt="Illustration" className="illustration-img" />
          <div className="overlay-text">
            <h2>{role === 'CLIENTE' ? 'Encuentra y Reserva' : 'Ofrece tus Servicios'}</h2>
            <p>
              {role === 'CLIENTE'
                ? 'Accede a la oferta de profesionales y reserva tu cupo en segundos.'
                : 'Define tus horarios, gestiona tu disponibilidad y aumenta tus reservas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
