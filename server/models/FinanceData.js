import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['cash', 'bank', 'card', 'wallet'], required: true },
    balance: { type: Number, required: true },
  },
  { _id: false },
);

const TransactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    amount: { type: Number, required: true },
    categoryId: { type: String },
    accountId: { type: String, required: true },
    toAccountId: { type: String },
    note: { type: String },
    isRecurring: { type: Boolean },
  },
  { _id: false },
);

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    icon: { type: String },
  },
  { _id: false },
);

const FinanceDataSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'singleton' },
    accounts: { type: [AccountSchema], default: [] },
    transactions: { type: [TransactionSchema], default: [] },
    categories: { type: [CategorySchema], default: [] },
  },
  { timestamps: true },
);

export const FinanceDataModel = mongoose.model('FinanceData', FinanceDataSchema);