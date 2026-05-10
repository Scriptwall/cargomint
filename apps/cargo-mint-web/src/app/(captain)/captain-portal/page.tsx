'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CaptainPortal() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('deliveries');
  const [toastMsg, setToastMsg] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      deliveries: 'Active Route', history: 'Delivery History', earnings: 'Earnings & Wallet', vehicle: 'Vehicle Details'
    };
    return titles[currentPage] || 'Active Route';
  };

  const jobs = [
    { waybill: 'CM-0912-7X', receiver: 'John Doe', destination: 'Lekki Phase 1, Lagos', status: 'pending', distance: '4.2 km', payout: '₦1,200' },
    { waybill: 'CM-8821-2Y', receiver: 'Jane Smith', destination: 'Victoria Island, Lagos', status: 'pending', distance: '6.5 km', payout: '₦1,800' },
    { waybill: 'CM-7182-9Z', receiver: 'Tech Store', destination: 'Ikoyi, Lagos', status: 'delivered', distance: '2.1 km', payout: '₦850' },
  ];

  const renderDeliveries = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">Current Assignments</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Apr 24, 2026</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-label">Pending Stops</div><div className="metric-value">2</div><div className="metric-delta">On route</div></div>
        <div className="metric-card"><div className="metric-label">Completed Today</div><div className="metric-value">1</div><div className="metric-delta up">Great job</div></div>
        <div className="metric-card"><div className="metric-label">Est. Earnings</div><div className="metric-value">₦3,850</div><div className="metric-delta up">Pending payout</div></div>
      </div>
      <div className="card-grid">
        <div className="card card-p">
          <div className="card-title">Next Stop</div>
          <div className="tenant-list-item">
            <div className="t-avatar" style={{ background: 'var(--bg-info)', color: 'var(--text-info)' }}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: '12px', height: '12px' }}><path d="M8 0a5.5 5.5 0 00-5.5 5.5c0 3.73 5.05 10.13 5.25 10.4a.33.33 0 00.5 0c.2-.27 5.25-6.67 5.25-10.4A5.5 5.5 0 008 0zm0 8a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-name">{jobs[0].destination}</div>
              <div className="t-meta">{jobs[0].receiver} ({jobs[0].waybill})</div>
            </div>
            <span className="badge badge-amber">{jobs[0].distance}</span>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => showToast('Starting navigation...')}>Navigate</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => showToast('Marked as Delivered!')}>Complete Delivery</button>
          </div>
        </div>
        <div className="card card-p">
          <div className="card-title">Upcoming Stops</div>
          <div className="tenant-list-item">
            <div className="t-avatar" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: '12px', height: '12px' }}><path d="M8 0a5.5 5.5 0 00-5.5 5.5c0 3.73 5.05 10.13 5.25 10.4a.33.33 0 00.5 0c.2-.27 5.25-6.67 5.25-10.4A5.5 5.5 0 008 0zm0 8a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-name">{jobs[1].destination}</div>
              <div className="t-meta">{jobs[1].receiver} ({jobs[1].waybill})</div>
            </div>
            <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{jobs[1].distance}</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">Delivery History</span>
      </div>
      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Waybill</th><th>Receiver</th><th>Destination</th><th>Payout</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {jobs.map((s, i) => (
                <tr key={i}>
                  <td className="td-mono">{s.waybill}</td>
                  <td><span style={{ fontWeight: 500, fontSize: '12px' }}>{s.receiver}</span></td>
                  <td>{s.destination}</td>
                  <td className="td-mono">{s.payout}</td>
                  <td><span className={`dot dot-${s.status === 'delivered' ? 'green' : s.status === 'transit' ? 'amber' : 'red'}`}></span><span style={{ fontSize: '11px' }}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Apr 24, 2026</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderEarnings = () => (
    <>
      <div className="sec-hd"><span className="sec-ttl">Earnings & Wallet</span></div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-label">Available Balance</div><div className="metric-value">₦24,500</div><button className="btn primary" style={{ marginTop: '8px' }} onClick={() => showToast('Withdraw modal')}>Withdraw Funds</button></div>
        <div className="metric-card"><div className="metric-label">Weekly Earnings</div><div className="metric-value">₦82,000</div><div className="metric-delta up">Apr 18 - 24</div></div>
      </div>
      <div className="full-card">
        <div className="sec-title" style={{ marginBottom: '12px' }}>Recent Payouts & Earnings</div>
        <table style={{ width: '100%' }}>
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Apr 24</td><td>Delivery Payout: CM-7182-9Z</td><td className="td-mono" style={{ color: 'var(--text-success)' }}>+₦850</td></tr>
            <tr><td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Apr 22</td><td>Weekly Bank Withdrawal</td><td className="td-mono" style={{ color: 'var(--text-danger)' }}>-₦65,000</td></tr>
            <tr><td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Apr 21</td><td>Delivery Payout: CM-9912-1X</td><td className="td-mono" style={{ color: 'var(--text-success)' }}>+₦1,400</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );

  const renderVehicle = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">Vehicle Details</span>
        <button className="btn primary" onClick={() => showToast('Report Issue')}>Report Issue</button>
      </div>
      <div className="card-grid">
        <div className="card card-p">
          <div className="card-title">Assigned Vehicle</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Toyota Hiace (2022)</strong><br/>
            License Plate: KJA-902-XC<br/>
            Color: White<br/>
            Capacity: 1.5 Tons
          </div>
          <span className="badge badge-green">Active & Inspected</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="shell">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 16 16"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v2A1.5 1.5 0 0112.5 7h-9A1.5 1.5 0 012 5.5v-2zm0 6A1.5 1.5 0 013.5 8h9A1.5 1.5 0 0114 9.5v3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-3z"/></svg>
            </div>
            <div>
              <div className="logo-name">CargoMint</div>
              <div className="logo-sub">captain portal</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section">
              <div className="nav-section-label">Operations</div>
              <div className={`nav-item ${currentPage === 'deliveries' ? 'active' : ''}`} onClick={() => setCurrentPage('deliveries')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a5.5 5.5 0 00-5.5 5.5c0 3.73 5.05 10.13 5.25 10.4a.33.33 0 00.5 0c.2-.27 5.25-6.67 5.25-10.4A5.5 5.5 0 008 0zm0 8a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                Active Route
              </div>
              <div className={`nav-item ${currentPage === 'history' ? 'active' : ''}`} onClick={() => setCurrentPage('history')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z"/></svg>
                Delivery History
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Finance</div>
              <div className={`nav-item ${currentPage === 'earnings' ? 'active' : ''}`} onClick={() => setCurrentPage('earnings')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 3A1.5 1.5 0 001 4.5v7A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0013.5 3h-11zM2 4.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v1.516L8 8.86 2 6.016V4.5zM14 11.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-4.25l5.548 2.589a1 1 0 00.844 0L14 7.25v4.25z"/></svg>
                Earnings & Wallet
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Fleet</div>
              <div className={`nav-item ${currentPage === 'vehicle' ? 'active' : ''}`} onClick={() => setCurrentPage('vehicle')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm1 0v.511l5 3.125 5-3.125V4H3zm0 1.736V12h10V5.736L8 8.86 3 5.736z"/></svg>
                Vehicle Details
              </div>
            </div>
          </nav>

          <div className="sidebar-footer" style={{ position: 'relative' }}>
            {userMenuOpen ? (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', background: 'rgba(10,14,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', animation: 'slideUpCard 160ms ease-out' }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={() => { setUserMenuOpen(false); logout(); }}>Log out</button>
              </div>
            ) : null}
            <div className="user-row" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
              <div className="avatar" style={{ background: '#E6F1FB', color: '#185FA5' }}>{(user?.firstName?.[0] ?? 'D')}{(user?.lastName?.[0] ?? 'R')}</div>
              <div>
                <div className="user-name">{user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Dave R.'}</div>
                <div className="user-email">{user?.email || 'Captain ID: #4012'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-title">{getPageTitle()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="dot dot-green"></span>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>Online & Ready</span>
            </div>
          </header>

          <div className="content">
            {currentPage === 'deliveries' && renderDeliveries()}
            {currentPage === 'history' && renderHistory()}
            {currentPage === 'earnings' && renderEarnings()}
            {currentPage === 'vehicle' && renderVehicle()}
          </div>
        </div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
