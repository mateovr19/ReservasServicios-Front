import React from 'react';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, Calendar, Settings, LogOut, User, Search, Bell } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon"></span>
            <span className="logo-text">{user?.nombres_usuario || user?.role}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="nav-item">
            <Calendar size={20} />
            <span>Reservas</span>
          </a>
          <a href="#" className="nav-item">
            <User size={20} />
            <span>Perfil</span>
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} />
            <span>Configuración</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-search">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar servicios o reservas..." />
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <div className="user-profile">
              <div className="avatar">
                {user?.nombres_usuario ? user.nombres_usuario.charAt(0) : user?.role?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="welcome-banner">
            <h1>¡Hola de nuevo{user?.nombres_usuario ? `, ${user.nombres_usuario}` : `, ${user?.role}`}!</h1>
            <p>Bienvenido a tu panel de control de {user?.role === 'PROVEEDOR' ? 'Proveedor' : 'Cliente'}.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Reservas Totales</h3>
              <p className="stat-value">24</p>
              <span className="stat-trend">+12% este mes</span>
            </div>
            <div className="stat-card">
              <h3>{user?.role === 'PROVEEDOR' ? 'Servicios Activos' : 'Próximas Citas'}</h3>
              <p className="stat-value">{user?.role === 'PROVEEDOR' ? '8' : '3'}</p>
              <span className="stat-trend">En curso</span>
            </div>
            <div className="stat-card">
              <h3>Calificación</h3>
              <p className="stat-value">4.9</p>
              <span className="stat-trend">Excelente</span>
            </div>
          </div>

          <div className="recent-activity">
            <h2>Actividad Reciente</h2>
            <div className="activity-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon"></div>
                  <div className="activity-details">
                    <p className="activity-title">Reserva de servicio #{1024 + i}</p>
                    <p className="activity-time">Hace 2 horas</p>
                  </div>
                  <div className="activity-status pending">Pendiente</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
