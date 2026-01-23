import express from 'express';
import db from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper function to get absolute file path
const getAbsoluteFilePath = (filePath) => {
  if (!filePath) return null;
  
  // If path starts with /uploads, it's relative to server folder
  if (filePath.startsWith('/uploads')) {
    return path.join(__dirname, '..', filePath);
  }
  
  // If it's already absolute, use it
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  // Otherwise, assume it's relative to server folder
  return path.join(__dirname, '..', filePath);
};

// Get all driver documents
router.get('/', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(`
      SELECT 
        dd.*,
        d.name as driver_name, d.staff_no, d.contact, d.department
      FROM driver_documents dd
      JOIN drivers d ON dd.driver_id = d.id
      ORDER BY dd.expiry_date ASC
    `);
    
    res.json(documents);
  } catch (error) {
    console.error('Get driver documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get documents by driver
router.get('/driver/:driverId', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(
      `SELECT * FROM driver_documents WHERE driver_id = ? ORDER BY expiry_date ASC`,
      [req.params.driverId]
    );
    
    res.json(documents);
  } catch (error) {
    console.error('Get documents by driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create driver document
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      doc_code, doc_name, doc_type, driver_id, issue_date, 
      expiry_date, storage_location, notes 
    } = req.body;
    
    // Calculate status based on expiry_date
    let current_status = 'permanent';
    if (expiry_date) {
      const today = new Date();
      const expiry = new Date(expiry_date);
      const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        current_status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        current_status = 'expiring_30_days';
      } else {
        current_status = 'valid';
      }
    }
    
    const [result] = await db.execute(
      `INSERT INTO driver_documents 
       (doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status, storage_location, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status, storage_location, notes]
    );
    
    res.json({ id: result.insertId, message: 'Driver document created successfully' });
  } catch (error) {
    console.error('Create driver document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload driver document file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { 
      doc_code, doc_name, doc_type, driver_id, issue_date, 
      expiry_date, storage_location, notes 
    } = req.body;
    
    // Calculate status
    let current_status = 'permanent';
    if (expiry_date) {
      const today = new Date();
      const expiry = new Date(expiry_date);
      const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        current_status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        current_status = 'expiring_30_days';
      } else {
        current_status = 'valid';
      }
    }
    
    // Store relative file path
    const filePath = `/uploads/documents/${req.file.filename}`;
    
    const [result] = await db.execute(
      `INSERT INTO driver_documents 
       (doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status, 
        storage_location, file_path, file_mime_type, file_size, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status, 
       storage_location, filePath, req.file.mimetype, req.file.size, notes]
    );
    
    res.json({ 
      id: result.insertId, 
      message: 'Driver document uploaded successfully',
      file: {
        path: filePath,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload driver document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Replace file on existing driver document
router.post('/:id/replace-file', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro foi enviado' });
    }

    // Get existing document
    const [documents] = await db.execute(
      'SELECT file_path FROM driver_documents WHERE id = ?',
      [req.params.id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Delete old file if exists
    if (documents[0].file_path) {
      const oldFilePath = getAbsoluteFilePath(documents[0].file_path);
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Store new file path
    const newFilePath = `/uploads/documents/${req.file.filename}`;
    
    // Update document with new file info
    await db.execute(
      'UPDATE driver_documents SET file_path = ?, file_mime_type = ?, file_size = ?, last_sync = NOW() WHERE id = ?',
      [newFilePath, req.file.mimetype, req.file.size, req.params.id]
    );

    res.json({ 
      message: 'Ficheiro substituído com sucesso',
      file_path: newFilePath
    });
  } catch (error) {
    console.error('Replace file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download driver document
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(
      'SELECT file_path, file_mime_type, doc_name FROM driver_documents WHERE id = ?',
      [req.params.id]
    );
    
    if (documents.length === 0 || !documents[0].file_path) {
      return res.status(404).json({ error: 'Ficheiro não encontrado' });
    }
    
    const filePath = getAbsoluteFilePath(documents[0].file_path);
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ error: 'Ficheiro não existe no servidor' });
    }
    
    const mimeType = documents[0].file_mime_type || 'application/octet-stream';
    const fileName = documents[0].doc_name || 'download';
    
    // Get file extension from original file if not in name
    const originalExt = path.extname(documents[0].file_path);
    const fileNameWithExt = fileName.includes('.') ? fileName : fileName + originalExt;
    
    // Set correct headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileNameWithExt)}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({ error: 'Erro ao ler ficheiro' });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download driver document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update driver document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { 
      doc_name, doc_type, issue_date, expiry_date, 
      storage_location, notes 
    } = req.body;
    
    // Calculate status
    let current_status = 'permanent';
    if (expiry_date) {
      const today = new Date();
      const expiry = new Date(expiry_date);
      const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        current_status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        current_status = 'expiring_30_days';
      } else {
        current_status = 'valid';
      }
    }
    
    await db.execute(
      `UPDATE driver_documents 
       SET doc_name = ?, doc_type = ?, issue_date = ?, expiry_date = ?, 
           current_status = ?, storage_location = ?, notes = ?, last_sync = NOW() 
       WHERE id = ?`,
      [doc_name, doc_type, issue_date, expiry_date, current_status, storage_location, notes, req.params.id]
    );
    
    res.json({ message: 'Driver document updated successfully' });
  } catch (error) {
    console.error('Update driver document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete driver document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Get file path before deleting
    const [documents] = await db.execute(
      'SELECT file_path FROM driver_documents WHERE id = ?',
      [req.params.id]
    );
    
    // Delete from database
    await db.execute('DELETE FROM driver_documents WHERE id = ?', [req.params.id]);
    
    // Delete file from filesystem if exists
    if (documents.length > 0 && documents[0].file_path) {
      const filePath = getAbsoluteFilePath(documents[0].file_path);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Driver document deleted successfully' });
  } catch (error) {
    console.error('Delete driver document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update document statuses (cron job endpoint)
router.post('/update-statuses', authenticate, async (req, res) => {
  try {
    // Update expired documents
    await db.execute(`
      UPDATE driver_documents 
      SET current_status = 'expired' 
      WHERE expiry_date IS NOT NULL AND expiry_date < CURDATE() AND current_status != 'expired'
    `);
    
    // Update expiring documents (30 days)
    await db.execute(`
      UPDATE driver_documents 
      SET current_status = 'expiring_30_days' 
      WHERE expiry_date IS NOT NULL 
        AND expiry_date >= CURDATE() 
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND current_status = 'valid'
    `);
    
    res.json({ message: 'Driver document statuses updated successfully' });
  } catch (error) {
    console.error('Update driver document statuses error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
