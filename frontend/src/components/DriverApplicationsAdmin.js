import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './DriverApplicationsAdmin.css';

const DriverApplicationsAdmin = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(null); // 'approve' o 'reject'
  const [password, setPassword] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/drivers/applications`,
        {
          params: {
            status: statusFilter,
            page,
            limit: 10
          }
        }
      );
      setApplications(response.data.data || []);
      setPagination(response.data.pagination);
      setMessage('');
    } catch (error) {
      setMessage(`Error cargando solicitudes: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL, statusFilter, page]);

  // Cargar solicitudes
  useEffect(() => {
    loadApplications();
  }, [statusFilter, page, loadApplications]);

  // Abrir modal de acción
  const openActionModal = (app, actionType) => {
    setSelectedApp(app);
    setAction(actionType);
    setPassword('');
    setRejectionReason('');
    setShowModal(true);
  };

  // Aprobar solicitud
  const handleApprove = async () => {
    if (!password.trim()) {
      setMessage('Debes establecer una contraseña para el conductor');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/drivers/applications/${selectedApp.id}/approve`,
        { password }
      );
      setMessage('✅ Solicitud aprobada exitosamente');
      setShowModal(false);
      loadApplications();
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Rechazar solicitud
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setMessage('Debes especificar el motivo del rechazo');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/drivers/applications/${selectedApp.id}/reject`,
        { reason: rejectionReason }
      );
      setMessage('✅ Solicitud rechazada');
      setShowModal(false);
      loadApplications();
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular tiempo restante
  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return '⏰ Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `⏳ ${days}d ${hours % 24}h restantes`;
    }
    return `⏳ ${hours}h ${minutes}m restantes`;
  };

  // Obtener clase de estado
  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      expired: 'status-expired'
    };
    return classes[status] || '';
  };

  // Obtener label de estado
  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Pendiente',
      approved: '✅ Aprobada',
      rejected: '❌ Rechazada',
      expired: '⏰ Expirada'
    };
    return labels[status] || status;
  };

  return (
    <div className="applications-admin-container">
      <nav className="admin-header">
        <h1>📋 Gestión de Solicitudes de Mensajeros</h1>
      </nav>

      <div className="admin-content">
        {/* Filtros */}
        <div className="filter-section">
          <div className="filter-buttons">
            {['pending', 'approved', 'rejected', 'expired'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje */}
        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Lista de solicitudes */}
        {loading ? (
          <div className="loading">⏳ Cargando solicitudes...</div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <p>No hay solicitudes con estado "{getStatusLabel(statusFilter)}"</p>
          </div>
        ) : (
          <>
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app.id} className={`application-card ${getStatusClass(app.status)}`}>
                  <div className="card-header">
                    <div className="card-title">
                      <h3>{app.firstName} {app.lastName}</h3>
                      <span className={`status-badge ${getStatusClass(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </div>
                    {app.status === 'pending' && (
                      <span className="time-remaining">
                        {getTimeRemaining(app.expiresAt)}
                      </span>
                    )}
                  </div>

                  <div className="card-body">
                    <div className="info-group">
                      <div className="info-item">
                        <span className="label">Cédula:</span>
                        <span className="value">{app.cedula}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Teléfono:</span>
                        <span className="value">{app.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Email:</span>
                        <span className="value">{app.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="address-group">
                      <p className="label">Dirección:</p>
                      <p className="address">
                        {app.house}, {app.street}, {app.address}
                      </p>
                    </div>

                    <div className="dates-group">
                      <div className="date-item">
                        <span className="label">Solicitado:</span>
                        <span className="value">{formatDate(app.createdAt)}</span>
                      </div>
                      {app.status === 'pending' && (
                        <div className="date-item">
                          <span className="label">Vence:</span>
                          <span className="value">{formatDate(app.expiresAt)}</span>
                        </div>
                      )}
                      {app.approvedAt && (
                        <div className="date-item">
                          <span className="label">Aprobado:</span>
                          <span className="value">{formatDate(app.approvedAt)}</span>
                        </div>
                      )}
                    </div>

                    {app.rejectionReason && (
                      <div className="rejection-reason">
                        <span className="label">Motivo del rechazo:</span>
                        <p>{app.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {app.status === 'pending' && (
                    <div className="card-actions">
                      <button
                        className="btn btn-approve"
                        onClick={() => openActionModal(app, 'approve')}
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        className="btn btn-reject"
                        onClick={() => openActionModal(app, 'reject')}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Paginación */}
            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Anterior
                </button>
                <span>Página {page} de {pagination.pages}</span>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de acción */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>
                {action === 'approve' ? '✅ Aprobar Solicitud' : '❌ Rechazar Solicitud'}
              </h2>

              {action === 'approve' ? (
                <>
                  <div className="form-group">
                    <label>Contraseña inicial del conductor</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Establece una contraseña segura"
                    />
                    <small>Se enviará por WhatsApp al conductor</small>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-approve" onClick={handleApprove}>
                      ✅ Confirmar Aprobación
                    </button>
                    <button className="btn btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Motivo del rechazo</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explica detalladamente el motivo del rechazo"
                      rows="4"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-reject" onClick={handleReject}>
                      ❌ Confirmar Rechazo
                    </button>
                    <button className="btn btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverApplicationsAdmin;
