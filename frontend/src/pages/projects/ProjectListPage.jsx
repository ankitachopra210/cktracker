import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { getProjects, createProject } from '../../services/project.api';
import { getCustomers } from '../../services/customer.api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLUMNS = [
  { key: 'PLANNING', label: 'Planning & Design', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'IN_PROGRESS', label: 'In Manufacturing & Site Work', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'ON_HOLD', label: 'On Hold / Delayed', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'COMPLETED', label: 'Handover Completed', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

const ProjectListPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Customers list for project creation
  const [customersList, setCustomersList] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    kitchenType: 'Island Kitchen',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletion: '',
    customerId: '',
    notes: '',
  });

  const fetchProjectsList = async () => {
    try {
      setLoading(true);
      const res = await getProjects({ search, status: statusFilter });
      if (res.success) {
        setProjects(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await getCustomers({ limit: 50 });
      if (res.success) {
        setCustomersList(res.data);
        if (res.data.length > 0 && !formData.customerId) {
          setFormData((prev) => ({ ...prev, customerId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  useEffect(() => {
    fetchProjectsList();
  }, [statusFilter]);

  const handleOpenCreateModal = () => {
    setErrorMsg('');
    loadCustomers();
    setIsModalOpen(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createProject(formData);
      if (res.success) {
        setSuccessMsg(`Project ${res.data.projectCode} initialized with all 14 lifecycle stages!`);
        setIsModalOpen(false);
        setFormData({
          title: '',
          kitchenType: 'Island Kitchen',
          budget: '',
          startDate: new Date().toISOString().split('T')[0],
          expectedCompletion: '',
          customerId: '',
          notes: '',
        });
        fetchProjectsList();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create project');
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

  const calculateProgress = (stageNumber, status) => {
    if (status === 'COMPLETED') return 100;
    return Math.round(((stageNumber - 1) / 14) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Projects & Stages</h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end monitoring from architectural 3D layouts to factory CNC manufacturing and on-site handover.
          </p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            New Kitchen Project
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control bar: search, filters, and view mode toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProjectsList()}
            placeholder="Search by project code, client, title..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Project Statuses</option>
            <option value="PLANNING">Planning & Design</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading kitchen projects & 14-stage progress...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">Create a new kitchen project or convert a lead inquiry.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATUS_COLUMNS.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="bg-slate-100/60 rounded-2xl p-4 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  {colProjects.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No projects
                    </div>
                  ) : (
                    colProjects.map((p) => {
                      const currentStage = p.stages?.find((s) => s.stageNumber === p.currentStageNumber);
                      const progress = calculateProgress(p.currentStageNumber, p.status);
                      return (
                        <Link
                          key={p.id}
                          to={`/admin/projects/${p.id}`}
                          className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                                {p.projectCode}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{formatCurrency(p.budget)}</span>
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-gold-600 transition-colors">
                              {p.title}
                            </h3>

                            <p className="text-xs text-slate-500">
                              Client: <strong className="text-slate-700">{p.customer?.user?.fullName}</strong>
                            </p>

                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-700 flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5 text-navy-700" />
                                  Stage {p.currentStageNumber} of 14
                                </span>
                                <span className="text-gold-600 font-bold">{progress}%</span>
                              </div>

                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-navy-900 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>

                              <p className="text-[10px] text-slate-500 truncate">
                                {currentStage?.name || 'Modular Lifecycle'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Project Code & Title</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Kitchen Layout</th>
                  <th className="py-3.5 px-6">14-Stage Progress</th>
                  <th className="py-3.5 px-6">Contract Value</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projects.map((p) => {
                  const progress = calculateProgress(p.currentStageNumber, p.status);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 block w-fit mb-1">
                          {p.projectCode}
                        </span>
                        <Link to={`/admin/projects/${p.id}`} className="font-bold text-slate-900 hover:text-gold-600">
                          {p.title}
                        </Link>
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {p.customer?.user?.fullName}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {p.kitchenType}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>Stage {p.currentStageNumber}/14</span>
                            <span className="text-gold-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-navy-900 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatCurrency(p.budget)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/admin/projects/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                        >
                          Timeline <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Kitchen Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 text-gold-800 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              14-Stage Lifecycle Engine
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Create Modular Kitchen Project</h2>
            <p className="text-xs text-slate-500 mb-5">
              Bind a customer, select kitchen layout, and initialize all 14 manufacturing, installation, and inspection stages.
            </p>

            {errorMsg && (
              <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  <option value="">-- Choose registered customer --</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.user?.fullName} ({c.user?.email}) - {c.propertyType || 'Residential'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sharma Villa - Island Kitchen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kitchen Layout Type *</label>
                  <select
                    value={formData.kitchenType}
                    onChange={(e) => setFormData({ ...formData, kitchenType: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Project Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 750000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Handover Date</label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes & Scope</label>
                <textarea
                  rows="2"
                  placeholder="Special finishes, hardware specifications, delivery timelines..."
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
                  className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project & 14 Stages</span>
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

export default ProjectListPage;
