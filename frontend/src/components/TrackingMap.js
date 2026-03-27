import React, { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultViewState = {
  center: [18.4861, -69.9312],
  zoom: 14
};

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = L.divIcon({
  className: 'start-marker',
  html: '<div style="background: #22c55e; width: 28px; height: 28px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.25);"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const endIcon = L.divIcon({
  className: 'end-marker',
  html: '<div style="font-size: 32px; line-height: 32px; transform: translateY(-4px);">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: '<div style="background: #ef4444; width: 32px; height: 32px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; font-size: 16px; animation: pulse 2s infinite;">🚗</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

function SetViewOnChange({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function TrackingMap({
  packageLocation,
  destinationLocation,
  driverLocation,
  activeDrivers = [],
  originLocation,
  calculatedRoute = null,
  selectedLocation,
  packages = [],
  route = null,
  adminLocation = null,
  userLocation = null
}) {
  const [viewState, setViewState] = useState(defaultViewState);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    // Prioridad: 1. Ubicación del usuario, 2. Admin, 3. Paquete, 4. Origen, 5. Primer repartidor activo
    if (userLocation && userLocation.lat && userLocation.lng) {
      setViewState({ center: [parseFloat(userLocation.lat), parseFloat(userLocation.lng)], zoom: 14 });
      return;
    }

    if (adminLocation && adminLocation.lat && adminLocation.lng) {
      setViewState({ center: [parseFloat(adminLocation.lat), parseFloat(adminLocation.lng)], zoom: 14 });
      return;
    }

    if (packageLocation && packageLocation.lat && packageLocation.lng) {
      setViewState({ center: [parseFloat(packageLocation.lat), parseFloat(packageLocation.lng)], zoom: 14 });
      return;
    }

    if (originLocation && originLocation.lat && originLocation.lng) {
      setViewState({ center: [parseFloat(originLocation.lat), parseFloat(originLocation.lng)], zoom: 14 });
      return;
    }

    if (activeDrivers.length > 0) {
      const first = activeDrivers[0];
      if (first.currentLat && first.currentLng) {
        setViewState({ center: [parseFloat(first.currentLat), parseFloat(first.currentLng)], zoom: 14 });
      }
    }
  }, [userLocation, packageLocation, originLocation, activeDrivers, adminLocation]);

  const packagePolylines = [];
  packagePolylines.push(...packages
    .filter((pkg) => pkg.originLat && pkg.originLng && pkg.destinationLat && pkg.destinationLng)
    .map((pkg) => ([
      [parseFloat(pkg.originLat), parseFloat(pkg.originLng)],
      [parseFloat(pkg.destinationLat), parseFloat(pkg.destinationLng)]
    ])));

  const routeLine = [];
  if (route?.legs?.length > 0) {
    route.legs.forEach((leg) => {
      leg.steps.forEach((step) => {
        routeLine.push([step.start_location.lat, step.start_location.lng]);
      });
      if (leg.end_location) {
        routeLine.push([leg.end_location.lat, leg.end_location.lng]);
      }
    });
  }

  // Ruta calculada por el usuario (desde RouteCalculator)
  const userRouteCoordinates = (calculatedRoute?.coordinates || [])
    .map((coord) => [coord.lat, coord.lng]);

  if (!userRouteCoordinates.length && calculatedRoute?.origin && calculatedRoute?.destination) {
    userRouteCoordinates.push(
      [parseFloat(calculatedRoute.origin.lat), parseFloat(calculatedRoute.origin.lng)],
      [parseFloat(calculatedRoute.destination.lat), parseFloat(calculatedRoute.destination.lng)]
    );
  }

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '8px', marginBottom: '20px', position: 'relative' }}>
      {selectedMarker && (
        <div className='selected-marker-info' style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4 }}>
          Marcador seleccionado: {selectedMarker}
        </div>
      )}
      <MapContainer center={viewState.center} zoom={viewState.zoom} style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
        <SetViewOnChange center={viewState.center} zoom={viewState.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {adminLocation && adminLocation.lat && adminLocation.lng && (
          <Marker position={[parseFloat(adminLocation.lat), parseFloat(adminLocation.lng)]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedMarker('admin') }}>
            <Popup>Tu Ubicaci�n (Admin)</Popup>
          </Marker>
        )}

        {/* Círculo azul de ubicación del usuario */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Circle
            key='user-location'
            center={[parseFloat(userLocation.lat), parseFloat(userLocation.lng)]}
            radius={100}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4, weight: 3 }}
            eventHandlers={{
              click: () => setSelectedMarker('user'),
            }}
          >
            <Popup>📍 Tu ubicación actual</Popup>
          </Circle>
        )}

        {packages.map((pkg) => (
          <React.Fragment key={`markers-${pkg.id}`}>
            {pkg.originLat && pkg.originLng && (
              <Marker position={[parseFloat(pkg.originLat), parseFloat(pkg.originLng)]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedMarker(`origin-${pkg.id}`) }}>
                <Popup><strong>Origen</strong><br />{pkg.originAddress || 'Punto de partida'}</Popup>
              </Marker>
            )}
            {pkg.destinationLat && pkg.destinationLng && (
              <Marker position={[parseFloat(pkg.destinationLat), parseFloat(pkg.destinationLng)]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedMarker(`destination-${pkg.id}`) }}>
                <Popup><strong>Destino</strong><br />{pkg.destinationAddress || 'Punto de entrega'}</Popup>
              </Marker>
            )}
          </React.Fragment>
        ))}

        {activeDrivers.map((drv) => drv.currentLat && drv.currentLng && (
          <Circle
            key={`driver-${drv.id}`}
            center={[parseFloat(drv.currentLat), parseFloat(drv.currentLng)]}
            radius={80}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3, weight: 2 }}
            eventHandlers={{
              click: () => setSelectedMarker(`driver-${drv.id}`),
            }}
          >
            <Popup>
              <strong>{drv.name || 'Repartidor'}</strong><br />Vehículo: {drv.vehicle || 'N/A'}<br />Estado: {drv.status || 'activo'}
            </Popup>
          </Circle>
        ))}

        {/* Marcador especial del repartidor en movimiento (para rastreo del cliente) */}
        {driverLocation && driverLocation.lat && driverLocation.lng && (
          <Marker 
            position={[parseFloat(driverLocation.lat), parseFloat(driverLocation.lng)]} 
            icon={driverIcon}
            eventHandlers={{ click: () => setSelectedMarker('active-driver') }}
          >
            <Popup>
              <strong>🚗 Repartidor en movimiento</strong><br />
              {driverLocation.name && <div>Nombre: {driverLocation.name}</div>}
              {driverLocation.vehicle && <div>Vehículo: {driverLocation.vehicle}</div>}
              {driverLocation.plate && <div>Placa: {driverLocation.plate}</div>}
              {driverLocation.timestamp && <div><small>Último: {new Date(driverLocation.timestamp).toLocaleTimeString('es-DO')}</small></div>}
            </Popup>
          </Marker>
        )}

        {packagePolylines.map((line, idx) => (
          <Polyline
            key={`pkg-line-${idx}`}
            positions={line}
            pathOptions={{ color: '#3b82f6', weight: 4 }}
          />
        ))}

        {/* Ruta desde el repartidor hacia el paquete/destino */}
        {driverLocation && driverLocation.lat && driverLocation.lng && packageLocation && packageLocation.lat && packageLocation.lng && (
          <Polyline
            positions={[
              [parseFloat(driverLocation.lat), parseFloat(driverLocation.lng)],
              [parseFloat(packageLocation.lat), parseFloat(packageLocation.lng)]
            ]}
            pathOptions={{ color: '#ef4444', weight: 3, dashArray: '5, 5' }}
          />
        )}

        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#8b5cf6', weight: 3, dashArray: '8, 8' }}
          />
        )}

        {userRouteCoordinates.length > 1 && (
          <>
            <Polyline
              positions={userRouteCoordinates}
              pathOptions={{ color: '#ff4500', weight: 4, dashArray: '6, 4' }}
            />
            <Marker position={userRouteCoordinates[0]} icon={startIcon}>
              <Popup>Inicio de ruta</Popup>
            </Marker>
            <Marker position={userRouteCoordinates[userRouteCoordinates.length - 1]} icon={endIcon}>
              <Popup>Destino</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default TrackingMap;
