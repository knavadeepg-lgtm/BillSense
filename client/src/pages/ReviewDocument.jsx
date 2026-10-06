import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileText, 
  Receipt
} from 'lucide-react';
import api from '../services/api';

export default function ReviewDocument() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [doc, setDoc] = useState(null);
  const [formData, setFormData] = useState({
    document_type: 'Other',
    expense_category: 'Misc',
    vendor_name: '',
    invoice_number: '',
    doc_date: '',
    due_date: '',
    currency: 'INR',
    subtotal: 0,
    gst_percent: 0,
    gst_amount: 0,
    total: 0,
  });
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      if (res.data.success && res.data.document) {
        const d = res.data.document;
        setDoc(d);
        setFormData({
          document_type: d.document_type || 'Other',
          expense_category: d.expense_category || 'Misc',
          vendor_name: d.vendor_name || '',
          invoice_number: d.invoice_number || '',
          doc_date: d.doc_date || '',
          due_date: d.due_date || '',
          currency: d.currency || 'INR',
          subtotal: d.subtotal || 0,
          gst_percent: d.gst_percent || 0,
          gst_amount: d.gst_amount || 0,
          total: d.total || 0,
        });
        setLineItems(d.line_items || []);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setErrorMsg('Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(updated[index].quantity) || 0;
      const p = Number(updated[index].unit_price) || 0;
      updated[index].amount = Number((q * p).toFixed(2));
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: 'New Item', quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSaveAndRevalidate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        subtotal: Number(formData.subtotal) || 0,
        gst_percent: Number(formData.gst_percent) || 0,
        gst_amount: Number(formData.gst_amount) || 0,
        total: Number(formData.total) || 0,
        line_items: lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          amount: Number(item.amount) || 0,
        })),
      };

      const res = await api.put(`/documents/${id}`, payload);
      if (res.data.success && res.data.document) {
        setDoc(res.data.document);
        setSuccessMsg('Document updated & re-validated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save document changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading document review workspace...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="ui-card p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto bg-white">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Document Not Found</h2>
        <p className="text-slate-500 text-sm">The document requested could not be retrieved.</p>
        <Link to="/documents" className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">
          Return to Documents List
        </Link>
      </div>
    );
  }

  const fileUrl = doc.file_url?.startsWith('/')
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`.replace('/api', '') + doc.file_url
    : doc.file_url;

  const isPdf = doc.original_filename?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{doc.vendor_name || doc.original_filename}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {doc.document_type}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Original file: <span className="font-mono text-slate-700 font-semibold">{doc.original_filename}</span>
            </p>
          </div>
        </div>

        {/* Validation Status Badge & Save Button */}
        <div className="flex items-center gap-3">
          {doc.validation_status === 'Valid' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Valid Document</span>
            </span>
          )}
          {doc.validation_status === 'Warning' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Warning Flags</span>
            </span>
          )}
          {doc.validation_status === 'Error' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Validation Error</span>
            </span>
          )}

          <button
            onClick={handleSaveAndRevalidate}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save & Re-validate</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Validation Issues Alert Cards */}
      {doc.validation_issues && doc.validation_issues.length > 0 && (
        <div className="ui-card p-5 rounded-2xl border-l-4 border-amber-500 bg-amber-50/60 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Rule Validation Issues Detected ({doc.validation_issues.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-900 font-medium">
            {doc.validation_issues.map((issue, idx) => (
              <li key={idx} className={issue.severity === 'Error' ? 'text-rose-800 font-bold' : 'text-amber-900'}>
                <span className="font-extrabold">{issue.code}:</span> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SIDE-BY-SIDE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ORIGINAL DOCUMENT PREVIEW */}
        <div className="lg:col-span-5 ui-card p-4 rounded-2xl space-y-4 sticky top-6 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Original Document Preview</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Lang: <strong className="text-indigo-600">{doc.language_detected || 'English'}</strong>
            </span>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-h-[450px] flex items-center justify-center p-2 relative">
            {isPdf ? (
              <iframe
                src={fileUrl}
                title="Document PDF Preview"
                className="w-full h-[550px] rounded-lg border-0"
              />
            ) : (
              <img
                src={fileUrl}
                alt="Original Bill Preview"
                className="max-h-[550px] w-auto max-w-full object-contain rounded-lg shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/500x700/0f172a/64748b?text=Document+Preview+Unavailable';
                }}
              />
            )}
          </div>

          {/* AI Confidence & Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Confidence Score</span>
              </span>
              <span className="font-extrabold text-indigo-600 text-sm">
                {((doc.confidence || 0.9) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed italic border-t border-slate-200 pt-2 font-medium">
              "{doc.summary || 'Extracted receipt document.'}"
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITABLE EXTRACTED FIELDS FORM */}
        <div className="lg:col-span-7 ui-card p-6 rounded-2xl space-y-6 bg-white">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Extracted Key Fields</span>
            </h3>
            <span className="text-xs font-medium text-slate-500">Edits automatically trigger re-validation</span>
          </div>

          <form onSubmit={handleSaveAndRevalidate} className="space-y-5">
            {/* Classification Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Document Type
                </label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleFieldChange}
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
                >
                  <option value="Purchase Invoice">Purchase Invoice</option>
                  <option value="Sales Invoice">Sales Invoice</option>
                  <option value="Utility Bill">Utility Bill</option>
                  <option value="Rent Receipt">Rent Receipt</option>
                  <option value="Salary/Expense Receipt">Salary/Expense Receipt</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Expense Category
                </label>
                <select
                  name="expense_category"
                  value={formData.expense_category}
                  onChange={handleFieldChange}
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
                >
                  <option value="Inventory">Inventory</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Transport">Transport</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
            </div>

            {/* Vendor & Invoice Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Vendor / Issuer Name
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Apex Wholesale"
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Invoice / Receipt Number
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleFieldChange}
                  placeholder="e.g. INV-10042"
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm font-mono"
                />
              </div>
            </div>

            {/* Dates & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Document Date
                </label>
                <input
                  type="date"
                  name="doc_date"
                  value={formData.doc_date}
                  onChange={handleFieldChange}
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleFieldChange}
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleFieldChange}
                  placeholder="INR"
                  className="w-full px-3.5 py-2.5 rounded-xl ui-input text-sm font-bold text-indigo-600"
                />
              </div>
            </div>

            {/* Financial Amounts Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    name="subtotal"
                    value={formData.subtotal}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 rounded-lg ui-input text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="gst_percent"
                    value={formData.gst_percent}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 rounded-lg ui-input text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gst_amount"
                    value={formData.gst_amount}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 rounded-lg ui-input text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-indigo-700 mb-1 font-bold">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total"
                    value={formData.total}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-extrabold"
                  />
                </div>
              </div>
            </div>

            {/* LINE ITEMS TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itemized Line Items</h4>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-24">Unit Price</th>
                      <th className="p-3 w-24">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg ui-input text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg ui-input text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg ui-input text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => handleLineItemChange(idx, 'amount', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg ui-input text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-400 italic">
                          No itemized lines extracted. Click "Add Line Item" to enter manually.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes & Re-validate</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
