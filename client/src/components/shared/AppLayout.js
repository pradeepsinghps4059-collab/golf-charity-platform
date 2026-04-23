import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from './BrandLogo';

const UserNavLinks = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/scores', icon: '✦', label: 'My Scores' },
  { to: '/draws', icon: '⟐', label: 'Draws & Results' },
  { to: '/charity', icon: '◆', label: 'My Charity' },
  { to: '/subscription', icon: '⬡', label: 'Subscription' },
];

const AdminNavLinks = [
  { to: '/admin', icon: '◉', label: 'Overview' },
  { to: '/admin/users', icon: '◈', label: 'Users' },
  { to: '/admin/draws', icon: '⟐', label: 'Draw System' },
  { to: '/admin/winners', icon: '✦', label: 'Winners' },
  { to: '/admin/charities', icon: '◆', label: 'Charities' },
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
      <div className="border-b border-white/[0.08] px-6 py-7">
        <div>
          <BrandLogo compact showTagline={false} />
          <div className="mt-3 text-xs font-body uppercase tracking-[0.24em] text-charcoal-500">
            {user?.role === 'admin' ? 'Admin Panel' : 'Player Portal'}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-nebula-500/15 bg-nebula-900/20 text-[13px] font-semibold text-nebula-300">
              {link.icon}
            </span>
            <span className="tracking-[0.01em]">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4">
        <div className="dashboard-highlight">
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Your impact</div>
            <div className="mt-2 font-display text-2xl text-white">Every round counts</div>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-300">
              Track scores, enter draws, and watch your charity contributions grow with every game.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.08] px-4 py-5">
        <div className="mb-3 flex items-center gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-nebula-500 to-stargold-500 text-sm font-bold text-white shadow-lg shadow-nebula-950/30">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user?.name}</div>
            <div className="truncate text-xs text-charcoal-500">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-900/20 hover:text-red-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-[11px] font-semibold text-red-300">
            ✕
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <aside className="sidebar-panel hidden h-screen w-72 shrink-0 flex-col md:sticky md:top-0 md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-cosmic-900/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-panel absolute bottom-0 left-0 top-0 z-10 flex w-72 flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-white/[0.08] bg-cosmic-800/50 px-4 py-4 backdrop-blur-2xl md:hidden">
          <div className="flex items-center justify-between">
            <BrandLogo compact showTagline={false} />
            <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-nebula-500/15 bg-white/[0.03] p-2.5 text-charcoal-400 hover:bg-white/[0.06] hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 animate-cosmic-fade-in">
          <div className="hero-shell min-h-full p-4 md:p-6">
            {/* Cosmic accent glows */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-nebula-500/[0.03] to-transparent" />
            <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-nebula-500/8 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-stargold-400/6 blur-3xl" />
            <div className="pointer-events-none absolute bottom-6 right-10 h-28 w-28 rounded-full border border-nebula-500/[0.06] bg-nebula-500/[0.02] blur-2xl" />
            <div className="relative h-full">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
