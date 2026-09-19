import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRoutes from './routes/apiRoutes.js';
import { seedDatabase } from './seed.js';
import { FarmerModel } from './models/farmerModel.js';
import { ProcessorModel } from './models/processorModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Auto-seed on startup if enabled
if (process.env.AUTO_SEED !== 'false') {
  try {
    seedDatabase({ force: false });
  } catch (err) {
    console.error('[Startup Seed Error]:', err.message);
  }
}

// Interactive API Documentation Dashboard
function renderApiDocs(req, res) {
  const farmerCount = FarmerModel.count();
  const processorCount = ProcessorModel.count();

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Farming Matchmaker API</title>
  <style>
    :root {
      --primary: #15803d;
      --primary-dark: #166534;
      --accent: #22c55e;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --code-bg: #1e293b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #166534 0%, #15803d 100%);
      color: white;
      padding: 2.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px -5px rgba(22, 101, 52, 0.2);
    }
    header h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; font-size: 1.1rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
    }
    .stat-card .val { font-size: 1.8rem; font-weight: bold; }
    .stat-card .lbl { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card h2 { font-size: 1.3rem; margin-bottom: 1rem; color: var(--primary-dark); display: flex; align-items: center; gap: 0.5rem; }
    .endpoint {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 8px;
      border-left: 4px solid var(--primary);
    }
    .endpoint.post { border-left-color: #3b82f6; }
    .endpoint.put { border-left-color: #f59e0b; }
    .endpoint.patch { border-left-color: #8b5cf6; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
      border-radius: 4px;
      color: white;
      margin-right: 0.5rem;
    }
    .badge.get { background: #15803d; }
    .badge.post { background: #3b82f6; }
    .badge.put { background: #f59e0b; }
    .badge.patch { background: #8b5cf6; }
    .route-url { font-family: monospace; font-size: 0.95rem; font-weight: 600; }
    .desc { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.4rem; }
    a.test-link {
      display: inline-block;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    a.test-link:hover { text-decoration: underline; }
    pre {
      background: var(--code-bg);
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    code { font-family: 'SFMono-Regular', Consolas, Menlo, monospace; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🌾 Contract Farming Matchmaker</h1>
      <p>AI Matching Engine & Automated Agricultural Supply Contract Platform</p>
      <div class="stats">
        <div class="stat-card">
          <div class="val">${farmerCount}</div>
          <div class="lbl">Registered Farms</div>
        </div>
        <div class="stat-card">
          <div class="val">${processorCount}</div>
          <div class="lbl">Processor Demands</div>
        </div>
        <div class="stat-card">
          <div class="val">SQLite</div>
          <div class="lbl">Storage Engine</div>
        </div>
        <div class="stat-card">
          <div class="val">Active</div>
          <div class="lbl">API Status</div>
        </div>
      </div>
    </header>

    <div class="card">
      <h2>🚀 Live API Endpoints</h2>

      <div class="endpoint">
        <span class="badge get">GET</span>
        <span class="route-url">/api/match/:processor_id</span>
        <div class="desc"><strong>AI Matching Engine:</strong> Calculates multi-factor compatibility (soil, season, past yield, distance, capacity) between a processor demand and all farms, returning a ranked list with natural language AI recommendations.</div>
        <a class="test-link" href="/api/match/proc_wheat_01" target="_blank">🔗 Test Wheat Matching (/api/match/proc_wheat_01)</a> &bull;
        <a class="test-link" href="/api/match/proc_potato_02" target="_blank">🔗 Test Potato Matching (/api/match/proc_potato_02)</a>
      </div>

      <div class="endpoint post">
        <span class="badge post">POST</span>
        <span class="route-url">/api/farmers</span>
        <div class="desc">Register a new farm with coordinates, soil type, total acreage, and past yield history.</div>
        <a class="test-link" href="/api/farmers" target="_blank">🔗 View Registered Farmers (GET /api/farmers)</a>
      </div>

      <div class="endpoint post">
        <span class="badge post">POST</span>
        <span class="route-url">/api/processors</span>
        <div class="desc">Post a new crop demand requirement from a food processor or buyer.</div>
        <a class="test-link" href="/api/processors" target="_blank">🔗 View Processor Demands (GET /api/processors)</a>
      </div>

      <div class="endpoint post">
        <span class="badge post">POST</span>
        <span class="route-url">/api/contracts/generate</span>
        <div class="desc"><strong>AI Contract Generator:</strong> Takes processor and farmer IDs, automatically drafts a comprehensive legally structured contract text with quality SLAs, pricing, advance terms, and inspection protocols.</div>
        <a class="test-link" href="/api/contracts" target="_blank">🔗 View Contracts (GET /api/contracts)</a>
      </div>

      <div class="endpoint put">
        <span class="badge put">PUT</span>
        <span class="route-url">/api/deliveries/track</span>
        <div class="desc">Updates delivery milestones against the contract (Scheduled, In Transit, Delivered) with checkpoint logs, automatically updating contract status to Fulfilled upon completion.</div>
        <a class="test-link" href="/api/deliveries" target="_blank">🔗 View Deliveries (GET /api/deliveries)</a>
      </div>

      <div class="endpoint">
        <span class="badge get">GET</span>
        <span class="route-url">/api/health</span>
        <div class="desc">System health check and live database row count metrics.</div>
        <a class="test-link" href="/api/health" target="_blank">🔗 Check System Health</a>
      </div>
    </div>

    <div class="card">
      <h2>🧠 AI Matching Engine Formula</h2>
      <p>The AI Engine scores farm compatibility using an agronomic multi-factor model:</p>
      <pre><code>Compatibility Score = 
  (0.25 × Distance Proximity Score) +
  (0.25 × Soil Agronomic Affinity Score) +
  (0.30 × Historical Yield & Grade Consistency) +
  (0.10 × Seasonal Harvest Lead Time) +
  (0.10 × Farm Acreage Capacity Ratio)</code></pre>
    </div>
  </div>
</body>
  </html>`);
}

// Mount Central API Routes
app.use('/api', apiRoutes);

// Docs endpoints
app.get('/docs', renderApiDocs);
app.get('/api-docs', renderApiDocs);

// Serve Frontend SPA if built, otherwise serve HTML docs
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', renderApiDocs);
}

// 404 Handler for unhandled API calls
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server only when run directly (not when imported in tests)
const isMain = process.argv[1] && (
  process.argv[1].endsWith('server.js') || 
  import.meta.url.endsWith(process.argv[1])
);

if (isMain && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌱 Contract Farming Matchmaker API running on port ${PORT}`);
    console.log(`📡 Local URL: http://localhost:${PORT}`);
    console.log(`📋 API Documentation & Test Dashboard: http://localhost:${PORT}/`);
    console.log(`====================================================`);
  });
}

export default app;
