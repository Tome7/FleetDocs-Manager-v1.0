import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all condition checks
router.get('/', authenticate, async (req, res) => {
  try {
    const [checks] = await db.query(
      `SELECT vcc.*, v.license_plate, v.model, d.name as driver_name, d.staff_no, u.name as created_by_name
       FROM vehicle_condition_checks vcc
       LEFT JOIN vehicles v ON vcc.vehicle_id = v.id
       LEFT JOIN drivers d ON vcc.driver_id = d.id
       LEFT JOIN users u ON vcc.created_by = u.id
       ORDER BY vcc.check_date DESC`
    );
    res.json(checks);
  } catch (error) {
    console.error('Error fetching all condition checks:', error);
    res.status(500).json({ error: 'Erro ao buscar verificações' });
  }
});

// Get all condition checks for a vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [checks] = await db.query(
      `SELECT vcc.*, v.license_plate, d.name as driver_name, u.name as created_by_name
       FROM vehicle_condition_checks vcc
       LEFT JOIN vehicles v ON vcc.vehicle_id = v.id
       LEFT JOIN drivers d ON vcc.driver_id = d.id
       LEFT JOIN users u ON vcc.created_by = u.id
       WHERE vcc.vehicle_id = ?
       ORDER BY vcc.check_date DESC`,
      [req.params.vehicleId]
    );
    res.json(checks);
  } catch (error) {
    console.error('Error fetching condition checks:', error);
    res.status(500).json({ error: 'Erro ao buscar verificações' });
  }
});

// Get latest condition check for a vehicle
router.get('/vehicle/:vehicleId/latest', authenticate, async (req, res) => {
  try {
    const [checks] = await db.query(
      `SELECT vcc.*, v.license_plate, d.name as driver_name, u.name as created_by_name
       FROM vehicle_condition_checks vcc
       LEFT JOIN vehicles v ON vcc.vehicle_id = v.id
       LEFT JOIN drivers d ON vcc.driver_id = d.id
       LEFT JOIN users u ON vcc.created_by = u.id
       WHERE vcc.vehicle_id = ?
       ORDER BY vcc.check_date DESC
       LIMIT 1`,
      [req.params.vehicleId]
    );
    res.json(checks[0] || null);
  } catch (error) {
    console.error('Error fetching latest condition check:', error);
    res.status(500).json({ error: 'Erro ao buscar última verificação' });
  }
});

// Create new condition check
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      vidro_parabrisa,
      espelho_esquerdo,
      espelho_direito,
      barachoque,
      capom,
      farois_cabeca,
      farois_trela,
      pintura,
      pneus,
      quarda_lamas,
      subsalente,
      notes
    } = req.body;

    if (!vehicle_id) {
      return res.status(400).json({ error: 'ID do veículo é obrigatório' });
    }

    const [result] = await db.query(
      `INSERT INTO vehicle_condition_checks (
        vehicle_id, driver_id, vidro_parabrisa, espelho_esquerdo, espelho_direito,
        barachoque, capom, farois_cabeca, farois_trela, pintura, pneus,
        quarda_lamas, subsalente, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_id, driver_id, vidro_parabrisa, espelho_esquerdo, espelho_direito,
        barachoque, capom, farois_cabeca, farois_trela, pintura, pneus,
        quarda_lamas, subsalente, notes, req.user.id
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Verificação criada com sucesso' });
  } catch (error) {
    console.error('Error creating condition check:', error);
    res.status(500).json({ error: 'Erro ao criar verificação' });
  }
});

// Update condition check
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      vidro_parabrisa,
      espelho_esquerdo,
      espelho_direito,
      barachoque,
      capom,
      farois_cabeca,
      farois_trela,
      pintura,
      pneus,
      quarda_lamas,
      subsalente,
      notes
    } = req.body;

    await db.query(
      `UPDATE vehicle_condition_checks SET
        vidro_parabrisa = ?, espelho_esquerdo = ?, espelho_direito = ?,
        barachoque = ?, capom = ?, farois_cabeca = ?, farois_trela = ?,
        pintura = ?, pneus = ?, quarda_lamas = ?, subsalente = ?, notes = ?
       WHERE id = ?`,
      [
        vidro_parabrisa, espelho_esquerdo, espelho_direito,
        barachoque, capom, farois_cabeca, farois_trela,
        pintura, pneus, quarda_lamas, subsalente, notes,
        req.params.id
      ]
    );

    res.json({ message: 'Verificação atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating condition check:', error);
    res.status(500).json({ error: 'Erro ao atualizar verificação' });
  }
});

// Delete condition check
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM vehicle_condition_checks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Verificação deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting condition check:', error);
    res.status(500).json({ error: 'Erro ao deletar verificação' });
  }
});

export default router;