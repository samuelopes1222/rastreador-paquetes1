import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import TrackingMap from '../components/TrackingMap';
import '../styles/TrackingPage.css';

function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realTimeLocation, setRealTimeLocation] = useState(null);
  const [driverRealTimeLocation, setDriverRealTimeLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [proximityInfo, setProximityInfo] = useState(null);
  const [checkingProximity, setCheckingProximity] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [paymentCheckLoading, setPaymentCheckLoading] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [clientName, setClientName] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [voucherImageBase64, setVoucherImageBase64] = useState('');
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const { socket, isConnected } = useSocket();

  // Suscribirse a actualizaciones en tiempo real cuando hay un paquete
  useEffect(() => {
    if (packageData && socket && isConnected) {
      console.log(`📦 Suscribiéndose a actualizaciones del paquete: ${packageData.id}`);
      console.log(`👤 Repartidor asignado: ${packageData.assignedDriverId || packageData.driverId}`);

      // Suscribirse al paquete
      socket.emit('subscribe-package', packageData.id);

      // Escuchar actualizaciones de ubicación del paquete (simulación)
      const handleLocationUpdate = (data) => {
        console.log('📍 Actualización de ubicación del paquete:', data);
        setRealTimeLocation(data);
      };

      // Escuchar actualizaciones de ubicación del repartidor en tiempo real
      const handleDriverLocationUpdate = (data) => {
        console.log('🚗 Ubicación del repartidor recibida en tiempo real:', data);
        setDriverRealTimeLocation({
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp
        });
      };

      socket.on('location-update', handleLocationUpdate);
      socket.on('driver-location-realtime', handleDriverLocationUpdate);

      // Cleanup
      return () => {
        socket.emit('unsubscribe-package', packageData.id);
        socket.off('location-update', handleLocationUpdate);
        socket.off('driver-location-realtime', handleDriverLocationUpdate);
      };
    }
  }, [packageData, socket, isConnected]);

  // Obtener información del repartidor cuando se asigna
  useEffect(() => {
    const driverId = packageData?.assignedDriverId || packageData?.driverId;
    if (driverId && socket && isConnected) {
      api.get(`/drivers/${driverId}`)
        .then(response => {
          setDriverInfo(response.data?.data || response.data);
          console.log('👤 Información del repartidor:', response.data);
        })
        .catch(err => console.error('Error obteniendo info del repartidor:', err));
    }
  }, [packageData, socket, isConnected]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!trackingCode.trim()) {
      setError('Por favor ingresa un código de paquete');
      return;
    }

    setLoading(true);
    setError('');
    setRealTimeLocation(null);
    setDriverRealTimeLocation(null);
    setProximityInfo(null);
    setConfirmationMessage('');
    setIsPaymentVerified(false);
    setTransferReference('');
    setVoucherImageBase64('');
    setVoucherPreviewUrl(null);

    try {
      const response = await api.get(`/packages/tracking/${trackingCode}`);
      if (response.data?.success) {
        setPackageData(response.data.data);
      } else {
        setError(response.data?.error || 'No se encontró paquete con ese código');
        setPackageData(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No se encontró paquete con ese código');
        setPackageData(null);
      } else {
        console.error('Error buscando paquete:', err);
        setError('Error buscando paquete. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProximity = async () => {
    if (!packageData) return;
    const driverId = packageData.assignedDriverId || packageData.driverId;
    const driverLat = driverRealTimeLocation?.lat;
    const driverLng = driverRealTimeLocation?.lng;

    if (!driverId || !driverLat || !driverLng) {
      setError('No hay información de ubicación del repartidor para verificar proximidad.');
      return;
    }

    setCheckingProximity(true);
    setError('');
    try {
      const res = await api.get(`/packages/${packageData.id}/delivery-proximity`, {
        params: {
          driverId,
          driverLat,
          driverLng
        }
      });

      const data = res.data;
      setProximityInfo({
        isNear: data?.isNear,
        distance: data?.distance,
        maxDistance: data?.maxDistance,
        message: data?.message
      });

      if (data?.isNear) {
        setConfirmationMessage('¡El repartidor está cerca! Ahora puedes confirmar la entrega cuando tengas el paquete.')
      } else {
        setConfirmationMessage(data?.message || 'Todavía faltan metros para llegar.');
      }
    } catch (err) {
      console.error('Error verificando proximidad:', err);
      setError(err.response?.data?.error || 'Error verificando proximidad');
      setProximityInfo(null);
    } finally {
      setCheckingProximity(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!packageData) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/packages/${packageData.id}/confirm-payment`);
      const updated = response.data?.data || response.data;
      if (updated?.status) {
        setPackageData((prev) => ({
          ...prev,
          ...updated,
        }));
      }

      setIsPaymentVerified(true);
      setConfirmationMessage('✅ Pago confirmado. El rastreo ha sido desbloqueado.');
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      setError(err.response?.data?.error || 'No se pudo verificar el pago automáticamente. Reintenta o contacta soporte.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!packageData) return;

    setPaymentCheckLoading(true);
    setError('');

    try {
      const res = await api.get(`/packages/${packageData.id}/payment-status`);
      if (!res.data?.success) {
        setError(res.data?.error || 'No fue posible consultar estado de pago');
        return;
      }

      const updated = res.data?.data;
      if (!updated) {
        setError('No se encontró el paquete para verificación');
        return;
      }

      setPackageData((prev) => ({
        ...prev,
        ...updated,
      }));

      if (['in-transit', 'out-for-delivery', 'delivered'].includes(updated.status)) {
        setIsPaymentVerified(true);
        setConfirmationMessage('✅ Pago confirmado (consulta). El rastreo está activo.');
      } else if (updated.status === 'payment_submitted') {
        setIsPaymentVerified(false);
        setConfirmationMessage('⏳ Pago pendiente de revisión de admin.');
      } else if (updated.status === 'payment_required' || updated.status === 'pending_payment') {
        setIsPaymentVerified(false);
        setConfirmationMessage('⏳ Aún no se confirmó el pago. Revisa tu comprobante en WhatsApp y vuelve a intentar.');
      } else {
        setConfirmationMessage('ℹ️ Estado de pago: ' + updated.status);
      }
    } catch (err) {
      console.error('Error consultando estado de pago:', err);
      setError('Error verificando estado de pago. Intenta de nuevo.');
    } finally {
      setPaymentCheckLoading(false);
    }
  };

  const handleVoucherFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVoucherImageBase64(reader.result);
      setVoucherPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async () => {
    if (!packageData) return;

    if (!transferReference.trim() && !voucherImageBase64) {
      setError('Por favor ingresa referencia o sube la imagen del comprobante.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/packages/${packageData.id}/submit-payment-proof`, {
        reference: transferReference.trim(),
        imageBase64: voucherImageBase64
      });

      if (res.data?.success) {
        setPackageData(res.data.data);
        setConfirmationMessage('✅ Comprobante enviado. Esperando confirmación del admin.');
      } else {
        setError(res.data?.error || 'Error enviando comprobante');
      }
    } catch (err) {
      console.error('Error al enviar comprobante:', err);
      setError(err.response?.data?.error || 'Error enviando comprobante de pago');
    } finally {
      setLoading(false);
    }
  };
  const handleConfirmDelivery = async () => {
    if (!packageData) return;
    if (!proximityInfo?.isNear) {
      setError('No se puede confirmar entrega: repartidor no está cerca aún.');
      return;
    }
    if (!clientName.trim()) {
      setError('Ingresa el nombre del receptor para confirmar la entrega.');
      return;
    }

    const driverId = packageData.assignedDriverId || packageData.driverId;
    const driverLat = driverRealTimeLocation?.lat;
    const driverLng = driverRealTimeLocation?.lng;

    if (!driverId || !driverLat || !driverLng) {
      setError('No se puede confirmar entrega: datos del repartidor incompletos.');
      return;
    }

    setConfirmingDelivery(true);
    setError('');

    try {
      const res = await api.post(`/packages/${packageData.id}/confirm-delivery`, {
        driverId,
        driverLat,
        driverLng,
        clientConfirmation: clientName.trim(),
        signature: null,
        photo: null
      });

      setPackageData(res.data?.data || packageData);
      setConfirmationMessage('✅ Entrega confirmada. Gracias por confirmar la recepción.');
      setProximityInfo({ ...proximityInfo, isNear: true });
      setClientName('');

      // Emitir evento local para reflejar en la UI inmediato
      if (socket && socket.connected) {
        socket.emit('delivery-complete', { packageId: packageData.id });
      }

    } catch (err) {
      console.error('Error confirmando entrega:', err);
      setError(err.response?.data?.error || 'Error confirmando entrega');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  return (
    <div className="tracking-page">
      <div className="tracking-container">
        <h1>📦 Rastrear tu Paquete</h1>
        <p>Ingresa tu código de seguimiento para ver la ubicación en tiempo real</p>

        {/* Estado de conexión WebSocket */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? '🟢 Conectado - Actualizaciones en tiempo real activas' : '🔴 Desconectado - Modo offline'}
        </div>

        <form onSubmit={handleSearch} className="tracking-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Ingresa código de paquete (ej: PKG-001)"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Buscando...' : 'Rastrear'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {packageData && ['payment_required', 'pending_payment', 'payment_submitted'].includes(packageData.status) && (
          <div className="payment-section">
            <div className="payment-header">
              <h2>💰 Pago Requerido para Rastreo</h2>
              <p>Para acceder al estado completo de tu paquete <strong>{packageData.trackingCode || packageData.id}</strong>, realiza un depósito de <strong>35 DOP</strong> a cualquiera de las siguientes cuentas:</p>
            </div>

            <div className="payment-table-container">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Banco</th>
                    <th>Tipo de Cuenta</th>
                    <th>Número de Cuenta</th>
                    <th>Nombre del Titular</th>
                    <th>Cédula</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🔴 Banreservas</td>
                    <td>Cuenta de Ahorros</td>
                    <td><strong>9608610867</strong></td>
                    <td>Menyeris Alfao</td>
                    <td>40203871450</td>
                    <td><span className="amount">35 DOP</span></td>
                  </tr>
                  <tr>
                    <td>🔵 Banco Popular</td>
                    <td>Cuenta Corriente</td>
                    <td><strong>850965237</strong></td>
                    <td>Menyeris Alfao</td>
                    <td>40203871450</td>
                    <td><span className="amount">35 DOP</span></td>
                  </tr>
                  <tr>
                    <td>⚪️ Banco BHD</td>
                    <td>Cuenta de Ahorros</td>
                    <td><strong>31618930021</strong></td>
                    <td>Julian Ovalles</td>
                    <td>40247172295</td>
                    <td><span className="amount">35 DOP</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="payment-instructions">
              <h3>📋 Instrucciones de Pago:</h3>
              <ol>
                <li>Realiza el depósito de <strong>35 DOP</strong> a cualquiera de las cuentas mostradas arriba</li>
                <li>Toma una foto del comprobante de depósito</li>
                <li>Ingresa el número de referencia y/o sube la imagen del comprobante</li>
                <li>Envía el comprobante por WhatsApp al: <strong>+1 (829) 123-4567</strong> (opcional)</li>
                <li>Luego usa el botón “Enviar comprobante” y “Verificar estado (auto)”</li>
              </ol>
            </div>
            {isPaymentVerified && (
              <div className="alert alert-success">
                ✅ Pago verificado. Ahora el rastreo está activo.
              </div>
            )}

            <div className="payment-proof-form">
              <label>Referencia de transferencia</label>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Ej: 123456789"
                className="form-input"
              />

              <label>Imagen del comprobante</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleVoucherFileChange}
                className="form-input"
              />

              {voucherPreviewUrl && (
                <div className="voucher-preview">
                  <img src={voucherPreviewUrl} alt="Comprobante" />
                </div>
              )}

              {packageData.submittedReference && (
                <p>Referencia enviada: <strong>{packageData.submittedReference}</strong></p>
              )}
              {packageData.submittedVoucherImage && (
                <p>Imagen de comprobante recibida (pendiente admin)</p>
              )}
            </div>

            <div className="payment-actions">
              <button
                onClick={handleSubmitPaymentProof}
                className="btn btn-secondary btn-large"
                disabled={loading}
              >
                {loading ? 'Enviando...' : '📤 Enviar comprobante (referencia + foto)'}
              </button>

              <button
                onClick={checkPaymentStatus}
                className="btn btn-info btn-large"
                disabled={paymentCheckLoading}
              >
                {paymentCheckLoading ? 'Consultando...' : '🔍 Verificar estado de pago (auto)'}
              </button>

              <button
                onClick={handleConfirmPayment}
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? 'Verificando pago...' : '💳 Confirmar pago recibido y activar rastreo'}
              </button>

              <a
                href={`https://wa.me/18291234567?text=Hola,%20acabo%20de%20realizar%20el%20dep%C3%B3sito%20de%2035%20DOP%20para%20rastrear%20mi%20paquete%20${encodeURIComponent(packageData.trackingCode || packageData.id)}%20Ref:%20${encodeURIComponent(transferReference)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-large"
              >
                📱 Enviar comprobante por WhatsApp
              </a>

              <button
                onClick={() => {
                  setPackageData(null);
                  setTrackingCode('');
                }}
                className="btn btn-secondary"
              >
                🔄 Buscar otro paquete
              </button>
            </div>
          </div>
        )}

        {packageData && packageData.status !== 'payment_required' && (
          <>
            <div className="status-section">
              <h2>Estado: <span className={`status ${packageData.status?.toLowerCase()}`}>
                {getStatusLabel(packageData.status)}
              </span></h2>
              {(driverRealTimeLocation || realTimeLocation) && (
                <small className="live-indicator">🔴 EN VIVO</small>
              )}
            </div>

            {/* Mapa de ubicación en tiempo real */}
            {(packageData.location || driverRealTimeLocation) && (
              <div className="map-section">
                <h3>🗺️ Ubicación en Tiempo Real</h3>
                <TrackingMap
                  packageLocation={packageData.location || (driverRealTimeLocation ? {
                    lat: driverRealTimeLocation.lat,
                    lng: driverRealTimeLocation.lng
                  } : undefined)}
                  destinationLocation={packageData.destinationLocation || packageData.destination}
                  originLocation={packageData.originLocation || packageData.origin}
                  driverLocation={driverRealTimeLocation ? {
                    lat: driverRealTimeLocation.lat,
                    lng: driverRealTimeLocation.lng,
                    name: driverInfo?.name || 'Repartidor',
                    vehicle: driverInfo?.vehicle,
                    plate: driverInfo?.plate
                  } : null}
                />
              </div>
            )}

            <div className="info-grid">
              <div className="info-card">
                <h3>Remitente</h3>
                <p>{packageData.sender || packageData.customerName || 'N/A'}</p>
              </div>
              <div className="info-card">
                <h3>Destinatario</h3>
                <p>{packageData.recipient || 'Cliente'}</p>
              </div>
              <div className="info-card">
                <h3>Dirección</h3>
                <p>{packageData.address || packageData.destination || 'N/A'}</p>
              </div>
              <div className="info-card">
                <h3>Repartidor</h3>
                <p>
                  {driverInfo?.name || packageData.assignedDriverName || packageData.driverName || 'Asignando...'}
                  {driverInfo?.vehicle && <small> ({driverInfo.vehicle})</small>}
                  {driverInfo?.plate && <small> - {driverInfo.plate}</small>}
                </p>
              </div>
            </div>

            {driverRealTimeLocation && (
              <div className="driver-tracking-info">
                <h3>🚗 Repartidor Viene Hacia Ti</h3>
                <div className="driver-status">
                  <p><strong>Ubicación en vivo:</strong> {driverRealTimeLocation.lat?.toFixed(4)}, {driverRealTimeLocation.lng?.toFixed(4)}</p>
                  <small>Última actualización: {new Date(driverRealTimeLocation.timestamp || Date.now()).toLocaleString('es-DO')}</small>
                  <p style={{ marginTop: '8px', color: 'green' }}>📍 El repartidor está en camino hacia ti</p>
                </div>

                {packageData.status !== 'delivered' && (
                  <div className="delivery-confirmation-panel">
                    <h4>✅ Confirmar Entrega</h4>
                    <p className="small-note">Comprueba proximidad y completa la entrega cuando el repartidor llegue.</p>

                    <button
                      className="btn btn-warning"
                      onClick={handleCheckProximity}
                      disabled={checkingProximity}
                    >
                      {checkingProximity ? 'Verificando...' : 'Verificar proximidad de entrega'}
                    </button>

                    {proximityInfo && (
                      <div className={`proximity-info ${proximityInfo.isNear ? 'near' : 'far'}`}>
                        <p>{proximityInfo.message}</p>
                        <p>Distancia: {proximityInfo.distance}m / Máx {proximityInfo.maxDistance}m</p>
                      </div>
                    )}

                    {proximityInfo?.isNear && (
                      <div className="confirm-delivery-form">
                        <input
                          type="text"
                          placeholder="Nombre de quien recibe"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="form-input"
                        />
                        <button
                          className="btn btn-success"
                          onClick={handleConfirmDelivery}
                          disabled={confirmingDelivery}
                        >
                          {confirmingDelivery ? 'Confirmando...' : 'Confirmar entrega recibida'}
                        </button>
                      </div>
                    )}

                    {confirmationMessage && (
                      <div className="alert alert-success">
                        {confirmationMessage}
                      </div>
                    )}
                  </div>
                )}

                {packageData.status === 'delivered' && (
                  <div className="alert alert-success">
                    🎉 El paquete ya fue entregado.
                  </div>
                )}
              </div>
            )}

            {packageData.location && (
              <div className="location-info">
                <h3>📍 Ubicación Actual del Paquete</h3>
                <p>Latitud: {packageData.location.lat?.toFixed(6) || 'N/A'}</p>
                <p>Longitud: {packageData.location.lng?.toFixed(6) || 'N/A'}</p>
                <small>Última actualización: {new Date(packageData.location.timestamp || Date.now()).toLocaleString('es-DO')}</small>
                {realTimeLocation && (
                  <div className="live-update">
                    <small>🟢 Actualización en vivo cada 5 segundos</small>
                  </div>
                )}
              </div>
            )}

            <div className="timeline">
              <h3>📋 Historial de Entrega</h3>
              {packageData.history && packageData.history.length > 0 ? (
                packageData.history.map((event, idx) => (
                  <div key={idx} className="timeline-event">
                    <span className="timeline-date">
                      {new Date(event.timestamp).toLocaleString('es-DO')}
                    </span>
                    <span className="timeline-status">{event.status}</span>
                    <p>{event.description}</p>
                  </div>
                ))
              ) : (
                <p>No hay historial disponible</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    'pending': '⏳ Pendiente',
    'in-transit': '🚚 En Tránsito',
    'out-for-delivery': '📍 Salió para Entrega',
    'delivered': '✅ Entregado',
    'failed': '❌ Fallo en Entrega',
    'payment_required': '💰 Pago Requerido'
  };
  return labels[status] || status;
}

export default TrackingPage;
