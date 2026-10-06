-- BillSense AI Database Schema for Supabase PostgreSQL

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) DEFAULT 'Other', -- Purchase Invoice, Sales Invoice, Utility Bill, Rent Receipt, Salary/Expense Receipt, Other
    expense_category VARCHAR(100) DEFAULT 'Misc', -- Inventory, Utilities, Rent, Transport, Salaries, Misc
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100),
    doc_date DATE,
    due_date DATE,
    currency VARCHAR(10) DEFAULT 'INR',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    gst_percent NUMERIC(5, 2) DEFAULT 0.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) DEFAULT 0.00,
    language_detected VARCHAR(50) DEFAULT 'English',
    confidence NUMERIC(3, 2) DEFAULT 1.00,
    summary TEXT,
    validation_status VARCHAR(20) DEFAULT 'Valid', -- Valid, Warning, Error
    validation_issues JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Line Items table
CREATE TABLE IF NOT EXISTS line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    amount NUMERIC(12, 2) DEFAULT 0.00
);

-- Indexes for fast querying & filtering
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_vendor ON documents(vendor_name);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(expense_category);
CREATE INDEX IF NOT EXISTS idx_documents_doc_date ON documents(doc_date);
CREATE INDEX IF NOT EXISTS idx_line_items_doc_id ON line_items(document_id);
