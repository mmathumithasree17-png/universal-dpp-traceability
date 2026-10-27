require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const Product = require('./models/Product');
const auditService = require('./services/auditService');
const runSeed = require('./scripts/seed');

// Import Route Handlers
const systemRoutes = require('./routes/systemRoutes');
const productRoutes = require('./routes/productRoutes');
const batchRoutes = require('./routes/batchRoutes');
const componentRoutes = require('./routes/componentRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const traceRoutes = require('./routes/traceRoutes');
const eventRoutes = require('./routes/eventRoutes');
const defectRoutes = require('./routes/defectRoutes');
const auditRoutes = require('./routes/auditRoutes');
const genealogyRoutes = require('./routes/genealogyRoutes');
const assemblyRoutes = require('./routes/assemblyRoutes');
const mvtecRoutes = require('./routes/mvtecRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount API Routes
app.use('/api/system', systemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/assemblies', assemblyRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/genealogy', genealogyRoutes);
app.use('/api/mvtec', mvtecRoutes);

// Fallback 404 Route for /api
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve compiled client frontend if client/dist exists
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile('index.html', { root: clientDistPath });
  });
}

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Initialize Database & Start Server
async function startServer(customPort = PORT) {
  try {
    await connectDB();

    // Check if initial data exists; if not and not explicitly cleared by user, auto-seed
    const productCount = await Product.countDocuments();
    const { fileStore } = require('./config/db');
    const isUserCleared = Boolean(fileStore.data?.systemState?.userCleared);
    if (productCount === 0 && !isUserCleared) {
      console.log('[Bootstrap] No existing products found. Automatically seeding electric motor demo dataset...');
      await runSeed();
    } else if (isUserCleared && productCount === 0) {
      console.log('[Bootstrap] Dataset was cleared by user. Waiting for new dataset.');
    } else {
      console.log(`[Bootstrap] Found ${productCount} existing products in persistent storage.`);
    }

    // Ensure audit hash chain is unbroken and initialized
    await auditService.ensureInitialChainIntegrity();

    return new Promise((resolve, reject) => {
      const server = app.listen(customPort, '0.0.0.0', () => {
        const addr = server.address();
        const boundPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || customPort || PORT);
        console.log(`====================================================`);
        console.log(`🚀 Universal DPP Backend running on port ${boundPort} (0.0.0.0)`);
        console.log(`   Health Check: http://localhost:${boundPort}/api/system/health`);
        console.log(`   Dashboard Stats: http://localhost:${boundPort}/api/system/stats`);
        console.log(`====================================================`);
        resolve(server);
      });
      server.on('error', (err) => {
        console.error('[Server Error]:', err.message);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
