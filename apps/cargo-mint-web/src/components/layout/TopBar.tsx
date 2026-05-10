import React from 'react';

interface TopBarProps {
  title: string;
  onSearch?: (query: string) => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const TopBar: React.FC<TopBarProps> = ({ title, primaryAction }) => {
  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      
      <div className="srch">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
        </svg>
        <input placeholder="Search waybills, customers..." />
      </div>

      {primaryAction && (
        <button className="btn primary" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </button>
      )}
    </header>
  );
};
