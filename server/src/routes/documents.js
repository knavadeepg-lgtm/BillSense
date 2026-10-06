import express from 'express';
import multer from 'multer';
import { Parser } from 'json2csv';
import { db, uploadFileToStorage } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { extractDataWithGemini } from '../utils/geminiExtractor.js';
import { validateDocumentRules, classifyExpenseCategory } from '../utils/validationEngine.js';
import { updateDocumentSchema } from '../utils/validation.js';

const router = express.Router();

// Multer Storage Configuration: Memory Storage (Buffer) for Production Cloud Uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPG, PNG, WEBP, and PDF files are allowed.'));
    }
  },
});

// Protect all document routes with authentication
router.use(authenticateToken);

/**
 * POST /api/documents/upload
 * Supports single or multiple file uploads to Supabase Storage and Gemini AI analysis
 */
router.post('/upload', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded. Please attach at least one JPG, PNG, or PDF document.',
      });
    }

    const userId = req.user.id;
    const existingDocs = await db.getUserDocuments(userId);
    const processedResults = [];

    for (const file of req.files) {
      try {
        const fileBuffer = file.buffer;

        // 1. Upload file buffer to Supabase Storage "documents" public bucket
        const fileUrl = await uploadFileToStorage(fileBuffer, file.mimetype, file.originalname);

        // 2. AI Extraction with Gemini from in-memory buffer
        const extracted = await extractDataWithGemini(fileBuffer, file.mimetype, file.originalname);

        // 3. Expense Category Classification
        const expense_category = extracted.expense_category || classifyExpenseCategory(extracted.document_type, extracted.vendor_name, extracted.summary);

        // 4. Rule-based Validation
        const validation = validateDocumentRules(
          {
            ...extracted,
            doc_date: extracted.date,
            id: null,
          },
          extracted.line_items || [],
          existingDocs
        );

        // 5. Save Record to Database
        const docRecord = {
          user_id: userId,
          file_url: fileUrl,
          original_filename: file.originalname,
          document_type: extracted.document_type || 'Other',
          expense_category,
          vendor_name: extracted.vendor_name || 'Unknown Vendor',
          invoice_number: extracted.invoice_number || null,
          doc_date: extracted.date || null,
          due_date: extracted.due_date || null,
          currency: extracted.currency || 'INR',
          subtotal: extracted.subtotal || 0,
          gst_percent: extracted.gst_percent || 0,
          gst_amount: extracted.gst_amount || 0,
          total: extracted.total || 0,
          language_detected: extracted.language_detected || 'English',
          confidence: extracted.confidence || 0.9,
          summary: extracted.summary || '',
          validation_status: validation.validation_status,
          validation_issues: validation.validation_issues,
        };

        const savedDoc = await db.createDocument(docRecord, extracted.line_items || []);
        processedResults.push(savedDoc);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err.message);
        processedResults.push({
          original_filename: file.originalname,
          status: 'Failed',
          error: err.message || 'AI extraction failed for this file.',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${processedResults.length} document(s).`,
      documents: processedResults,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents
 * List documents with filtering, search, and date range support
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category, status, search, startDate, endDate } = req.query;

    let documents = await db.getUserDocuments(userId);

    // Filter logic
    if (type && type !== 'All') {
      documents = documents.filter((d) => d.document_type === type);
    }

    if (category && category !== 'All') {
      documents = documents.filter((d) => d.expense_category === category);
    }

    if (status && status !== 'All') {
      documents = documents.filter((d) => d.validation_status === status);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      documents = documents.filter(
        (d) =>
          (d.vendor_name && d.vendor_name.toLowerCase().includes(q)) ||
          (d.invoice_number && d.invoice_number.toLowerCase().includes(q)) ||
          (d.original_filename && d.original_filename.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      documents = documents.filter((d) => d.doc_date && d.doc_date >= startDate);
    }

    if (endDate) {
      documents = documents.filter((d) => d.doc_date && d.doc_date <= endDate);
    }

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/export/csv
 * Export filtered user documents to CSV file
 */
router.get('/export/csv', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category, status, search } = req.query;

    let documents = await db.getUserDocuments(userId);

    if (type && type !== 'All') documents = documents.filter((d) => d.document_type === type);
    if (category && category !== 'All') documents = documents.filter((d) => d.expense_category === category);
    if (status && status !== 'All') documents = documents.filter((d) => d.validation_status === status);
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      documents = documents.filter(
        (d) =>
          (d.vendor_name && d.vendor_name.toLowerCase().includes(q)) ||
          (d.invoice_number && d.invoice_number.toLowerCase().includes(q))
      );
    }

    const fields = [
      { label: 'Document ID', value: 'id' },
      { label: 'File Name', value: 'original_filename' },
      { label: 'Document Type', value: 'document_type' },
      { label: 'Expense Category', value: 'expense_category' },
      { label: 'Vendor Name', value: 'vendor_name' },
      { label: 'Invoice Number', value: 'invoice_number' },
      { label: 'Date', value: 'doc_date' },
      { label: 'Due Date', value: 'due_date' },
      { label: 'Currency', value: 'currency' },
      { label: 'Subtotal', value: 'subtotal' },
      { label: 'GST %', value: 'gst_percent' },
      { label: 'GST Amount', value: 'gst_amount' },
      { label: 'Total Amount', value: 'total' },
      { label: 'Language', value: 'language_detected' },
      { label: 'Status', value: 'validation_status' },
      { label: 'Created At', value: 'created_at' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(documents);

    res.header('Content-Type', 'text/csv');
    res.attachment(`billsense_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id
 * Fetch single document by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const document = await db.getDocumentById(req.params.id, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.',
      });
    }

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/documents/:id
 * Update extracted document fields & re-run rule-based validation engine
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    const existingDoc = await db.getDocumentById(docId, userId);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.',
      });
    }

    const validatedBody = updateDocumentSchema.parse(req.body);

    const mergedData = {
      ...existingDoc,
      ...validatedBody,
    };

    const lineItems = validatedBody.line_items || existingDoc.line_items || [];
    const allUserDocs = await db.getUserDocuments(userId);

    // Re-run validation rules on edited data
    const validation = validateDocumentRules(mergedData, lineItems, allUserDocs);

    const updatedRecord = {
      document_type: mergedData.document_type,
      expense_category: mergedData.expense_category || classifyExpenseCategory(mergedData.document_type, mergedData.vendor_name, mergedData.summary),
      vendor_name: mergedData.vendor_name,
      invoice_number: mergedData.invoice_number,
      doc_date: mergedData.doc_date,
      due_date: mergedData.due_date,
      currency: mergedData.currency,
      subtotal: Number(mergedData.subtotal) || 0,
      gst_percent: Number(mergedData.gst_percent) || 0,
      gst_amount: Number(mergedData.gst_amount) || 0,
      total: Number(mergedData.total) || 0,
      validation_status: validation.validation_status,
      validation_issues: validation.validation_issues,
    };

    const updatedDoc = await db.updateDocument(docId, userId, updatedRecord, lineItems);

    res.json({
      success: true,
      message: 'Document updated and re-validated successfully.',
      document: updatedDoc,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document and remove file from Supabase Storage
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    const success = await db.deleteDocument(docId, userId);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or deletion failed.',
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
