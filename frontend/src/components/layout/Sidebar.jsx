import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Compass,
  FileSpreadsheet,
  CreditCard,
  Boxes,
  UserCheck,
  BarChart3,
  LifeBuoy,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const adminLinks = [
    { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Customer CRM', to: '/admin/customers', icon: Users },
    { label: 'Projects & Stages', to: '/admin/projects', icon: Briefcase },
    { label: 'Kitchen Designs', to: '/admin/designs', icon: Compass },
    { label: 'Quotations & Invoices', to: '/admin/quotations', icon: FileSpreadsheet },
    { label: 'Payments & Revenue', to: '/admin/payments', icon: CreditCard },
    { label: 'Inventory & Materials', to: '/admin/inventory', icon: Boxes },
    { label: 'Staff & Tasks', to: '/admin/employees', icon: UserCheck },
    { label: 'Analytics & Reports', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Support & Warranty', to: '/admin/support', icon: LifeBuoy },
  ];

  const managerLinks = [
    { label: 'Manager Dashboard', to: '/manager', icon: LayoutDashboard },
    { label: 'Assigned Leads & CRM', to: '/manager/crm', icon: Users },
    { label: 'Site Visits & Surveys', to: '/manager/appointments', icon: Calendar },
    { label: 'Active Projects', to: '/manager/projects', icon: Briefcase },
    { label: 'Stage Progression', to: '/manager/stages', icon: Layers },
    { label: 'Kitchen Designs', to: '/manager/designs', icon: Compass },
    { label: 'Quotations Tracker', to: '/manager/quotations', icon: FileSpreadsheet },
    { label: 'Customer Service', to: '/manager/support', icon: LifeBuoy },
  ];

  const customerLinks = [
    { label: 'My Project Hub', to: '/customer', icon: LayoutDashboard },
    { label: '14-Stage Tracker', to: '/customer/timeline', icon: Layers },
    { label: '2D & 3D Kitchen Designs', to: '/customer/designs', icon: Sparkles },
    { label: 'Quotations & Proposals', to: '/customer/quotations', icon: FileSpreadsheet },
    { label: 'Payments & Receipts', to: '/customer/payments', icon: CreditCard },
    { label: 'Warranty & Care', to: '/customer/warranty', icon: ShieldCheck },
    { label: 'Raise Service Request', to: '/customer/support', icon: LifeBuoy },
  ];

  const links =
    user?.role === 'ADMIN'
      ? adminLinks
      : user?.role === 'MANAGER'
      ? managerLinks
      : customerLinks;

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-navy-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-navy-800">
        <div className="w-9 h-9 rounded-lg bg-gold-500 text-navy-950 font-black flex items-center justify-center text-lg shadow-md shadow-gold-500/20">
          CK
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight tracking-tight">CKTracker</h1>
          <p className="text-[10px] text-gold-400 font-medium tracking-wider uppercase">Modular Kitchens</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
          {user?.role} PORTAL
        </p>

        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/manager' || item.to === '/customer'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold-500 text-navy-950 shadow-md shadow-gold-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-navy-800/80 bg-navy-950/40 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Enterprise Edition</p>
        <p className="text-[11px] text-slate-500 mt-0.5">v1.0.0 • Production Build</p>
      </div>
    </aside>
  );
};

export default Sidebar;
