import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import './TrackingMap.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  marginBottom: '20px'
};

const defaultCenter = {
  lat: 18.4861,
  lng: -69.9312 // Santo Domingo, República Dominicana
};

/**
 * Componente de Mapa con Google Maps
 * Muestra ubicación del paquete y ruta usando Google Maps
 */
function TrackingMapGoogle({
  packageLocation,
  destinationLocation,
  driverLocation,
  activeDrivers = [],
  originLocation,
  calculatedRoute,
  selectedLocation,
  packages = [],
  route = null,
  adminLocation = null
}) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  // Actualizar centro del mapa según prioridades
  useEffect(() => {
    if (adminLocation && adminLocation.lat && adminLocation.lng) {
      setMapCenter({
        lat: parseFloat(adminLocation.lat),
        lng: parseFloat(adminLocation.lng)
      });
      return;
    }

    if (packageLocation) {
      setMapCenter({
        lat: parseFloat(packageLocation.lat),
        lng: parseFloat(packageLocation.lng)
      });
      return;
    }

    if (originLocation) {
      setMapCenter({
        lat: parseFloat(originLocation.lat),
        lng: parseFloat(originLocation.lng)
      });
      return;
    }

    if (activeDrivers.length > 0) {
      const first = activeDrivers[0];
      if (first.currentLat && first.currentLng) {
        setMapCenter({
          lat: parseFloat(first.currentLat),
          lng: parseFloat(first.currentLng)
        });
      }
    }
  }, [packageLocation, originLocation, activeDrivers, adminLocation]);

  // Construir polyline de la ruta calculada
  const routePathCoordinates = route?.legs?.[0]?.steps?.map((step) => ({
    lat: step.start_location.lat,
    lng: step.start_location.lng
  })) || [];

  if (route?.legs?.length > 0) {
    const lastLeg = route.legs[route.legs.length - 1];
    routePathCoordinates.push({
      lat: lastLeg.end_location.lat,
      lng: lastLeg.end_location.lng
    });
  }

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={14}
        ref={mapRef}
        options={{
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {/* Marcador del Administrador */}
        {adminLocation && adminLocation.lat && adminLocation.lng && (
          <Marker
            position={{ lat: parseFloat(adminLocation.lat), lng: parseFloat(adminLocation.lng) }}
            title="📍 Tu Ubicación (Admin)"
            onClick={() => setSelectedMarker('admin')}
            icon={{
              path: 'M0 0L10 0L10 10L0 10Z',
              fillColor: '#6668cc',
              fillOpacity: 1,
              scale: 3,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }}
          >
            {selectedMarker === 'admin' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div style={{ color: '#000' }}>
                  <strong>Tu Ubicación (Admin)</strong>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Mostrar ruta entre origen y destino para paquetes */}
        {packages.map((pkg) => {
          if (
            pkg.originLat &&
            pkg.originLng &&
            pkg.destinationLat &&
            pkg.destinationLng &&
            !isNaN(parseFloat(pkg.originLat)) &&
            !isNaN(parseFloat(pkg.originLng)) &&
            !isNaN(parseFloat(pkg.destinationLat)) &&
            !isNaN(parseFloat(pkg.destinationLng))
          ) {
            return (
              <Polyline
                key={`route-${pkg.id}`}
                path={[
                  { lat: parseFloat(pkg.originLat), lng: parseFloat(pkg.originLng) },
                  { lat: parseFloat(pkg.destinationLat), lng: parseFloat(pkg.destinationLng) }
                ]}
                options={{
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  geodesic: true
                }}
              />
            );
          }
          return null;
        })}

        {/* Marcadores de origen de paquetes */}
        {packages.map((pkg) => {
          if (
            pkg.originLat &&
            pkg.originLng &&
            !isNaN(parseFloat(pkg.originLat)) &&
            !isNaN(parseFloat(pkg.originLng))
          ) {
            return (
              <Marker
                key={`origin-${pkg.id}`}
                position={{ lat: parseFloat(pkg.originLat), lng: parseFloat(pkg.originLng) }}
                title={`Origen: ${pkg.originAddress || 'Punto de partida'}`}
                onClick={() => setSelectedMarker(`origin-${pkg.id}`)}
                icon={{
                  path: 'M0 0L10 0L10 10L0 10Z',
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  scale: 3,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }}
              >
                {selectedMarker === `origin-${pkg.id}` && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div style={{ color: '#000' }}>
                      <strong>Origen</strong>
                      <p>{pkg.originAddress || 'Punto de partida'}</p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          }
          return null;
        })}

        {/* Marcadores de destino de paquetes */}
        {packages.map((pkg) => {
          if (
            pkg.destinationLat &&
            pkg.destinationLng &&
            !isNaN(parseFloat(pkg.destinationLat)) &&
            !isNaN(parseFloat(pkg.destinationLng))
          ) {
            return (
              <Marker
                key={`destination-${pkg.id}`}
                position={{
                  lat: parseFloat(pkg.destinationLat),
                  lng: parseFloat(pkg.destinationLng)
                }}
                title={`Destino: ${pkg.destinationAddress || 'Punto de entrega'}`}
                onClick={() => setSelectedMarker(`destination-${pkg.id}`)}
                icon={{
                  path: 'M0 0L10 0L10 10L0 10Z',
                  fillColor: '#ef2727',
                  fillOpacity: 1,
                  scale: 3,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }}
              >
                {selectedMarker === `destination-${pkg.id}` && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div style={{ color: '#000' }}>
                      <strong>Destino</strong>
                      <p>{pkg.destinationAddress || 'Punto de entrega'}</p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          }
          return null;
        })}

        {/* Marcadores de repartidores activos */}
        {activeDrivers.map((drv) => {
          if (
            drv.currentLat &&
            drv.currentLng &&
            !isNaN(parseFloat(drv.currentLat)) &&
            !isNaN(parseFloat(drv.currentLng))
          ) {
            return (
              <Marker
                key={`driver-${drv.id}`}
                position={{
                  lat: parseFloat(drv.currentLat),
                  lng: parseFloat(drv.currentLng)
                }}
                title={drv.name || 'Repartidor'}
                onClick={() => setSelectedMarker(`driver-${drv.id}`)}
                icon={{
                  path: 'M12 0C9.24 0 7 2.24 7 5c0 2.85 2.92 7.21 5 9.88c2.11-2.69 5-7.05 5-9.88c0-2.76-2.24-5-5-5zm0 7.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  scale: 2,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }}
              >
                {selectedMarker === `driver-${drv.id}` && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div style={{ color: '#000' }}>
                      <strong>{drv.name || 'Repartidor'}</strong>
                      <p>Vehículo: {drv.vehicle || 'N/A'}</p>
                      <p>Estado: {drv.status || 'activo'}</p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          }
          return null;
        })}

        {/* Ruta calculada (polyline) */}
        {routePathCoordinates.length > 1 && (
          <Polyline
            path={routePathCoordinates}
            options={{
              strokeColor: '#8b5cf6',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              geodesic: true
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default TrackingMapGoogle;
