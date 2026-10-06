import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Trash2, 
  Eye, 
  ArrowRight,
  FileCheck
} from 'lucide-react';
import api from '../services/api';

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const isAllowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'].includes(file.type);
      const isSizeOk = file.size <= 10 * 1024 * 1024; // 10MB
      return isAllowed && isSizeOk;
    });

    if (validFiles.length < files.length) {
      setErrorMsg('Some files were ignored. Only JPG, PNG, WEBP, and PDF under 10MB are supported.');
    } else {
      setErrorMsg('');
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    setFileStatuses(
      newFiles.map((file) => ({
        name: file.name,
        size: file.size,
        status: 'Pending',
        docId: null,
        error: null,
      }))
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setFileStatuses(fileStatuses.filter((_, i) => i !== index));
  };

  const startUploadAndAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');

    setFileStatuses((prev) =>
      prev.map((item) => ({ ...item, status: 'Analyzing' }))
    );

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.documents) {
        const docs = res.data.documents;

        setFileStatuses((prev) =>
          prev.map((item, idx) => {
            const doc = docs[idx];
            if (doc && doc.id) {
              return { ...item, status: 'Done', docId: doc.id };
            } else {
              return { ...item, status: 'Failed', error: doc?.error || 'Extraction failed' };
            }
          })
        );
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload and analyze files.');
      setFileStatuses((prev) =>
        prev.map((item) => ({ ...item, status: 'Failed', error: 'Upload process error' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Quick Demo sample builder
  const handleLoadSample = (sampleType) => {
    let filename = 'sample_clean_invoice.jpg';
    let mime = 'image/jpeg';

    if (sampleType === 'wrong_total') {
      filename = 'sample_wrong_total_invoice.jpg';
    } else if (sampleType === 'duplicate') {
      filename = 'sample_duplicate_invoice.jpg';
    } else if (sampleType === 'telugu') {
      filename = 'sample_telugu_regional_bill.jpg';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('INVOICE / బస్సు బిల్లు', 40, 50);

    ctx.font = '14px sans-serif';
    ctx.fillText(`Vendor: ${sampleType === 'telugu' ? 'Sri Krishna Traders (శ్రీ కృష్ణ ట్రేడర్స్)' : 'Apex Wholesale Ltd'}`, 40, 90);
    ctx.fillText(`Invoice #: INV-2026-${sampleType === 'duplicate' ? '1001' : Math.floor(1000 + Math.random() * 9000)}`, 40, 115);
    ctx.fillText(`Date: 2026-10-06`, 40, 140);

    ctx.beginPath();
    ctx.moveTo(40, 160);
    ctx.lineTo(560, 160);
    ctx.stroke();

    ctx.fillText('1. Raw Material Batch A (5 x 1200) = 6000', 40, 200);
    ctx.fillText('2. Packaging Boxes (2 x 1500) = 3000', 40, 230);

    ctx.fillText('Subtotal: ₹9,000.00', 350, 280);
    ctx.fillText('GST (18%): ₹1,620.00', 350, 310);
    ctx.fillText(`Total Amount: ${sampleType === 'wrong_total' ? '₹9,999.00 (Mismatched)' : '₹10,620.00'}`, 350, 350);

    canvas.toBlob((blob) => {
      const file = new File([blob], filename, { type: mime });
      handleFiles([file]);
    }, mime);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <UploadCloud className="w-7 h-7 text-indigo-600" />
          <span>Upload Bills & Invoices</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Drag and drop single or multiple receipts, invoices, or utility bills (English, Telugu, or handwritten).
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-white p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 relative overflow-hidden shadow-xs ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">
              Drop files here or <span className="text-indigo-600 underline">click to browse</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Supports JPG, PNG, WEBP, and PDF up to 10MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Demo Sample Invoices Shortcuts */}
      <div className="ui-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Quick Demo: Test extraction with instant sample bills</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleLoadSample('clean')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Clean Invoice
          </button>
          <button
            onClick={() => handleLoadSample('wrong_total')}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Wrong Total Invoice
          </button>
          <button
            onClick={() => handleLoadSample('duplicate')}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Duplicate Invoice
          </button>
          <button
            onClick={() => handleLoadSample('telugu')}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Telugu Bill
          </button>
        </div>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="ui-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Files Ready for AI Processing ({selectedFiles.length})</span>
            </h3>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setFileStatuses([]);
              }}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {fileStatuses.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{(item.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {/* Status Chips */}
                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'Pending' && (
                    <span className="text-xs font-bold text-slate-600 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300">
                      Ready
                    </span>
                  )}
                  {item.status === 'Analyzing' && (
                    <span className="text-xs font-bold text-indigo-700 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Gemini Extracting...
                    </span>
                  )}
                  {item.status === 'Done' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Analyzed
                      </span>
                      {item.docId && (
                        <button
                          onClick={() => navigate(`/documents/${item.docId}`)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Side-by-Side</span>
                        </button>
                      )}
                    </div>
                  )}
                  {item.status === 'Failed' && (
                    <span className="text-xs font-bold text-rose-800 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Failed
                    </span>
                  )}

                  {!isUploading && item.status !== 'Done' && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={startUploadAndAnalyze}
              disabled={isUploading || selectedFiles.length === 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract & Validate with AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
