import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const [vehicles] = await db.execute(`
      SELECT v.*, 
        COUNT(DISTINCT d.id) as total_documents,
        SUM(CASE WHEN d.current_status = 'expired' THEN 1 ELSE 0 END) as expired_documents,
        SUM(CASE WHEN d.current_status = 'expiring_30_days' THEN 1 ELSE 0 END) as expiring_documents,
        dr.name as driver_name,
        dr.staff_no as driver_staff_no,
        dr.contact as driver_contact
      FROM vehicles v
      LEFT JOIN documents d ON v.id = d.vehicle_id
      LEFT JOIN drivers dr ON v.assigned_driver_id = dr.id
      GROUP BY v.id
      ORDER BY v.license_plate
    `);
    
    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [vehicles] = await db.execute(
      'SELECT * FROM vehicles WHERE id = ?',
      [req.params.id]
    );
    
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicles[0]);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create vehicle
router.post('/', authenticate, async (req, res) => {
  try {
    const { license_plate, model, department, fleet, color, status } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO vehicles (license_plate, model, department, fleet, color, status) VALUES (?, ?, ?, ?, ?, ?)',
      [license_plate, model, department, fleet || null, color || null, status || 'active']
    );
    
    res.status(201).json({ id: result.insertId, message: 'Vehicle created successfully' });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { license_plate, model, department, fleet, color, status, assigned_driver_id } = req.body;
    
    await db.execute(
      'UPDATE vehicles SET license_plate = ?, model = ?, department = ?, fleet = ?, color = ?, status = ?, assigned_driver_id = ?, last_sync = NOW() WHERE id = ?',
      [license_plate, model, department, fleet, color || null, status, assigned_driver_id || null, req.params.id]
    );
    
    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.execute('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
