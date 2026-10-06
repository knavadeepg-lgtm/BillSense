import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().or(z.string().transform(Number)).default(1),
  unit_price: z.number().or(z.string().transform(Number)).default(0),
  amount: z.number().or(z.string().transform(Number)).default(0),
});

export const updateDocumentSchema = z.object({
  document_type: z.enum([
    'Purchase Invoice',
    'Sales Invoice',
    'Utility Bill',
    'Rent Receipt',
    'Salary/Expense Receipt',
    'Other',
  ]).optional(),
  expense_category: z.enum([
    'Inventory',
    'Utilities',
    'Rent',
    'Transport',
    'Salaries',
    'Misc',
  ]).optional(),
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  doc_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  currency: z.string().optional(),
  subtotal: z.number().or(z.string().transform(Number)).optional(),
  gst_percent: z.number().or(z.string().transform(Number)).optional(),
  gst_amount: z.number().or(z.string().transform(Number)).optional(),
  total: z.number().or(z.string().transform(Number)).optional(),
  line_items: z.array(lineItemSchema).optional(),
});

export const chatQuerySchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters long'),
});
