import React, { useState, useRef } from 'react';
import '../styles/RouteCalculator.css';

function RouteCalculator({ onRouteCalculated, onLocationSelected }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: ''
  });

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para sugerencias
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  // Ubicaciones seleccionadas con coordenadas
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  
  // Para debounce
  const originTimeoutRef = useRef(null);
  const destinationTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Buscar sugerencias con debounce
    if (name === 'origin') {
      setShowOriginSuggestions(true);
      
      // Limpiar timeout anterior
      if (originTimeoutRef.current) {
        clearTimeout(originTimeoutRef.current);
      }

      if (value.trim().length > 2) {
        originTimeoutRef.current = setTimeout(() => {
          searchSuggestions(value, 'origin');
        }, 500);
      } else {
        setOriginSuggestions([]);
      }
    } else if (name === 'destination') {
      setShowDestinationSuggestions(true);
      
      // Limpiar timeout anterior
      if (destinationTimeoutRef.current) {
        clearTimeout(destinationTimeoutRef.current);
      }

      if (value.trim().length > 2) {
        destinationTimeoutRef.current = setTimeout(() => {
          searchSuggestions(value, 'destination');
        }, 500);
      } else {
        setDestinationSuggestions([]);
      }
    }
  };

  const searchSuggestions = async (query, type) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=do`
      );
      const results = await response.json();

      const suggestions = results.map(result => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
        address: result.address || {}
      }));

      if (type === 'origin') {
        setOriginSuggestions(suggestions);
      } else {
        setDestinationSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Error searching suggestions:', err);
    }
  };

  const selectSuggestion = (suggestion, type) => {
    if (type === 'origin') {
      setFormData(prev => ({
        ...prev,
        origin: suggestion.name
      }));
      setSelectedOrigin(suggestion);
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
      
      // Notificar al mapa
      if (onLocationSelected) {
        onLocationSelected({
          type: 'origin',
          lat: suggestion.lat,
          lng: suggestion.lng,
          name: suggestion.name
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        destination: suggestion.name
      }));
      setSelectedDestination(suggestion);
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
      
      // Notificar al mapa
      if (onLocationSelected) {
        onLocationSelected({
          type: 'destination',
          lat: suggestion.lat,
          lng: suggestion.lng,
          name: suggestion.name
        });
      }
    }
  };



  const calculateRoute = async (e) => {
    e.preventDefault();
    
    // Usar ubicaciones seleccionadas de las sugerencias
    if (!selectedOrigin || !selectedDestination) {
      setError('Selecciona una dirección de partida y una final de las sugerencias');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar OSRM para calcular la ruta
      const osmRoute = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${selectedOrigin.lng},${selectedOrigin.lat};${selectedDestination.lng},${selectedDestination.lat}?overview=full&steps=true&geometries=geojson`
      );
      const osmData = await osmRoute.json();

      if (osmData.code !== 'Ok' || !osmData.routes.length) {
        setError('No se pudo calcular la ruta entre estos puntos');
        setLoading(false);
        return;
      }

      const route = osmData.routes[0];
      
      // Convertir distancia de metros a km y redondear
      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationMinutes = Math.round(route.duration / 60);
      const durationHours = Math.floor(durationMinutes / 60);
      const remainingMinutes = durationMinutes % 60;

      // Extraer coordenadas de la geometría
      const routeCoordinates = route.geometry.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));

      const calculatePrice = (km) => {
        const d = parseFloat(km);
        if (d <= 4) return 200;
        if (d <= 7) return 250;
        if (d <= 9) return 300;
        if (d <= 11) return 350;
        if (d <= 15) return 400;
        if (d <= 18) return 450;
        if (d <= 23) return 500;
        if (d <= 26) return 600;
        if (d <= 30) return 750;
        if (d <= 33) return 850;
        if (d <= 36) return 990;
        if (d <= 40) return 1200;
        // Más de 40 km: 1200 + 30 por km extra (ajustable)
        return Math.round(1200 + (d - 40) * 30);
      };

      const price = calculatePrice(distanceKm);

      const routeResult = {
        origin: {
          lat: selectedOrigin.lat,
          lng: selectedOrigin.lng,
          name: selectedOrigin.name
        },
        destination: {
          lat: selectedDestination.lat,
          lng: selectedDestination.lng,
          name: selectedDestination.name
        },
        distance: distanceKm,
        price,
        duration: {
          total: durationMinutes,
          hours: durationHours,
          minutes: remainingMinutes
        },
        coordinates: routeCoordinates
      };

      setRouteInfo(routeResult);
      
      if (onRouteCalculated) {
        onRouteCalculated(routeResult);
      }

    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Error al calcular la ruta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setFormData({ origin: '', destination: '' });
    setRouteInfo(null);
    setError(null);
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
    
    if (onRouteCalculated) {
      onRouteCalculated(null);
    }
    
    if (onLocationSelected) {
      onLocationSelected(null);
    }
  };

  return (
    <div className="route-calculator">
      <div className="route-header">
        <h2>🗺️ Calcula tu Ruta</h2>
        <p>Ingresa una dirección de partida y una final para ver la distancia y tiempo estimado</p>
      </div>

      <form onSubmit={calculateRoute} className="route-form">
        <div className="form-inputs">
          <div className="input-group">
            <label htmlFor="origin">
              <span className="icon">📍</span>
              Dirección de Partida
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                onFocus={() => setShowOriginSuggestions(true)}
                placeholder="Ej: Calle Principal 123, Santo Domingo"
                disabled={loading}
                autoComplete="off"
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {originSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`suggestion-item ${
                        selectedOrigin?.name === suggestion.name ? 'selected' : ''
                      }`}
                      onClick={() => selectSuggestion(suggestion, 'origin')}
                    >
                      <div className="suggestion-icon">📍</div>
                      <div className="suggestion-content">
                        <div className="suggestion-name">{suggestion.name.split(',')[0]}</div>
                        <div className="suggestion-address">
                          {suggestion.name.split(',').slice(1, 3).join(',')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="destination">
              <span className="icon">🎯</span>
              Dirección Final
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                onFocus={() => setShowDestinationSuggestions(true)}
                placeholder="Ej: Villa Mella 456, Santo Domingo"
                disabled={loading}
                autoComplete="off"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {destinationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`suggestion-item ${
                        selectedDestination?.name === suggestion.name ? 'selected' : ''
                      }`}
                      onClick={() => selectSuggestion(suggestion, 'destination')}
                    >
                      <div className="suggestion-icon">🎯</div>
                      <div className="suggestion-content">
                        <div className="suggestion-name">{suggestion.name.split(',')[0]}</div>
                        <div className="suggestion-address">
                          {suggestion.name.split(',').slice(1, 3).join(',')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" className="btn-search" disabled={loading}>
            {loading ? '⏳ Calculando...' : '🔍 Calcular Ruta'}
          </button>
          {routeInfo && (
            <button type="button" className="btn-clear" onClick={clearRoute}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </form>

      {routeInfo && (
        <div className="route-info">
          <div className="info-item">
            <span className="label">Distancia:</span>
            <span className="value">{routeInfo.distance} km</span>
          </div>
          <div className="info-item">
            <span className="label">Tiempo estimado:</span>
            <span className="value">
              {routeInfo.duration.hours > 0
                ? `${routeInfo.duration.hours}h ${routeInfo.duration.minutes}m`
                : `${routeInfo.duration.minutes}m`}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Precio estimado:</span>
            <span className="value">DOP {routeInfo.price}</span>
          </div>
          <div className="info-item">
            <span className="label">Velocidad promedio:</span>
            <span className="value">
              {(routeInfo.distance / (routeInfo.duration.total / 60)).toFixed(1)} km/h
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteCalculator;
