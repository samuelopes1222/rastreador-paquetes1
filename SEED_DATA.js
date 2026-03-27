// Datos de prueba para desarrollo
// Guardar en backend/data/seedData.js

// Datos de prueba para desarrollo
// Guardar en backend/data/seedData.js

const mockDrivers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Carlos López García',
    cedula: '00112345678',
    phone: '+1-809-555-0101',
    email: 'carlos.lopez@delivery.do',
    password: '123456',
    vehicle: 'Motocicleta',
    plate: 'PL-001-AA',
    status: 'active',
    currentLat: 18.4861,
    currentLng: -69.9312,
    activePackages: 3,
    rating: 4.8,
    totalDeliveries: 150
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Ana Rodríguez Martinez',
    cedula: '00212345678',
    phone: '+1-809-555-0102',
    email: 'ana.rodriguez@delivery.do',
    password: '123456',
    vehicle: 'Auto',
    plate: 'PL-002-BB',
    status: 'active',
    currentLat: 18.4900,
    currentLng: -69.9350,
    activePackages: 5,
    rating: 4.9,
    totalDeliveries: 200
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Juan Martín Pérez',
    cedula: '00312345678',
    phone: '+1-809-555-0103',
    email: 'juan.martin@delivery.do',
    password: '123456',
    vehicle: 'Van',
    plate: 'PL-003-CC',
    status: 'active',
    currentLat: 18.4750,
    currentLng: -69.9400,
    activePackages: 4,
    rating: 4.7,
    totalDeliveries: 120
  }
];

const mockPackages = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    code: 'PKG-20260313-001',
    sender: 'Juan Pérez García',
    senderPhone: '+1-809-555-1001',
    recipient: 'María García López',
    recipientPhone: '+1-809-555-2001',
    address: 'Calle Principal 123, Apto 4A, Santo Domingo, Distrito Nacional',
    status: 'in-transit',
    description: 'Caja con documentos y libros',
    weight: 2.5,
    lat: 18.4861,
    lng: -69.9312,
    driverId: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    code: 'PKG-20260313-002',
    sender: 'Tienda ABC SRL',
    senderPhone: '+1-809-555-1002',
    recipient: 'Roberto Martín Núñez',
    recipientPhone: '+1-809-555-2002',
    address: 'Av. Paseo de los Indios 456, Suite 201, Santo Domingo',
    status: 'delivered',
    description: 'Paquete de ropa y accesorios',
    weight: 3.2,
    lat: 18.4900,
    lng: -69.9350,
    driverId: '550e8400-e29b-41d4-a716-446655440002',
    deliveredAt: new Date(Date.now() - 7200000),
    rating: 5,
    feedback: 'Excelente servicio, rápido y seguro',
    createdAt: new Date(Date.now() - 7200000)
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    code: 'PKG-20260313-003',
    sender: 'E-commerce XYZ',
    senderPhone: '+1-809-555-1003',
    recipient: 'Ana López Flores',
    recipientPhone: '+1-809-555-2003',
    address: 'Zona Colonial, Calle Isabela La Católica 101, Santo Domingo',
    status: 'out-for-delivery',
    description: 'Electrodoméstico - Microondas',
    weight: 5.8,
    lat: 18.4750,
    lng: -69.9400,
    driverId: '550e8400-e29b-41d4-a716-446655440003',
    createdAt: new Date(Date.now() - 1800000)
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    code: 'PKG-20260313-004',
    sender: 'Amazon Marketplace',
    senderPhone: '+1-809-555-1004',
    recipient: 'Carlos Acosta Reyes',
    recipientPhone: '+1-809-555-2004',
    address: 'Los Mina, Ave. Hermanos Defilló 789, Santo Domingo',
    status: 'pending',
    description: 'Libros, electrónicos y cables',
    weight: 1.5,
    driverId: null,
    createdAt: new Date()
  }
];

const mockTrackingHistory = [
  {
    packageId: '650e8400-e29b-41d4-a716-446655440001',
    status: 'pending',
    description: 'Paquete registrado en sistema',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    packageId: '650e8400-e29b-41d4-a716-446655440001',
    status: 'in-transit',
    description: 'Paquete en centro de distribución',
    lat: 18.4850,
    lng: -69.9300,
    timestamp: new Date(Date.now() - 1800000)
  },
  {
    packageId: '650e8400-e29b-41d4-a716-446655440001',
    status: 'in-transit',
    description: 'Saliendo del centro de distribución',
    lat: 18.4861,
    lng: -69.9312,
    timestamp: new Date(Date.now() - 600000)
  }
];

module.exports = {
  mockDrivers,
  mockPackages,
  mockTrackingHistory
};
