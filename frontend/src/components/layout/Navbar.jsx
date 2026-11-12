import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Bell, LogOut, User as UserIcon, Wifi, WifiOff } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [profileOpen, setProfileOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CUSTOMER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-base">CKTracker</span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
            Modular Kitchen Operating System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Socket Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500" title={connected ? 'Real-time sync active' : 'Connecting to live updates...'}>
          {connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-700 font-medium">Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span className="text-slate-400">Offline</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center font-semibold text-xs shadow-inner">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
              <span className={`inline-block text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-medium text-slate-800 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
