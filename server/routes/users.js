import express from 'express';
import db from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin/fleet_manager only)
router.get('/', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, staff_no, name, email, department, contact, role, fleet, status FROM users ORDER BY name'
    );
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, staff_no, name, email, department, contact, role, fleet, status FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', authenticate, authorize(['admin', 'fleet_manager']), async (req, res) => {
  try {
    const { name, email, department, contact, role, fleet, status } = req.body;
    
    await db.execute(
      'UPDATE users SET name = ?, email = ?, department = ?, contact = ?, role = ?, fleet = ?, status = ?, last_sync = NOW() WHERE id = ?',
      [name, email, department, contact, role, fleet, status, req.params.id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
