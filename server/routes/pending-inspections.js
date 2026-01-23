import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all pending vehicle inspections
router.get('/', authenticate, async (req, res) => {
  try {
    const [pendingVehicles] = await db.query(
      `SELECT pvi.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no,
        u.name as created_by_name
       FROM pending_vehicle_inspections pvi
       LEFT JOIN vehicles v ON pvi.vehicle_id = v.id
       LEFT JOIN drivers d ON pvi.driver_id = d.id
       LEFT JOIN users u ON pvi.created_by = u.id
       WHERE pvi.status = 'pending'
       ORDER BY pvi.arrival_date DESC`
    );
    res.json(pendingVehicles);
  } catch (error) {
    console.error('Error fetching pending inspections:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos pendentes' });
  }
});

// Get pending by trip type
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const tripType = req.params.type;
    const [pendingVehicles] = await db.query(
      `SELECT pvi.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no
       FROM pending_vehicle_inspections pvi
       LEFT JOIN vehicles v ON pvi.vehicle_id = v.id
       LEFT JOIN drivers d ON pvi.driver_id = d.id
       WHERE pvi.status = 'pending' AND pvi.trip_type = ?
       ORDER BY pvi.arrival_date DESC`,
      [tripType]
    );
    res.json(pendingVehicles);
  } catch (error) {
    console.error('Error fetching pending by type:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos pendentes' });
  }
});

// Add vehicle to pending inspection queue
router.post('/', authenticate, async (req, res) => {
  try {
    const { vehicle_id, driver_id, trip_type, trip_destination, notes, arrival_date } = req.body;

    if (!vehicle_id || !trip_type || !trip_destination) {
      return res.status(400).json({ 
        error: 'Veículo, tipo de viagem e destino são obrigatórios' 
      });
    }

    // Check if vehicle already has a pending inspection
    const [existing] = await db.query(
      `SELECT id FROM pending_vehicle_inspections 
       WHERE vehicle_id = ? AND status = 'pending'`,
      [vehicle_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Este veículo já está na fila de inspeção pendente' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO pending_vehicle_inspections 
        (vehicle_id, driver_id, trip_type, trip_destination, notes, arrival_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_id,
        driver_id || null,
        trip_type,
        trip_destination,
        notes || null,
        arrival_date || new Date(),
        req.user.id
      ]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Veículo adicionado à fila de inspeção' 
    });
  } catch (error) {
    console.error('Error adding pending inspection:', error);
    res.status(500).json({ error: 'Erro ao adicionar veículo pendente' });
  }
});

// Mark as inspected (link to inspection)
router.put('/:id/inspected', authenticate, async (req, res) => {
  try {
    const { inspection_id } = req.body;

    await db.query(
      `UPDATE pending_vehicle_inspections SET
        status = 'inspected',
        inspected_at = NOW(),
        inspection_id = ?
       WHERE id = ?`,
      [inspection_id, req.params.id]
    );

    res.json({ message: 'Veículo marcado como inspecionado' });
  } catch (error) {
    console.error('Error marking as inspected:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Cancel pending inspection
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    await db.query(
      `UPDATE pending_vehicle_inspections SET status = 'cancelled' WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Inspeção pendente cancelada' });
  } catch (error) {
    console.error('Error cancelling pending inspection:', error);
    res.status(500).json({ error: 'Erro ao cancelar' });
  }
});

// Delete pending inspection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM pending_vehicle_inspections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Registo eliminado' });
  } catch (error) {
    console.error('Error deleting pending inspection:', error);
    res.status(500).json({ error: 'Erro ao eliminar' });
  }
});

// Get summary counts
router.get('/summary', authenticate, async (req, res) => {
  try {
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_pending,
        SUM(CASE WHEN trip_type = 'internal' THEN 1 ELSE 0 END) as internal_pending,
        SUM(CASE WHEN trip_type = 'long_trip' THEN 1 ELSE 0 END) as long_trip_pending
      FROM pending_vehicle_inspections
      WHERE status = 'pending'
    `);
    
    res.json(summary[0]);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

export default router;
