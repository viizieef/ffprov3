import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  getMongoStatus, 
  saveMongoDoc, 
  deleteMongoDoc, 
  syncAllToMongo, 
  pullAllFromMongo, 
  getMongoDb,
  registerDeviceHeartbeat,
  incrementRtuRevision
} from './server/mongodb.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  // ==========================================
  // API Routes
  // ==========================================

  // Health check endpoint
  app.get('/api/health', async (_req, res) => {
    const mongoStatus = await getMongoStatus();
    res.json({
      status: 'ok',
      service: 'FarmFlow Pro Enterprise API (RTU Mode)',
      timestamp: new Date().toISOString(),
      database: {
        engine: 'MongoDB',
        connected: mongoStatus.connected,
        dbName: mongoStatus.dbName,
        rtuRevision: mongoStatus.rtuRevision,
        activeDevicesCount: mongoStatus.activeDevicesCount,
      },
    });
  });

  // RTU Heartbeat & Telemetry (Rapid multi-device sync check)
  app.get('/api/rtu/heartbeat', (req, res) => {
    const deviceId = String(req.query.deviceId || req.headers['x-device-id'] || 'device_anonymous');
    const telemetry = registerDeviceHeartbeat(deviceId);
    res.json({
      status: 'active',
      mode: 'RTU_DIRECT_DATABASE',
      revision: telemetry.revision,
      lastModified: telemetry.lastModified,
      activeDevices: telemetry.activeDevices,
      timestamp: new Date().toISOString(),
    });
  });

  // RTU Manual Trigger / Broadcast
  app.post('/api/rtu/broadcast', (_req, res) => {
    const newRev = incrementRtuRevision();
    res.json({ success: true, revision: newRev, timestamp: new Date().toISOString() });
  });

  // MongoDB Status & Health
  app.get('/api/mongodb/status', async (_req, res) => {
    try {
      const status = await getMongoStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        error: err?.message || 'Failed to query MongoDB status',
      });
    }
  });

  // MongoDB Sync All Collections (Push)
  app.post('/api/mongodb/sync', async (req, res) => {
    try {
      const data = req.body;
      const result = await syncAllToMongo(data);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Error syncing data to MongoDB',
      });
    }
  });

  // MongoDB Pull All Collections
  app.get('/api/mongodb/pull', async (_req, res) => {
    try {
      const result = await pullAllFromMongo();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Error pulling data from MongoDB',
      });
    }
  });

  // MongoDB Upsert Single Document
  app.post('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      const docData = req.body;
      const result = await saveMongoDoc(collection, id, docData);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Error saving document to MongoDB',
      });
    }
  });

  // MongoDB Delete Single Document
  app.delete('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      const result = await deleteMongoDoc(collection, id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Error deleting document from MongoDB',
      });
    }
  });

  // Test MongoDB Connection String
  app.post('/api/mongodb/test-connection', async (_req, res) => {
    try {
      const status = await getMongoStatus();
      res.json({
        success: status.connected,
        message: status.connected
          ? `Successfully connected to MongoDB database "${status.dbName}"`
          : (status.error || 'Could not connect to MongoDB'),
        status,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'MongoDB test connection failed',
      });
    }
  });

  // ==========================================
  // Vite Middleware & SPA Static Serving
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [FarmFlow Pro] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
