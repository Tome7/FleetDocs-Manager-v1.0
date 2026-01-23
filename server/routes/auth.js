import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { staff_no, name, email, password, department, role } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO users (staff_no, name, email, password, department, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [staff_no, name, email, password, department, role || 'user', 'active']
    );
    
    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND status = "active"',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        staff_no: user.staff_no,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
