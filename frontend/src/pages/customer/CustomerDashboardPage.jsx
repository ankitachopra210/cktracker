import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sparkles,
  Layers,
  FileCheck2,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react';

const CustomerDashboardPage = () => {
  const { user } = useAuth();

  const customerProject = {
    code: 'CK-2026-101',
    title: 'Sharma Villa - Contemporary Acrylic & Quartz Island Kitchen',
    type: 'Luxury Island Kitchen (15ft x 12ft)',
    currentStageNumber: 8,
    currentStageName: 'Factory Manufacturing & CNC Edge Banding',
    totalStages: 14,
    expectedHandover: '20 November 2026',
    progress: 57,
    budget: '₹8,25,000',
    paidAmount: '₹4,12,500',
    balanceDue: '₹4,12,500',
    renderImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  };

  const stages = [
    { num: 1, name: 'Registration & Requirements', done: true },
    { num: 2, name: 'Site Laser Measurement', done: true },
    { num: 3, name: '3D Kitchen Design', done: true },
    { num: 4, name: 'Design Approval', done: true },
    { num: 5, name: 'Quotation Estimation', done: true },
    { num: 6, name: 'Quotation Approval & Token', done: true },
    { num: 7, name: 'Material Stock Allocation', done: true },
    { num: 8, name: 'Factory Manufacturing', current: true },
    { num: 9, name: 'Quality Inspection (QC)', upcoming: true },
    { num: 10, name: 'Dispatch & Transport', upcoming: true },
    { num: 11, name: 'Modular Installation', upcoming: true },
    { num: 12, name: 'Final Inspection', upcoming: true },
    { num: 13, name: 'Customer Handover', upcoming: true },
    { num: 14, name: 'Warranty Activation', upcoming: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Your Modular Kitchen Journey
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.fullName || 'Valued Customer'}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Your kitchen is currently in <strong className="text-gold-400">Stage {customerProject.currentStageNumber}: {customerProject.currentStageName}</strong>. Everything is tracking on schedule for delivery by <strong className="text-white">{customerProject.expectedHandover}</strong>.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl">
              <span className="text-slate-400 block">Project Code</span>
              <span className="font-mono font-bold text-sm text-white">{customerProject.code}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl">
              <span className="text-slate-400 block">Overall Progress</span>
              <span className="font-bold text-sm text-gold-400">{customerProject.progress}% Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Design Render & 14-Stage Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approved 3D Render Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <h3 className="text-sm font-bold text-slate-900">Approved 3D Kitchen Render</h3>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Approved
            </span>
          </div>

          <div className="relative aspect-video bg-slate-100 overflow-hidden group">
            <img 
              src={customerProject.renderImage} 
              alt="Kitchen 3D Render" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800">{customerProject.type}</p>
              <p className="text-xs text-slate-500">
                Finish: High-Gloss Acrylic Pure White shutters with Calacatta Quartz breakfast island.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button className="text-navy-900 font-semibold hover:text-gold-600 transition-colors flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View Full Gallery
              </button>
            </div>
          </div>
        </div>

        {/* 14-Stage Journey Indicator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Modular Kitchen Lifecycle</h3>
              <p className="text-xs text-slate-500 mt-0.5">Transparent 14-stage manufacturing & installation timeline</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Stage 8 of 14
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {stages.map((st) => (
              <div 
                key={st.num} 
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  st.done 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : st.current
                    ? 'bg-gold-50 border-gold-300 ring-2 ring-gold-400/40 text-navy-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                  st.done
                    ? 'bg-emerald-600 text-white'
                    : st.current
                    ? 'bg-gold-500 text-navy-950 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {st.done ? <CheckCircle className="w-3.5 h-3.5" /> : st.num}
                </div>

                <div className="truncate">
                  <p className="font-semibold truncate">{st.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {st.done ? 'Completed' : st.current ? 'Currently In Progress' : 'Upcoming Stage'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financials & Documentation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium uppercase">Total Contract Value</span>
            <p className="text-xl font-bold text-slate-900">{customerProject.budget}</p>
            <span className="text-[11px] text-slate-400">All inclusive (GST + Installation)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium uppercase">Advance Received</span>
            <p className="text-xl font-bold text-emerald-600">{customerProject.paidAmount}</p>
            <span className="text-[11px] text-emerald-700 font-medium">Receipt #RCPT-2026-101-01</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium uppercase">10-Year Warranty</span>
            <p className="text-xl font-bold text-slate-800">Protected</p>
            <span className="text-[11px] text-slate-400">Hettich / Blum Hardware Guarantee</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
