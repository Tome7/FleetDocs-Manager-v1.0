import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';
import pool from './config/database.js';
import vehicleRoutes from './routes/vehicles.js';
import documentRoutes from './routes/documents.js';
import driverDocumentsRoutes from './routes/driver-documents.js';
import driversRoutes from './routes/drivers.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import flowRecordsRoutes from './routes/flow-records.js';
import alertsRoutes from './routes/alerts.js';
import reportsRoutes from './routes/reports.js';
import vehicleConditionRoutes from './routes/vehicle-condition.js';
import postTripInspectionRoutes from './routes/post-trip-inspection.js';
import pendingInspectionsRoutes from './routes/pending-inspections.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/driver-documents', driverDocumentsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flow-records', flowRecordsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/vehicle-condition', vehicleConditionRoutes);
app.use('/api/post-trip-inspections', postTripInspectionRoutes);
app.use('/api/pending-inspections', pendingInspectionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Cron job para limpar inspeções todas as segundas-feiras às 00:00
cron.schedule('0 0 * * 1', async () => {
  console.log('Executando limpeza semanal de inspeções - Segunda-feira 00:00');
  try {
    const [result] = await pool.query('DELETE FROM post_trip_inspections');
    console.log(`Limpeza concluída: ${result.affectedRows} inspeções removidas`);
  } catch (error) {
    console.error('Erro na limpeza semanal de inspeções:', error);
  }
}, {
  scheduled: true,
  timezone: "Africa/Maputo"
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cron job configurado: Limpeza de inspeções todas as segundas-feiras às 00:00');
});
