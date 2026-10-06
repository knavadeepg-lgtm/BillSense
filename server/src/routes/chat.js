import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chatQuerySchema } from '../utils/validation.js';

const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

router.use(authenticateToken);

/**
 * POST /api/chat/ask
 * Grounded Q&A against user's uploaded document database using Gemini 2.5 Flash
 */
router.post('/ask', aiLimiter, async (req, res, next) => {
  try {
    const validated = chatQuerySchema.parse(req.body);
    const userId = req.user.id;

    // Fetch user documents & line items
    const userDocs = await db.getUserDocuments(userId);

    if (!userDocs || userDocs.length === 0) {
      return res.json({
        success: true,
        answer: "You haven't uploaded any documents yet! Please upload bills or receipts first so I can analyze and answer questions about your business expenses.",
        sourcesCount: 0,
      });
    }

    // Format context summary of extracted documents
    const contextLines = userDocs.map((doc, idx) => {
      const lineItemsText = (doc.line_items || [])
        .map((li) => `  - Item: ${li.description}, Qty: ${li.quantity}, Unit Price: ${doc.currency || '₹'}${li.unit_price}, Line Amount: ${doc.currency || '₹'}${li.amount}`)
        .join('\n');

      return `Document #${idx + 1}:
- Vendor: ${doc.vendor_name || 'Unknown'}
- Invoice Number: ${doc.invoice_number || 'N/A'}
- Document Type: ${doc.document_type}
- Category: ${doc.expense_category}
- Date: ${doc.doc_date || 'N/A'}
- Subtotal: ${doc.currency || '₹'}${doc.subtotal}
- GST (${doc.gst_percent}%): ${doc.currency || '₹'}${doc.gst_amount}
- Total Amount: ${doc.currency || '₹'}${doc.total}
- Summary: ${doc.summary || 'N/A'}
- Line Items:
${lineItemsText || '  - No itemized details'}`;
    }).join('\n\n');

    const prompt = `
You are BillSense AI, a business financial advisor assistant.
You must answer the user's question using ONLY the provided document context below.

DOCUMENT CONTEXT FOR THIS USER:
=================================
${contextLines}
=================================

USER QUESTION: "${validated.question}"

RULES:
1. Base your answer STRICTLY on the document context provided above.
2. If the user's question cannot be answered using the provided data, explicitly say:
   "Based on your uploaded documents, I do not have enough data to answer this question."
3. Provide concise, clear numbers, dollar/rupee totals, vendor names, or item counts when answering.
4. Do not invent or assume information outside of the context.
`;

    let answerText = '';

    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

        let responseReceived = false;
        for (const modelName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            answerText = response.text().trim();
            responseReceived = true;
            break;
          } catch (err) {
            console.warn(`Chat model ${modelName} failed, trying next:`, err.message);
          }
        }

        if (!responseReceived) {
          answerText = generateFallbackChatAnswer(validated.question, userDocs);
        }
      } catch (err) {
        console.error('Gemini chat call error:', err);
        answerText = generateFallbackChatAnswer(validated.question, userDocs);
      }
    } else {
      // Deterministic fallback response when Gemini key is offline
      answerText = generateFallbackChatAnswer(validated.question, userDocs);
    }

    res.json({
      success: true,
      answer: answerText,
      sourcesCount: userDocs.length,
    });
  } catch (error) {
    next(error);
  }
});

// Grounded local analyzer for testing without Gemini API key
function generateFallbackChatAnswer(question, userDocs) {
  const q = question.toLowerCase();

  const totalSpend = userDocs.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  
  if (q.includes('total') || q.includes('overall') || q.includes('how much did i spend')) {
    return `Based on your ${userDocs.length} uploaded documents, your overall spending total is ₹${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })} across ${new Set(userDocs.map(d => d.expense_category)).size} expense categories.`;
  }

  if (q.includes('electricity') || q.includes('power') || q.includes('utility') || q.includes('utilities')) {
    const utilityDocs = userDocs.filter(d => d.expense_category === 'Utilities' || (d.vendor_name && d.vendor_name.toLowerCase().includes('electricity')));
    const utilitySum = utilityDocs.reduce((sum, d) => sum + Number(d.total), 0);
    return `You have ${utilityDocs.length} utility bill(s) recorded. Total utility spend is ₹${utilitySum.toFixed(2)}.`;
  }

  if (q.includes('rent')) {
    const rentDocs = userDocs.filter(d => d.expense_category === 'Rent' || d.document_type === 'Rent Receipt');
    const rentSum = rentDocs.reduce((sum, d) => sum + Number(d.total), 0);
    return `You have ${rentDocs.length} rent receipt(s) recorded, totaling ₹${rentSum.toFixed(2)}.`;
  }

  if (q.includes('top vendor') || q.includes('vendor') || q.includes('who did i pay')) {
    const vendorMap = {};
    userDocs.forEach(d => {
      const v = d.vendor_name || 'Unknown';
      vendorMap[v] = (vendorMap[v] || 0) + Number(d.total);
    });
    const sorted = Object.entries(vendorMap).sort((a, b) => b[1] - a[1]);
    const topVendor = sorted[0];
    return `Your top vendor by total expenditure is "${topVendor[0]}" with a total of ₹${topVendor[1].toFixed(2)} across your bills.`;
  }

  return `Based on your ${userDocs.length} uploaded document(s), you have recorded spending across vendors including ${Array.from(new Set(userDocs.map(d => d.vendor_name))).slice(0, 3).join(', ')}, totaling ₹${totalSpend.toFixed(2)}.`;
}

export default router;
