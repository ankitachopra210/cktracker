import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Layers,
  Clock,
  MessageSquare,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Compass,
  X,
} from 'lucide-react';
import { getCustomerById, logCustomerInteraction } from '../../services/customer.api';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interaction form
  const [interactionForm, setInteractionForm] = useState({
    interactionType: 'Phone Call',
    summary: '',
    nextFollowUpDate: '',
  });

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await getCustomerById(id);
      if (res.success) {
        setCustomer(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await logCustomerInteraction(id, interactionForm);
      if (res.success) {
        setIsLogModalOpen(false);
        setInteractionForm({ interactionType: 'Phone Call', summary: '', nextFollowUpDate: '' });
        fetchCustomer();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log interaction');
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

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
        <p className="text-xs">Loading customer profile & project history...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm font-semibold">Customer record not found.</p>
        <Link to="/admin/customers" className="text-xs text-gold-600 mt-2 inline-block">
          &larr; Back to Customers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers Directory
        </Link>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 text-gold-400 font-bold text-2xl flex items-center justify-center shadow-lg shadow-navy-900/20 shrink-0">
            {customer.user?.fullName?.charAt(0) || 'C'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{customer.user?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Active Client
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Registered on {new Date(customer.createdAt).toLocaleDateString()} • Lead Source: {customer.leadSource || 'Showroom'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.user?.phoneNumber || 'No phone'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {customer.address ? `${customer.address}, ${customer.city || ''}` : 'Location pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-gold-400" />
            Log Interaction
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-4 transition-colors relative ${
            activeTab === 'projects'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Kitchen Projects ({customer.projects?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`pb-3 px-4 transition-colors relative ${
            activeTab === 'specs'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Kitchen Specs & Preferences
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 transition-colors relative ${
            activeTab === 'appointments'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Appointments ({customer.appointments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`pb-3 px-4 transition-colors relative ${
            activeTab === 'interactions'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Interaction Log ({customer.interactions?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {customer.projects && customer.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {customer.projects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                        {proj.projectCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{proj.title}</h3>
                      <p className="text-xs text-slate-500">Managed by: {proj.assignedManager?.user?.fullName || 'Unassigned'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Stage {proj.currentStageNumber} of 14
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block">Total Budget</span>
                      <span className="font-bold text-slate-800">{formatCurrency(proj.budget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contract Status</span>
                      <span className="font-bold text-slate-800">{proj.status}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/admin/projects`}
                      className="text-xs font-semibold text-navy-900 hover:text-gold-600 flex items-center gap-1 transition-colors"
                    >
                      View 14-Stage Lifecycle Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No active kitchen project yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Convert a lead inquiry into a project to kick off the 14-stage journey.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Modular Kitchen Preferences & Property Specifications</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Property Type</span>
              <p className="text-sm font-semibold text-slate-800">{customer.propertyType || 'Not specified'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Kitchen Dimensions</span>
              <p className="text-sm font-semibold text-slate-800">{customer.kitchenDimensions || 'Pending site survey'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Estimated Budget</span>
              <p className="text-sm font-semibold text-slate-800">{formatCurrency(customer.estimatedBudget)}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Preferred Kitchen Style</span>
              <p className="text-sm font-semibold text-slate-800">{customer.preferredStyle || 'Standard Modular'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Preferred Materials</span>
              <p className="text-sm font-semibold text-slate-800">{customer.preferredMaterials || 'Century Marine Ply + Acrylic'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <span className="text-slate-400 font-medium">Lead Acquisition Source</span>
              <p className="text-sm font-semibold text-slate-800">{customer.leadSource || 'Showroom Walk-in'}</p>
            </div>
          </div>

          {customer.requirementsNotes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <span className="text-slate-400 font-medium">Special Customer Requirements:</span>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{customer.requirementsNotes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {customer.appointments && customer.appointments.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {customer.appointments.map((apt) => (
                <div key={apt.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{apt.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                        {apt.type}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      Date: {new Date(apt.scheduledDate).toLocaleString()} • Assigned: {apt.assignedEmployee?.user?.fullName || 'Unassigned'}
                    </p>
                    {apt.notes && <p className="text-slate-600 text-[11px] italic">"{apt.notes}"</p>}
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 text-xs">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No appointments recorded for this client.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {customer.interactions && customer.interactions.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {customer.interactions.map((item) => (
                <div key={item.id} className="p-5 space-y-1 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                      {item.interactionType}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">{item.summary}</p>
                  {item.nextFollowUpDate && (
                    <p className="text-gold-700 font-medium text-[11px] pt-1">
                      Next Follow-up Due: {new Date(item.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No interactions logged yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Log Interaction Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Log Customer Interaction</h2>
            <p className="text-xs text-slate-500 mb-5">Record phone call, showroom discussion, or site measurement notes.</p>

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interaction Type</label>
                <select
                  value={interactionForm.interactionType}
                  onChange={(e) => setInteractionForm({ ...interactionForm, interactionType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp Chat">WhatsApp Chat</option>
                  <option value="Showroom Visit">Showroom Visit</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discussion Summary *</label>
                <textarea
                  required
                  rows="3"
                  value={interactionForm.summary}
                  onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })}
                  placeholder="Details of client inquiry, changes requested, or budget agreements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Follow-Up Date (Optional)</label>
                <input
                  type="date"
                  value={interactionForm.nextFollowUpDate}
                  onChange={(e) => setInteractionForm({ ...interactionForm, nextFollowUpDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
