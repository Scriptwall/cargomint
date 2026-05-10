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
  closedAtUtc: string | null;
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

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [filterTab, setFilterTab] = useState<'escalated' | 'all' | 'critical'>('escalated');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        apiFetch('/tickets'),
        apiFetch('/stats'),
      ]);
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data);
      }
      if (statsRes.ok) setStats(await statsRes.json());
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
    let filtered = tickets;
    if (filterTab === 'escalated') {
      filtered = tickets.filter(t => t.escalationLevel === 'PlatformSupport' && t.status !== 'Closed' && t.status !== 'Resolved');
    } else if (filterTab === 'critical') {
      filtered = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed' && t.status !== 'Resolved');
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(s) ||
        t.subject.toLowerCase().includes(s) ||
        (t.createdByUserEmail?.toLowerCase().includes(s))
      );
    }
    setFilteredTickets(filtered);
  }, [tickets, filterTab, searchTerm]);

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

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5v2h14V5L8 1zM2 8v5h3V9h6v4h3V8H2zm4 1h4v4H6V9z" /></svg></div>
          <div><div className="logo-text">CargoMint</div><div className="logo-sub">Platform Support</div></div>
        </div>
        <nav className="nav">
          <div className="nav-grp">
            <div className="nav-grp-label">Platform Support</div>
            <div className={`nav-item ${filterTab === 'escalated' ? 'active' : ''}`} onClick={() => setFilterTab('escalated')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 11H1L8 1zm0 4v3m0 2h.01" /></svg>
              Escalated Tickets
              {stats && stats.escalated > 0 && <span className="nav-badge">{stats.escalated}</span>}
            </div>
            <div className={`nav-item ${filterTab === 'critical' ? 'active' : ''}`} onClick={() => setFilterTab('critical')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3" /></svg>
              Critical
              {stats && stats.critical > 0 && <span className="nav-badge">{stats.critical}</span>}
            </div>
            <div className={`nav-item ${filterTab === 'all' ? 'active' : ''}`} onClick={() => setFilterTab('all')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z" /></svg>
              All Tickets
              {stats && stats.total > 0 && <span className="nav-count">{stats.total}</span>}
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar" style={{ background: 'var(--bg-info)', color: 'var(--text-info)' }}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</div>
            <div><div className="user-name">{user?.name ?? 'Admin'}</div><div className="user-email">{user?.email ?? ''}</div></div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">Platform Support</div>
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 110-10 5 5 0 010 10z" /></svg>
            <input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '360px 1fr' : '1fr', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
          <div style={{ borderRight: '0.5px solid var(--border)', overflowY: 'auto', background: 'var(--bg-surface)' }}>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--text-tertiary)' }}>Loading...</div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div>No {filterTab} tickets</div>
              </div>
            ) : (
              filteredTickets.map((t) => (
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
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    {priorityBadge(t.priority)}
                    {statusBadge(t.status)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    From: {t.createdByUserName ?? t.createdByUserEmail} ({t.creatorRole.replace(/([A-Z])/g, ' $1').trim()})
                  </div>
                  {t.unreadCount > 0 && <span className="badge badge-red" style={{ marginTop: 4 }}>{t.unreadCount} new</span>}
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
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{selectedTicket.subject}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  From: {selectedTicket.createdByUserName ?? selectedTicket.createdByUserEmail} · {selectedTicket.creatorRole.replace(/([A-Z])/g, ' $1').trim()} · {selectedTicket.category.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 10, background: 'var(--bg-subtle)', borderRadius: 6, marginBottom: 16 }}>
                  {selectedTicket.description}
                </div>
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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
                      background: msg.senderRole === 'TenantAdmin' ? 'var(--bg-info)' : 'var(--bg-subtle)',
                      borderRadius: 8,
                    }}>
                      {msg.body}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 14, borderTop: '0.5px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
                    <>
                      <button className="btn sm" onClick={() => updateStatus('InProgress')}>In Progress</button>
                      <button className="btn sm" onClick={() => updateStatus('Resolved')}>Resolve</button>
                      <button className="btn sm" onClick={() => updateStatus('Closed')}>Close</button>
                    </>
                  )}
                </div>
                <textarea
                  className="inp"
                  rows={2}
                  placeholder="Reply to ticket..."
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
                <div style={{ fontSize: 40, marginBottom: 8 }}>🛠️</div>
                <div style={{ fontSize: 14 }}>Select an escalated ticket to respond</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
