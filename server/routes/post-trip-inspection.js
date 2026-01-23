import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all post-trip inspections (with optional date filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    let query = `SELECT pti.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no,
        u.name as inspector_name
       FROM post_trip_inspections pti
       LEFT JOIN vehicles v ON pti.vehicle_id = v.id
       LEFT JOIN drivers d ON pti.driver_id = d.id
       LEFT JOIN users u ON pti.inspector_id = u.id`;
    
    const params = [];
    
    if (date) {
      // Filter by specific date
      query += ` WHERE DATE(pti.inspection_date) = ?`;
      params.push(date);
    } else if (start_date && end_date) {
      // Filter by date range
      query += ` WHERE DATE(pti.inspection_date) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY pti.inspection_date DESC`;
    
    const [inspections] = await db.query(query, params);
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching post-trip inspections:', error);
    res.status(500).json({ error: 'Erro ao buscar inspeções pós-viagem' });
  }
});

// Get inspections for today (real-time view)
router.get('/today', authenticate, async (req, res) => {
  try {
    const [inspections] = await db.query(
      `SELECT pti.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no,
        u.name as inspector_name
       FROM post_trip_inspections pti
       LEFT JOIN vehicles v ON pti.vehicle_id = v.id
       LEFT JOIN drivers d ON pti.driver_id = d.id
       LEFT JOIN users u ON pti.inspector_id = u.id
       WHERE DATE(pti.inspection_date) = CURDATE()
       ORDER BY pti.inspection_date DESC`
    );
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching today inspections:', error);
    res.status(500).json({ error: 'Erro ao buscar inspeções de hoje' });
  }
});

// Get inspections by trip type
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const tripType = req.params.type;
    const [inspections] = await db.query(
      `SELECT pti.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no,
        u.name as inspector_name
       FROM post_trip_inspections pti
       LEFT JOIN vehicles v ON pti.vehicle_id = v.id
       LEFT JOIN drivers d ON pti.driver_id = d.id
       LEFT JOIN users u ON pti.inspector_id = u.id
       WHERE pti.trip_type = ?
       ORDER BY pti.inspection_date DESC`,
      [tripType]
    );
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections by type:', error);
    res.status(500).json({ error: 'Erro ao buscar inspeções' });
  }
});

// Get pending vehicles (vehicles not inspected in current period)
router.get('/pending/:type', authenticate, async (req, res) => {
  try {
    const tripType = req.params.type;
    let dateFilter;
    
    if (tripType === 'internal') {
      // Internal: weekly - vehicles not inspected in last 7 days
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else {
      // Long trip: check recent inspections
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const [pendingVehicles] = await db.query(
      `SELECT v.*, d.name as driver_name, d.staff_no as driver_staff_no,
        (SELECT MAX(pti.inspection_date) FROM post_trip_inspections pti 
         WHERE pti.vehicle_id = v.id AND pti.trip_type = ?) as last_inspection
       FROM vehicles v
       LEFT JOIN drivers d ON v.assigned_driver_id = d.id
       WHERE v.status = 'active'
       AND v.id NOT IN (
         SELECT DISTINCT vehicle_id FROM post_trip_inspections 
         WHERE trip_type = ? AND inspection_date > ${dateFilter}
       )
       ORDER BY v.license_plate`,
      [tripType, tripType]
    );
    res.json(pendingVehicles);
  } catch (error) {
    console.error('Error fetching pending vehicles:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos pendentes' });
  }
});

// Get inspection by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [inspections] = await db.query(
      `SELECT pti.*, 
        v.license_plate, v.model,
        d.name as driver_name, d.staff_no as driver_staff_no, d.contact as driver_contact,
        u.name as inspector_name
       FROM post_trip_inspections pti
       LEFT JOIN vehicles v ON pti.vehicle_id = v.id
       LEFT JOIN drivers d ON pti.driver_id = d.id
       LEFT JOIN users u ON pti.inspector_id = u.id
       WHERE pti.id = ?`,
      [req.params.id]
    );
    
    if (inspections.length === 0) {
      return res.status(404).json({ error: 'Inspeção não encontrada' });
    }
    
    res.json(inspections[0]);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Erro ao buscar inspeção' });
  }
});

