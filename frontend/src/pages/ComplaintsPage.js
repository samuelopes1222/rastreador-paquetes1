import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/ComplaintsPage.css';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, open, closed
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints');
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error('Error obteniendo quejas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (complaintId) => {
    if (!responseText.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    try {
      await api.put(`/complaints/${complaintId}`, {
        status: 'closed',
        response: responseText
      });

      // Actualizar lista local
      setComplaints(complaints.map(c =>
        c.id === complaintId
          ? { ...c, status: 'closed', response: responseText, updatedAt: new Date().toISOString() }
          : c
      ));

      setSelectedComplaint(null);
      setResponseText('');
      alert('✅ Respuesta enviada');
    } catch (error) {
      console.error('Error respondiendo queja:', error);
      alert('Error al enviar la respuesta');
    }
  };

  const handleDelete = async (complaintId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta queja?')) return;

    try {
      await api.delete(`/complaints/${complaintId}`);
      setComplaints(complaints.filter(c => c.id !== complaintId));
      setSelectedComplaint(null);
      alert('✅ Queja eliminada');
    } catch (error) {
      console.error('Error eliminando queja:', error);
      alert('Error al eliminar la queja');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'closed') return c.status === 'closed';
    return true;
  });

  return (
    <div className="complaints-page">
      <div className="complaints-container">
        <div className="complaints-header">
          <h1>📋 Centro de Quejas y Reclamos</h1>
          <p className="subtitle">Gestiona todas las quejas de los clientes</p>
        </div>

        <div className="complaints-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({complaints.length})
          </button>
          <button
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Abiertas ({complaints.filter(c => c.status === 'open').length})
          </button>
          <button
            className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Cerradas ({complaints.filter(c => c.status === 'closed').length})
          </button>
        </div>

        <div className="complaints-content">
          <div className="complaints-list">
            <h2>Quejas Registradas</h2>
            {loading ? (
              <div className="loading">Cargando quejas...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="empty-state">
                <p>📭 No hay quejas en esta categoría</p>
              </div>
            ) : (
              filteredComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className={`complaint-card ${complaint.status} ${selectedComplaint?.id === complaint.id ? 'selected' : ''}`}
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="complaint-header">
                    <div className="complaint-ref">
                      <span className="ref-id">{complaint.id}</span>
                      <span className={`status-badge ${complaint.status}`}>
                        {complaint.status === 'open' ? '🔴 Abierta' : '✅ Cerrada'}
                      </span>
                    </div>
                    <span className="tracking-num">Paquete: {complaint.trackingNumber}</span>
                  </div>

                  <div className="complaint-body">
                    <p className="description">{complaint.description}</p>
                  </div>

                  <div className="complaint-meta">
                    <span className="date">📅 {new Date(complaint.createdAt).toLocaleDateString('es-DO')}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="complaint-detail">
            {selectedComplaint ? (
              <div className="detail-card">
                <div className="detail-header">
                  <h3>Detalles de la Queja</h3>
                  <button 
                    className="close-detail"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="detail-content">
                  <div className="detail-section">
                    <label>ID de Queja:</label>
                    <p>{selectedComplaint.id}</p>
                  </div>

                  <div className="detail-section">
                    <label>Número de Paquete:</label>
                    <p>{selectedComplaint.trackingNumber}</p>
                  </div>

                  <div className="detail-section">
                    <label>Estado:</label>
                    <p>
                      <span className={`status-badge ${selectedComplaint.status}`}>
                        {selectedComplaint.status === 'open' ? '🔴 Abierta' : '✅ Cerrada'}
                      </span>
                    </p>
                  </div>

                  <div className="detail-section">
                    <label>Descripción del Problema:</label>
                    <p className="description-full">{selectedComplaint.description}</p>
                  </div>

                  <div className="detail-section">
                    <label>Fecha de Creación:</label>
                    <p>{new Date(selectedComplaint.createdAt).toLocaleString('es-DO')}</p>
                  </div>

                  {selectedComplaint.response && (
                    <div className="detail-section response-section">
                      <label>🔔 Respuesta Enviada:</label>
                      <p className="response-text">{selectedComplaint.response}</p>
                      <p className="response-date">
                        {new Date(selectedComplaint.updatedAt).toLocaleString('es-DO')}
                      </p>
                    </div>
                  )}

                  {selectedComplaint.status === 'open' ? (
                    <div className="response-form">
                      <h4>Responder a la Queja</h4>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Escribe tu respuesta al cliente..."
                        rows="5"
                      />
                      <div className="form-buttons">
                        <button
                          className="btn-send"
                          onClick={() => handleRespond(selectedComplaint.id)}
                        >
                          Enviar Respuesta ✓
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="detail-actions">
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(selectedComplaint.id)}
                    >
                      🗑️ Eliminar Queja
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>👈 Selecciona una queja para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
