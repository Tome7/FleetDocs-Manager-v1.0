import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
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

// Get all documents
router.get('/', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(`
      SELECT d.*, v.license_plate, v.model 
      FROM documents d
      JOIN vehicles v ON d.vehicle_id = v.id
      ORDER BY d.expiry_date
    `);
    
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get documents by vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE vehicle_id = ? ORDER BY expiry_date',
      [req.params.vehicleId]
    );
    
    res.json(documents);
  } catch (error) {
    console.error('Get vehicle documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload file (new document)
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro foi enviado' });
    }

    const { file_name, file_type, vehicle_id, issue_date, expiry_date, storage_location, has_expiry } = req.body;
    
    // Generate unique file code
    const year = new Date().getFullYear();
    const [maxCode] = await db.execute(
      'SELECT MAX(CAST(SUBSTRING(file_code, 8) AS UNSIGNED)) as max_num FROM documents WHERE file_code LIKE ?',
      [`DOC${year}%`]
    );
    
    const nextNum = (maxCode[0].max_num || 0) + 1;
    const file_code = `DOC${year}${String(nextNum).padStart(4, '0')}`;
    
    // Handle documents without expiry date
    const finalExpiryDate = (has_expiry === 'false' || has_expiry === false) ? null : expiry_date;
    
    // Calculate status based on expiry date
    let status = 'valid';
    let daysUntilExpiry = null;
    
    if (finalExpiryDate) {
      const expiryDate = new Date(finalExpiryDate);
      const today = new Date();
      daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) status = 'expired';
      else if (daysUntilExpiry <= 30) status = 'expiring_30_days';
    } else {
      status = 'permanent';
    }
    
    // Store file information - relative path
    const filePath = `/uploads/documents/${req.file.filename}`;
    
    const [result] = await db.execute(
      'INSERT INTO documents (file_code, file_name, file_type, vehicle_id, issue_date, expiry_date, current_status, storage_location, file_path, file_mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [file_code, file_name, file_type, vehicle_id, issue_date, finalExpiryDate, status, storage_location, filePath, req.file.mimetype, req.file.size]
    );
    
    // Generate alerts for this document if it has expiry
    if (finalExpiryDate && daysUntilExpiry && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      const expiryDate = new Date(finalExpiryDate);
      const alertDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      await db.execute(
        'INSERT INTO alerts (document_id, alert_type, alert_date) VALUES (?, "30_days", ?)',
        [result.insertId, alertDate]
      );
    }
    
    res.json({ 
      message: 'Documento e ficheiro enviados com sucesso', 
      file_code,
      file_path: filePath 
    });
  } catch (error) {
    console.error('Upload document error:', error);
    // Delete uploaded file if database insert fails
    if (req.file) {
      const filePath = getAbsoluteFilePath(`/uploads/documents/${req.file.filename}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// Replace file on existing document
router.post('/:id/replace-file', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro foi enviado' });
    }

    // Get existing document
    const [documents] = await db.execute(
      'SELECT file_path FROM documents WHERE id = ?',
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
      'UPDATE documents SET file_path = ?, file_mime_type = ?, file_size = ?, last_sync = NOW() WHERE id = ?',
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

// Create document (without file upload)
router.post('/', authenticate, async (req, res) => {
  try {
    const { file_name, file_type, vehicle_id, expiry_date, storage_location } = req.body;
    
    // Generate unique file code
    const year = new Date().getFullYear();
    const [maxCode] = await db.execute(
      'SELECT MAX(CAST(SUBSTRING(file_code, 8) AS UNSIGNED)) as max_num FROM documents WHERE file_code LIKE ?',
      [`DOC${year}%`]
    );
    
    const nextNum = (maxCode[0].max_num || 0) + 1;
    const file_code = `DOC${year}${String(nextNum).padStart(4, '0')}`;
    
    // Calculate status based on expiry date
    const expiryDate = new Date(expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    let status = 'valid';
    if (daysUntilExpiry <= 0) status = 'expired';
    else if (daysUntilExpiry <= 30) status = 'expiring_30_days';
    
    const [result] = await db.execute(
      'INSERT INTO documents (file_code, file_name, file_type, vehicle_id, expiry_date, current_status, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [file_code, file_name, file_type, vehicle_id, expiry_date, status, storage_location]
    );
    
    // Generate alerts for this document
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      const alertDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      await db.execute(
        'INSERT INTO alerts (document_id, alert_type, alert_date) VALUES (?, "30_days", ?)',
        [result.insertId, alertDate]
      );
    }
    
    res.json({ message: 'Document created successfully', file_code });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { file_name, file_type, issue_date, expiry_date, storage_location, current_status } = req.body;
    
    await db.execute(
      'UPDATE documents SET file_name = ?, file_type = ?, issue_date = ?, expiry_date = ?, storage_location = ?, current_status = ?, last_sync = NOW() WHERE id = ?',
      [file_name, file_type, issue_date, expiry_date, storage_location, current_status, req.params.id]
    );
    
    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const [documents] = await db.execute(
      'SELECT file_path, file_name, file_mime_type FROM documents WHERE id = ?',
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
    const fileName = documents[0].file_name || 'download';
    
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
    console.error('Download document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Get file path before deleting
    const [documents] = await db.execute(
      'SELECT file_path FROM documents WHERE id = ?',
      [req.params.id]
    );
    
    // Delete from database
    await db.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    
    // Delete file from filesystem if exists
    if (documents.length > 0 && documents[0].file_path) {
      const filePath = getAbsoluteFilePath(documents[0].file_path);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
