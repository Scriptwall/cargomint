'use client';

import React from 'react';

type TopbarProps = {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onSettingsClick: () => void;
  onPrimaryAction?: (() => void) | null;
  primaryActionLabel?: string | null;
};

export default function Topbar({
  title,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  onSettingsClick,
  onPrimaryAction,
  primaryActionLabel
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="search-wrap">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10.5 10.5l3 3" />
        </svg>
        <input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <button className="btn" onClick={onSettingsClick} type="button">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26-.77zM8 6a2 2 0 100 4A2 2 0 008 6z" />
        </svg>
        Settings
      </button>
      {primaryActionLabel && onPrimaryAction ? (
        <button className="btn primary" onClick={onPrimaryAction} type="button">
          {primaryActionLabel}
        </button>
      ) : null}
    </header>
  );
}
