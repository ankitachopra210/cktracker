import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  getAnalyticsOverview,
  getMonthlyRevenue,
  getStageDistribution,
  getConversionFunnel,
  getBottlenecks,
} from '../../services/enterprise.api';

const AnalyticsDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [stageDistribution, setStageDistribution] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [overRes, revRes, stageRes, funnelRes, botRes] = await Promise.all([
          getAnalyticsOverview(),
          getMonthlyRevenue(),
          getStageDistribution(),
          getConversionFunnel(),
          getBottlenecks(),
        ]);

        if (overRes.success) setOverview(overRes.data);
        if (revRes.success) setMonthlyRevenue(revRes.data);
        if (stageRes.success) setStageDistribution(stageRes.data);
        if (funnelRes.success) setFunnel(funnelRes.data);
        if (botRes.success) setBottlenecks(botRes.data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
        <p className="text-xs">Compiling business intelligence & SQL aggregations...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 100000);
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Business Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time business performance, conversion rates, 14-stage bottlenecks, and revenue realization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-gold-600" />
            Fiscal Year 2026
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Revenue Received</span>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(overview.totalRevenueReceived)}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Realized payments</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Average Contract Size</span>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(overview.averageProjectValue)}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Across modular projects</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Kitchen Projects</span>
            <p className="text-2xl font-bold text-navy-900 mt-2">{overview.activeProjects}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">In factory / on-site fitting</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Delayed Project Stages</span>
            <p className={`text-2xl font-bold mt-2 ${overview.delayedStagesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overview.delayedStagesCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Requires manager intervention</span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Monthly Revenue Inflow</h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated actual payments received</p>
          </div>

          {monthlyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              No revenue records for this period
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {monthlyRevenue.map((m) => {
                const percent = Math.round((m.revenue / maxRevenue) * 100);
                return (
                  <div key={m.month} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{m.month}</span>
                      <span className="text-navy-900 font-bold">{formatCurrency(m.revenue)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-navy-900 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Lead to Project Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pipeline progression efficiency</p>
          </div>

          <div className="space-y-3 pt-2">
            {funnel.map((f, idx) => {
              const width = Math.max(15, Math.round((f.count / maxFunnel) * 100));
              return (
                <div key={f.stage} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>
                      {idx + 1}. {f.stage}
                    </span>
                    <span className="text-gold-700 font-bold">{f.count} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gold-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 14-Stage Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-base text-slate-900">Active Kitchen Project Stage Distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5">Current spread across the 14-stage workflow</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2 text-center text-xs">
          {stageDistribution.map((st) => (
            <div
              key={st.stageNumber}
              className={`p-3 rounded-2xl border transition-all ${
                st.count > 0
                  ? 'bg-navy-50/70 border-navy-200 text-navy-950 font-bold shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}
            >
              <span className="block text-[10px] text-slate-400 uppercase">Stage</span>
              <span className="block text-sm font-extrabold text-navy-900">{st.stageNumber}</span>
              <span className="mt-1 block text-xs font-semibold text-gold-600">
                {st.count} {st.count === 1 ? 'proj' : 'projs'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottlenecks and Delays Table */}
      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Recorded Project Bottlenecks & Delays
            </h3>
            <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
              {bottlenecks.length} delayed stages
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {bottlenecks.map((b) => (
              <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {b.project?.projectCode}
                    </span>
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="text-slate-400">• Client: {b.project?.customer?.user?.fullName}</span>
                  </div>
                  <p className="text-rose-700 font-medium">Reason: {b.delayReason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardPage;
