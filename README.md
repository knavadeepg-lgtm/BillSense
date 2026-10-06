# BillSense AI: Smart Bill & Invoice Assistant

An AI-powered Intelligent Document Processing app for small businesses. Upload an invoice, bill or receipt (photo or PDF, English or Telugu) and BillSense AI reads it, extracts the data, classifies it, validates it, and turns your documents into spending insights.

**Live Demo:** `<add deployed frontend link>`
**Backend API:** `<add deployed backend link>`/api/health
**Demo Video:** `<add demo video link>`

---

## Problem Statement

Small businesses handle large volumes of invoices, bills, and receipts in different formats, languages, and quality levels. Processing them manually is time-consuming, causes data entry errors, lets duplicate or incorrect invoices go unnoticed, and leaves owners without a clear view of their spending.

## Solution

BillSense AI automates the whole workflow:

| Problem | What BillSense AI does |
|---|---|
| Slow manual reading | AI extracts the data automatically |
| Messy, mixed documents | AI classifies each document (invoice, utility bill, rent receipt, and more) |
| Errors and duplicates | A rule-based validation engine checks totals, GST, missing fields, and repeats |
| No insights | Dashboard with charts, plus an "Ask your documents" AI chat |

## Features

- **Secure authentication:** register and login with JWT and bcrypt. Each user sees only their own documents.
- **Smart upload:** drag-and-drop JPG, PNG, or PDF files (up to 10 MB), with a processing status for each file.
- **AI extraction (Google Gemini):** vendor, invoice number, dates, line items, subtotal, GST, total, language, confidence score, and a plain-English summary. Works with English, Telugu, and mixed-language documents.
- **Classification:** document type (Purchase Invoice, Sales Invoice, Utility Bill, Rent Receipt, Salary/Expense Receipt, Other) and expense category.
- **Validation engine:**
  - line items add up to the subtotal
  - GST amount and final total are correct
  - duplicate invoice detection
  - missing fields and low-confidence extraction flagged
  - status shown as Valid, Warning, or Error with readable messages
- **Review screen:** compare the original document with the extracted fields side by side, edit any value, and re-validate.
- **Dashboard:** total documents, total spend, flagged documents, duplicates caught, spend by category, top vendors, and monthly trend.
- **Ask your documents:** ask questions like "How much did I spend on rent this year?" and get answers grounded only in your own data.
- **Search, filter, and CSV export** for your documents.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, React Router, Tailwind CSS, Axios, Recharts |
| Backend | Node.js, Express.js, JWT, bcrypt, Zod, Multer |
| Database and storage | Supabase PostgreSQL and Supabase Storage |
| AI | Google Gemini API (called only from the backend) |
| Deployment | Vercel (frontend), Render (backend), Supabase (database) |

## Architecture

```
React (Vite)  --->  Express API  --->  Supabase PostgreSQL
 (Vercel)           (Render)    \-->  Supabase Storage (files)
                         |
                         +--->  Google Gemini API (extraction + chat)
```

The AI key is stored only in backend environment variables and is never exposed to the browser.

## Project Structure

```
Billsense/
├── client/              # React + Vite frontend
├── server/              # Express backend
├── sample_documents/    # Sample files for testing the demo
├── supabase_schema.sql  # Database tables
└── README.md
```

## Getting Started (Local Setup)

### Prerequisites

- Node.js 18 or newer
- A Supabase project (free tier works)
- A Google Gemini API key from Google AI Studio

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Billsense
```

### 2. Set up Supabase

1. Open the **SQL Editor** in your Supabase project, then paste and run `supabase_schema.sql`.
2. Go to **Storage** and create a **public** bucket named `documents`.
3. Copy your **Project URL** and **secret (service_role) key** from Project Settings, then API Keys.

### 3. Configure environment variables

Copy the example files and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase secret (service_role) key. Backend only. |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `GEMINI_API_KEY` | Google Gemini API key. Backend only. |
| `PORT` | Server port (default 5000) |
| `CLIENT_URL` | Frontend URL allowed by CORS (for example `http://localhost:5173`) |

**client/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (for example `http://localhost:5000/api`) |

> Never commit `.env` files or share your keys. Only the `.env.example` files belong in the repository.

### 4. Install and run

Backend:

```bash
cd server
npm install
npm start
```

Frontend (in a second terminal):

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### 5. Try it with the sample documents

Register an account, then upload the files in `sample_documents/` in this order:

| File | What it shows |
|---|---|
| `01_valid_invoice.pdf` | Clean extraction, status Valid |
| `04_electricity_bill.pdf` | Classified as Utility Bill |
| `05_rent_receipt.pdf` | Classified as Rent Receipt |
| `02_wrong_total_invoice.pdf` | Validation error: total does not match the items and GST |
| `03_duplicate_invoice.pdf` | Duplicate of file 01 is detected |

Then open the dashboard and try the **Ask AI** page.

## API Overview

All routes are under `/api`.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Login and receive a JWT |
| POST | `/documents/upload` | Upload and process documents |
| GET | `/documents` | List documents (with filters) |
| GET | `/documents/:id` | Get one document |
| PUT | `/documents/:id` | Edit and re-validate a document |
| DELETE | `/documents/:id` | Delete a document |
| GET | `/documents/export/csv` | Export documents as CSV |
| GET | `/dashboard/stats` | Dashboard statistics |
| POST | `/chat/ask` | Ask a question about your documents |
| GET | `/health` | Health check |

## Deployment

**Database:** run `supabase_schema.sql` and create the public `documents` storage bucket in Supabase.

**Backend (Render):**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL` (set to your Vercel URL)

**Frontend (Vercel):**
- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variable: `VITE_API_URL` (your Render URL followed by `/api`)

The free Render tier sleeps when idle, so the first request after a break can take around 50 seconds.

## Security

- Passwords are hashed with bcrypt, and routes are protected with JWT.
- All request bodies are validated with Zod.
- CORS is limited to the configured frontend URL, and auth and AI routes are rate limited.
- API keys live only in backend environment variables.
- Users can only access their own documents.

## Future Improvements

- Handwritten document support with higher accuracy
- Telugu and other regional language answers in the chat
- Accounting software export (Tally, Zoho Books)
- WhatsApp upload for bills
- Monthly spending reports by email
