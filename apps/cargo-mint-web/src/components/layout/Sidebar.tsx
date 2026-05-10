import React from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  active?: boolean;
}

interface SidebarProps {
  portalName: string;
  portalSub: string;
  navGroups: {
    label: string;
    items: NavItem[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ portalName, portalSub, navGroups }) => {
  return (
    <aside className="sidebar">
      <div className="logo-bar">
        <div className="logo-icon">
          <svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v2A1.5 1.5 0 0113.5 7h-11A1.5 1.5 0 011 5.5v-2zm0 6A1.5 1.5 0 012.5 8h11A1.5 1.5 0 0115 9.5v3A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-3z"/></svg>
        </div>
        <div>
          <div className="logo-text">{portalName}</div>
          <div className="logo-tenant">{portalSub}</div>
        </div>
      </div>

      <nav className="nav">
        {navGroups.map((group, idx) => (
          <div key={idx} className="nav-grp">
            <div className="nav-grp-label">{group.label}</div>
            {group.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
                {item.active && <span className="nav-pip"></span>}
                {item.badge && <span className="nav-count">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="ava">HM</div>
          <div>
            <div className="u-name">Hub Manager</div>
            <div className="u-role">Lagos Hub · Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
