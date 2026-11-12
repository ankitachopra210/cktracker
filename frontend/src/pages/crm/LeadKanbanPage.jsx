import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import {
  getLeads,
  createLead,
  updateLeadStage,
  convertLeadToProject,
} from '../../services/lead.api';
import { createAppointment } from '../../services/appointment.api';

const STAGES = [
  { key: 'NEW', label: 'New Inquiries', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'INTERESTED', label: 'Interested', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'SITE_VISIT_SCHEDULED', label: 'Site Survey', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'CONVERTED', label: 'Converted', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { key: 'LOST', label: 'Lost / Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const LeadKanbanPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [leadForm, setLeadForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    propertyAddress: '',
    estimatedBudget: '',
    preferredStyle: 'Modern Minimalist',
    notes: '',
  });

  const [convertForm, setConvertForm] = useState({
    projectTitle: '',
    kitchenType: 'Island Kitchen',
    budget: '',
    expectedCompletion: '',
  });

  const [aptForm, setAptForm] = useState({
    title: 'Site Laser Measurement & Survey',
    type: 'SITE_MEASUREMENT',
    scheduledDate: '',
    location: '',
    notes: '',
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageMove = async (leadId, newStage) => {
    try {
      const res = await updateLeadStage(leadId, newStage, `Moved to ${newStage}`);
      if (res.success) {
        fetchLeads();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stage');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createLead(leadForm);
      if (res.success) {
        setSuccessMsg(`Lead ${leadForm.contactName} registered!`);
        setIsLeadModalOpen(false);
        setLeadForm({
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          propertyAddress: '',
          estimatedBudget: '',
          preferredStyle: 'Modern Minimalist',
          notes: '',
        });
        fetchLeads();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await convertLeadToProject(selectedLead.id, convertForm);
      if (res.success) {
        setSuccessMsg(`Lead converted into Project ${res.data.projectCode}! 14 Stages Initialized.`);
        setIsConvertModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to convert lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createAppointment({
        ...aptForm,
        leadId: selectedLead.id,
        location: aptForm.location || selectedLead.propertyAddress,
      });
      if (res.success) {
        // Also move lead stage to SITE_VISIT_SCHEDULED
        await updateLeadStage(selectedLead.id, 'SITE_VISIT_SCHEDULED', 'Site measurement scheduled');
        setSuccessMsg(`Site measurement scheduled on ${new Date(aptForm.scheduledDate).toLocaleDateString()}!`);
        setIsAptModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Pipeline & Conversion</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track prospective clients from initial showroom inquiries to site surveys and active modular kitchen projects.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsLeadModalOpen(true);
          }}
          className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          Capture New Lead
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

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading lead pipeline...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-6">
          {STAGES.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.key);
            return (
              <div key={col.key} className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-w-[260px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {colLeads.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {lead.leadCode}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              {formatCurrency(lead.estimatedBudget)}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 mt-1">{lead.contactName}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {lead.contactPhone}
                          </p>
                          {lead.propertyAddress && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {lead.propertyAddress}
                            </p>
                          )}
                        </div>

                        {lead.preferredStyle && (
                          <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <strong>Style:</strong> {lead.preferredStyle}
                          </div>
                        )}

                        {/* Quick action buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          {col.key !== 'CONVERTED' && col.key !== 'LOST' && (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setAptForm((prev) => ({
                                  ...prev,
                                  location: lead.propertyAddress || '',
                                }));
                                setIsAptModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-semibold border border-amber-200 flex items-center gap-1 cursor-pointer"
                              title="Schedule Site Laser Measurement"
                            >
                              <Compass className="w-3 h-3 text-amber-600" /> Survey
                            </button>
                          )}

                          {col.key !== 'CONVERTED' ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setConvertForm({
                                  projectTitle: `${lead.contactName} - Modular Kitchen`,
                                  kitchenType: 'Island Kitchen',
                                  budget: lead.estimatedBudget ? String(lead.estimatedBudget) : '650000',
                                  expectedCompletion: '',
                                });
                                setIsConvertModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                            >
                              <Sparkles className="w-3 h-3 text-gold-400" /> Convert
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-auto">
                              Active Project
                            </span>
                          )}
                        </div>

                        {/* Stage Mover Selector */}
                        {col.key !== 'CONVERTED' && (
                          <div className="pt-1">
                            <select
                              value={lead.status}
                              onChange={(e) => handleStageMove(lead.id, e.target.value)}
                              className="w-full text-[10px] py-1 px-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  Move &rarr; {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Capture Lead */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Capture New Showroom Lead</h2>
            <p className="text-xs text-slate-500 mb-5">Record client contact details, preferred kitchen aesthetics, and target budget.</p>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Manish Malhotra"
                  value={leadForm.contactName}
                  onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9888877777"
                    value={leadForm.contactPhone}
                    onChange={(e) => setLeadForm({ ...leadForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={leadForm.contactEmail}
                    onChange={(e) => setLeadForm({ ...leadForm, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Site Address</label>
                <input
                  type="text"
                  placeholder="Flat 401, Ozone Urbana, Bangalore"
                  value={leadForm.propertyAddress}
                  onChange={(e) => setLeadForm({ ...leadForm, propertyAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 550000"
                    value={leadForm.estimatedBudget}
                    onChange={(e) => setLeadForm({ ...leadForm, estimatedBudget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Style</label>
                  <select
                    value={leadForm.preferredStyle}
                    onChange={(e) => setLeadForm({ ...leadForm, preferredStyle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Scandinavian">Scandinavian</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inquiry Discussion Notes</label>
                <textarea
                  rows="2"
                  placeholder="Discussed handleless Gola profiles, tandem drawers..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Capture Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Site Visit */}
      {isAptModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsAptModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Schedule Site Laser Measurement</h2>
            <p className="text-xs text-slate-500 mb-5">
              Client: <strong className="text-slate-800">{selectedLead.contactName}</strong> ({selectedLead.contactPhone})
            </p>

            <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Title</label>
                <input
                  type="text"
                  required
                  value={aptForm.title}
                  onChange={(e) => setAptForm({ ...aptForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={aptForm.scheduledDate}
                  onChange={(e) => setAptForm({ ...aptForm, scheduledDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Location</label>
                <input
                  type="text"
                  value={aptForm.location}
                  onChange={(e) => setAptForm({ ...aptForm, location: e.target.value })}
                  placeholder="Site address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Survey Notes</label>
                <textarea
                  rows="2"
                  value={aptForm.notes}
                  onChange={(e) => setAptForm({ ...aptForm, notes: e.target.value })}
                  placeholder="Check chimney duct cutout, electrical points, gas pipe routing..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convert to Project */}
      {isConvertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsConvertModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 text-gold-800 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              14-Stage Lifecycle Engine
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Convert Lead to Active Kitchen Project</h2>
            <p className="text-xs text-slate-500 mb-5">
              This initializes the project lifecycle, binds all 14 stages, and provisions a customer login portal for <strong className="text-slate-800">{selectedLead.contactName}</strong>.
            </p>

            <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={convertForm.projectTitle}
                  onChange={(e) => setConvertForm({ ...convertForm, projectTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kitchen Layout Type *</label>
                  <select
                    value={convertForm.kitchenType}
                    onChange={(e) => setConvertForm({ ...convertForm, kitchenType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Island Kitchen">Island Kitchen</option>
                    <option value="L-Shaped">L-Shaped Kitchen</option>
                    <option value="Parallel Kitchen">Parallel Kitchen</option>
                    <option value="U-Shaped">U-Shaped Kitchen</option>
                    <option value="Straight Kitchen">Straight Kitchen</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    value={convertForm.budget}
                    onChange={(e) => setConvertForm({ ...convertForm, budget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Handover Date (Optional)</label>
                <input
                  type="date"
                  value={convertForm.expectedCompletion}
                  onChange={(e) => setConvertForm({ ...convertForm, expectedCompletion: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Project & 14 Stages</span>
                      <ArrowRight className="w-4 h-4 text-gold-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadKanbanPage;
