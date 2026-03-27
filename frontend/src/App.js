import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatePackagePage from './pages/CreatePackagePage';
import AdminDashboard from './pages/AdminDashboard';
import TrackingPage from './pages/TrackingPage';
import DriverRegistration from './components/DriverRegistration';
import DriverApplicationsAdmin from './components/DriverApplicationsAdmin';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import SupportBot from './components/SupportBot';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img 
                src="/images/logo-willmore.svg" 
                alt="Transporte Willmore" 
                className="logo-img"
              />
            </Link>
            <ul className="nav-menu">
              <li>
                <Link to="/create" className="nav-link">
                  Crear Paquete
                </Link>
              </li>
              <li>
                <Link to="/track" className="nav-link">
                  Rastrear Paquete
                </Link>
              </li>
              <li>
                <Link to="/admin" className="nav-link">
                  Panel Admin
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePackagePage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver-register" element={<DriverRegistration />} />
          <Route path="/admin/applications" element={<DriverApplicationsAdmin />} />
          <Route path="/check-application" element={<ApplicationStatusPage />} />
        </Routes>

        {/* Support Bot */}
        <SupportBot />

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <p className="copyright">Copyright © 2026 Transporte Willmore. Todos los derechos reservados.</p>
            <p className="watermark">Hecho por ML</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
