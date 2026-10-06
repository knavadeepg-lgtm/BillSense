# BillSense AI Demo Sample Invoices

This folder contains description & quick-load test files for the 3 sample invoice scenarios required by the system:

1. **Sample 1: Clean Purchase Invoice (`sample_clean_invoice.jpg`)**
   - Vendor: Apex Wholesale Distributors
   - Line Items: Raw Material Batch A (₹6,000) + Packaging Containers (₹3,000)
   - Subtotal: ₹9,000.00 | GST (18%): ₹1,620.00 | Total: ₹10,620.00
   - Validation Status: **Valid 🟢**

2. **Sample 2: Mismatched / Wrong Total Invoice (`sample_wrong_total_invoice.jpg`)**
   - Vendor: Apex Wholesale Distributors
   - Line Items: Raw Material Batch A (₹6,000) + Packaging Containers (₹3,000)
   - Subtotal: ₹9,000.00 | GST (18%): ₹1,620.00 | Declared Total: **₹9,999.00 (Wrong)**
   - Validation Status: **Error 🔴** (Rule engine catches `subtotal + GST = ₹10,620 != ₹9,999`)

3. **Sample 3: Duplicate Invoice (`sample_duplicate_invoice.jpg`)**
   - Vendor: Apex Wholesale Distributors
   - Invoice Number: `INV-2026-1001` (Same vendor & invoice number as Sample 1)
   - Total: ₹10,620.00
   - Validation Status: **Error 🔴** (Rule engine catches `DUPLICATE_DOCUMENT`)

> 💡 **Quick Test**: On the web application's **Upload Documents** page, simply click the preset buttons (`+ Clean Invoice`, `+ Wrong Total Invoice`, `+ Duplicate Invoice`, `+ Telugu Bill`) to instantly generate and test these scenarios with 1 click!
