import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './constants.js';
import { FinanceDataModel } from './models/FinanceData.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment variables.');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function getOrCreateFinanceData() {
  let data = await FinanceDataModel.findOne({ key: 'singleton' }).lean();
  if (!data) {
    data = await FinanceDataModel.create({
      key: 'singleton',
      accounts: DEFAULT_ACCOUNTS,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
    });
    return {
      accounts: data.accounts,
      transactions: data.transactions,
      categories: data.categories,
    };
  }
  return {
    accounts: data.accounts,
    transactions: data.transactions,
    categories: data.categories,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/finance', async (_req, res) => {
  try {
    const data = await getOrCreateFinanceData();
    res.json(data);
  } catch (error) {
    console.error('GET /api/finance failed:', error);
    res.status(500).json({ message: 'Failed to fetch finance data' });
  }
});

app.put('/api/finance', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.accounts) || !Array.isArray(payload.transactions) || !Array.isArray(payload.categories)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const updated = await FinanceDataModel.findOneAndUpdate(
      { key: 'singleton' },
      {
        $set: {
          accounts: payload.accounts,
          transactions: payload.transactions,
          categories: payload.categories,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    res.json({
      accounts: updated.accounts,
      transactions: updated.transactions,
      categories: updated.categories,
    });
  } catch (error) {
    console.error('PUT /api/finance failed:', error);
    res.status(500).json({ message: 'Failed to save finance data' });
  }
});

if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(indexPath);
  });
}

let server;

async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    server = app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve(undefined)));
      });
    }
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Shutdown failed:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start();