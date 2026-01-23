import express from 'express';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all active alerts (vehicle documents and driver documents)
router.get('/', authenticate, async (req, res) => {
  try {
    // Get vehicle document alerts
    const [vehicleAlerts] = await db.execute(`
      SELECT 
        a.*,
        'vehicle' as source_type,
        d.file_code as doc_code, 
        d.file_name as doc_name, 
        d.file_type as doc_type, 
        d.expiry_date,
        v.license_plate, 
        v.model, 
        v.department,
        NULL as driver_name
      FROM alerts a
      JOIN documents d ON a.document_id = d.id
      JOIN vehicles v ON d.vehicle_id = v.id
      WHERE a.is_sent = FALSE AND a.document_id IS NOT NULL
    `);
    
    // Get driver document alerts
    const [driverAlerts] = await db.execute(`
      SELECT 
        a.*,
        'driver' as source_type,
        dd.doc_code, 
        dd.doc_name, 
        dd.doc_type, 
        dd.expiry_date,
        NULL as license_plate,
        NULL as model,
        dr.department,
        dr.name as driver_name
      FROM alerts a
      JOIN driver_documents dd ON a.driver_document_id = dd.id
      JOIN drivers dr ON dd.driver_id = dr.id
      WHERE a.is_sent = FALSE AND a.driver_document_id IS NOT NULL
    `);
    
    // Combine and sort all alerts
    const allAlerts = [...vehicleAlerts, ...driverAlerts].sort((a, b) => {
      const dateCompare = new Date(a.alert_date).getTime() - new Date(b.alert_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.alert_type.localeCompare(a.alert_type);
    });
    
    res.json(allAlerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark alert as sent
router.put('/:id/mark-sent', authenticate, async (req, res) => {
  try {
    await db.execute(
      'UPDATE alerts SET is_sent = TRUE, sent_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Alert marked as sent' });
  } catch (error) {
    console.error('Mark alert sent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate alerts for documents expiring soon
/*router.post('/generate', authenticate, async (req, res) => {
  try {
    // Get vehicle documents with expiry dates (only those that have expiry_date set)
    const [documents] = await db.execute(
      'SELECT id, expiry_date FROM documents WHERE expiry_date IS NOT NULL'
    );
    
    // Get driver documents with expiry dates
    const [driverDocuments] = await db.execute(
      'SELECT id, expiry_date FROM driver_documents WHERE expiry_date IS NOT NULL'
    );
    
    let alertsCreated = 0;
    
    // Process vehicle documents
    for (const doc of documents) {
      const expiryDate = new Date(doc.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let alertType = null;
      let alertDate = null;
      
      if (daysUntilExpiry <= 0) {
        alertType = 'expired';
        alertDate = today;
      } else if (daysUntilExpiry <= 3) {
        alertType = '3_days';
        alertDate = new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 7) {
        alertType = '7_days';
        alertDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 15) {
        alertType = '15_days';
        alertDate = new Date(expiryDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 30) {
        alertType = '30_days';
        alertDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (alertType) {
        const [existing] = await db.execute(
          'SELECT id FROM alerts WHERE document_id = ? AND alert_type = ? AND is_sent = FALSE',
          [doc.id, alertType]
        );
        
        if (existing.length === 0) {
          await db.execute(
            'INSERT INTO alerts (document_id, alert_type, alert_date) VALUES (?, ?, ?)',
            [doc.id, alertType, alertDate]
          );
          alertsCreated++;
        }
      }
    }
    
    // Process driver documents
    for (const doc of driverDocuments) {
      const expiryDate = new Date(doc.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let alertType = null;
      let alertDate = null;
      
      if (daysUntilExpiry <= 0) {
        alertType = 'expired';
        alertDate = today;
      } else if (daysUntilExpiry <= 3) {
        alertType = '3_days';
        alertDate = new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 7) {
        alertType = '7_days';
        alertDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 15) {
        alertType = '15_days';
        alertDate = new Date(expiryDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      } else if (daysUntilExpiry <= 30) {
        alertType = '30_days';
        alertDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (alertType) {
        const [existing] = await db.execute(
          'SELECT id FROM alerts WHERE driver_document_id = ? AND alert_type = ? AND is_sent = FALSE',
          [doc.id, alertType]
        );
        
        if (existing.length === 0) {
          await db.execute(
            'INSERT INTO alerts (driver_document_id, alert_type, alert_date) VALUES (?, ?, ?)',
            [doc.id, alertType, alertDate]
          );
          alertsCreated++;
        }
      }
    }
    
    res.json({ message: `${alertsCreated} alertas gerados com sucesso` });
  } catch (error) {
    console.error('Generate alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});*/

router.post('/generate', authenticate, async (req, res) => {
  try {
    // Busca documentos (simplificado para o exemplo)
    const [documents] = await db.execute('SELECT id, expiry_date FROM documents WHERE expiry_date IS NOT NULL');
    const [driverDocuments] = await db.execute('SELECT id, expiry_date FROM driver_documents WHERE expiry_date IS NOT NULL');
    
    let alertsCreated = 0;

    // Função auxiliar para processar a lógica (evita repetir código para driver e vehicle)
    const processDocument = async (doc, isDriver = false) => {
      let expiryDate;
      
      // 1. CORREÇÃO DE DATA: Tratamento robusto para DD/MM/YYYY ou YYYY-MM-DD
      if (typeof doc.expiry_date === 'string' && doc.expiry_date.includes('/')) {
         const parts = doc.expiry_date.split('/');
         expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
         expiryDate = new Date(doc.expiry_date);
      }

      // Validação de segurança
      if (isNaN(expiryDate.getTime())) return;

      const today = new Date();
      today.setHours(0,0,0,0); // Ignorar horas para cálculo preciso de dias
      
      // Diferença em dias
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let alertType = null;

      // Lógica de cascata (do mais urgente para o menos urgente)
      if (daysUntilExpiry <= 0) alertType = 'expired';
      else if (daysUntilExpiry <= 3) alertType = '3_days';
      else if (daysUntilExpiry <= 7) alertType = '7_days';
      else if (daysUntilExpiry <= 15) alertType = '15_days';
      else if (daysUntilExpiry <= 30) alertType = '30_days';

      if (alertType) {
        const idField = isDriver ? 'driver_document_id' : 'document_id';
        
        // 2. CORREÇÃO DE ACÚMULO: Remove alertas antigos menos relevantes/diferentes
        // Se vamos criar um alerta de "7 dias", não precisamos mais do alerta de "15 dias" ou "30 dias" se eles não foram enviados.
        await db.execute(
            `DELETE FROM alerts WHERE ${idField} = ? AND alert_type != ? AND is_sent = FALSE`,
            [doc.id, alertType]
        );

        // Verifica se O MESMO alerta já existe
        const [existing] = await db.execute(
          `SELECT id FROM alerts WHERE ${idField} = ? AND alert_type = ? AND is_sent = FALSE`,
          [doc.id, alertType]
        );
        
        if (existing.length === 0) {
          // 3. CORREÇÃO DE DATA DO ALERTA: Usamos 'today' para saber quando o alerta foi gerado
          // Ou mantemos sua lógica original se preferir que a data reflita o "marco" de 30 dias.
          // Vou manter a data de criação como HOJE para aparecer no topo da lista de recentes.
          const alertDateToInsert = new Date(); 

          await db.execute(
            `INSERT INTO alerts (${idField}, alert_type, alert_date) VALUES (?, ?, ?)`,
            [doc.id, alertType, alertDateToInsert]
          );
          alertsCreated++;
        }
      }
    };

    // Executa para veículos
    for (const doc of documents) await processDocument(doc, false);
    
    // Executa para motoristas
    for (const doc of driverDocuments) await processDocument(doc, true);
    
    res.json({ message: `${alertsCreated} alertas gerados e atualizados com sucesso` });
  } catch (error) {
    console.error('Generate alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});


export default router;

