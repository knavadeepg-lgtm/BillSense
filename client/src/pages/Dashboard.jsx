import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Copy, 
  UploadCloud, 
  TrendingUp, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  Eye,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6'];

// Helper for Indian Currency Formatting (en-IN)
const formatINR = (val, showDecimals = true) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading business spending insights...</p>
      </div>
    );
  }

  const {
    totalDocuments = 0,
    totalSpend = 0,
    flaggedCount = 0,
    duplicatesCount = 0,
    categoryData = [],
    topVendors = [],
    monthlyTrend = [],
    recentDocuments = [],
  } = stats || {};

  const totalCategorySum = categoryData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOP WELCOME BANNER */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name || 'Partner'}</span>
            <span>👋</span>
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl font-medium">
            BillSense AI has extracted and analyzed your business bills. Review spending breakdown and validation alerts below.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          <span>Upload New Bill</span>
        </Link>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents Card */}
        <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{totalDocuments}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Extracted & stored</span>
          </p>
        </div>

        {/* Total Spending Card (Indian Digit Grouping) */}
        <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-2xl p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spending</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {formatINR(totalSpend, true)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Across all invoices</span>
          </p>
        </div>

        {/* Flagged Documents Card */}
        <div className="bg-amber-50/70 border border-amber-100/90 rounded-2xl p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged Documents</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{flaggedCount}</div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Requires rule review</p>
        </div>

        {/* Duplicates Prevented Card */}
        <div className="bg-rose-50/70 border border-rose-100/90 rounded-2xl p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duplicates Caught</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
              <Copy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{duplicatesCount}</div>
          <p className="text-xs text-rose-700 mt-1 font-medium">Prevents double payments</p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spend by Category Donut Chart */}
        <div className="lg:col-span-6 ui-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <span>Spending by Category</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Breakdown</span>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <PieChartIcon className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-700">No document categories recorded yet</p>
              <p className="text-xs text-slate-500">Upload invoices to view automatic category insights.</p>
              <Link to="/upload" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs mt-1">
                Upload your first bill
              </Link>
            </div>
          ) : (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = totalCategorySum > 0 ? ((data.value / totalCategorySum) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-lg space-y-1">
                              <p className="font-bold text-indigo-300">{data.name}</p>
                              <p>Amount: <span className="font-extrabold">{formatINR(data.value, true)}</span></p>
                              <p className="text-slate-300 text-[11px]">Share: {percent}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Full Category Legend with colors & amounts without decimals */}
              <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs border-t border-slate-100 pt-3">
                {categoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    ></span>
                    <span>{item.name}: {formatINR(item.value, false)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Vendors Horizontal Bar Chart */}
        <div className="lg:col-span-6 ui-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Top 5 Vendors by Spend</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Highest payouts</span>
          </div>

          {topVendors.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Building2 className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-700">No vendor expenditure recorded yet</p>
              <p className="text-xs text-slate-500">Add documents to highlight top vendor spending.</p>
              <Link to="/upload" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs mt-1">
                Upload your first bill
              </Link>
            </div>
          ) : (
            <div className="h-68">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendors} layout="vertical" margin={{ left: 10, right: 25, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    tickFormatter={(v) => formatINR(v, false)}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="vendor" 
                    stroke="#334155" 
                    width={140} 
                    tickFormatter={(name) => (name.length > 16 ? `${name.substring(0, 16)}...` : name)}
                    tick={{ fontSize: 11, fontWeight: 600 }} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-lg space-y-1">
                            <p className="font-bold text-indigo-300">{data.vendor}</p>
                            <p>Total Payout: <span className="font-extrabold">{formatINR(data.amount, true)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[0, 8, 8, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Spend Trend Area Chart */}
        <div className="lg:col-span-12 ui-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Monthly Spend Trend</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Spending timeline</span>
          </div>

          {monthlyTrend.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <TrendingUp className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-700">No historical monthly data recorded</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpendLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fontWeight: 600, fontSize: 12 }} />
                  <YAxis 
                    stroke="#64748b" 
                    tickFormatter={(v) => formatINR(v, false)} 
                    tick={{ fontWeight: 600, fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-lg space-y-1">
                            <p className="font-bold text-indigo-300">{data.payload.month}</p>
                            <p>Monthly Spend: <span className="font-extrabold">{formatINR(data.value, true)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSpendLight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* RECENT DOCUMENTS TABLE */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Recent Uploaded Invoices</span>
          </h3>
          <Link to="/documents" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
            <span>View Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentDocuments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    No documents found. Click "Upload New Bill" to add your first bill!
                  </td>
                </tr>
              ) : (
                recentDocuments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.vendor_name || 'Unknown Vendor'}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">{d.document_type}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">{d.doc_date || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatINR(d.total || 0, true)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        d.validation_status === 'Valid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : d.validation_status === 'Warning'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {d.validation_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/documents/${d.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
