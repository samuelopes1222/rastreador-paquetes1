const axios = require('axios');
require('dotenv').config();

/**
 * Calcular distancia entre dos coordenadas (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Obtener dirección desde coordenadas (Reverse Geocoding)
 */
async function getAddressFromCoords(lat, lng) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    return 'Ubicación desconocida';
  } catch (error) {
    console.error('❌ Error en geocoding reverso:', error);
    return 'Error al obtener dirección';
  }
}

/**
 * Obtener coordenadas desde dirección (Geocoding)
 */
async function getCoordsFromAddress(address) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    throw new Error('Dirección no encontrada');
  } catch (error) {
    console.error('❌ Error en geocoding:', error);
    throw error;
  }
}

/**
 * Calcular ruta optimal entre puntos
 */
async function getOptimalRoute(origin, destination, waypoints = []) {
  try {
    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: process.env.GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      optimization: 'best'
    };

    if (waypoints.length > 0) {
      params.waypoints = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json`,
      { params }
    );

    if (response.data.routes.length > 0) {
      return response.data.routes[0];
    }
    throw new Error('Ruta no encontrada');
  } catch (error) {
    console.error('❌ Error calculando ruta:', error);
    throw error;
  }
}

module.exports = {
  calculateDistance,
  getAddressFromCoords,
  getCoordsFromAddress,
  getOptimalRoute
};
