import express from 'express';
import db from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import uploadProfile from '../middleware/uploadProfiles.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Get all drivers
router.get('/', authenticate, async (req, res) => {
  try {
    const [drivers] = await db.execute(`
      SELECT 
        d.*,
        COUNT(DISTINCT dd.id) as total_documents,
        SUM(CASE WHEN dd.current_status = 'expired' THEN 1 ELSE 0 END) as expired_documents,
        SUM(CASE WHEN dd.current_status = 'expiring_30_days' THEN 1 ELSE 0 END) as expiring_documents,
        v.license_plate as assigned_vehicle
      FROM drivers d
      LEFT JOIN driver_documents dd ON d.id = dd.driver_id
      LEFT JOIN vehicles v ON d.id = v.assigned_driver_id
      GROUP BY d.id
      ORDER BY d.name
    `);
    
    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get driver by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [drivers] = await db.execute(`
      SELECT 
        d.*,
        COUNT(DISTINCT dd.id) as total_documents,
        SUM(CASE WHEN dd.current_status = 'expired' THEN 1 ELSE 0 END) as expired_documents,
        v.license_plate as assigned_vehicle,
        v.id as assigned_vehicle_id
      FROM drivers d
      LEFT JOIN driver_documents dd ON d.id = dd.driver_id
      LEFT JOIN vehicles v ON d.id = v.assigned_driver_id
      WHERE d.id = ?
      GROUP BY d.id
    `, [req.params.id]);
    
    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(drivers[0]);
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create driver
router.post('/', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const { 
      staff_no, name, contact, alternative_contact, 
      contact_malawi, contact_zambia, contact_zimbabwe,
      date_of_birth, sex, driver_license_number, driver_license_expiry,
      position, department, fleet, profile_photo, notes, status 
    } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO drivers (
        staff_no, name, contact, alternative_contact,
        contact_malawi, contact_zambia, contact_zimbabwe,
        date_of_birth, sex, driver_license_number, driver_license_expiry,
        position, department, fleet, profile_photo, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_no, name, contact, alternative_contact || null,
        contact_malawi || null, contact_zambia || null, contact_zimbabwe || null,
        date_of_birth || null, sex || null, driver_license_number || null, driver_license_expiry || null,
        position || null, department || null, fleet || null, profile_photo || null, notes || null, status || 'active'
      ]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Driver created successfully' });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update driver
router.put('/:id', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const { 
      staff_no, name, contact, alternative_contact,
      contact_malawi, contact_zambia, contact_zimbabwe,
      date_of_birth, sex, driver_license_number, driver_license_expiry,
      position, department, fleet, profile_photo, notes, status 
    } = req.body;
    
    await db.execute(
      `UPDATE drivers SET 
        staff_no = ?, name = ?, contact = ?, alternative_contact = ?,
        contact_malawi = ?, contact_zambia = ?, contact_zimbabwe = ?,
        date_of_birth = ?, sex = ?, driver_license_number = ?, driver_license_expiry = ?,
        position = ?, department = ?, fleet = ?, profile_photo = ?, notes = ?, status = ?, 
        last_sync = NOW() 
      WHERE id = ?`,
      [
        staff_no, name, contact, alternative_contact || null,
        contact_malawi || null, contact_zambia || null, contact_zimbabwe || null,
        date_of_birth || null, sex || null, driver_license_number || null, driver_license_expiry || null,
        position || null, department || null, fleet || null, profile_photo || null, notes || null, status,
        req.params.id
      ]
    );
    
    res.json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete driver
router.delete('/:id', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    // Check if driver has assigned vehicle
    const [vehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE assigned_driver_id = ?',
      [req.params.id]
    );
    
    if (vehicles.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete driver with assigned vehicle. Please unassign the vehicle first.' 
      });
    }
    
    await db.execute('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign vehicle to driver
router.post('/:id/assign-vehicle', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const { vehicle_id } = req.body;
    const driver_id = req.params.id;
    
    // Check if vehicle is already assigned to another driver
    const [vehicles] = await db.execute(
      'SELECT assigned_driver_id, license_plate FROM vehicles WHERE id = ?',
      [vehicle_id]
    );
    
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    if (vehicles[0].assigned_driver_id && vehicles[0].assigned_driver_id !== parseInt(driver_id)) {
      return res.status(400).json({ 
        error: 'Vehicle is already assigned to another driver. Please unassign it first.' 
      });
    }
    
    // Assign vehicle to driver
    await db.execute(
      'UPDATE vehicles SET assigned_driver_id = ?, last_sync = NOW() WHERE id = ?',
      [driver_id, vehicle_id]
    );
    
    res.json({ message: 'Vehicle assigned successfully' });
  } catch (error) {
    console.error('Assign vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unassign vehicle from driver
router.post('/:id/unassign-vehicle', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const driver_id = req.params.id;
    
    await db.execute(
      'UPDATE vehicles SET assigned_driver_id = NULL, last_sync = NOW() WHERE assigned_driver_id = ?',
      [driver_id]
    );
    
    res.json({ message: 'Vehicle unassigned successfully' });
  } catch (error) {
    console.error('Unassign vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer vehicle between drivers
router.post('/transfer-vehicle', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const { vehicle_id, from_driver_id, to_driver_id } = req.body;
    
    // Verify vehicle is assigned to from_driver
    const [vehicles] = await db.execute(
      'SELECT assigned_driver_id FROM vehicles WHERE id = ?',
      [vehicle_id]
    );
    
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    if (vehicles[0].assigned_driver_id !== from_driver_id) {
      return res.status(400).json({ 
        error: 'Vehicle is not assigned to the specified driver' 
      });
    }
    
    // Transfer vehicle
    await db.execute(
      'UPDATE vehicles SET assigned_driver_id = ?, last_sync = NOW() WHERE id = ?',
      [to_driver_id, vehicle_id]
    );
    
    res.json({ message: 'Vehicle transferred successfully' });
  } catch (error) {
    console.error('Transfer vehicle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload profile photo
router.post('/:id/upload-photo', authenticate, authorize(['admin', 'fleet_manager']), uploadProfile.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const driverId = req.params.id;
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    
    // Get current photo to delete if exists
    const [drivers] = await db.execute('SELECT profile_photo FROM drivers WHERE id = ?', [driverId]);
    if (drivers.length > 0 && drivers[0].profile_photo) {
      const oldPhotoPath = path.join(__dirname, '..', drivers[0].profile_photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    // Update driver with new photo path
    await db.execute('UPDATE drivers SET profile_photo = ?, last_sync = NOW() WHERE id = ?', [photoPath, driverId]);
    
    res.json({ message: 'Photo uploaded successfully', photo_path: photoPath });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete profile photo
router.delete('/:id/photo', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const driverId = req.params.id;
    
    // Get current photo to delete
    const [drivers] = await db.execute('SELECT profile_photo FROM drivers WHERE id = ?', [driverId]);
    if (drivers.length > 0 && drivers[0].profile_photo) {
      const photoPath = path.join(__dirname, '..', drivers[0].profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    // Update driver to remove photo path
    await db.execute('UPDATE drivers SET profile_photo = NULL, last_sync = NOW() WHERE id = ?', [driverId]);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
