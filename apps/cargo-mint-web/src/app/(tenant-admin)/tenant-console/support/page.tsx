'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

type Ticket = {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  escalationLevel: string;
  creatorRole: string;
  createdByUserId: string;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  relatedShipmentId: number | null;
  relatedWaybill: string | null;
  relatedServiceCentreId: number | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  lastActivityAtUtc: string;
  createdAt: string;
};

type TicketDetail = {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  escalationLevel: string;
  creatorRole: string;
  createdByUserId: string;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  relatedShipmentId: number | null;
  relatedWaybill: string | null;
  relatedServiceCentreId: number | null;
  lastMessagePreview: string | null;
  lastActivityAtUtc: string;
  createdAt: string;
  closedAtUtc: string | null;
  messages: Message[];
};

type Message = {
  id: number;
  senderUserId: string;
  senderUserName: string | null;
  senderRole: string;
  body: string;
  attachmentUrl: string | null;
  isInternalNote: boolean;
  isRead: boolean;
  createdAt: string;
};

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
  critical: number;
  unreadByMe: number;
};

const API_BASE = '/api/v1/Support';

function getToken() {
  const tokenFromCookie = document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1];
  if (tokenFromCookie) return tokenFromCookie;
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('cm_token') ?? '';
  }
  return '';
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init, headers });
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function priorityBadge(priority: string) {
  const cls = priority === 'Critical' ? 'badge-red' : priority === 'High' ? 'badge-amber' : priority === 'Medium' ? 'badge-blue' : 'badge-gray';
  return <span className={`badge ${cls}`}>{priority}</span>;
}

function statusBadge(status: string) {
  const cls = status === 'Open' || status === 'WaitingForTenantAdmin' ? 'badge-blue' : status === 'InProgress' ? 'badge-amber' : status === 'Resolved' ? 'badge-green' : status === 'Closed' ? 'badge-gray' : 'badge-red';
  return <span className={`badge ${cls}`}>{status.replace(/([A-Z])/g, ' $1').trim()}</span>;
}

