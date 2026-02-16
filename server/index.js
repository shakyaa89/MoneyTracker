import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './constants.js';
import { FinanceDataModel } from './models/FinanceData.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;

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
  res.json({ ok: true });
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

async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

start();