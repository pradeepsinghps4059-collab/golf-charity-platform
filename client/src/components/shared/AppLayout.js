import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from './BrandLogo';

const UserNavLinks = [
  { to: '/dashboard', icon: 'D', label: 'Dashboard' },
  { to: '/scores', icon: 'S', label: 'My Scores' },
  { to: '/draws', icon: 'R', label: 'Draws & Results' },
  { to: '/charity', icon: 'C', label: 'My Charity' },
  { to: '/subscription', icon: 'P', label: 'Subscription' },
];

const AdminNavLinks = [
  { to: '/admin', icon: 'O', label: 'Overview' },
  { to: '/admin/users', icon: 'U', label: 'Users' },
  { to: '/admin/draws', icon: 'R', label: 'Draw System' },
  { to: '/admin/winners', icon: 'W', label: 'Winners' },
  { to: '/admin/charities', icon: 'C', label: 'Charities' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user?.role === 'admin' ? AdminNavLinks : UserNavLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-charcoal-800/60 px-6 py-6">
        <div>
          <BrandLogo compact showTagline={false} />
          <div className="mt-3 text-xs text-charcoal-500 font-body">
            {user?.role === 'admin' ? 'Admin Panel' : 'Player Portal'}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold text-charcoal-300">
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-charcoal-800/60 px-3 py-4">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-charcoal-800/40 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user?.name}</div>
            <div className="truncate text-xs text-charcoal-500">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-900/20 hover:text-red-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-[11px] font-semibold text-red-300">
            X
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-charcoal-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-charcoal-800/60 bg-charcoal-900/80 md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute bottom-0 left-0 top-0 z-10 flex w-72 flex-col border-r border-charcoal-800/60 bg-charcoal-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-charcoal-800/60 bg-charcoal-900/80 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <BrandLogo compact showTagline={false} />
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-charcoal-400 hover:bg-charcoal-800 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
