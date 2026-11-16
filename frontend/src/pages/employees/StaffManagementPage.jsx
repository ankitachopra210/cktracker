import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  Loader2,
  X,
  ListTodo,
} from 'lucide-react';
import {
  getEmployees,
  createEmployee,
  getTasks,
  createTask,
  updateTaskStatus,
} from '../../services/enterprise.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const DEPARTMENTS = [
  'MANAGEMENT',
  'SALES',
  'DESIGN',
  'MEASUREMENT',
  'PROCUREMENT',
  'MANUFACTURING',
  'QUALITY_CONTROL',
  'INSTALLATION',
  'CUSTOMER_SUPPORT',
];

const StaffManagementPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'tasks'
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    employeeCode: '',
    department: 'DESIGN',
    designation: 'Senior Kitchen Designer',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    dueDate: '',
    projectId: '',
    assignedToId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [empRes, taskRes, projRes] = await Promise.all([
        getEmployees({ department: deptFilter }),
        getTasks(),
        getProjects({ limit: 50 }),
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (taskRes.success) setTasks(taskRes.data);
      if (projRes.success && projRes.data.length > 0) {
        setProjects(projRes.data);
        if (!taskForm.projectId) {
          setTaskForm((prev) => ({ ...prev, projectId: projRes.data[0].id }));
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptFilter]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createEmployee(staffForm);
      if (res.success) {
        setSuccessMsg(`Staff member ${staffForm.fullName} registered successfully!`);
        setIsStaffModalOpen(false);
        setStaffForm({
          fullName: '',
          email: '',
          phoneNumber: '',
          employeeCode: '',
          department: 'DESIGN',
          designation: '',
        });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create staff account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createTask(taskForm);
      if (res.success) {
        setSuccessMsg(`Task "${taskForm.title}" assigned!`);
        setIsTaskModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'HIGH',
          dueDate: '',
          projectId: projects[0]?.id || '',
          assignedToId: '',
        });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskStatusToggle = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    try {
      const res = await updateTaskStatus(taskId, newStatus);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Task Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Department assignments across sales, 3D design, site measurement, CNC manufacturing, QC, and on-site assembly.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMsg('');
                setIsStaffModalOpen(true);
              }}
              className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Add Staff Member
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ListTodo className="w-4 h-4 text-slate-600" />
              Assign Task
            </button>
          </div>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'staff'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Staff Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'tasks'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Operational Tasks ({tasks.length})
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading staff & assigned tasks...</p>
        </div>
      ) : activeTab === 'staff' ? (
        /* Staff Directory Grid */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-sm shadow-inner">
                      {emp.user?.fullName?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{emp.user?.fullName}</h3>
                      <p className="text-xs text-slate-500">{emp.designation}</p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                    {emp.employeeCode}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{emp.department.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.user?.phoneNumber}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{emp._count?.managedProjects || 0} Managed Projects</span>
                  <span className="font-semibold text-slate-700">{emp._count?.assignedTasks || 0} Active Tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tasks List */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {tasks.map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="space-y-1 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.status === 'COMPLETED'}
                    onChange={() => handleTaskStatusToggle(t.id, t.status)}
                    className="mt-1 w-4 h-4 rounded text-gold-600 focus:ring-gold-500 cursor-pointer"
                  />
                  <div>
                    <h4 className={`font-bold text-sm ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.title}
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Project: <strong className="text-slate-700">{t.project?.projectCode}</strong> • Assignee:{' '}
                      <strong className="text-slate-700">{t.assignedTo?.user?.fullName || 'Unassigned'}</strong>
                    </p>
                    {t.description && <p className="text-slate-600 text-[11px] pt-0.5">{t.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Employee */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Staff Member</h2>
            <p className="text-xs text-slate-500 mb-5">Create an employee account with departmental access.</p>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-DSG-004"
                    value={staffForm.employeeCode}
                    onChange={(e) => setStaffForm({ ...staffForm, employeeCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@cktracker.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9888877777"
                    value={staffForm.phoneNumber}
                    onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Kitchen Architect"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Assign Operational Task</h2>
            <p className="text-xs text-slate-500 mb-4">Assign milestone responsibility to staff member.</p>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finalize 3D Render V2 changes"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign To</label>
                  <select
                    value={taskForm.assignedToId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.fullName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