// Create new inspection
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      trip_type,
      trip_destination,
      // Horse documents
      horse_livrete, horse_caderneta, horse_seguro, horse_inspecao,
      horse_cfm, horse_moz_permit, horse_radio_difusao, horse_manifesto,
      horse_passaport, horse_carta_conducao, horse_comesa,
      // Trailer documents
      trailer_livrete, trailer_caderneta, trailer_seguro, trailer_inspecao,
      trailer_cfm, trailer_moz_permit, trailer_radio_difusao, trailer_manifesto,
      trailer_comesa,
      // General
      documents_complete,
      missing_documents,
      observations,
      status
    } = req.body;

    if (!vehicle_id || !driver_id || !trip_type || !trip_destination) {
      return res.status(400).json({ 
        error: 'Veículo, motorista, tipo de viagem e destino são obrigatórios' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO post_trip_inspections (
        vehicle_id, driver_id, inspector_id, trip_type, trip_destination,
        horse_livrete, horse_caderneta, horse_seguro, horse_inspecao,
        horse_cfm, horse_moz_permit, horse_radio_difusao, horse_manifesto,
        horse_passaport, horse_carta_conducao, horse_comesa,
        trailer_livrete, trailer_caderneta, trailer_seguro, trailer_inspecao,
        trailer_cfm, trailer_moz_permit, trailer_radio_difusao, trailer_manifesto,
        trailer_comesa,
        documents_complete, missing_documents, observations, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_id,
        driver_id,
        req.user.id,
        trip_type,
        trip_destination,
        horse_livrete || false, horse_caderneta || false, horse_seguro || false, horse_inspecao || false,
        horse_cfm || false, horse_moz_permit || false, horse_radio_difusao || false, horse_manifesto || false,
        horse_passaport || false, horse_carta_conducao || false, horse_comesa || false,
        trailer_livrete || false, trailer_caderneta || false, trailer_seguro || false, trailer_inspecao || false,
        trailer_cfm || false, trailer_moz_permit || false, trailer_radio_difusao || false, trailer_manifesto || false,
        trailer_comesa || false,
        documents_complete !== false,
        missing_documents || null,
        observations || null,
        status || 'verified'
      ]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Inspeção pós-viagem registada com sucesso' 
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Erro ao criar inspeção' });
  }
});

// Update inspection
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      trip_type,
      trip_destination,
      // Horse documents
      horse_livrete, horse_caderneta, horse_seguro, horse_inspecao,
      horse_cfm, horse_moz_permit, horse_radio_difusao, horse_manifesto,
      horse_passaport, horse_carta_conducao, horse_comesa,
      // Trailer documents
      trailer_livrete, trailer_caderneta, trailer_seguro, trailer_inspecao,
      trailer_cfm, trailer_moz_permit, trailer_radio_difusao, trailer_manifesto,
      trailer_comesa,
      // General
      documents_complete,
      missing_documents,
      observations,
      status
    } = req.body;

    await db.query(
      `UPDATE post_trip_inspections SET
        vehicle_id = ?, driver_id = ?, trip_type = ?, trip_destination = ?,
        horse_livrete = ?, horse_caderneta = ?, horse_seguro = ?, horse_inspecao = ?,
        horse_cfm = ?, horse_moz_permit = ?, horse_radio_difusao = ?, horse_manifesto = ?,
        horse_passaport = ?, horse_carta_conducao = ?, horse_comesa = ?,
        trailer_livrete = ?, trailer_caderneta = ?, trailer_seguro = ?, trailer_inspecao = ?,
        trailer_cfm = ?, trailer_moz_permit = ?, trailer_radio_difusao = ?, trailer_manifesto = ?,
        trailer_comesa = ?,
        documents_complete = ?,
        missing_documents = ?,
        observations = ?,
        status = ?
       WHERE id = ?`,
      [
        vehicle_id, driver_id, trip_type, trip_destination,
        horse_livrete || false, horse_caderneta || false, horse_seguro || false, horse_inspecao || false,
        horse_cfm || false, horse_moz_permit || false, horse_radio_difusao || false, horse_manifesto || false,
        horse_passaport || false, horse_carta_conducao || false, horse_comesa || false,
        trailer_livrete || false, trailer_caderneta || false, trailer_seguro || false, trailer_inspecao || false,
        trailer_cfm || false, trailer_moz_permit || false, trailer_radio_difusao || false, trailer_manifesto || false,
        trailer_comesa || false,
        documents_complete !== false,
        missing_documents || null,
        observations || null,
        status || 'verified',
        req.params.id
      ]
    );

    res.json({ message: 'Inspeção atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Erro ao atualizar inspeção' });
  }
});

// Delete inspection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM post_trip_inspections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Inspeção eliminada com sucesso' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ error: 'Erro ao eliminar inspeção' });
  }
});

// Get summary statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_inspections,
        SUM(CASE WHEN trip_type = 'internal' THEN 1 ELSE 0 END) as internal_count,
        SUM(CASE WHEN trip_type = 'long_trip' THEN 1 ELSE 0 END) as long_trip_count,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END) as incomplete_count,
        SUM(CASE WHEN documents_complete = 0 THEN 1 ELSE 0 END) as missing_docs_count
      FROM post_trip_inspections
      WHERE inspection_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
