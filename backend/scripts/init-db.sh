#!/bin/bash

# Script para inicializar base de datos PostgreSQL

echo "🗄️ Creando base de datos..."

# Crear base de datos
createdb tracking_db

# Conectar y crear tablas
psql tracking_db << EOF

-- Tabla de Repartidores
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  vehicle VARCHAR(255) NOT NULL,
  plate VARCHAR(20) UNIQUE,
  status ENUM ('active', 'inactive', 'on-break') DEFAULT 'active',
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP,
  active_packages INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Paquetes
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  sender VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(20),
  recipient VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status ENUM ('pending', 'in-transit', 'out-for-delivery', 'delivered', 'failed') DEFAULT 'pending',
  weight DECIMAL(8, 2),
  description TEXT,
  delivery_preference VARCHAR(255),
  driver_id UUID REFERENCES drivers(id),
  rating INT,
  feedback TEXT,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Historial de Rastreo
CREATE TABLE tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  status ENUM ('pending', 'in-transit', 'out-for-delivery', 'delivered', 'failed') NOT NULL,
  description TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_packages_code ON packages(code);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_driver ON packages(driver_id);
CREATE INDEX idx_tracking_package ON tracking_history(package_id);
CREATE INDEX idx_drivers_status ON drivers(status);

-- Insertar datos de ejemplo
INSERT INTO drivers (name, phone, vehicle, plate, status, rating, total_deliveries) VALUES
  ('Carlos López', '+1-809-555-0101', 'Motorcycle', 'PL-001', 'active', 4.8, 150),
  ('Ana Rodríguez', '+1-809-555-0102', 'Car', 'PL-002', 'active', 4.9, 200),
  ('Juan Martín', '+1-809-555-0103', 'Van', 'PL-003', 'active', 4.7, 120);

INSERT INTO packages (code, sender, recipient, recipient_phone, address, status) VALUES
  ('PKG-001', 'Tienda ABC', 'María García', '+1-809-555-1001', 'Calle Principal 123, Santo Domingo', 'in-transit'),
  ('PKG-002', 'Juan Pérez', 'Roberto Martín', '+1-809-555-1002', 'Av. Paseo de los Indios 456', 'delivered'),
  ('PKG-003', 'E-commerce XYZ', 'Ana López', '+1-809-555-1003', 'Zona Colonial, Santo Domingo', 'pending');

EOF

echo "✅ Base de datos creada exitosamente!"
