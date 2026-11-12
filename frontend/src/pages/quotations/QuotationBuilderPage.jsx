import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  FileText,
  X,
  Send,
} from 'lucide-react';
import {
  getProjectQuotations,
  getQuotationById,
  createQuotation,
  reviseQuotation,
  submitQuotationDecision,
  downloadQuotationPDF,
  sendQuotationEmail,
} from '../../services/quotation.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { value: 'BASE_CABINETS', label: 'Base Cabinets' },
  { value: 'WALL_CABINETS', label: 'Wall Cabinets' },
  { value: 'TALL_UNITS', label: 'Tall Units' },
  { value: 'COUNTERTOPS', label: 'Countertops' },
  { value: 'LAMINATES', label: 'Laminates' },
  { value: 'ACRYLIC_FINISHES', label: 'Acrylic Finishes' },
  { value: 'HINGES', label: 'Hinges' },
  { value: 'DRAWER_CHANNELS', label: 'Drawer Channels' },
  { value: 'HANDLES', label: 'Handles' },
  { value: 'KITCHEN_ACCESSORIES', label: 'Kitchen Accessories' },
  { value: 'INSTALLATION_SERVICES', label: 'Installation Services' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
];

const QuotationBuilderPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [activeQuotation, setActiveQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Builder state for creating new or revising
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([
    {
      category: 'BASE_CABINETS',
      description: 'Marine Plywood Base Cabinets with PVC Edge Banding',
      dimensions: '12ft run',
      materialFinish: 'Century BWP Marine Ply + Inner Laminate',
      quantity: 1,
      unitPrice: 180000,
      discount: 0,
    },
    {
      category: 'WALL_CABINETS',
      description: 'High-Gloss Acrylic Wall Cabinets with Aventos Lift-up',
      dimensions: '10ft run',
      materialFinish: 'Rehau Pure White Gloss Acrylic',
      quantity: 1,
      unitPrice: 120000,
      discount: 0,
    },
    {
      category: 'COUNTERTOPS',
      description: 'Quartz Countertop with Beveled Profile',
      dimensions: '55 SqFt',
      materialFinish: 'Kalinga Stone Calacatta White',
      quantity: 55,
      unitPrice: 1250,
      discount: 0,
    },
    {
      category: 'DRAWER_CHANNELS',
      description: 'Blum Legrabox Soft-Close Drawer Systems',
      dimensions: '500mm depth',
      materialFinish: 'Stainless Steel Silk White',
      quantity: 5,
      unitPrice: 4200,
      discount: 0,
    },
    {
      category: 'INSTALLATION_SERVICES',
      description: 'Factory Trained Precision Installation & Fitting',
      dimensions: 'Full modular kitchen',
      materialFinish: 'All hardware & silicone included',
      quantity: 1,
      unitPrice: 35000,
      discount: 0,
    },
  ]);

  const [discountPercent, setDiscountPercent] = useState(5);
  const [gstPercent, setGstPercent] = useState(18);
  const [installationCharges, setInstallationCharges] = useState(0);
  const [transportCharges, setTransportCharges] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [terms, setTerms] = useState(
    '1. 50% Advance Token on quotation acceptance to initiate factory production.\n2. 40% Before dispatch from factory.\n3. 10% On completion of modular installation.\n4. 10-year warranty applies to Hettich/Blum hinges and carcass integrity.'
  );

  // Load Projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const res = await getProjects({ limit: 50 });
        if (res.success && res.data.length > 0) {
          setProjects(res.data);
          setSelectedProjectId(res.data[0].id);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Load Quotations for selected project
  useEffect(() => {
    if (!selectedProjectId) return;

    const loadQuotations = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await getProjectQuotations(selectedProjectId);
        if (res.success) {
          setQuotations(res.data);
          setActiveQuotation(res.data[0] || null);
          setIsEditing(res.data.length === 0);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch quotations');
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [selectedProjectId]);

  // Real-time calculation helpers
  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach((item) => {
      const line = (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0) - (parseFloat(item.discount) || 0);
      subtotal += Math.max(0, line);
    });

    const discountAmount = Math.round((subtotal * (parseFloat(discountPercent) || 0)) / 100);
    const taxable = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round((taxable * (parseFloat(gstPercent) || 0)) / 100);
    const grandTotal =
      taxable +
      gstAmount +
      (parseFloat(installationCharges) || 0) +
      (parseFloat(transportCharges) || 0) +
      (parseFloat(additionalCharges) || 0);

    return { subtotal, discountAmount, gstAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        category: 'KITCHEN_ACCESSORIES',
        description: 'New Hardware / Accessory',
        dimensions: '',
        materialFinish: '',
        quantity: 1,
        unitPrice: 5000,
        discount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        items,
        discountPercentage: parseFloat(discountPercent) || 0,
        gstPercentage: parseFloat(gstPercent) || 18,
        installationCharges: parseFloat(installationCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        additionalCharges: parseFloat(additionalCharges) || 0,
        termsAndConditions: terms,
      };

      let res;
      if (activeQuotation && !activeQuotation.isFrozen) {
        // Create revision if revising existing
        res = await reviseQuotation(activeQuotation.id, payload);
      } else {
        // Create new
        res = await createQuotation(selectedProjectId, payload);
      }

      if (res.success) {
        setSuccessMsg(`Quotation ${res.data.quotationNumber} generated and saved!`);
        setIsEditing(false);
        const refetch = await getProjectQuotations(selectedProjectId);
        if (refetch.success) {
          setQuotations(refetch.data);
          setActiveQuotation(refetch.data[0]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!activeQuotation) return;
    try {
      setIsDownloading(true);
      setErrorMsg('');
      await downloadQuotationPDF(activeQuotation.id, activeQuotation.quotationNumber);
      setSuccessMsg(`Quotation PDF downloaded!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!activeQuotation) return;
    try {
      setIsSendingEmail(true);
      setErrorMsg('');
      const res = await sendQuotationEmail(activeQuotation.id);
      if (res.success) {
        setSuccessMsg(`Quotation PDF emailed to client successfully!`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCustomerDecision = async (decision) => {
    if (!activeQuotation) return;
    try {
      setLoading(true);
      const res = await submitQuotationDecision(activeQuotation.id, { decision });
      if (res.success) {
        setSuccessMsg(`Quotation ${decision === 'APPROVED' ? 'approved! Stage 6 completed.' : 'rejected.'}`);
        const refetch = await getProjectQuotations(selectedProjectId);
        if (refetch.success) {
          setQuotations(refetch.data);
          setActiveQuotation(refetch.data[0]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record decision');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotation & Proposal Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build itemized quotations with automatic GST and discounts, generate professional PDFKit documents, and manage digital approvals.
          </p>
        </div>

        {user?.role !== 'CUSTOMER' && activeQuotation && !isEditing && (
          <button
            onClick={() => {
              // Populate builder with current active quotation items to revise
              setItems(activeQuotation.items || []);
              setDiscountPercent(activeQuotation.discountPercentage || 0);
              setGstPercent(activeQuotation.gstPercentage || 18);
              setInstallationCharges(activeQuotation.installationCharges || 0);
              setTransportCharges(activeQuotation.transportCharges || 0);
              setIsEditing(true);
            }}
            className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4 text-gold-400" />
            Create Revised Proposal (V{activeQuotation.versionNumber + 1})
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Project Selector & Revision Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setIsEditing(false);
            }}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none w-full sm:w-auto"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.title} ({p.customer?.user?.fullName})
              </option>
            ))}
          </select>
        </div>

        {quotations.length > 0 && !isEditing && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Revisions:</span>
            {quotations.map((q) => (
              <button
                key={q.id}
                onClick={() => setActiveQuotation(q)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  activeQuotation?.id === q.id
                    ? 'bg-gold-500 text-navy-950 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                V{q.versionNumber} ({q.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading quotation specifications & calculations...</p>
        </div>
      ) : isEditing ? (
        /* Quotation Builder Mode */
        <form onSubmit={handleSaveQuotation} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Itemized Modular Kitchen Cost Estimation</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Categorize carcass units, finishes, tandem drawers, hinges, and countertops with line-item pricing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3.5 py-1.5 bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold-600" /> Add Line Item
              </button>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description & Specifications</th>
                    <th className="py-2.5 px-3">Dimensions / Finish</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const lineTotal = (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0) - (parseFloat(item.discount) || 0);
                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-gold-500"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-gold-500"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="e.g. 18mm BWP, Rehau Acrylic"
                            value={item.materialFinish}
                            onChange={(e) => handleItemChange(index, 'materialFinish', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-gold-500"
                          />
                        </td>

                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16 p-2 rounded-lg border border-slate-200 text-xs text-center focus:ring-1 focus:ring-gold-500"
                          />
                        </td>

                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="w-28 p-2 rounded-lg border border-slate-200 text-xs text-right font-medium focus:ring-1 focus:ring-gold-500"
                          />
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Taxes, Freight & Discount Engine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Terms & Payment Milestones
                </span>
                <textarea
                  rows="4"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Materials Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2">
                    Discount (%):
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-14 p-1 rounded border border-slate-200 text-center"
                    />
                  </span>
                  <span className="text-emerald-700 font-semibold">- {formatCurrency(totals.discountAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>GST Rate (18%):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totals.gstAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Installation Charges (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={installationCharges}
                    onChange={(e) => setInstallationCharges(e.target.value)}
                    className="w-24 p-1 rounded border border-slate-200 text-right"
                  />
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Transportation & Freight (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={transportCharges}
                    onChange={(e) => setTransportCharges(e.target.value)}
                    className="w-24 p-1 rounded border border-slate-200 text-right"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-bold text-slate-900">
                  <span>Grand Total (All-Inclusive):</span>
                  <span className="text-gold-600 text-lg">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {activeQuotation && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 shadow-md cursor-pointer"
              >
                Save & Generate Proposal
              </button>
            </div>
          </div>
        </form>
      ) : activeQuotation ? (
        /* Quotation Preview Mode */
        <div className="space-y-6">
          {/* Status banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
                  {activeQuotation.quotationNumber}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activeQuotation.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeQuotation.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activeQuotation.status}
                </span>
                {activeQuotation.isFrozen && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    Frozen Revision
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 pt-1">
                Total Value: {formatCurrency(activeQuotation.grandTotal)}
              </h2>
              <p className="text-xs text-slate-500">
                Date: {new Date(activeQuotation.quotationDate).toLocaleDateString()} • Valid Until:{' '}
                {new Date(activeQuotation.expiryDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-slate-600" />}
                Download PDF
              </button>

              {user?.role !== 'CUSTOMER' && (
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin text-gold-400" /> : <Send className="w-4 h-4 text-gold-400" />}
                  Email to Client
                </button>
              )}
            </div>
          </div>

          {/* Customer Approval Banner (When Customer is logged in and Quotation is SENT) */}
          {activeQuotation.status === 'SENT' && !activeQuotation.isFrozen && (
            <div className="bg-gold-50/70 border border-gold-300 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  Client Quotation Acceptance
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Accepting this quotation confirms the budget and moves the project to Milestone 6 (Advance Token & Factory Production).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCustomerDecision('APPROVED')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Quotation
                </button>
                <button
                  onClick={() => handleCustomerDecision('REJECTED')}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Line items preview table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Itemized Bill of Materials</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Item & Category</th>
                    <th className="py-3 px-4">Specifications & Finish</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeQuotation.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{item.description}</span>
                        <span className="text-[10px] text-slate-400">{item.category.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.materialFinish || item.dimensions || 'Standard Factory Spec'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 mt-6 text-xs">
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Terms & Conditions
                </span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {activeQuotation.termsAndConditions}
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(activeQuotation.subtotal)}</span>
                </div>
                {activeQuotation.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({activeQuotation.discountPercentage}%):</span>
                    <span className="font-semibold">- {formatCurrency(activeQuotation.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST ({activeQuotation.gstPercentage}%):</span>
                  <span className="font-semibold">{formatCurrency(activeQuotation.gstAmount)}</span>
                </div>
                {activeQuotation.installationCharges > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Installation Charges:</span>
                    <span className="font-semibold">{formatCurrency(activeQuotation.installationCharges)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-gold-600">{formatCurrency(activeQuotation.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No quotation created for this project yet</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-gold-400" /> Create Quotation Proposal
          </button>
        </div>
      )}
    </div>
  );
};

export default QuotationBuilderPage;