export default function TenantSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: 'GeneralQuestion',
    priority: 'Medium',
    relatedWaybill: '',
  });

  const loadData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        apiFetch(`/tickets?status=${filterStatus}&priority=${filterPriority}&search=${searchTerm}`),
        apiFetch('/stats'),
      ]);
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filterStatus, filterPriority, searchTerm]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages?.length]);

  const selectTicket = async (ticket: { id: number }) => {
    try {
      const res = await apiFetch(`/tickets/${ticket.id}`);
      if (res.ok) setSelectedTicket(await res.json());
    } catch {
      // silent
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !messageInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ ticketId: selectedTicket.id, body: messageInput.trim(), isInternalNote }),
      });
      if (res.ok) {
        setMessageInput('');
        setIsInternalNote(false);
        await selectTicket(selectedTicket);
        await loadData();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      await apiFetch(`/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ ticketId: selectedTicket.id, status }),
      });
      await selectTicket(selectedTicket);
      await loadData();
    } catch {
      // silent
    }
  };

  const escalateTicket = async () => {
    if (!selectedTicket) return;
    try {
      await apiFetch(`/tickets/${selectedTicket.id}/escalate`, { method: 'POST' });
      await selectTicket(selectedTicket);
      await loadData();
    } catch {
      // silent
    }
  };

  const createTicket = async () => {
    if (!createForm.subject.trim() || !createForm.description.trim()) return;
    try {
      const res = await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ subject: '', description: '', category: 'GeneralQuestion', priority: 'Medium', relatedWaybill: '' });
        await loadData();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5v2h14V5L8 1zM2 8v5h3V9h6v4h3V8H2zm4 1h4v4H6V9z" /></svg></div>
          <div><div className="logo-text">CargoMint</div><div className="logo-sub">Support Desk</div></div>
        </div>
        <nav className="nav">
          <div className="nav-grp">
            <div className="nav-grp-label">Support</div>
            <div className="nav-item active" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z" /></svg>
              All Tickets
              {stats && stats.total > 0 && <span className="nav-count">{stats.total}</span>}
            </div>
            <div className="nav-item" onClick={() => { setFilterStatus('Open'); setFilterPriority(''); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3" /></svg>
              Open
              {stats && stats.open > 0 && <span className="nav-count">{stats.open}</span>}
            </div>
            <div className="nav-item" onClick={() => { setFilterStatus('InProgress'); setFilterPriority(''); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a1 1 0 110 2 1 1 0 010-2zm1 4H7v1h2V8z" /></svg>
              In Progress
              {stats && stats.inProgress > 0 && <span className="nav-count">{stats.inProgress}</span>}
            </div>
            <div className="nav-item" onClick={() => { setFilterStatus('EscalatedToPlatformSupport'); setFilterPriority(''); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 11H1L8 1zm0 4v3m0 2h.01" /></svg>
              Escalated
              {stats && stats.escalated > 0 && <span className="nav-count">{stats.escalated}</span>}
            </div>
            <div className="nav-item" onClick={() => { setFilterStatus(''); setFilterPriority('Critical'); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 11H1L8 1zm0 4v3m0 2h.01" /></svg>
              Critical
              {stats && stats.critical > 0 && <span className="nav-count">{stats.critical}</span>}
            </div>
            <div className="nav-item" onClick={() => { setFilterStatus('Resolved'); setFilterPriority(''); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 3.5l-8 8-4-4" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
              Resolved
              {stats && stats.resolved > 0 && <span className="nav-count">{stats.resolved}</span>}
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div><div className="user-name">{user?.name ?? 'User'}</div><div className="user-email">{user?.email ?? ''}</div></div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Support Tickets</div>
          <div className="srch">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 110-10 5 5 0 010 10z" /></svg>
            <input placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>+ New Ticket</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '340px 1fr' : '1fr', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
          <div style={{ borderRight: '0.5px solid var(--border)', overflowY: 'auto', background: 'var(--bg-surface)' }}>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--text-tertiary)' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div>No tickets found</div>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => selectTicket(t)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '0.5px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedTicket?.id === t.id ? 'var(--bg-subtle)' : 'transparent',
                    borderLeft: selectedTicket?.id === t.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 10 }}>{t.ticketNumber}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{formatTimeAgo(t.lastActivityAtUtc)}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    {priorityBadge(t.priority)}
                    {statusBadge(t.status)}
                    {t.unreadCount > 0 && <span className="badge badge-red">{t.unreadCount} new</span>}
                  </div>
                  {t.lastMessagePreview && (
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.lastMessagePreview}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{selectedTicket.ticketNumber}</span>
                      {priorityBadge(selectedTicket.priority)}
                      {statusBadge(selectedTicket.status)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {selectedTicket.createdByUserName ?? selectedTicket.createdByUserEmail} · {selectedTicket.category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
                      <>
                        <button className="btn sm" onClick={() => updateStatus('InProgress')}>In Progress</button>
                        <button className="btn sm" onClick={() => updateStatus('Resolved')}>Resolve</button>
                        <button className="btn sm" onClick={() => updateStatus('Closed')}>Close</button>
                      </>
                    )}
                    {selectedTicket.escalationLevel !== 'PlatformSupport' && selectedTicket.status !== 'Closed' && (
                      <button className="btn sm danger" onClick={escalateTicket}>Escalate</button>
                    )}
                  </div>
                </div>
                {selectedTicket.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 10, background: 'var(--bg-subtle)', borderRadius: 6 }}>
                    {selectedTicket.description}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 16, opacity: msg.isInternalNote ? 0.8 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{msg.senderUserName ?? 'Unknown'}</span>
                        {msg.isInternalNote && <span className="badge badge-amber">Internal Note</span>}
                        <span className="badge badge-gray">{msg.senderRole.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{formatTimeAgo(msg.createdAt)}</span>
                    </div>
                    <div style={{
                      fontSize: 12,
                      lineHeight: 1.6,
                      padding: '8px 12px',
                      background: msg.isInternalNote ? 'var(--bg-warning)' : msg.senderRole === 'Customer' ? 'var(--bg-info)' : 'var(--bg-subtle)',
                      borderRadius: 8,
                      borderLeft: msg.isInternalNote ? '3px solid var(--amber)' : '3px solid var(--border)',
                    }}>
                      {msg.body}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 14, borderTop: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />
                        Internal note
                      </label>
                    </div>
                    <textarea
                      className="inp"
                      rows={2}
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) void sendMessage(); }}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <button className="btn primary" onClick={() => void sendMessage()} disabled={sending || !messageInput.trim()}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 14 }}>Select a ticket to view conversation</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="overlay open" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Support Ticket</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="form-row">
              <label className="form-label">Subject</label>
              <input className="form-input" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="form-row">
              <label className="form-label">Description</label>
              <textarea className="inp" rows={4} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Detailed description of the issue" />
            </div>
            <div className="form-2">
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
                  <option value="ShipmentIssue">Shipment Issue</option>
                  <option value="PickupIssue">Pickup Issue</option>
                  <option value="DeliveryIssue">Delivery Issue</option>
                  <option value="PaymentIssue">Payment Issue</option>
                  <option value="WalletIssue">Wallet Issue</option>
                  <option value="PricingIssue">Pricing Issue</option>
                  <option value="ManifestIssue">Manifest Issue</option>
                  <option value="DriverAssignmentIssue">Driver Assignment Issue</option>
                  <option value="CustomerComplaint">Customer Complaint</option>
                  <option value="TechnicalSystemIssue">Technical/System Issue</option>
                  <option value="AccountLoginIssue">Account/Login Issue</option>
                  <option value="GeneralQuestion">General Question</option>
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="form-select" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Related Waybill (optional)</label>
              <input className="form-input" value={createForm.relatedWaybill} onChange={(e) => setCreateForm({ ...createForm, relatedWaybill: e.target.value })} placeholder="WB..." />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn primary" onClick={() => void createTicket()}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

