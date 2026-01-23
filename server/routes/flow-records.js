import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all flow records with related data
router.get('/', authenticate, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT 
        fr.*,
        doc.file_code, doc.file_name, doc.file_type,
        v.license_plate, v.model, v.id as vehicle_id,
        dr.name as driver_name, dr.staff_no
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      JOIN drivers dr ON fr.driver_id = dr.id
      ORDER BY fr.operation_time DESC
    `);
    
    res.json(records);
  } catch (error) {
    console.error('Get flow records error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flow records grouped by vehicle
router.get('/by-vehicle', authenticate, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT 
        fr.id,
        fr.operation_type,
        fr.operation_time,
        fr.expected_return_time,
        fr.actual_return_time,
        fr.notes,
        fr.driver_id,
        fr.document_id,
        doc.file_code, doc.file_name, doc.file_type,
        v.id as vehicle_id, v.license_plate, v.model, v.department, v.fleet,
        dr.name as driver_name, dr.staff_no
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      JOIN drivers dr ON fr.driver_id = dr.id
      ORDER BY fr.operation_time DESC
    `);
    
    // Group by vehicle
    const groupedByVehicle = records.reduce((acc, record) => {
      const vehicleId = record.vehicle_id;
      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          vehicle_id: vehicleId,
          license_plate: record.license_plate,
          model: record.model,
          department: record.department,
          fleet: record.fleet,
          records: []
        };
      }
      acc[vehicleId].records.push(record);
      return acc;
    }, {});
    
    res.json(Object.values(groupedByVehicle));
  } catch (error) {
    console.error('Get flow records by vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flow records for specific vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT 
        fr.*,
        doc.file_code, doc.file_name, doc.file_type,
        v.license_plate, v.model,
        dr.name as driver_name, dr.staff_no
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      JOIN drivers dr ON fr.driver_id = dr.id
      WHERE v.id = ?
      ORDER BY fr.operation_time DESC
    `, [req.params.vehicleId]);
    
    res.json(records);
  } catch (error) {
    console.error('Get vehicle flow records error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flow records by document
router.get('/document/:documentId', authenticate, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT 
        fr.*,
        dr.name as driver_name, dr.staff_no
      FROM flow_records fr
      JOIN drivers dr ON fr.driver_id = dr.id
      WHERE fr.document_id = ?
      ORDER BY fr.operation_time DESC
    `, [req.params.documentId]);
    
    res.json(records);
  } catch (error) {
    console.error('Get document flow records error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flow records by driver
router.get('/driver/:driverId', authenticate, async (req, res) => {
  try {
    const [records] = await db.execute(`
      SELECT 
        fr.*,
        doc.file_code, doc.file_name, doc.file_type,
        v.license_plate, v.model
      FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      JOIN vehicles v ON doc.vehicle_id = v.id
      WHERE fr.driver_id = ?
      ORDER BY fr.operation_time DESC
    `, [req.params.driverId]);
    
    res.json(records);
  } catch (error) {
    console.error('Get driver flow records error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create flow record (withdrawal)
router.post('/withdrawal', authenticate, async (req, res) => {
  try {
    const { document_id, driver_id, expected_return_time, notes } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO flow_records (document_id, driver_id, operation_type, expected_return_time, notes) VALUES (?, ?, "withdrawal", ?, ?)',
      [document_id, driver_id, expected_return_time, notes]
    );
    
    res.json({ message: 'Withdrawal recorded successfully', id: result.insertId });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create flow record (return)
router.post('/return', authenticate, async (req, res) => {
  try {
    const { document_id, driver_id, notes } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO flow_records (document_id, driver_id, operation_type, actual_return_time, notes) VALUES (?, ?, "return", NOW(), ?)',
      [document_id, driver_id, notes]
    );
    
    res.json({ message: 'Return recorded successfully', id: result.insertId });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update flow record
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { operation_type, expected_return_time, actual_return_time, notes, driver_id } = req.body;
    
    await db.execute(
      `UPDATE flow_records SET 
        operation_type = COALESCE(?, operation_type),
        expected_return_time = ?,
        actual_return_time = ?,
        notes = ?,
        driver_id = COALESCE(?, driver_id)
      WHERE id = ?`,
      [operation_type, expected_return_time, actual_return_time, notes, driver_id, req.params.id]
    );
    
    res.json({ message: 'Flow record updated successfully' });
  } catch (error) {
    console.error('Update flow record error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all flow records for a vehicle
router.delete('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [result] = await db.execute(`
      DELETE fr FROM flow_records fr
      JOIN documents doc ON fr.document_id = doc.id
      WHERE doc.vehicle_id = ?
    `, [req.params.vehicleId]);
    res.json({ message: 'All vehicle flow records deleted successfully', deleted: result.affectedRows });
  } catch (error) {
    console.error('Delete vehicle flow records error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete flow record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.execute('DELETE FROM flow_records WHERE id = ?', [req.params.id]);
    res.json({ message: 'Flow record deleted successfully' });
  } catch (error) {
    console.error('Delete flow record error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
