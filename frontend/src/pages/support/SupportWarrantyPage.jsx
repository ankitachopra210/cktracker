import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Wrench,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import {
  getSupportTickets,
  createSupportTicket,
  updateTicket,
  getWarranties,
} from '../../services/enterprise.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const SupportWarrantyPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'warranty'
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [ticketForm, setTicketForm] = useState({
    projectId: '',
    category: 'Hardware & Hinges',
    priority: 'MEDIUM',
    subject: '',
    description: '',
  });

  const [resolveForm, setResolveForm] = useState({
    status: 'RESOLVED',
    resolutionNotes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [tickRes, warRes, projRes] = await Promise.all([
        getSupportTickets({ status: statusFilter }),
        getWarranties(),
        getProjects({ limit: 50 }),
      ]);

      if (tickRes.success) setTickets(tickRes.data);
      if (warRes.success) setWarranties(warRes.data);
      if (projRes.success && projRes.data.length > 0) {
        setProjects(projRes.data);
        if (!ticketForm.projectId) {
          setTicketForm((prev) => ({ ...prev, projectId: projRes.data[0].id }));
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createSupportTicket(ticketForm);
      if (res.success) {
        setSuccessMsg(`Support ticket ${res.data.ticketNumber} registered! Technician assigned.`);
        setIsTicketModalOpen(false);
        setTicketForm({
          projectId: projects[0]?.id || '',
          category: 'Hardware & Hinges',
          priority: 'MEDIUM',
          subject: '',
          description: '',
        });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await updateTicket(selectedTicket.id, resolveForm);
      if (res.success) {
        setSuccessMsg(`Ticket ${selectedTicket.ticketNumber} marked as ${resolveForm.status}!`);
        setIsResolveModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ASSIGNED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">After-Sales Support & Warranty</h1>
          <p className="text-sm text-slate-500 mt-1">
            Post-handover service complaints, technician visits, hardware warranty certificates, and maintenance history.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setIsTicketModalOpen(true);
          }}
          className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          Raise Support Request
        </button>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'tickets'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Service Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('warranty')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'warranty'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          10-Year Warranty Guarantee
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading support tickets & warranty registry...</p>
        </div>
      ) : activeTab === 'tickets' ? (
        /* Support Tickets List */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="font-semibold text-slate-600">No active complaints</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All customer installations are running smoothly.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {t.ticketNumber}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{t.subject}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed max-w-2xl">{t.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span>Category: <strong className="text-slate-700">{t.category}</strong></span>
                      <span>Client: <strong className="text-slate-700">{t.customer?.user?.fullName}</strong></span>
                      <span>Technician: <strong className="text-slate-700">{t.assignedTechnician?.user?.fullName || 'Pending assignment'}</strong></span>
                    </div>

                    {t.resolutionNotes && (
                      <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <strong>Resolution Note:</strong> {t.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {user?.role !== 'CUSTOMER' && t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setResolveForm({ status: 'RESOLVED', resolutionNotes: '' });
                        setIsResolveModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs shrink-0 cursor-pointer"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Warranty Tab */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">10-Year Modular Kitchen Warranty Guarantee</h2>
              <p className="text-xs text-slate-500">Official comprehensive coverage policy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
              <span className="font-bold text-slate-800">Hardware & Hinges</span>
              <p className="text-slate-500">
                10-year replacement warranty on all Blum Legrabox drawer slides and Hettich Sensys soft-close hinges.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
              <span className="font-bold text-slate-800">Carcass & Moisture Resistance</span>
              <p className="text-slate-500">
                Century Club Prime BWP 710 marine plywood carcasses protected against borer, fungus, and boiling water.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
              <span className="font-bold text-slate-800">Free Annual Maintenance</span>
              <p className="text-slate-500">
                Includes complimentary hinge alignment, silicone resealing, and drawer tension calibration in year 1.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Raise Ticket */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsTicketModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Raise After-Sales Support Request</h2>
            <p className="text-xs text-slate-500 mb-4">Our service engineering team will dispatch a technician.</p>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Hardware & Hinges">Hardware & Hinges</option>
                    <option value="Drawer Channel Alignment">Drawer Channel Alignment</option>
                    <option value="Laminate / Acrylic Peel">Laminate / Acrylic Peel</option>
                    <option value="Water Seepage & Plumbing">Water Seepage & Plumbing</option>
                    <option value="Countertop Finish">Countertop Finish</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soft-close hinge tension loose on sink shutter"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Please describe when the issue started and shutter location..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Ticket */}
      {isResolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsResolveModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Resolve Support Complaint</h2>
            <p className="text-xs text-slate-500 mb-4">Ticket #{selectedTicket.ticketNumber}</p>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  <option value="RESOLVED">Resolved</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician Resolution Notes *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Technician replaced Blum damper cartridge and calibrated shutter gap..."
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportWarrantyPage;
