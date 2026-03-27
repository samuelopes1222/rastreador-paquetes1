import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/CreatePackage.css';
import PaymentModal from './PaymentModal';
import PaymentSuccess from './PaymentSuccess';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

function MapClickHandler({ onLocationClick, selectedMode }) {
  useMapEvents({
    click(e) {
      if (selectedMode) {
        onLocationClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    }
  });
  return null;
}

function CreatePackageForm({ onPackageCreated }) {
  const [formData, setFormData] = useState({
    code: '',
    sender: '',
    senderPhone: '',
    recipient: '',
    recipientPhone: '',
    weight: '',
    description: '',
    originAddress: '',
    originLat: null,
    originLng: null,
    destinationAddress: '',
    destinationLat: null,
    destinationLng: null
  });

  const [selectedMode, setSelectedMode] = useState(null); // 'origin' o 'destination'
  const [mapCenter, setMapCenter] = useState({ lat: 18.4861, lng: -69.9312 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(500); // Costo estimado dinámico
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successData, setSuccessData] = useState({
    packageCode: '',
    amount: 0,
    transferDate: new Date().toISOString().split('T')[0]
  });

  // Estados para sugerencias de direcciones
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);

  // Función para calcular distancia entre dos coordenadas (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  // Función para calcular el monto de cotización basado en distancia
  const calculateQuotationAmount = useCallback((originLat, originLng, destinationLat, destinationLng) => {
    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return 500; // Monto por defecto si faltan coordenadas
    }
    
    const distance = calculateDistance(originLat, originLng, destinationLat, destinationLng);
    // RD$50 por km + base de RD$100
    const amount = Math.max(500, Math.ceil((distance * 50) + 100));
    return amount;
  }, []);

  // Recalcular costo cuando cambien las coordenadas
  React.useEffect(() => {
    if (formData.originLat && formData.originLng && formData.destinationLat && formData.destinationLng) {
      const newCost = calculateQuotationAmount(
        formData.originLat,
        formData.originLng,
        formData.destinationLat,
        formData.destinationLng
      );
      setEstimatedCost(newCost);
    }
  }, [formData.originLat, formData.originLng, formData.destinationLat, formData.destinationLng, calculateQuotationAmount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Buscar sugerencias mientras el usuario escribe
    if (name === 'originAddress' && value.length > 2) {
      searchAddressSuggestions(value, 'origin');
    } else if (name === 'destinationAddress' && value.length > 2) {
      searchAddressSuggestions(value, 'destination');
    }
  };

  const handleLocationClick = (location) => {
    if (selectedMode === 'origin') {
      setFormData(prev => ({
        ...prev,
        originLat: location.lat,
        originLng: location.lng
      }));
      setMapCenter(location);
    } else if (selectedMode === 'destination') {
      setFormData(prev => ({
        ...prev,
        destinationLat: location.lat,
        destinationLng: location.lng
      }));
      setMapCenter(location);
    }
  };

  // Búsqueda de sugerencias de direcciones
  const searchAddressSuggestions = async (address, type) => {
    if (!address || address.length < 3) return;

    try {
      if (type === 'origin') {
        setSearchingOrigin(true);
      } else {
        setSearchingDestination(true);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=8&countrycodes=do`
      );
      const results = await response.json();

      if (type === 'origin') {
        setOriginSuggestions(results);
        setShowOriginSuggestions(true);
      } else {
        setDestinationSuggestions(results);
        setShowDestinationSuggestions(true);
      }
    } catch (err) {
      console.error('Error buscando sugerencias:', err);
    } finally {
      if (type === 'origin') {
        setSearchingOrigin(false);
      } else {
        setSearchingDestination(false);
      }
    }
  };

  // Seleccionar una sugerencia
  const selectAddressSuggestion = (suggestion, type) => {
    const { display_name, lat, lon } = suggestion;
    
    if (type === 'origin') {
      setFormData(prev => ({
        ...prev,
        originAddress: display_name,
        originLat: parseFloat(lat),
        originLng: parseFloat(lon)
      }));
      setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
    } else {
      setFormData(prev => ({
        ...prev,
        destinationAddress: display_name,
        destinationLat: parseFloat(lat),
        destinationLng: parseFloat(lon)
      }));
      setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
    }
  };

  const searchAddress = async (address, type) => {
    if (!address) return;

    try {
      // Usar nominatim de OpenStreetMap para geocodificación
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=do`
      );
      const results = await response.json();

      if (results.length > 0) {
        selectAddressSuggestion(results[0], type);
      } else {
        setError(`No se encontró la dirección: ${address}`);
      }
    } catch (err) {
      console.error('Error buscando dirección:', err);
      setError('Error al buscar la dirección');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar que todos los campos requeridos estén completos
    if (!formData.sender || !formData.recipient || !formData.recipientPhone) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!formData.originLat || !formData.destinationLat) {
      setError('Por favor selecciona origins y destino en el mapa');
      return;
    }

    // Mostrar modal de pago
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentInfo) => {
    setLoading(true);
    setError(null);

    try {
      const packageWithPayment = {
        ...formData,
        senderName: formData.sender, // Pasar el nombre del remitente para el admin
        ...paymentInfo
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageWithPayment)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Obtener el código generado por el backend
        const packageCode = data.packageCode || data.data?.packageCode;
        
        // Mostrar pantalla de éxito
        setSuccessData({
          packageCode: packageCode,
          amount: paymentInfo.transferAmount,
          transferDate: paymentInfo.transferDate
        });
        setShowSuccessMessage(true);
        
        if (onPackageCreated) onPackageCreated(data.data || data);
        
        // Reset form después de un tiempo
        setTimeout(() => {
          setFormData({
            code: '',
            sender: '',
            senderPhone: '',
            recipient: '',
            recipientPhone: '',
            weight: '',
            description: '',
            originAddress: '',
            originLat: null,
            originLng: null,
            destinationAddress: '',
            destinationLat: null,
            destinationLng: null
          });
          setSelectedMode(null);
          setShowPaymentModal(false);
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear el paquete');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-package-container">
      <h1>📦 Crear Nuevo Paquete</h1>

      <div className="create-package-content">
        {/* Formulario */}
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            {/* Información del Paquete */}
            <fieldset>
              <legend>Información del Paquete</legend>

              <div className="form-group">
                <label>Código del Paquete</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Se generará después de confirmar el pago"
                  disabled
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Peso (kg) <span className="optional">(Opcional)</span></label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="2.5"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Ej: Ropa, documentos, etc."
                  />
                </div>
              </div>
            </fieldset>

            {/* Información del Remitente */}
            <fieldset>
              <legend>Información del Remitente</legend>

              <div className="form-group">
                <label>Nombre del Remitente *</label>
                <input
                  type="text"
                  name="sender"
                  value={formData.sender}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono del Remitente</label>
                <input
                  type="tel"
                  name="senderPhone"
                  value={formData.senderPhone}
                  onChange={handleInputChange}
                  placeholder="+1-809-555-0123"
                />
              </div>
            </fieldset>

            {/* Información del Destinatario */}
            <fieldset>
              <legend>Información del Destinatario</legend>

              <div className="form-group">
                <label>Nombre del Destinatario *</label>
                <input
                  type="text"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  placeholder="María García"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono del Destinatario *</label>
                <input
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleInputChange}
                  placeholder="+1-809-555-0456"
                  required
                />
              </div>
            </fieldset>

            {/* Ubicación de Origen */}
            <fieldset>
              <legend>Ubicación de Origen (Punto de Partida)</legend>

              <div className="form-group">
                <label>Dirección de Origen *</label>
                <div className="address-input-wrapper">
                  <div className="address-input-group">
                    <input
                      type="text"
                      name="originAddress"
                      value={formData.originAddress}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (originSuggestions.length > 0) {
                          setShowOriginSuggestions(true);
                        }
                      }}
                      placeholder="Ej: Calle Principal 123, Santo Domingo"
                      required
                      autoComplete="off"
                    />
                    {searchingOrigin && <span className="searching">🔄 Buscando...</span>}
                    <button
                      type="button"
                      className={`btn-search ${selectedMode === 'origin' ? 'active' : ''}`}
                      onClick={() => {
                        if (formData.originAddress) {
                          searchAddress(formData.originAddress, 'origin');
                        } else {
                          setSelectedMode(selectedMode === 'origin' ? null : 'origin');
                        }
                      }}
                      title="Click en el mapa para seleccionar origen"
                    >
                      🔍 Buscar / Clickear en mapa
                    </button>
                  </div>
                  
                  {/* Dropdown de sugerencias */}
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {originSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => selectAddressSuggestion(suggestion, 'origin')}
                        >
                          <div className="suggestion-text">{suggestion.display_name}</div>
                          <div className="suggestion-coords">
                            📍 {parseFloat(suggestion.lat).toFixed(4)}, {parseFloat(suggestion.lon).toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formData.originLat && formData.originLng && (
                <div className="location-info">
                  ✓ Ubicación seleccionada: {formData.originLat.toFixed(4)}, {formData.originLng.toFixed(4)}
                </div>
              )}
            </fieldset>

            {/* Ubicación de Destino */}
            <fieldset>
              <legend>Ubicación de Destino (Punto Final)</legend>

              <div className="form-group">
                <label>Dirección de Destino *</label>
                <div className="address-input-wrapper">
                  <div className="address-input-group">
                    <input
                      type="text"
                      name="destinationAddress"
                      value={formData.destinationAddress}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (destinationSuggestions.length > 0) {
                          setShowDestinationSuggestions(true);
                        }
                      }}
                      placeholder="Ej: Villa Mella 456, Santo Domingo"
                      required
                      autoComplete="off"
                    />
                    {searchingDestination && <span className="searching">🔄 Buscando...</span>}
                    <button
                      type="button"
                      className={`btn-search ${selectedMode === 'destination' ? 'active' : ''}`}
                      onClick={() => {
                        if (formData.destinationAddress) {
                          searchAddress(formData.destinationAddress, 'destination');
                        } else {
                          setSelectedMode(selectedMode === 'destination' ? null : 'destination');
                        }
                      }}
                      title="Click en el mapa para seleccionar destino"
                    >
                      🔍 Buscar / Clickear en mapa
                    </button>
                  </div>

                  {/* Dropdown de sugerencias */}
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {destinationSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => selectAddressSuggestion(suggestion, 'destination')}
                        >
                          <div className="suggestion-text">{suggestion.display_name}</div>
                          <div className="suggestion-coords">
                            📍 {parseFloat(suggestion.lat).toFixed(4)}, {parseFloat(suggestion.lon).toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formData.destinationLat && formData.destinationLng && (
                <div className="location-info">
                  ✓ Ubicación seleccionada: {formData.destinationLat.toFixed(4)}, {formData.destinationLng.toFixed(4)}
                </div>
              )}
            </fieldset>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !formData.sender || !formData.recipient || !formData.recipientPhone || !formData.originLat || !formData.destinationLat}
            >
              {loading ? 'Creando paquete...' : '✓ Crear Paquete'}
            </button>
          </form>
        </div>

        {/* Mapa */}
        <div className="map-section">
          <h3>Selecciona Ubicaciones en el Mapa</h3>
          <div className="map-info">
            {selectedMode === 'origin' && <p>🟢 Modo: Seleccionar ORIGEN - Click en el mapa</p>}
            {selectedMode === 'destination' && <p>🔴 Modo: Seleccionar DESTINO - Click en el mapa</p>}
            {!selectedMode && <p>ℹ️ Presiona los botones de búsqueda para seleccionar ubicaciones</p>}
          </div>

          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            style={{ width: '100%', height: '500px', borderRadius: '8px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onLocationClick={handleLocationClick} selectedMode={selectedMode} />

            {/* Origen */}
            {formData.originLat && formData.originLng && (
              <Marker
                position={[formData.originLat, formData.originLng]}
                title="Punto de Origen"
                icon={new L.Icon({
                  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxMiIgZmlsbD0iIzEwYjk4MSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMjAiIHk9IjI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iMjAiPkk8L3RleHQ+PC9zdmc+',
                  iconSize: [40, 40],
                  iconAnchor: [20, 40],
                  popupAnchor: [0, -40]
                })}
              >
                <Popup>📍 Punto de Origen</Popup>
              </Marker>
            )}

            {/* Destino */}
            {formData.destinationLat && formData.destinationLng && (
              <Marker
                position={[formData.destinationLat, formData.destinationLng]}
                title="Punto de Destino"
                icon={new L.Icon({
                  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxMiIgZmlsbD0iI2VmMjcyNyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMjAiIHk9IjI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iMjAiPkY8L3RleHQ+PC9zdmc+',
                  iconSize: [40, 40],
                  iconAnchor: [20, 40],
                  popupAnchor: [0, -40]
                })}
              >
                <Popup>📍 Punto de Destino</Popup>
              </Marker>
            )}

            {/* Ruta */}
            {formData.originLat && formData.originLng && formData.destinationLat && formData.destinationLng && (
              <Polyline
                positions={[
                  [formData.originLat, formData.originLng],
                  [formData.destinationLat, formData.destinationLng]
                ]}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '5, 5'
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        packageCode={formData.code}
        estimatedCost={estimatedCost}
        onConfirm={handlePaymentConfirm}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Pantalla de Éxito */}
      {showSuccessMessage && (
        <PaymentSuccess
          packageCode={successData.packageCode}
          amount={successData.amount}
          transferDate={successData.transferDate}
          onClose={() => setShowSuccessMessage(false)}
        />
      )}
    </div>
  );
}

export default CreatePackageForm;
