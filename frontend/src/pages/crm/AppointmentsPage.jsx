import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Compass,
  X,
} from 'lucide-react';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../../services/appointment.api';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: 'Site Laser Measurement',
    type: 'SITE_MEASUREMENT',
    scheduledDate: '',
    location: '',
    notes: '',
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await getAppointments({ status: statusFilter });
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleStatusChange = async (aptId, newStatus) => {
    try {
      const res = await updateAppointmentStatus(aptId, newStatus, `Marked as ${newStatus}`);
      if (res.success) {
        setSuccessMsg(`Appointment status updated to ${newStatus}`);
        fetchAppointments();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createAppointment(formData);
      if (res.success) {
        setSuccessMsg('Appointment scheduled successfully!');
        setIsModalOpen(false);
        setFormData({
          title: 'Site Laser Measurement',
          type: 'SITE_MEASUREMENT',
          scheduledDate: '',
          location: '',
          notes: '',
        });
        fetchAppointments();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'RESCHEDULED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments & Site Surveys</h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule laser measurements, showroom design presentations, and site inspections.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          Schedule Site Visit
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        {['', 'SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`pb-3 px-3 transition-colors ${
              statusFilter === st
                ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {st ? st.charAt(0) + st.slice(1).toLowerCase() : 'All Appointments'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
            <p className="text-xs">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No appointments scheduled</p>
            <p className="text-[11px] mt-0.5">Click "Schedule Site Visit" to book a survey or consultation.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{apt.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      {apt.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gold-600" />
                      {new Date(apt.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>

                    {apt.customer ? (
                      <span className="flex items-center gap-1 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Client: {apt.customer.user?.fullName} ({apt.customer.user?.phoneNumber})
                      </span>
                    ) : apt.lead ? (
                      <span className="flex items-center gap-1 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Lead: {apt.lead.contactName} ({apt.lead.contactPhone})
                      </span>
                    ) : null}

                    {apt.location && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {apt.location}
                      </span>
                    )}
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Notes: {apt.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {apt.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Schedule Site Visit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Schedule Site Measurement / Visit</h2>
            <p className="text-xs text-slate-500 mb-5">Book a visit for laser measurement, technical survey, or design presentation.</p>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Site Laser Survey & Plumbing Check"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="SITE_MEASUREMENT">Site Measurement</option>
                    <option value="SHOWROOM_CONSULTATION">Showroom Consultation</option>
                    <option value="DESIGN_PRESENTATION">Design Presentation</option>
                    <option value="FINAL_INSPECTION">Final Inspection</option>
                    <option value="HANDOVER">Handover</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Address</label>
                <input
                  type="text"
                  placeholder="Client property address"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Survey Notes & Requirements</label>
                <textarea
                  rows="2"
                  placeholder="Check electrical points, chimney outlet, water inlets..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {isSubmitting ? 'Booking...' : 'Book Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
