import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Trash2, 
  Receipt,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [search, type, category, status, startDate, endDate]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (type !== 'All') params.type = type;
      if (category !== 'All') params.category = category;
      if (status !== 'All') params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/documents', { params });
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setErrorMsg('Failed to load documents list.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete document "${name}"?`)) return;

    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data.success) {
        setDocuments(documents.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Could not delete document.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (type !== 'All') params.append('type', type);
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (search) params.append('search', search);

      const response = await api.get(`/documents/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `billsense_documents_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV Export failed:', err);
      alert('Failed to export CSV file.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>Document Repository</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Search, filter, review, and export all extracted business invoices and bills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export CSV</span>
          </button>
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New</span>
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ui-card p-5 rounded-2xl space-y-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, invoice #..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl ui-input text-sm"
            />
          </div>

          {/* Document Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
            >
              <option value="All">All Document Types</option>
              <option value="Purchase Invoice">Purchase Invoice</option>
              <option value="Sales Invoice">Sales Invoice</option>
              <option value="Utility Bill">Utility Bill</option>
              <option value="Rent Receipt">Rent Receipt</option>
              <option value="Salary/Expense Receipt">Salary/Expense Receipt</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Inventory">Inventory</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Transport">Transport</option>
              <option value="Salaries">Salaries</option>
              <option value="Misc">Misc</option>
            </select>
          </div>

          {/* Validation Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
            >
              <option value="All">All Validation Statuses</option>
              <option value="Valid">Valid Only</option>
              <option value="Warning">Warning Only</option>
              <option value="Error">Error Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* DOCUMENTS TABLE LIST */}
      <div className="ui-card rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Vendor & Invoice</th>
                <th className="p-4">Type & Category</th>
                <th className="p-4">Doc Date</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-center">Validation Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span>Loading document records...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Receipt className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-slate-800">No documents found</p>
                    <p className="text-xs text-slate-500 font-medium">
                      Try adjusting your search filters or upload your first bill.
                    </p>
                    <Link
                      to="/upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload your first bill</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Vendor & Invoice # */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {d.vendor_name || 'Unknown Vendor'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                        {d.invoice_number ? `#${d.invoice_number}` : d.original_filename}
                      </div>
                    </td>

                    {/* Type & Category */}
                    <td className="p-4">
                      <div className="text-xs font-bold text-slate-800">{d.document_type}</div>
                      <div className="text-[11px] text-indigo-600 font-bold">{d.expense_category}</div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-600 text-xs font-medium">
                      {d.doc_date || 'N/A'}
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 text-right font-extrabold text-slate-900 text-sm">
                      {d.currency || '₹'}{Number(d.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Validation Status Badges */}
                    <td className="p-4 text-center">
                      {d.validation_status === 'Valid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Valid
                        </span>
                      )}
                      {d.validation_status === 'Warning' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Warning
                        </span>
                      )}
                      {d.validation_status === 'Error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Error
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/documents/${d.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(d.id, d.vendor_name || d.original_filename)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
