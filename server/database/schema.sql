-- ============================================
-- FleetDocs - Schema Oficial Único
-- ============================================
-- Este é o ÚNICO ficheiro de schema da base de dados.
-- Execute este script para criar a base de dados completa.

CREATE DATABASE IF NOT EXISTS fleetdocs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleetdocs;

-- ============================================
-- 1. TABELA USERS (Utilizadores do Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_no VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  contact VARCHAR(100),
  role ENUM('driver', 'dispatcher', 'fleet_manager', 'admin') DEFAULT 'driver',
  fleet VARCHAR(100),
  status ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0,
  INDEX idx_staff_no (staff_no),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABELA DRIVERS (Motoristas - Separados dos Users)
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_no VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  alternative_contact VARCHAR(100),
  contact_malawi VARCHAR(100),
  contact_zambia VARCHAR(100),
  contact_zimbabwe VARCHAR(100),
  date_of_birth DATE,
  sex ENUM('M', 'F') DEFAULT NULL,
  driver_license_number VARCHAR(50),
  driver_license_expiry DATE,
  position VARCHAR(100),
  department VARCHAR(100),
  fleet VARCHAR(100),
  profile_photo VARCHAR(500),
  notes TEXT,
  status ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0,
  INDEX idx_staff_no (staff_no),
  INDEX idx_name (name),
  INDEX idx_department (department),
  INDEX idx_fleet (fleet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABELA VEHICLES (Veículos)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  fleet VARCHAR(100),
  color VARCHAR(50),
  assigned_driver_id INT NULL,
  status ENUM('active', 'maintenance', 'on_leave', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0,
  FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_license_plate (license_plate),
  INDEX idx_department (department),
  INDEX idx_fleet (fleet),
  INDEX idx_assigned_driver (assigned_driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABELA DOCUMENTS (Documentos dos Veículos)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_code VARCHAR(100) UNIQUE NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  file_type ENUM(
    'registration', 'operation_license', 'insurance', 'inspection', 'transport_cert', 
    'livrete_cabeca', 'livrete_trela', 'titulo_propriedade', 'caderneta', 
    'seguro', 'seguro_trela', 'inspecao', 'inspencao_trela',
    'livre_transito_cfm', 'mozambique_permit', 'radio_difusao', 'manifesto_municipal',
    'comesa', 'other'
  ) NOT NULL,
  vehicle_id INT NOT NULL,
  issue_date DATE,
  expiry_date DATE NULL,
  current_status ENUM('valid', 'expiring_30_days', 'expired', 'permanent') DEFAULT 'valid',
  storage_location VARCHAR(100),
  file_path VARCHAR(500),
  file_mime_type VARCHAR(100),
  file_size INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_file_code (file_code),
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_status (current_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABELA DRIVER_DOCUMENTS (Documentos dos Motoristas)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_code VARCHAR(100) UNIQUE NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  doc_type ENUM(
    'cnh', 'carta_conducao', 'exame_medico', 'cert_treinamento', 
    'cert_defesa_defensiva', 'cert_cargas_perigosas', 'seguro_pessoal', 'other'
  ) NOT NULL,
  driver_id INT NOT NULL,
  issue_date DATE,
  expiry_date DATE NULL,
  current_status ENUM('valid', 'expiring_30_days', 'expired', 'permanent') DEFAULT 'valid',
  storage_location VARCHAR(100),
  file_path VARCHAR(500),
  file_mime_type VARCHAR(100),
  file_size INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_doc_code (doc_code),
  INDEX idx_driver_id (driver_id),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_status (current_status),
  INDEX idx_doc_type (doc_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TABELA FLOW_RECORDS (Registos de Movimentação)
-- ============================================
CREATE TABLE IF NOT EXISTS flow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  driver_id INT NOT NULL,
  operation_type ENUM('withdrawal', 'return') NOT NULL,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_return_time TIMESTAMP NULL,
  actual_return_time TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_document_id (document_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TABELA SYNC_QUEUE (Fila de Sincronização Offline)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(100),
  operation_type VARCHAR(50) NOT NULL,
  operation_data JSON NOT NULL,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
  error_message TEXT,
  INDEX idx_device_id (device_id),
  INDEX idx_sync_status (sync_status),
  INDEX idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TABELA ALERTS (Alertas de Expiração)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NULL,
  driver_document_id INT NULL,
  alert_type ENUM('30_days', '15_days', '7_days', '3_days', 'expired') NOT NULL,
  alert_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_document_id) REFERENCES driver_documents(id) ON DELETE CASCADE,
  INDEX idx_document_id (document_id),
  INDEX idx_driver_document_id (driver_document_id),
  INDEX idx_alert_date (alert_date),
  INDEX idx_is_sent (is_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TABELA VEHICLE_CONDITION_CHECKS (Verificação de Condição)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_condition_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NULL,
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vidro_parabrisa ENUM('bom', 'mau') DEFAULT 'bom',
  espelho_esquerdo ENUM('bom', 'mau') DEFAULT 'bom',
  espelho_direito ENUM('bom', 'mau') DEFAULT 'bom',
  barachoque ENUM('bom', 'mau') DEFAULT 'bom',
  capom ENUM('bom', 'mau') DEFAULT 'bom',
  farois_cabeca ENUM('bom', 'mau') DEFAULT 'bom',
  farois_trela ENUM('bom', 'mau') DEFAULT 'bom',
  pintura ENUM('bom', 'mau') DEFAULT 'bom',
  pneus ENUM('bom', 'mau') DEFAULT 'bom',
  quarda_lamas ENUM('bom', 'mau') DEFAULT 'bom',
  subsalente ENUM('bom', 'mau') DEFAULT 'bom',
  notes TEXT,
  created_by INT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_check_date (check_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TABELA POST_TRIP_INSPECTIONS (Verificação de Documentos Pós-Viagem)
-- ============================================
CREATE TABLE IF NOT EXISTS post_trip_inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  inspector_id INT NOT NULL,
  trip_type ENUM('internal', 'long_trip') NOT NULL,
  trip_destination VARCHAR(255) NOT NULL,
  inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Documentos da Cabeça (Horse)
  horse_livrete BOOLEAN DEFAULT FALSE,
  horse_caderneta BOOLEAN DEFAULT FALSE,
  horse_seguro BOOLEAN DEFAULT FALSE,
  horse_inspecao BOOLEAN DEFAULT FALSE,
  horse_cfm BOOLEAN DEFAULT FALSE,
  horse_moz_permit BOOLEAN DEFAULT FALSE,
  horse_radio_difusao BOOLEAN DEFAULT FALSE,
  horse_manifesto BOOLEAN DEFAULT FALSE,
  horse_passaport BOOLEAN DEFAULT FALSE,
  horse_carta_conducao BOOLEAN DEFAULT FALSE,
  horse_comesa BOOLEAN DEFAULT FALSE,
  -- Documentos da Treila (Trailer)
  trailer_livrete BOOLEAN DEFAULT FALSE,
  trailer_caderneta BOOLEAN DEFAULT FALSE,
  trailer_seguro BOOLEAN DEFAULT FALSE,
  trailer_inspecao BOOLEAN DEFAULT FALSE,
  trailer_cfm BOOLEAN DEFAULT FALSE,
  trailer_moz_permit BOOLEAN DEFAULT FALSE,
  trailer_radio_difusao BOOLEAN DEFAULT FALSE,
  trailer_manifesto BOOLEAN DEFAULT FALSE,
  trailer_comesa BOOLEAN DEFAULT FALSE,
  -- Status geral
  documents_complete BOOLEAN DEFAULT TRUE,
  missing_documents TEXT,
  observations TEXT,
  status ENUM('verified', 'pending', 'incomplete') DEFAULT 'verified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_trip_type (trip_type),
  INDEX idx_inspection_date (inspection_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. INSERIR ADMIN PADRÃO
-- ============================================
-- AVISO: Senha em texto simples - apenas para desenvolvimento!
INSERT INTO users (staff_no, name, email, password, department, role, status) 
VALUES ('ADMIN001', 'Administrator', 'admin@fleetdocs.com', 'admin123', 'Administration', 'admin', 'active')
ON DUPLICATE KEY UPDATE staff_no=staff_no;

-- ============================================
-- ALTERAÇÕES PARA BASES EXISTENTES
-- ============================================
-- Execute estas queries para atualizar uma base de dados existente:

-- Adicionar campos de contacto extras aos motoristas
-- ALTER TABLE drivers ADD COLUMN IF NOT EXISTS contact_malawi VARCHAR(100) AFTER alternative_contact;
-- ALTER TABLE drivers ADD COLUMN IF NOT EXISTS contact_zambia VARCHAR(100) AFTER contact_malawi;
-- ALTER TABLE drivers ADD COLUMN IF NOT EXISTS contact_zimbabwe VARCHAR(100) AFTER contact_zambia;

-- Adicionar campos de checklist de documentos às inspeções pós-viagem
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_livrete BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_caderneta BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_seguro BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_inspecao BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_cfm BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_moz_permit BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_radio_difusao BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_manifesto BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_passaport BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_carta_conducao BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN horse_comesa BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_livrete BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_caderneta BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_seguro BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_inspecao BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_cfm BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_moz_permit BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_radio_difusao BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_manifesto BOOLEAN DEFAULT FALSE;
-- ALTER TABLE post_trip_inspections ADD COLUMN trailer_comesa BOOLEAN DEFAULT FALSE;

-- Adicionar foto de perfil aos motoristas
-- ALTER TABLE drivers ADD COLUMN profile_photo VARCHAR(500) AFTER fleet;

-- Adicionar cor aos veículos
-- ALTER TABLE vehicles ADD COLUMN color VARCHAR(50) AFTER fleet;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
SELECT 'Schema FleetDocs criado com sucesso!' AS status;
