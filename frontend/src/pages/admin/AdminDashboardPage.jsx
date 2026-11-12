import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Building,
} from 'lucide-react';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalCustomers: 2,
    newInquiries: 4,
    activeProjects: 2,
    inManufacturing: 1,
    awaitingInstallation: 0,
    completedProjects: 0,
    totalQuotationValue: 1345000,
    revenueReceived: 412500,
    pendingPayments: 412500,
    overduePayments: 0,
    delayedProjects: 0,
  });

  const [recentProjects, setRecentProjects] = useState([
    {
      id: 'p1',
      code: 'CK-2026-101',
      title: 'Sharma Villa - Acrylic & Quartz Island Kitchen',
      customer: 'Amitabh & Sunita Sharma',
      stage: 'Stage 8: Factory Manufacturing',
      value: '₹8,25,000',
      status: 'IN_PROGRESS',
      progress: 57,
    },
    {
      id: 'p2',
      code: 'CK-2026-102',
      title: 'Verma Residence - Scandinavian Parallel Kitchen',
      customer: 'Dr. Rajesh Verma',
      stage: 'Stage 3: 3D Kitchen Design Preparation',
      value: '₹5,20,000',
      status: 'PLANNING',
      progress: 21,
    },
  ]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.fullName}</span>. Here is the operational pulse of your modular kitchen business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            All 14 Stages Operational
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Customers</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{metrics.totalCustomers}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +100%
            </span>
            <span>vs previous month</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Kitchen Projects</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{metrics.activeProjects}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{metrics.inManufacturing}</span> in factory manufacturing
          </div>
        </div>

        {/* Revenue Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue Received</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{formatCurrency(metrics.revenueReceived)}</p>
          <div className="mt-2 text-xs text-slate-500">
            Out of <span className="font-semibold text-slate-700">{formatCurrency(metrics.totalQuotationValue)}</span> pipeline
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Receivables</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{formatCurrency(metrics.pendingPayments)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 font-medium">
            <span>Milestone dues on delivery</span>
          </div>
        </div>
      </div>

      {/* Secondary Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="text-center border-r border-slate-100 last:border-none">
          <p className="text-xs text-slate-500 font-medium">New Leads</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{metrics.newInquiries}</p>
        </div>
        <div className="text-center border-r border-slate-100 last:border-none">
          <p className="text-xs text-slate-500 font-medium">In Factory Production</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{metrics.inManufacturing}</p>
        </div>
        <div className="text-center border-r border-slate-100 last:border-none">
          <p className="text-xs text-slate-500 font-medium">Awaiting Site Fitting</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{metrics.awaitingInstallation}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium">Delayed Stages</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.delayedProjects} (0%)</p>
        </div>
      </div>

      {/* Active Projects Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Current Projects in Pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live tracking across the 14-stage manufacturing & installation process</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {recentProjects.map((p) => (
            <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                    {p.code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Client: <span className="font-medium text-slate-700">{p.customer}</span>
                </p>
              </div>

              <div className="flex flex-col md:items-end gap-1.5 min-w-[200px]">
                <span className="text-xs font-semibold text-slate-700">{p.stage}</span>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-navy-900 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${p.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between w-full text-[11px] text-slate-400 font-medium">
                  <span>{p.progress}% Complete</span>
                  <span className="text-slate-800 font-semibold">{p.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
