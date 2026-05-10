'use client';

import React from 'react';

type AdminPage = 'dashboard' | 'tenants' | 'invitations' | 'finance' | 'fleet' | 'settings' | 'regions' | 'audit';

type SidebarProps = {
  currentPage: AdminPage;
  onChangePage: (page: AdminPage) => void;
  totalTenants: number;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    roles?: string[];
  } | null;
  onLogout: () => void;
};

function SidebarItem({
  isActive,
  onClick,
  icon,
  label,
  badge
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      {icon}
      {label}
      {badge}
    </div>
  );
}

export default function Sidebar({
  currentPage,
  onChangePage,
  totalTenants,
  user,
  onLogout
}: SidebarProps) {
  const initials = `${user?.firstName?.[0] ?? 'S'}${user?.lastName?.[0] ?? 'A'}`;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Super Admin';
  const email = user?.email || 'root@cargomint.io';
  const role = Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : 'Super Admin';

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <svg viewBox="0 0 16 16">
            <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v2A1.5 1.5 0 0112.5 7h-9A1.5 1.5 0 012 5.5v-2zm0 6A1.5 1.5 0 013.5 8h9A1.5 1.5 0 0114 9.5v3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-3z" />
          </svg>
        </div>
        <div>
          <div className="logo-name">CargoMint</div>
          <div className="logo-sub">master console</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">
          <div className="nav-section-label">Overview</div>
          <SidebarItem
            isActive={currentPage === 'dashboard'}
            onClick={() => onChangePage('dashboard')}
            label="Dashboard"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" />
              </svg>
            }
          />
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Tenants</div>
          <SidebarItem
            isActive={currentPage === 'tenants'}
            onClick={() => onChangePage('tenants')}
            label="Tenant Management"
            badge={<span className="nav-badge">{totalTenants}</span>}
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z" />
              </svg>
            }
          />
          <SidebarItem
            isActive={currentPage === 'invitations'}
            onClick={() => onChangePage('invitations')}
            label="Invitations"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm1 0v.511l5 3.125 5-3.125V4H3zm0 1.736V12h10V5.736L8 8.86 3 5.736z" />
              </svg>
            }
          />
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Finance</div>
          <SidebarItem
            isActive={currentPage === 'finance'}
            onClick={() => onChangePage('finance')}
            label="Finance Oversight"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 12.5h12v1H2v-1zm1-2.2l2.2-2.4 1.8 1.7L10.7 5l2.3 2.4v2.9H3v-1z" />
              </svg>
            }
          />
          <SidebarItem
            isActive={currentPage === 'fleet'}
            onClick={() => onChangePage('fleet')}
            label="Fleet & Compliance"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h7l3 3h1v3h-1.1a1.9 1.9 0 01-3.8 0H6.9a1.9 1.9 0 01-3.8 0H2V5zm2 5.5a.9.9 0 101.8 0 .9.9 0 00-1.8 0zm6 0a.9.9 0 101.8 0 .9.9 0 00-1.8 0z" />
              </svg>
            }
          />
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Configuration</div>
          <SidebarItem
            isActive={currentPage === 'settings'}
            onClick={() => onChangePage('settings')}
            label="Global Settings"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26-.77zM8 6a2 2 0 100 4A2 2 0 008 6z" />
              </svg>
            }
          />
          <SidebarItem
            isActive={currentPage === 'regions'}
            onClick={() => onChangePage('regions')}
            label="Countries & Regions"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 11.001 12.001A6 6 0 018 2zm0 1.5C6.07 3.5 4.5 5.57 4.5 8S6.07 12.5 8 12.5 11.5 10.43 11.5 8 9.93 3.5 8 3.5zm-3.47.8A6 6 0 014.08 7H2.04A5.98 5.98 0 014.53 4.3zm6.94 0A5.98 5.98 0 0113.96 7h-2.04a6 6 0 00-2.45-2.7zM5.5 8A4.4 4.4 0 018 4c1.34 0 2.54.6 3.35 1.55.1.14.19.29.27.45H4.38c.08-.16.17-.31.27-.45A4.41 4.41 0 015.5 8z" />
              </svg>
            }
          />
        </div>

        <div className="nav-section">
          <div className="nav-section-label">System</div>
          <SidebarItem
            isActive={currentPage === 'audit'}
            onClick={() => onChangePage('audit')}
            label="Audit Log"
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1H3zm1 2h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z" />
              </svg>
            }
          />
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-row">
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-email" style={{ marginBottom: 2 }}>
              {role}
            </div>
            <div className="user-name">{fullName}</div>
            <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email}
            </div>
          </div>
          <button className="icon-btn" onClick={onLogout} type="button" title="Logout">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 2.5A1.5 1.5 0 017.5 1h4A1.5 1.5 0 0113 2.5v11a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 016 13.5V11h1v2.5a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-4a.5.5 0 00-.5.5V5H6V2.5zm2.85 5.5H2v1h6.85l-1.7 1.7.7.7L10.76 8 7.85 5.1l-.7.7L8.85 7.5z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
