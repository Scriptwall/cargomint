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
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  assignedToUserName: string | null;
  relatedWaybill: string | null;
  messages: Message[];
  lastActivityAtUtc: string;
  createdAt: string;
};

type Message = {
  id: number;
  senderUserId: string;
  senderUserName: string | null;
  senderRole: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
};

const API_BASE = '/api/v1/Support';

function getToken() {
  const tokenFromCookie = document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1];
  if (tokenFromCookie) return tokenFromCookie;
  return window.localStorage.getItem('cm_token') ?? '';
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init, headers });
}

function formatTimeAgo(dateStr: string): string {
  const diffMs = new Date().getTime() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function priorityBadge(priority: string) {
  const cls = priority === 'Critical' ? 'badge-red' : priority === 'High' ? 'badge-amber' : priority === 'Medium' ? 'badge-blue' : 'badge-gray';
  return <span className={`badge ${cls}`}>{priority}</span>;
}

function statusBadge(status: string) {
  const cls = status === 'Open' || status === 'WaitingForTenantAdmin' ? 'badge-blue' : status === 'InProgress' ? 'badge-amber' : status === 'Resolved' ? 'badge-green' : status === 'Closed' ? 'badge-gray' : 'badge-red';
  return <span className={`badge ${cls}`}>{status.replace(/([A-Z])/g, ' $1').trim()}</span>;
}

export default function OpsSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: 'TechnicalSystemIssue',
    priority: 'Medium',
    relatedWaybill: '',
  });

  const loadData = async () => {
    try {
      const res = await apiFetch('/tickets');
      if (res.ok) setTickets(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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
        body: JSON.stringify({ ticketId: selectedTicket.id, body: messageInput.trim() }),
      });
      if (res.ok) {
        setMessageInput('');
        await selectTicket(selectedTicket);
        await loadData();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
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
        setCreateForm({ subject: '', description: '', category: 'TechnicalSystemIssue', priority: 'Medium', relatedWaybill: '' });
        await loadData();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo-bar">
          <div className="logo-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5v2h14V5L8 1zM2 8v5h3V9h6v4h3V8H2zm4 1h4v4H6V9z" /></svg></div>
          <div><div className="logo-text">CargoMint</div><div className="logo-tenant">Operations</div></div>
        </div>
        <nav className="nav">
          <div className="nav-grp">
            <div className="nav-grp-label">Support</div>
            <div className="nav-item active">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z" /></svg>
              My Tickets
              {tickets.length > 0 && <span className="nav-count">{tickets.length}</span>}
            </div>
          </div>
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="ava">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div><div className="u-name">{user?.name ?? 'User'}</div><div className="u-role">{user?.role ?? 'Operator'}</div></div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Need Help?</div>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>+ Raise Issue</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '320px 1fr' : '1fr', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
          <div style={{ borderRight: '0.5px solid var(--border)', overflowY: 'auto', background: 'var(--bg-surface)' }}>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--text-tertiary)' }}>Loading...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div>No tickets yet. Raise an issue to get help.</div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 10 }}>{t.ticketNumber}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{formatTimeAgo(t.lastActivityAtUtc)}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  <div style={{ display: 'flex', gap: 4 }}>{priorityBadge(t.priority)}{statusBadge(t.status)}</div>
                </div>
              ))
            )}
          </div>

          {selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{selectedTicket.ticketNumber}</span>
                  {priorityBadge(selectedTicket.priority)}
                  {statusBadge(selectedTicket.status)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTicket.subject}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 10, background: 'var(--bg-subtle)', borderRadius: 6, marginBottom: 16 }}>
                  {selectedTicket.description}
                </div>
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{msg.senderUserName ?? 'Unknown'}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{formatTimeAgo(msg.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.6, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                      {msg.body}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 14, borderTop: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <textarea
                  className="inp"
                  rows={2}
                  placeholder="Reply..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) void sendMessage(); }}
                  style={{ resize: 'none', marginBottom: 6 }}
                />
                <button className="btn primary" onClick={() => void sendMessage()} disabled={sending || !messageInput.trim()}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 14 }}>Select a ticket to view</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="overlay open" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Raise Issue to Admin</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="form-row">
              <label className="form-label">Subject</label>
              <input className="form-input" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="What's the issue?" />
            </div>
            <div className="form-row">
              <label className="form-label">Description</label>
              <textarea className="inp" rows={4} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Describe the problem in detail..." />
            </div>
            <div className="form-2">
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
                  <option value="TechnicalSystemIssue">Technical/System Issue</option>
                  <option value="ShipmentIssue">Shipment Issue</option>
                  <option value="ManifestIssue">Manifest Issue</option>
                  <option value="PricingIssue">Pricing Issue</option>
                  <option value="DriverAssignmentIssue">Driver Assignment Issue</option>
                  <option value="PaymentIssue">Payment Issue</option>
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
              <button className="btn primary" onClick={() => void createTicket()}>Submit Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

