import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  PlusCircle,
  FileText,
} from 'lucide-react';

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assignedProjects = [
    {
      code: 'CK-2026-101',
      client: 'Amitabh & Sunita Sharma',
      property: 'Luxury Villa, Whitefield',
      kitchen: 'Island Kitchen (15x12 ft)',
      currentStage: 'Stage 8: Factory Manufacturing',
      status: 'IN_PROGRESS',
      targetHandover: '20 Nov 2026',
    },
    {
      code: 'CK-2026-102',
      client: 'Dr. Rajesh Verma',
      property: 'Apartment, Prestige Lakeside',
      kitchen: 'Parallel Kitchen (11x9 ft)',
      currentStage: 'Stage 3: 3D Kitchen Design Preparation',
      status: 'PLANNING',
      targetHandover: '15 Dec 2026',
    },
  ];

  const upcomingVisits = [
    {
      type: 'Site Laser Measurement',
      client: 'Dr. Rajesh Verma',
      date: 'Completed Yesterday',
      status: 'DONE',
    },
    {
      type: '3D Render Presentation',
      client: 'Amitabh Sharma',
      date: 'Approved',
      status: 'DONE',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manager Operations Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{user?.fullName}</span> • Assigned Field & Project Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
  onClick={() => navigate('/manager/customers?register=1')}
  className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm"
>
  <PlusCircle className="w-4 h-4 text-gold-400" />
  Register Customer
</button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">My Assigned Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{assignedProjects.length}</p>
          <p className="text-xs text-slate-500 mt-1">Currently progressing smoothly</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Active Site Measurements</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">2</p>
          <p className="text-xs text-slate-500 mt-1">Surveys recorded with laser accuracy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Scheduled Appointments</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">1</p>
          <p className="text-xs text-slate-500 mt-1">Factory QC inspection upcoming</p>
        </div>
      </div>

      {/* Assigned Projects Detail List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Assigned Kitchen Deliveries</h3>
          <span className="text-xs text-slate-500 font-medium">Real-time status</span>
        </div>

        <div className="divide-y divide-slate-100">
          {assignedProjects.map((item) => (
            <div key={item.code} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-navy-100 text-navy-800">
                    {item.code}
                  </span>
                  <span className="font-bold text-sm text-slate-800">{item.client}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{item.property}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                  {item.currentStage}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                <span>Layout: <strong className="text-slate-700">{item.kitchen}</strong></span>
                <span>Target Handover: <strong className="text-slate-700">{item.targetHandover}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
