import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Comprehensive report - vehicles with drivers and all documents
router.get('/comprehensive', authenticate, async (req, res) => {
  try {
    // Get all vehicles with assigned drivers
    const [vehicles] = await db.execute(`
      SELECT v.*, d.name as driver_name, d.staff_no as driver_staff_no, d.contact as driver_contact
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      ORDER BY v.license_plate
    `);

    // Get all drivers with their assigned vehicles
    const [drivers] = await db.execute(`
      SELECT d.*, v.license_plate as assigned_vehicle, v.model as vehicle_model
      FROM drivers d
      LEFT JOIN vehicles v ON v.assigned_driver_id = d.id
      ORDER BY d.name
    `);

    // Get vehicle condition checks
    const [conditionChecks] = await db.execute(`
      SELECT vcc.*, v.license_plate, dr.name as driver_name
      FROM vehicle_condition_checks vcc
      LEFT JOIN vehicles v ON vcc.vehicle_id = v.id
      LEFT JOIN drivers dr ON vcc.driver_id = dr.id
      ORDER BY vcc.check_date DESC
    `);

    res.json({ vehicles, drivers, conditionChecks });
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get expiring documents report (vehicle and driver documents)
router.get('/expiring-documents', authenticate, async (req, res) => {
  try {
    // Vehicle documents
    const [vehicleDocs] = await db.execute(`
      SELECT 
        'vehicle' as source_type,
        d.file_code as doc_code, d.file_name as doc_name, d.file_type as doc_type, 
        d.expiry_date, d.current_status, d.storage_location,
        v.license_plate, v.model, v.department, v.fleet,
        NULL as driver_name
      FROM documents d
      JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.current_status IN ('expiring_30_days', 'expired')
    `);
    
    // Driver documents
    const [driverDocs] = await db.execute(`
      SELECT 
        'driver' as source_type,
        dd.doc_code, dd.doc_name, dd.doc_type, 
        dd.expiry_date, dd.current_status, dd.storage_location,
        NULL as license_plate, NULL as model, dr.department, dr.fleet,
        dr.name as driver_name
      FROM driver_documents dd
      JOIN drivers dr ON dd.driver_id = dr.id
      WHERE dd.current_status IN ('expiring_30_days', 'expired')
    `);
    
    // Combine and sort by expiry date
    const allDocs = [...vehicleDocs, ...driverDocs].sort((a, b) => 
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    );
    
    res.json(allDocs);
  } catch (error) {
    console.error('Get expiring documents report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flow records report
router.get('/flow-records', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        fr.operation_type, fr.operation_time, fr.expected_return_time, fr.actual_return_time, fr.notes,
        doc.file_code, doc.file_name, doc.file_type,
        v.license_plate, v.model,
        dr.name as driver_name, dr.staff_no, dr.department
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      JOIN drivers dr ON fr.driver_id = dr.id
    `;
    
    const params = [];
    
    if (start_date && end_date) {
      query += ' WHERE fr.operation_time BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY fr.operation_time DESC';
    
    const [records] = await db.execute(query, params);
    
    res.json(records);
  } catch (error) {
    console.error('Get flow records report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get driver profile report (from drivers table, not users)
router.get('/driver-profile/:driverId', authenticate, async (req, res) => {
  try {
    // Get driver details from drivers table
    const [drivers] = await db.execute(
      `SELECT id, staff_no, name, contact, alternative_contact, department, fleet, 
              position, date_of_birth, driver_license_number, driver_license_expiry, 
              notes, status 
       FROM drivers WHERE id = ?`,
      [req.params.driverId]
    );
    
    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }
    
    // Get driver documents
    const [documents] = await db.execute(`
      SELECT doc_code, doc_name, doc_type, issue_date, expiry_date, current_status, storage_location
      FROM driver_documents
      WHERE driver_id = ?
      ORDER BY expiry_date ASC
    `, [req.params.driverId]);
    
    // Get driver flow records
    const [records] = await db.execute(`
      SELECT 
        fr.operation_type, fr.operation_time, fr.expected_return_time, fr.actual_return_time, fr.notes,
        doc.file_code, doc.file_name, doc.file_type,
        v.license_plate, v.model
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      WHERE fr.driver_id = ?
      ORDER BY fr.operation_time DESC
    `, [req.params.driverId]);
    
    // Get assigned vehicle
    const [vehicles] = await db.execute(
      'SELECT id, license_plate, model, department, fleet FROM vehicles WHERE assigned_driver_id = ?',
      [req.params.driverId]
    );
    
    res.json({
      driver: drivers[0],
      documents: documents,
      records: records,
      assigned_vehicle: vehicles[0] || null
    });
  } catch (error) {
    console.error('Get driver profile report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all documents with details
router.get('/all-documents', authenticate, async (req, res) => {
  try {
    // Vehicle documents
    const [vehicleDocs] = await db.execute(`
      SELECT 
        'vehicle' as source_type,
        d.file_code as doc_code, d.file_name as doc_name, d.file_type as doc_type, 
        d.issue_date, d.expiry_date, d.current_status, d.storage_location,
        v.license_plate, v.model, v.department, v.fleet, v.status as vehicle_status,
        NULL as driver_name
      FROM documents d
      JOIN vehicles v ON d.vehicle_id = v.id
    `);
    
    // Driver documents
    const [driverDocs] = await db.execute(`
      SELECT 
        'driver' as source_type,
        dd.doc_code, dd.doc_name, dd.doc_type, 
        dd.issue_date, dd.expiry_date, dd.current_status, dd.storage_location,
        NULL as license_plate, NULL as model, dr.department, dr.fleet, dr.status as vehicle_status,
        dr.name as driver_name
      FROM driver_documents dd
      JOIN drivers dr ON dd.driver_id = dr.id
    `);
    
    // Combine all documents
    const allDocs = [...vehicleDocs, ...driverDocs].sort((a, b) => {
      if (a.license_plate && b.license_plate) {
        return a.license_plate.localeCompare(b.license_plate);
      }
      return (a.driver_name || '').localeCompare(b.driver_name || '');
    });
    
    res.json(allDocs);
  } catch (error) {
    console.error('Get all documents report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get fleet summary report
router.get('/fleet-summary', authenticate, async (req, res) => {
  try {
    // Total vehicles
    const [vehicleStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_vehicles
      FROM vehicles
    `);
    
    // Total drivers
    const [driverStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_drivers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_drivers
      FROM drivers
    `);
    
    // Document stats
    const [docStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(CASE WHEN current_status = 'valid' THEN 1 ELSE 0 END) as valid_documents,
        SUM(CASE WHEN current_status = 'expiring_30_days' THEN 1 ELSE 0 END) as expiring_documents,
        SUM(CASE WHEN current_status = 'expired' THEN 1 ELSE 0 END) as expired_documents,
        SUM(CASE WHEN current_status = 'permanent' THEN 1 ELSE 0 END) as permanent_documents
      FROM documents
    `);
    
    // Driver document stats
    const [driverDocStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_driver_documents,
        SUM(CASE WHEN current_status = 'valid' THEN 1 ELSE 0 END) as valid_driver_documents,
        SUM(CASE WHEN current_status = 'expiring_30_days' THEN 1 ELSE 0 END) as expiring_driver_documents,
        SUM(CASE WHEN current_status = 'expired' THEN 1 ELSE 0 END) as expired_driver_documents
      FROM driver_documents
    `);
    
    res.json({
      vehicles: vehicleStats[0],
      drivers: driverStats[0],
      vehicle_documents: docStats[0],
      driver_documents: driverDocStats[0]
    });
  } catch (error) {
    console.error('Get fleet summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
