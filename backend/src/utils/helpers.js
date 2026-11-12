/**
 * CKTracker API Standardized Response Helpers
 */

const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendPaginated = (res, items = [], total = 0, page = 1, limit = 10, message = 'Data fetched successfully') => {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Generate sequential enterprise identifiers
 */
const generateCode = (prefix = 'CK', sequenceNumber = 1) => {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
};

/**
 * Monetary & Quotation Calculation Engine
 */
const calculateQuotationTotals = (items = [], discountPercent = 0, gstPercent = 18, installation = 0, transport = 0, additional = 0) => {
  let subtotal = 0;

  const processedItems = items.map((item) => {
    const qty = parseInt(item.quantity, 10) || 1;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    const lineTotal = Math.max(0, qty * unitPrice - discount);
    subtotal += lineTotal;

    return {
      ...item,
      quantity: qty,
      unitPrice,
      discount,
      totalPrice: Math.round(lineTotal * 100) / 100,
    };
  });

  const discountAmount = Math.round((subtotal * (parseFloat(discountPercent) || 0)) / 100 * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round((taxableAmount * (parseFloat(gstPercent) || 0)) / 100 * 100) / 100;
  const installationCharges = parseFloat(installation) || 0;
  const transportCharges = parseFloat(transport) || 0;
  const additionalCharges = parseFloat(additional) || 0;

  const grandTotal = Math.round(
    (taxableAmount + gstAmount + installationCharges + transportCharges + additionalCharges) * 100
  ) / 100;

  return {
    processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount,
    gstAmount,
    grandTotal,
  };
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
  generateCode,
  calculateQuotationTotals,
};
