import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Download,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  X,
  TrendingUp,
} from 'lucide-react';
import { getProjectPayments, getPaymentSummary, recordPayment, downloadReceiptPDF } from '../../services/payment.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const PaymentManagementPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    milestoneTitle: '50% Production Advance Token',
    notes: '',
  });

  // Load Projects & Global Summary
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [projRes, sumRes] = await Promise.all([
          getProjects({ limit: 50 }),
          user?.role === 'ADMIN' ? getPaymentSummary() : Promise.resolve({ data: null }),
        ]);

        if (projRes.success && projRes.data.length > 0) {
          setProjects(projRes.data);
          setSelectedProjectId(projRes.data[0].id);
        }
        if (sumRes.data) {
          setGlobalSummary(sumRes.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to initialize payments');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Load Payments for selected project
  useEffect(() => {
    if (!selectedProjectId) return;

    const loadPayments = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await getProjectPayments(selectedProjectId);
        if (res.success) {
          setPayments(res.data.payments);
          setSummary(res.data.summary);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch payments');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [selectedProjectId]);

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await recordPayment({
        ...paymentForm,
        projectId: selectedProjectId,
        amount: parseFloat(paymentForm.amount),
      });

      if (res.success) {
        setSuccessMsg(`Payment of ₹${paymentForm.amount} recorded! Receipt #${res.data.receiptNumber} generated.`);
        setIsModalOpen(false);
        setPaymentForm({
          amount: '',
          paymentMethod: 'BANK_TRANSFER',
          transactionReference: '',
          milestoneTitle: 'Production Advance Token',
          notes: '',
        });
        const refetch = await getProjectPayments(selectedProjectId);
        if (refetch.success) {
          setPayments(refetch.data.payments);
          setSummary(refetch.data.summary);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    try {
      setIsDownloading(true);
      await downloadReceiptPDF(paymentId, receiptNumber);
      setSuccessMsg(`Receipt ${receiptNumber} downloaded!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download receipt');
    } finally {
      setIsDownloading(false);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track milestone-based advance payments, verify transaction references, and generate downloadable official PDF receipts.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            Record Payment Transaction
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

      {/* Global Executive Finance KPI Bar (Admin Only) */}
      {user?.role === 'ADMIN' && globalSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Order Pipeline</span>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(globalSummary.totalPipelineValue)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Active project contracts</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Revenue Received</span>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(globalSummary.totalReceived)}</p>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Verified bank transactions</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500">Outstanding Receivables</span>
            <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(globalSummary.totalOutstanding)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Due on factory dispatch/fitting</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-500">Overdue Invoices</span>
            <p className="text-2xl font-bold text-slate-800 mt-2">{globalSummary.overdueCount}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Accounts team follow-up queue</span>
          </div>
        </div>
      )}

      {/* Project Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none w-full sm:w-auto"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.title} ({p.customer?.user?.fullName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading payment transactions & receipts...</p>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Project Specific Milestone Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Contract Budget</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(summary.contractValue)}</p>
                <span className="text-[10px] text-slate-400">All-inclusive total</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs text-emerald-800 font-medium">Amount Received</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(summary.totalReceived)}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">{summary.percentPaid}% Settled</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-xs text-amber-800 font-medium">Remaining Milestone Balance</span>
                <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(summary.remainingBalance)}</p>
                <span className="text-[10px] text-slate-400">Due before handover</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${summary.percentPaid}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Payment Transactions Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Verified Payment Records</h2>
              <span className="text-xs text-slate-400 font-medium">{payments.length} transactions</span>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No payment records found for this project</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Record Payment Transaction" to log advance tokens.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Receipt #</th>
                      <th className="py-3 px-6">Milestone Title</th>
                      <th className="py-3 px-6">Mode & Reference</th>
                      <th className="py-3 px-6">Payment Date</th>
                      <th className="py-3 px-6 text-right">Amount</th>
                      <th className="py-3 px-6 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {p.receiptNumber}
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-800 block">{p.milestoneTitle}</span>
                          {p.notes && <span className="text-[11px] text-slate-400 italic">{p.notes}</span>}
                        </td>

                        <td className="py-4 px-6 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mb-0.5">
                            {p.paymentMethod}
                          </span>
                          <p className="font-mono text-[11px] text-slate-500">{p.transactionReference}</p>
                        </td>

                        <td className="py-4 px-6 text-slate-600">
                          {new Date(p.paymentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>

                        <td className="py-4 px-6 text-right font-bold text-emerald-700 text-sm">
                          {formatCurrency(p.amount)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownloadReceipt(p.id, p.receiptNumber)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Modal: Record Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Record Verified Payment</h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter verified transaction reference, amount, and milestone stage. A signed PDF receipt will be automatically generated.
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 250000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Reference / UTR Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., NEFT/HDFC/20261108/8899221 or Cheque #000412"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Stage Title</label>
                <input
                  type="text"
                  placeholder="e.g., 50% Production Advance Token"
                  value={paymentForm.milestoneTitle}
                  onChange={(e) => setPaymentForm({ ...paymentForm, milestoneTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes & Bank Verification</label>
                <textarea
                  rows="2"
                  placeholder="Credited to HDFC Current Account #8899..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagementPage;
