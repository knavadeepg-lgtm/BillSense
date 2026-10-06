/**
 * Rule-based Validation & Classification Engine for BillSense AI
 * Runs server-side deterministic checks on extracted data.
 */

export const classifyExpenseCategory = (documentType, vendorName = '', summary = '') => {
  const text = `${documentType} ${vendorName} ${summary}`.toLowerCase();

  if (documentType === 'Utility Bill' || text.includes('electricity') || text.includes('power') || text.includes('water') || text.includes('internet') || text.includes('telecom')) {
    return 'Utilities';
  }
  if (documentType === 'Rent Receipt' || text.includes('rent') || text.includes('lease') || text.includes('landlord')) {
    return 'Rent';
  }
  if (documentType === 'Salary/Expense Receipt' || text.includes('salary') || text.includes('payroll') || text.includes('wages') || text.includes('reimbursement')) {
    return 'Salaries';
  }
  if (text.includes('transport') || text.includes('freight') || text.includes('fuel') || text.includes('travel') || text.includes('courier') || text.includes('logistics')) {
    return 'Transport';
  }
  if (documentType === 'Purchase Invoice' || text.includes('supply') || text.includes('material') || text.includes('stock') || text.includes('goods') || text.includes('wholesale')) {
    return 'Inventory';
  }
  return 'Misc';
};

export const validateDocumentRules = (docData, lineItems = [], existingUserDocs = []) => {
  const issues = [];
  
  const subtotal = Number(docData.subtotal) || 0;
  const gstPercent = Number(docData.gst_percent) || 0;
  const gstAmount = Number(docData.gst_amount) || 0;
  const total = Number(docData.total) || 0;
  const confidence = Number(docData.confidence) ?? 1.0;

  // Rule 1: Sum of line items equals subtotal
  if (lineItems.length > 0) {
    const sumLineItems = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const diff = Math.abs(sumLineItems - subtotal);
    if (diff > 1.0) {
      issues.push({
        code: 'LINE_ITEMS_SUBTOTAL_MISMATCH',
        severity: 'Error',
        message: `Sum of line items (${docData.currency || '₹'}${sumLineItems.toFixed(2)}) does not match subtotal (${docData.currency || '₹'}${subtotal.toFixed(2)}).`,
      });
    }
  }

  // Rule 2: GST amount calculation check (subtotal * gst_percent / 100)
  if (subtotal > 0 && gstPercent > 0) {
    const expectedGst = (subtotal * gstPercent) / 100;
    const gstDiff = Math.abs(expectedGst - gstAmount);
    if (gstDiff > 1.0) {
      issues.push({
        code: 'GST_CALCULATION_MISMATCH',
        severity: 'Error',
        message: `GST amount (${docData.currency || '₹'}${gstAmount.toFixed(2)}) does not match ${gstPercent}% of subtotal (${docData.currency || '₹'}${expectedGst.toFixed(2)}).`,
      });
    }
  }

  // Rule 3: Subtotal + GST equals Total
  const expectedTotal = subtotal + gstAmount;
  if (subtotal > 0 && total > 0) {
    const totalDiff = Math.abs(expectedTotal - total);
    if (totalDiff > 1.0) {
      issues.push({
        code: 'TOTAL_MISMATCH',
        severity: 'Error',
        message: `Subtotal + GST (${docData.currency || '₹'}${expectedTotal.toFixed(2)}) does not match declared total (${docData.currency || '₹'}${total.toFixed(2)}).`,
      });
    }
  }

  // Rule 4: Check missing critical fields
  if (!docData.vendor_name || docData.vendor_name.trim() === '' || docData.vendor_name === 'Unknown Vendor') {
    issues.push({
      code: 'MISSING_VENDOR',
      severity: 'Warning',
      message: 'Vendor name could not be identified automatically.',
    });
  }

  if (!docData.invoice_number || docData.invoice_number.trim() === '') {
    issues.push({
      code: 'MISSING_INVOICE_NUMBER',
      severity: 'Warning',
      message: 'Invoice number is missing or unreadable.',
    });
  }

  if (!docData.doc_date) {
    issues.push({
      code: 'MISSING_DATE',
      severity: 'Warning',
      message: 'Document date is missing.',
    });
  }

  if (total <= 0) {
    issues.push({
      code: 'ZERO_OR_MISSING_TOTAL',
      severity: 'Error',
      message: 'Invoice total amount is missing or zero.',
    });
  }

  // Rule 5: Low confidence warning
  if (confidence < 0.75) {
    issues.push({
      code: 'LOW_CONFIDENCE',
      severity: 'Warning',
      message: `AI confidence rating is low (${(confidence * 100).toFixed(0)}%). Please review extracted fields carefully.`,
    });
  }

  // Rule 6: Duplicate detection (same vendor + invoice number OR same vendor + date + total)
  if (existingUserDocs && existingUserDocs.length > 0) {
    const duplicate = existingUserDocs.find((prevDoc) => {
      if (prevDoc.id === docData.id) return false;

      const sameVendor =
        docData.vendor_name &&
        prevDoc.vendor_name &&
        docData.vendor_name.trim().toLowerCase() === prevDoc.vendor_name.trim().toLowerCase();

      const sameInvoiceNo =
        docData.invoice_number &&
        prevDoc.invoice_number &&
        docData.invoice_number.trim().toLowerCase() === prevDoc.invoice_number.trim().toLowerCase();

      const sameDate = docData.doc_date && prevDoc.doc_date && docData.doc_date === prevDoc.doc_date;
      const sameTotal = total > 0 && Math.abs(Number(prevDoc.total) - total) < 0.5;

      // Duplicate match condition
      if (sameVendor && sameInvoiceNo) return true;
      if (sameVendor && sameDate && sameTotal) return true;
      return false;
    });

    if (duplicate) {
      issues.push({
        code: 'DUPLICATE_DOCUMENT',
        severity: 'Error',
        message: `Duplicate detected: Matches existing invoice "${duplicate.invoice_number || duplicate.original_filename}" from ${duplicate.vendor_name}.`,
      });
    }
  }

  // Determine overall validation status
  let validation_status = 'Valid';
  const hasErrors = issues.some((i) => i.severity === 'Error');
  const hasWarnings = issues.some((i) => i.severity === 'Warning');

  if (hasErrors) {
    validation_status = 'Error';
  } else if (hasWarnings) {
    validation_status = 'Warning';
  }

  return {
    validation_status,
    validation_issues: issues,
  };
};
