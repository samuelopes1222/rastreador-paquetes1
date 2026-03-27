import React, { useState } from 'react';
import axios from 'axios';
import './ApplicationStatusPage.css';

const ApplicationStatusPage = () => {
  const [applicationId, setApplicationId] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!applicationId.trim()) {
      setError('Por favor ingresa tu ID de solicitud');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/drivers/applications/${applicationId}`
      );
      
      if (response.data.success) {
        setApplication(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró la solicitud');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  // Calcular tiempo restante
  const calculateTimeRemaining = () => {
    if (!application || !application.expiresAt) return '';
    const now = new Date();
    const expiry = new Date(application.expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} y ${hours % 24} horas`;
    }
    return `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minutos`;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color y ícono de estado
  const getStatusInfo = (status) => {
    const info = {
      pending: {
        icon: '⏳',
        color: 'status-pending',
        title: 'En Revisión',
        description: 'Tu solicitud está siendo revisada por nuestro equipo'
      },
      approved: {
        icon: '✅',
        color: 'status-approved',
        title: 'Aprobada',
        description: '¡Bienvenido! Tu solicitud fue aprobada exitosamente'
      },
      rejected: {
        icon: '❌',
        color: 'status-rejected',
        title: 'Rechazada',
        description: 'Tu solicitud fue rechazada. Por favor revisa el motivo'
      },
      expired: {
        icon: '⏰',
        color: 'status-expired',
        title: 'Expirada',
        description: 'El tiempo de revisión de 72 horas ha vencido'
      }
    };
    return info[status] || info.pending;
  };

  const statusInfo = application ? getStatusInfo(application.status) : null;

  return (
    <div className="status-page-container">
      <div className="status-card">
        <h1>📍 Consulta el Estado de tu Solicitud</h1>

        {/* Formulario de búsqueda */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>ID de Solicitud</label>
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Ingresa tu ID de solicitud (ej: 123e4567-e89b-12d3-a456...)"
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-search" disabled={loading}>
            {loading ? '⏳ Buscando...' : '🔍 Buscar'}
          </button>
        </form>

        {/* Error */}
        {error && searched && (
          <div className="alert alert-error">
            <p>{error}</p>
            <small>Si no tienes tu ID, revisa el mensaje de WhatsApp que recibiste.</small>
          </div>
        )}

        {/* Resultado */}
        {application && statusInfo && (
          <div className={`status-result ${statusInfo.color}`}>
            <div className="status-header">
              <div className="status-icon">{statusInfo.icon}</div>
              <div className="status-text">
                <h2>{statusInfo.title}</h2>
                <p>{statusInfo.description}</p>
              </div>
            </div>

            {/* Información personal */}
            <div className="info-section">
              <h3>Información Personal</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Nombre Completo</span>
                  <span className="value">{application.firstName} {application.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Cédula de Identidad</span>
                  <span className="value">{application.cedula}</span>
                </div>
                <div className="info-item">
                  <span className="label">Teléfono</span>
                  <span className="value">{application.phone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value">{application.email || 'No registrado'}</span>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="address-section">
              <h3>Dirección Registrada</h3>
              <div className="address-box">
                <p>{application.house}, {application.street}</p>
                <p>{application.address}</p>
              </div>
            </div>

            {/* Información de solicitud */}
            <div className="request-info">
              <h3>Información de la Solicitud</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">ID de Solicitud</span>
                  <span className="value code">{application.id}</span>
                </div>
                <div className="info-item">
                  <span className="label">Fecha de Solicitud</span>
                  <span className="value">{formatDate(application.createdAt)}</span>
                </div>

                {application.status === 'pending' && (
                  <div className="info-item highlight">
                    <span className="label">Tiempo Restante</span>
                    <span className="value highlight-value">{calculateTimeRemaining()}</span>
                  </div>
                )}

                {application.status === 'pending' && (
                  <div className="info-item">
                    <span className="label">Vencimiento</span>
                    <span className="value">{formatDate(application.expiresAt)}</span>
                  </div>
                )}

                {application.approvedAt && (
                  <div className="info-item">
                    <span className="label">Fecha de Aprobación</span>
                    <span className="value">{formatDate(application.approvedAt)}</span>
                  </div>
                )}

                {application.whatsappSentAt && (
                  <div className="info-item">
                    <span className="label">Notificación WhatsApp</span>
                    <span className="value">✅ Enviada el {formatDate(application.whatsappSentAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Motivo de rechazo */}
            {application.status === 'rejected' && application.rejectionReason && (
              <div className="rejection-section">
                <h3>Motivo del Rechazo</h3>
                <div className="rejection-box">
                  <p>{application.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Siguientes pasos */}
            {application.status === 'pending' && (
              <div className="next-steps">
                <h3>⏳ Próximos Pasos</h3>
                <ol>
                  <li>Tu solicitud está siendo revisada por nuestro equipo administrativo</li>
                  <li>En las próximas 72 horas recibirás notificación por WhatsApp</li>
                  <li>Si es aprobada, podrás acceder a la plataforma con tus credenciales</li>
                  <li>Si tienes dudas, puedes contactarnos para más información</li>
                </ol>
              </div>
            )}

            {application.status === 'approved' && (
              <div className="next-steps success">
                <h3>✅ ¡Bienvenido al Equipo!</h3>
                <p>Tu solicitud fue aprobada. Ahora puedes:</p>
                <ol>
                  <li>Ingresar a la plataforma con tu cédula de identidad</li>
                  <li>Actualizar tu información de perfil</li>
                  <li>Comenzar a recibir paquetes para entregar</li>
                </ol>
                <a href="/driver-login" className="btn btn-login">
                  🚀 Ir al Login
                </a>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial */}
        {!searched && !application && (
          <div className="info-box">
            <p>📝 Ingresa el ID de tu solicitud para consultar el estado actual.</p>
            <p>Recibiste este ID por WhatsApp cuando enviaste tu solicitud.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatusPage;
