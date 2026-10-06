# BillSense AI: Smart Bill & Invoice Assistant for Small Businesses

> **BillSense AI** is an intelligent full-stack document processing, validation, and financial insights platform engineered specifically for small business owners handling high volumes of physical/digital bills, receipts, and invoices (in English, Telugu, or regional scripts).

---

## 🌐 Live Demo & Deployment Links

- 🖥️ **Live Frontend Application (Vercel)**: `https://your-app-name.vercel.app` *(Replace with deployed URL)*
- ⚙️ **Live Backend API (Render)**: `https://your-api-name.onrender.com/api` *(Replace with deployed URL)*
- 📹 **Demo Video / Walkthrough**: `https://youtube.com/watch?v=your-demo-video` *(Replace with demo video link)*

---

## 🌟 Key Features

1. **JWT Business Authentication**: Secure user registration & login using bcrypt password hashing and JWT authorization middleware. Data is strictly isolated per business owner.
2. **Multi-Format In-Memory Upload**: Single or batch drag-and-drop file upload supporting JPG, PNG, WEBP, and PDF up to 10 MB. Files are uploaded directly from memory to Supabase Storage.
3. **Google Gemini 2.5 Flash AI Extraction**: Server-side multimodal AI extraction returning strict structured JSON data (`document_type`, `vendor_name`, `invoice_number`, `date`, `due_date`, `currency`, `line_items`, `subtotal`, `gst_percent`, `gst_amount`, `total`, `language_detected`, `confidence`, `summary`).
4. **Regional & Telugu Bill Recognition**: Native recognition of printed and handwritten bills in English, Telugu, or mixed English+Telugu scripts.
5. **Deterministic Rule-Based Validation Engine**: Server-side mathematical checks:
   - Line items sum check vs `subtotal`.
   - GST percentage calculation check (`gst_amount = subtotal × gst_percent / 100`).
   - Final total verification (`subtotal + gst_amount = total`).
   - Duplicate document prevention (matches vendor + invoice # or vendor + date + total).
   - Status tagging (`Valid` 🟢, `Warning` 🟡, `Error` 🔴) with detailed issue descriptions.
6. **Side-by-Side Review Workspace**: Original document preview (left) side-by-side with editable fields and itemized line items table (right). Live re-validation upon editing & saving.
7. **Interactive Visual Analytics**: Modern Stripe/Linear-styled Dashboard featuring Recharts metrics: Indian currency formatting (`en-IN`), spending by category donut chart, top 5 vendors horizontal bar chart, and monthly spending trajectory.
8. **Filtered Document Repository & CSV Export**: Searchable and filterable document list with 1-click CSV export capability.
9. **"Ask Your Documents" AI Chat Assistant**: Q&A interface powered by Gemini 2.5 Flash, returning natural-language answers strictly grounded in your business documents context.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS v4, Axios, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Zod Validation, Multer memory storage.
- **Database & Cloud Storage**: Supabase PostgreSQL + Supabase Storage ("documents" public bucket).
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`), executed strictly server-side.

---

## 📁 Repository Project Structure

```
Billsense/
├── client/                      # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/          # Sidebar, ProtectedLayout navigation components
│   │   ├── context/             # AuthContext authentication provider
│   │   ├── pages/               # Login, Register, Dashboard, Upload, ReviewDocument, Documents, AskAI
│   │   ├── services/            # Axios API instance with JWT interceptors
│   │   ├── App.jsx              # Application router
│   │   └── main.jsx             # React DOM entry point
│   ├── .env.example             # Client environment template
│   ├── vercel.json              # Vercel SPA routing rewrite configuration
│   └── package.json
│
├── server/                      # Express Node.js Backend Server
│   ├── src/
│   │   ├── config/              # Supabase DB & Storage client
│   │   ├── middleware/          # Auth JWT, rate limiters, central error handler
│   │   ├── routes/              # Auth, Documents, Dashboard, and Chat API routes
│   │   ├── utils/               # Gemini AI extractor, rule validation engine, Zod schemas
│   │   └── index.js             # Express server entry point
│   ├── .env.example             # Server environment template
│   └── package.json
│
├── sample_documents/            # Directory for demo PDF and image sample bills
├── supabase_schema.sql          # Database tables and indexes SQL file
├── supabase_storage.sql         # Supabase Storage bucket & policy setup SQL file
└── README.md                    # System documentation
```

---

## 📋 Environment Variables Reference

### Backend (`/server/.env`)

| Variable Name | Purpose | Where Set |
|---|---|---|
| `PORT` | HTTP Server Port (default `5000` locally) | Render / Server Environment |
| `CLIENT_URL` | Allowed CORS origins (e.g., `http://localhost:5173,https://your-app.vercel.app`) | Render / Server Environment |
| `JWT_SECRET` | Secret key for signing and verifying JWT authentication tokens | Render / Server Environment |
| `GEMINI_API_KEY` | Google Gemini API Key for document extraction & chat Q&A | Render / Server Environment |
| `SUPABASE_URL` | Supabase Project URL (`https://xyz.supabase.co`) | Render / Server Environment |
| `SUPABASE_KEY` | Supabase Service Role Key or Anon Key for DB & Storage access | Render / Server Environment |

### Frontend (`/client/.env`)

| Variable Name | Purpose | Where Set |
|---|---|---|
| `VITE_API_URL` | Full URL to Express API endpoints including `/api` suffix (e.g. `https://your-api.onrender.com/api`) | Vercel / Client Environment |

---

## 🗄️ Database & File Storage Setup (Supabase)

1. Log in to [Supabase](https://supabase.com) and create a PostgreSQL project.
2. Open the **SQL Editor** in your Supabase dashboard:
   - Run the contents of `supabase_schema.sql` to create `users`, `documents`, and `line_items` tables and indexes.
   - Run the contents of `supabase_storage.sql` to create the public storage bucket named **`documents`** and set storage access policies.

---

## ⚡ Local Setup & Execution Guide

### 1. Configure Environment Files
Copy templates and create local `.env` files:
- `server/.env` (fill in `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`)
- `client/.env` (`VITE_API_URL=http://localhost:5000/api`)

### 2. Install Dependencies & Start

#### Backend:
```bash
cd server
npm install
npm run dev
```
*Server runs at `http://localhost:5000`*

#### Frontend:
```bash
cd client
npm install
npm run dev
```
*Client runs at `http://localhost:5173`*

---

## 🚀 Production Deployment Instructions

### 1. Backend Deployment (Render)
- **Repository**: Connect your GitHub repository.
- **Root Directory**: `server`
- **Environment / Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add `PORT` (`5000`), `CLIENT_URL` (`https://your-app.vercel.app`), `JWT_SECRET`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`.

### 2. Frontend Deployment (Vercel)
- **Repository**: Connect your GitHub repository.
- **Root Directory**: `client`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Add `VITE_API_URL` set to `https://your-api.onrender.com/api`.

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create business account.
- `POST /api/auth/login` - Authenticate & obtain JWT token.
- `GET /api/auth/me` - Retrieve current authenticated profile.

### Documents (`/api/documents`)
- `POST /api/documents/upload` - Upload bills directly to Supabase Storage, run Gemini AI extraction & rule validation.
- `GET /api/documents` - List documents with search, type, category, date range, and status filters.
- `GET /api/documents/:id` - Fetch document details and line items.
- `PUT /api/documents/:id` - Edit extracted fields/items and re-run validation engine.
- `DELETE /api/documents/:id` - Delete document record and remove file from Supabase Storage.
- `GET /api/documents/export/csv` - Export filtered document records to CSV.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Summary metrics and chart datasets formatted with Indian currency (`en-IN`).

### Ask AI Assistant (`/api/chat`)
- `POST /api/chat/ask` - Natural language grounded Q&A against user documents using Gemini 2.5 Flash.
#   B i l l S e n s e  
 #   B i l l S e n s e  
 