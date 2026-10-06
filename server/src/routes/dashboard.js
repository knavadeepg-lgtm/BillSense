import express from 'express';
import { db } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/dashboard/stats
 * Aggregates user document metrics, spending by category, top vendors, and monthly trends
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await db.getUserDocuments(userId);

    // Summary Metrics
    const totalDocuments = documents.length;
    const totalSpend = documents.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
    const flaggedCount = documents.filter((d) => d.validation_status === 'Warning' || d.validation_status === 'Error').length;
    
    // Count duplicates caught
    const duplicatesCount = documents.filter((d) => {
      const issues = d.validation_issues || [];
      return Array.isArray(issues) && issues.some((i) => i.code === 'DUPLICATE_DOCUMENT');
    }).length;

    // Spend by Expense Category
    const categoryMap = {};
    documents.forEach((d) => {
      const cat = d.expense_category || 'Misc';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(d.total) || 0);
    });

    const categoryData = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      value: Number(categoryMap[cat].toFixed(2)),
    }));

    // Top 5 Vendors by Spend
    const vendorMap = {};
    documents.forEach((d) => {
      const vendor = d.vendor_name || 'Unknown Vendor';
      vendorMap[vendor] = (vendorMap[vendor] || 0) + (Number(d.total) || 0);
    });

    const topVendors = Object.keys(vendorMap)
      .map((vendor) => ({
        vendor,
        amount: Number(vendorMap[vendor].toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly Spend Trend
    const monthMap = {};
    documents.forEach((d) => {
      let monthKey = 'Recent';
      if (d.doc_date) {
        const dateObj = new Date(d.doc_date);
        if (!isNaN(dateObj.getTime())) {
          monthKey = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
      }
      monthMap[monthKey] = (monthMap[monthKey] || 0) + (Number(d.total) || 0);
    });

    const monthlyTrend = Object.keys(monthMap).map((month) => ({
      month,
      spend: Number(monthMap[month].toFixed(2)),
    }));

    // Recent 5 documents
    const recentDocuments = documents.slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalDocuments,
        totalSpend: Number(totalSpend.toFixed(2)),
        flaggedCount,
        duplicatesCount,
        categoryData,
        topVendors,
        monthlyTrend,
        recentDocuments,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
