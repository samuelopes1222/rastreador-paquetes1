import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TrackingMap from '../components/TrackingMap';
import AdminLogin from '../components/AdminLogin';
import useDriverLocations from '../hooks/useDriverLocations';
import { useSocket } from '../hooks/useSocket';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [packages, setPackages] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDeliveredTodayOnly, setShowDeliveredTodayOnly] = useState(false);
  const [deliveredAlert, setDeliveredAlert] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationAction, setApplicationAction] = useState(null); // 'approve' o 'reject'
  const [applicationPassword, setApplicationPassword] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [responseText, setResponseText] = useState('');
  const [deliveryNotification, setDeliveryNotification] = useState(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [selectedDriverForGPS, setSelectedDriverForGPS] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);
  const [newPackage, setNewPackage] = useState({
    code: '',
    sender: '',
    recipient: '',
    address: '',
    phone: '',
  });
  const [newDriver, setNewDriver] = useState({
    name: '',
    cedula: '',
    phone: '',
    vehicle: '',
    password: '',
  });
  
  // Hook para ubicaciones de repartidores en tiempo real
  const { drivers: realTimeDrivers } = useDriverLocations();
  
  // Hook para WebSocket
  const { socket } = useSocket();

  // Función para solicitar permisos de ubicación
  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        console.warn('Geolocalización no soportada en este navegador');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setAdminLocation({
            lat: latitude,
            lng: longitude
          });
          console.log('✅ Ubicación admin obtenida:', { latitude, longitude });
        },
        (error) => {
          console.warn('⚠️ Permiso de ubicación denegado o error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Error solicitando permisos de ubicación:', err);
    }
  };

  useEffect(() => {
    // Solicitar permisos de ubicación al cargar
    requestLocationPermission();
    
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s (paquetes y repartidores del admin)
    return () => clearInterval(interval);
  }, []);

  // Escuchar eventos de entrega en tiempo real
  useEffect(() => {
    if (!socket) return;

    // Escuchar evento de entrega completada
    const handlePackageDelivered = (data) => {
      console.log('📦 Evento de entrega recibido:', data);

      setPackages(prevPackages =>
        prevPackages.map(pkg =>
          pkg.id === data.packageId
            ? {
                ...pkg,
                status: 'delivered',
                deliveredAt: data.deliveredAt || new Date().toISOString(),
                deliveryConfirmedBy: data.clientConfirmation || '',
              }
            : pkg
        )
      );

      // Mensaje en UI admin
      setDeliveredAlert(`Paquete ${data.packageCode} entregado por ${data.driverName || 'repartidor'}`);
      setTimeout(() => setDeliveredAlert(null), 6000);

      // Notificación toast existente
      setDeliveryNotification({
        packageCode: data.packageCode || 'N/A',
        clientName: data.clientConfirmation || 'Cliente',
        driverName: data.driverName || 'Repartidor',
        timestamp: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
      });

      if (Notification.permission === 'granted') {
        new Notification('✅ Paquete Entregado', {
          body: `Paquete ${data.packageCode} ha sido entregado exitosamente`,
          icon: '✅'
        });
      }

      setTimeout(() => {
        setDeliveryNotification(null);
      }, 5000);
    };

    socket.on('packageDelivered', handlePackageDelivered);

    return () => {
      socket.off('packageDelivered', handlePackageDelivered);
    };
  }, [socket]);

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [packagesRes, driversRes, complaintsRes, applicationsRes] = await Promise.all([
        api.get('/packages'),
        api.get('/drivers'),
        api.get('/complaints'),
        api.get('/drivers/applications?status=pending&limit=100')
      ]);

      // Las respuestas vienen en { success, data: [...] }
      setPackages(Array.isArray(packagesRes.data?.data) ? packagesRes.data.data : []);
      setDrivers(Array.isArray(driversRes.data?.data) ? driversRes.data.data : []);
      setComplaints(Array.isArray(complaintsRes.data?.data) ? complaintsRes.data.data : []);
      setApplications(Array.isArray(applicationsRes.data?.data) ? applicationsRes.data.data : []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/packages', newPackage);
      setNewPackage({
        code: '',
        sender: '',
        recipient: '',
        address: '',
        phone: '',
      });
      setShowPackageModal(false);
      loadData();
    } catch (err) {
      console.error('Error adding package:', err);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    console.log('Creando driver:', newDriver);

    // Validar que los campos requeridos estén llenos
    if (!newDriver.name || !newDriver.phone || !newDriver.vehicle) {
      alert('Por favor, complete todos los campos requeridos (Nombre, Teléfono, Vehículo).');
      return;
    }

    // Validar que la cédula no esté duplicada (si se proporciona)
    if (newDriver.cedula) {
      const existingDriverByCedula = drivers.find(driver => driver.cedula === newDriver.cedula);
      if (existingDriverByCedula) {
        alert('Ya existe un repartidor con esta cédula.');
        return;
      }
    }

    const existingDriverByPhone = drivers.find(driver => driver.phone === newDriver.phone);
    if (existingDriverByPhone) {
      alert('Ya existe un repartidor con este teléfono.');
      return;
    }

    try {
      // Solicitar ubicación del repartidor
      let driverLocationData = { ...newDriver };
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          const { latitude, longitude } = position.coords;
          driverLocationData.currentLat = latitude;
          driverLocationData.currentLng = longitude;
          driverLocationData.status = 'active';
          console.log('✅ Ubicación del repartidor capturada:', { latitude, longitude });
        } catch (geoError) {
          console.warn('⚠️ No se pudo obtener ubicación, continuando sin ella:', geoError.message);
        }
      }

      // Crear el repartidor con su ubicación
      const response = await api.post('/drivers', driverLocationData);
      console.log('Respuesta del servidor:', response);
      setNewDriver({
        name: '',
        cedula: '',
        phone: '',
        vehicle: '',
        password: '',
      });
      setShowDriverModal(false);
      loadData();
      console.log('Driver creado exitosamente con ubicación');
    } catch (err) {
      console.error('Error adding driver:', err);
      const serverMessage = err.response?.data?.error || err.message || 'Network Error';
      const apiUrl = api.defaults.baseURL ? `${api.defaults.baseURL}/drivers` : '/api/drivers';
      alert(`Error creando repartidor: ${serverMessage}\nURL: ${apiUrl}. Revisa que el backend esté activo y CORS habilitado.`);
    }
  };

  const toggleDriverStatus = async (driver) => {
    try {
      const newStatus = driver.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/drivers/${driver.id}/status`, { status: newStatus });
      loadData();
    } catch (err) {
      console.error('Error updating driver status:', err);
    }
  };

  const handleDeletePackage = async (packageId) => {
    try {
      await api.delete(`/packages/${packageId}`);
      loadData();
    } catch (err) {
      console.error('Error deleting package:', err);
      alert('Error eliminando paquete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAdminConfirmPayment = async (packageId) => {
    try {
      const res = await api.post(`/packages/${packageId}/confirm-payment`);
      if (res.data?.success) {
        alert('✅ Pago confirmado y rastreo activado para el paquete');
        loadData();
      } else {
        alert('No se pudo confirmar pago: ' + (res.data?.error || 'Error desconocido'));
      }
    } catch (err) {
      console.error('Error confirmando pago desde admin:', err);
      alert('Error al confirmar pago: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRejectPayment = async (packageId) => {
    const confirm = window.confirm('¿Estás seguro de que quieres rechazar este pago pendiente? Se eliminará de la lista.');
    if (!confirm) return;

    try {
      // Eliminar paquete del array
      const res = await api.delete(`/packages/${packageId}`);
      if (res.data?.success) {
        alert('✅ Pago rechazado y paquete eliminado');
        loadData();
      }
    } catch (err) {
      console.error('Error rechazando pago:', err);
      alert('Error al rechazar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteDriver = async (driverId) => {
    try {
      await api.delete(`/drivers/${driverId}`);
      loadData();
    } catch (err) {
      console.error('Error deleting driver:', err);
      alert('Error eliminando repartidor: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRespondComplaint = async (complaintId) => {
    if (!responseText.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    try {
      await api.put(`/complaints/${complaintId}`, {
        status: 'closed',
        response: responseText
      });

      setComplaints(complaints.map(c =>
        c.id === complaintId
          ? { ...c, status: 'closed', response: responseText }
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

  const handleApproveApplication = async () => {
    try {
      const payload = applicationPassword ? { password: applicationPassword } : {};
      await api.post(`/drivers/applications/${selectedApplication.id}/approve`, payload);

      alert('✅ Solicitud aprobada exitosamente');
      setShowApplicationModal(false);
      setApplicationPassword('');
      loadData();
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      alert('Error al aprobar solicitud: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor especifica el motivo del rechazo');
      return;
    }

    try {
      await api.post(`/drivers/applications/${selectedApplication.id}/reject`, {
        reason: rejectionReason
      });

      alert('✅ Solicitud rechazada');
      setShowApplicationModal(false);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      alert('Error al rechazar solicitud: ' + (error.response?.data?.error || error.message));
    }
  };

  const openApplicationModal = (app, action) => {
    setSelectedApplication(app);
    setApplicationAction(action);
    setApplicationPassword('');
    setRejectionReason('');
    setShowApplicationModal(true);
  };

  const handleSendGPSNotification = async (driver) => {
    try {
      // Solicitar permisos de ubicación antes de enviar
      await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalización no soportada'));
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Permiso de ubicación otorgado (para validar)');
            resolve(position);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      // Si se obtiene la ubicación, enviar la notificación
      await api.post(`/drivers/${driver.id}/gps-notification`, {
        message: 'El administrador solicita que actives tu GPS para el rastreo en tiempo real.'
      });
      alert('✅ Notificación GPS enviada por WhatsApp al conductor');
      setShowGPSModal(false);
      setSelectedDriverForGPS(null);
    } catch (error) {
      console.error('Error enviando notificación GPS:', error);
      if (error.code === 1) {
        alert('❌ Permiso de ubicación denegado. Por favor, habilita los permisos de ubicación en tu navegador.');
      } else {
        alert('Error al enviar notificación GPS');
      }
    }
  };

  const openGPSModal = (driver) => {
    setSelectedDriverForGPS(driver);
    setShowGPSModal(true);
  };


  return (
    <>
      {!isAuthenticated ? (
        <AdminLogin onSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <div className="admin-dashboard">
          {/* Notificación de entrega */}
          {deliveryNotification && (
            <div className="delivery-toast">
              <div className="delivery-toast-content">
                <span className="delivery-toast-icon">✅</span>
                <div className="delivery-toast-message">
                  <h4>¡Paquete Entregado!</h4>
                  <p>
                    <strong>{deliveryNotification.packageCode}</strong> fue entregado a{' '}
                    <strong>{deliveryNotification.clientName}</strong> por{' '}
                    <strong>{deliveryNotification.driverName}</strong> a las{' '}
                    <strong>{deliveryNotification.timestamp}</strong>
                  </p>
                </div>
                <button
                  className="delivery-toast-close"
                  onClick={() => setDeliveryNotification(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

      <div className="dashboard-header">
        <h1>🎛️ Panel de Administración</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowPackageModal(true)}
          >
            + Nuevo Paquete
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              console.log('Abriendo modal de nuevo repartidor');
              setShowDriverModal(true);
            }}
          >
            + Nuevo Repartidor
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          Paquetes
        </button>
        <button
          className={`tab ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          Repartidores
        </button>
        <button
          className={`tab ${activeTab === 'pending-payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending-payments')}
          style={{ backgroundColor: '#fff3cd', color: '#856404', fontWeight: 'bold' }}
        >
          💰 Pagos Pendientes ({packages.filter(p => ['payment_submitted', 'pending_payment', 'payment_required', 'pending_pickup'].includes(p.status)).length})
        </button>

      {activeTab === 'packages' && (
        <div className="packages-filter-bar">
          <button
            className={`btn btn-sm ${showDeliveredTodayOnly ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setShowDeliveredTodayOnly(prev => !prev)}
          >
            {showDeliveredTodayOnly ? 'Mostrar todos los paquetes' : 'Mostrar solo entregados hoy'}
          </button>
          {deliveredAlert && (
            <span className="delivered-alert">✔️ {deliveredAlert}</span>
          )}
        </div>
      )}
        <button
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Solicitudes de Trabajo ({applications.filter(a => a.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          📋 Quejas ({complaints.filter(c => c.status === 'open').length})
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Estadísticas
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {activeTab === 'packages' && (
            <div className="packages-section">
              <h2>Paquetes Registrados</h2>
              <div className="packages-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Estado Pago</th>
                      <th>Referencia</th>
                      <th>Repartidor</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredPackages = showDeliveredTodayOnly
                        ? packages.filter(pkg => {
                            if (pkg.status !== 'delivered') return false;
                            const deliveredAt = pkg.deliveredAt || pkg.updatedAt;
                            if (!deliveredAt) return false;
                            const date = new Date(deliveredAt);
                            const today = new Date();
                            return date.toDateString() === today.toDateString();
                          })
                        : packages;

                      if (filteredPackages.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>
                              {(showDeliveredTodayOnly
                                ? 'No hay paquetes entregados hoy'
                                : 'No hay paquetes disponibles')}
                            </td>
                          </tr>
                        );
                      }

                      return filteredPackages.map(pkg => (
                        <tr key={pkg.id}>
                          <td><strong>{pkg.code}</strong></td>
                        <td>{pkg.recipient}</td>
                        <td>
                          <span className={`status ${pkg.status.toLowerCase()}`}>
                            {pkg.status}
                          </span>
                        </td>
                        <td>{pkg.paymentStatus || (pkg.status === 'payment_required' || pkg.status === 'pending_payment' ? 'pending' : 'paid')}</td>
                        <td>{pkg.submittedReference || pkg.transferReference || '-'}</td>
                        <td>{pkg.driver?.name || 'No asignado'}</td>
                        <td>
                          <button className="btn-small">Ver</button>
                          {['payment_submitted', 'pending_payment', 'payment_required', 'pending_pickup'].includes(pkg.status) && (
                            <button
                              className="btn-small success"
                              onClick={() => handleAdminConfirmPayment(pkg.id)}
                              title="Marcar que el pago ha sido realizado"
                            >
                              ✓ Realicé el pago
                            </button>
                          )}
                          <button 
                            className="btn-small danger"
                            onClick={() => handleDeletePackage(pkg.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pending-payments' && (
            <div className="payments-section">
              <h2>💰 Pagos Pendientes - Panel de Control</h2>
              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '2px solid #ffc107', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px',
                color: '#856404'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  ⚠️ Aquí se muestran los paquetes esperando confirmación de pago.
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  • Si la referencia o comprobante fueron enviados por WhatsApp, haz clic en "✓ Realicé el pago"
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                  • Si el cliente no pudo enviar el comprobante, solicita que lo haga via WhatsApp
                </p>
              </div>
              <div className="packages-table" style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr style={{ backgroundColor: '#ffc107', color: '#000' }}>
                      <th>Código Paquete</th>
                      <th>Remitente</th>
                      <th>Teléfono</th>
                      <th>Monto RD$</th>
                      <th>Referencia</th>
                      <th>Comprobante</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const pendingPayments = packages.filter(p => 
                        ['payment_submitted', 'pending_payment', 'payment_required', 'pending_pickup'].includes(p.status)
                      );
                      
                      if (pendingPayments.length === 0) {
                        return (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'green', fontWeight: 'bold', fontSize: '16px' }}>
                              ✅ ¡No hay pagos pendientes! Todos los paquetes están pagados.
                            </td>
                          </tr>
                        );
                      }

                      return pendingPayments.map(pkg => (
                        <tr key={pkg.id} style={{ backgroundColor: '#fffbf0', borderBottom: '2px solid #ffc107' }}>
                          <td><strong style={{ fontSize: '13px', color: '#d9534f' }}>{pkg.code || pkg.packageCode}</strong></td>
                          <td style={{ maxWidth: '150px' }}>{pkg.senderName || pkg.sender || 'N/A'}</td>
                          <td style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}>
                            {pkg.senderPhone ? <a href={`https://wa.me/${pkg.senderPhone}`} target="_blank" rel="noopener noreferrer">{pkg.senderPhone}</a> : 'N/A'}
                          </td>
                          <td><strong>${pkg.amount || pkg.transferAmount || '0.00'}</strong></td>
                          <td>
                            {pkg.submittedReference || pkg.transferReference ? (
                              <span style={{ backgroundColor: '#d4edda', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                ✓ {pkg.submittedReference || pkg.transferReference}
                              </span>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td>
                            {pkg.voucherImage ? (
                              <span style={{ backgroundColor: '#d4edda', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                📸 Disponible
                              </span>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td>
                            <span className={`status ${pkg.status.toLowerCase()}`}>
                              {pkg.status === 'pending_pickup' ? 'Esperando Pago' : pkg.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-small success"
                              onClick={() => handleAdminConfirmPayment(pkg.id)}
                              style={{ fontWeight: 'bold', padding: '6px 10px', fontSize: '12px', whiteSpace: 'nowrap', marginRight: '4px' }}
                              title="Confirmar que el pago ha sido realizado"
                            >
                              ✓ Pago OK
                            </button>
                            <button
                              className="btn-small danger"
                              onClick={() => handleRejectPayment(pkg.id)}
                              style={{ fontWeight: 'bold', padding: '6px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                              title="Rechazar pago y limpiar de la lista"
                            >
                              ✕ Rechazar
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="drivers-section">
              <h2>Repartidores</h2>

              <div className="map-preview">
                <TrackingMap activeDrivers={realTimeDrivers} adminLocation={adminLocation} />
              </div>

              <div className="drivers-grid">
                {drivers.map((driver) => (
                  <div key={driver.id} className="driver-card">
                    <h3>{driver.name}</h3>
                    <p>Cédula: {driver.cedula}</p>
                    <p>Tel: {driver.phone}</p>
                    <p>Vehículo: {driver.vehicle}</p>
                    <p>Estado: <strong>{driver.status}</strong></p>
                    <div className="driver-actions">
                      <button
                        className="btn-small"
                        onClick={() => toggleDriverStatus(driver)}
                      >
                        {driver.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        className="btn-small warning"
                        onClick={() => openGPSModal(driver)}
                        title="Enviar notificación GPS"
                      >
                        📍 GPS
                      </button>
                      <button 
                        className="btn-small danger"
                        onClick={() => handleDeleteDriver(driver.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="applications-section">
              <h2>Solicitudes de Trabajo de Repartidores</h2>
              <div className="applications-container">
                <div className="applications-list">
                  <h3>Solicitudes Pendientes ({applications.filter(a => a.status === 'pending').length})</h3>
                  
                  {applications.length === 0 ? (
                    <p className="empty">No hay solicitudes pendientes</p>
                  ) : (
                    applications.map(app => (
                      <div
                        key={app.id}
                        className={`application-item ${app.status} ${selectedApplication?.id === app.id ? 'selected' : ''}`}
                        onClick={() => setSelectedApplication(app)}
                      >
                        <div className="app-header">
                          <h4>{app.firstName} {app.lastName}</h4>
                          <span className={`status-badge ${app.status}`}>
                            {app.status === 'pending' ? '⏳ Pendiente' : app.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'}
                          </span>
                        </div>
                        <div className="app-info">
                          <p><strong>Teléfono:</strong> {app.phone}</p>
                          <p><strong>Cédula:</strong> {app.cedula || 'N/A'}</p>
                          <p><strong>Dirección:</strong> {app.address}</p>
                          <p><strong>Solicitado:</strong> {new Date(app.createdAt).toLocaleDateString('es-DO')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="application-detail">
                  {selectedApplication ? (
                    <div className="detail">
                      <h3>Detalles de la Solicitud</h3>
                      <div className="detail-info">
                        <p><strong>Nombre Completo:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                        <p><strong>Teléfono:</strong> {selectedApplication.phone}</p>
                        <p><strong>Email:</strong> {selectedApplication.email || 'No proporcionado'}</p>
                        <p><strong>Cédula:</strong> {selectedApplication.cedula || 'Sin cédula'}</p>
                        
                        <div className="address-section">
                          <p><strong>Dirección Completa:</strong></p>
                          <p>{selectedApplication.house}, {selectedApplication.street}, {selectedApplication.address}</p>
                        </div>

                        <div className="dates-section">
                          <p><strong>Solicitado:</strong> {new Date(selectedApplication.createdAt).toLocaleString('es-DO')}</p>
                          <p><strong>Vence:</strong> {new Date(selectedApplication.expiresAt).toLocaleString('es-DO')}</p>
                        </div>

                        {selectedApplication.status === 'pending' && (
                          <div className="application-actions">
                            <button 
                              className="btn btn-approve"
                              onClick={() => openApplicationModal(selectedApplication, 'approve')}
                            >
                              ✅ Aprobar Solicitud
                            </button>
                            <button 
                              className="btn btn-reject"
                              onClick={() => openApplicationModal(selectedApplication, 'reject')}
                            >
                              ❌ Rechazar Solicitud
                            </button>
                          </div>
                        )}

                        {selectedApplication.status === 'approved' && (
                          <div className="status-info success">
                            <p>✅ Esta solicitud fue aprobada el {new Date(selectedApplication.approvedAt).toLocaleString('es-DO')}</p>
                          </div>
                        )}

                        {selectedApplication.rejectionReason && (
                          <div className="status-info rejected">
                            <p><strong>Motivo del Rechazo:</strong></p>
                            <p>{selectedApplication.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="no-selection">👈 Selecciona una solicitud para ver detalles</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="complaints-admin-section">
              <h2>Gestión de Quejas</h2>
              <div className="complaints-admin-container">
                <div className="complaints-admin-list">
                  <h3>Quejas Registradas ({complaints.length})</h3>
                  
                  {complaints.length === 0 ? (
                    <p className="empty">No hay quejas registradas</p>
                  ) : (
                    complaints.map(complaint => (
                      <div
                        key={complaint.id}
                        className={`complaint-admin-item ${selectedComplaint?.id === complaint.id ? 'selected' : ''} ${complaint.status}`}
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setResponseText(complaint.response || '');
                        }}
                      >
                        <div className="complaint-id">{complaint.id}</div>
                        <div className="complaint-info">
                          <p className="tracking">Paquete: {complaint.trackingNumber}</p>
                          <p className="description">{complaint.description.substring(0, 50)}...</p>
                        </div>
                        <span className={`status ${complaint.status}`}>
                          {complaint.status === 'open' ? '🔴' : '✅'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="complaints-admin-detail">
                  {selectedComplaint ? (
                    <div className="detail">
                      <h3>Detalles de la Queja</h3>
                      <div className="detail-info">
                        <p><strong>ID:</strong> {selectedComplaint.id}</p>
                        <p><strong>Paquete:</strong> {selectedComplaint.trackingNumber}</p>
                        <p><strong>Estado:</strong> <span className={`status-badge ${selectedComplaint.status}`}>{selectedComplaint.status === 'open' ? '🔴 Abierta' : '✅ Cerrada'}</span></p>
                        <p><strong>Fecha:</strong> {new Date(selectedComplaint.createdAt).toLocaleString('es-DO')}</p>
                        <p><strong>Descripción:</strong></p>
                        <p className="description-full">{selectedComplaint.description}</p>
                        
                        {selectedComplaint.response && (
                          <>
                            <p><strong>Respuesta Enviada:</strong></p>
                            <p className="response-text">{selectedComplaint.response}</p>
                          </>
                        )}

                        {selectedComplaint.status === 'open' && (
                          <div className="response-form">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Escribe tu respuesta..."
                              rows="4"
                            />
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleRespondComplaint(selectedComplaint.id)}
                            >
                              Enviar Respuesta
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="no-selection">👈 Selecciona una queja para ver detalles</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <h2>Estadísticas</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Paquetes</h3>
                  <p className="stat-value">{packages.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Entregados Hoy</h3>
                  <p className="stat-value">
                    {packages.filter(p => p.status === 'delivered').length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>En Tránsito</h3>
                  <p className="stat-value">
                    {packages.filter(p => p.status === 'in-transit').length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Repartidores Activos</h3>
                  <p className="stat-value">{drivers.length}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showPackageModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nuevo Paquete</h2>
            <form onSubmit={handleAddPackage}>
              <div className="form-group">
                <label>Código de Paquete</label>
                <input
                  type="text"
                  required
                  value={newPackage.code}
                  onChange={(e) => setNewPackage({ ...newPackage, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Remitente</label>
                <input
                  type="text"
                  required
                  value={newPackage.sender}
                  onChange={(e) => setNewPackage({ ...newPackage, sender: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Destinatario</label>
                <input
                  type="text"
                  required
                  value={newPackage.recipient}
                  onChange={(e) => setNewPackage({ ...newPackage, recipient: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  required
                  value={newPackage.address}
                  onChange={(e) => setNewPackage({ ...newPackage, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  required
                  value={newPackage.phone}
                  onChange={(e) => setNewPackage({ ...newPackage, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">Crear Paquete</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPackageModal(false)}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {showDriverModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nuevo Repartidor</h2>
            <form onSubmit={handleAddDriver}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  required
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cédula</label>
                <input
                  type="text"
                  value={newDriver.cedula}
                  onChange={(e) => setNewDriver({ ...newDriver, cedula: e.target.value })}
                  placeholder="Ej: 001-1234567-8"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-small"
                  onClick={() => setNewDriver({ ...newDriver, cedula: '' })}
                  style={{ marginTop: '8px', width: '100%' }}
                >
                  Sin cédula
                </button>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  required
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Vehículo</label>
                <input
                  type="text"
                  required
                  value={newDriver.vehicle}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contraseña (opcional)</label>
                <input
                  type="password"
                  value={newDriver.password}
                  onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                />
                <small>Si no se ingresa contraseña, el conductor podrá iniciar sesión solo con teléfono (sin clave) o con el PIN enviado.</small>
              </div>
              <button type="submit" className="btn btn-primary">Crear Repartidor</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDriverModal(false)}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {showApplicationModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>
              {applicationAction === 'approve' ? '✅ Aprobar Solicitud de Trabajo' : '❌ Rechazar Solicitud de Trabajo'}
            </h2>
            
            {applicationAction === 'approve' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleApproveApplication();
              }}>
                <div className="form-group">
                  <label>Contraseña Inicial del Conductor (opcional)</label>
                  <input
                    type="password"
                    value={applicationPassword}
                    onChange={(e) => setApplicationPassword(e.target.value)}
                    placeholder="Puedes dejar en blanco para 123456"
                  />
                  <small>Si no especificas contraseña, se usará <strong>123456</strong>.</small>
                </div>
                <div className="form-group">
                  <label>Confirmación de Datos:</label>
                  <p><strong>Nombre:</strong> {selectedApplication?.firstName} {selectedApplication?.lastName}</p>
                  <p><strong>Teléfono:</strong> {selectedApplication?.phone}</p>
                  <p><strong>Dirección:</strong> {selectedApplication?.address}</p>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-approve">
                    ✅ Confirmar Aprobación
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRejectApplication();
              }}>
                <div className="form-group">
                  <label>Motivo del Rechazo *</label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explica detalladamente por qué se rechaza la solicitud"
                    rows="4"
                  />
                  <small>Se enviará al conductor por WhatsApp</small>
                </div>
                <div className="form-group">
                  <label>Información del Solicitante:</label>
                  <p><strong>Nombre:</strong> {selectedApplication?.firstName} {selectedApplication?.lastName}</p>
                  <p><strong>Teléfono:</strong> {selectedApplication?.phone}</p>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-reject">
                    ❌ Confirmar Rechazo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showGPSModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>� Notificación WhatsApp GPS</h2>
            <p>¿Quieres enviar una notificación por WhatsApp al conductor para que active su GPS?</p>
            
            {selectedDriverForGPS && (
              <div className="driver-info">
                <p><strong>Conductor:</strong> {selectedDriverForGPS.name}</p>
                <p><strong>Teléfono:</strong> {selectedDriverForGPS.phone}</p>
                <p><strong>Estado:</strong> {selectedDriverForGPS.status}</p>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleSendGPSNotification(selectedDriverForGPS)}
              >
                � Enviar WhatsApp
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowGPSModal(false);
                  setSelectedDriverForGPS(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
}

export default AdminDashboard;
