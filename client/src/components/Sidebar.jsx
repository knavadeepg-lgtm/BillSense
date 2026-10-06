import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  MessageSquareText, 
  LogOut, 
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Upload Documents', path: '/upload', icon: UploadCloud },
    { label: 'Documents List', path: '/documents', icon: FileText },
    { label: 'Ask AI Assistant', path: '/ask-ai', icon: MessageSquareText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs z-20">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              BillSense <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">AI</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Smart Bill Assistant</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="py-4 px-3 space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-semibold border-l-4 border-indigo-600 rounded-r-xl shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center shadow-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Business Owner'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'owner@business.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
