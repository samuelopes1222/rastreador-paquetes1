import React, { useState } from 'react';
import '../styles/AdminLogin.css';

function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'elias125') {
      onSuccess();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <h2>🔐 Acceso Restringido</h2>
        <p>Se requiere contraseña para acceder al Panel de Administración</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              autoFocus
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="btn btn-primary">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
