'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

type PageKey = 'home' | 'shipments' | 'wallet' | 'addresses';

type BookingItemInput = {
  description: string;
  quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
};

type BookingQuote = {
  sessionId: string;
  zoneName: string;
  lineItems: Array<{ description: string; billableWeightKg: number; baseRate: number }>;
  subTotal: number;
  vatAmount: number;
  insuranceAmount: number;
  grandTotal: number;
  currencyCode: string;
  currencySymbol: string;
  totalBillableWeight: number;
  isCashOnDelivery: boolean;
};

type PublicTimeline = {
  waybill: string;
  currentStatus: string;
  timeline: Array<{ name: string; completed: boolean; timestamp?: string; location?: string }>;
};

type ConfirmResult = {
  waybill: string;
  grandTotal: number;
  paymentMethod: string;
  trackingUrl: string;
};

type ShipmentView = {
  waybill: string;
  receiver: string;
  destination: string;
  status: string;
  date: string;
  amount: string;
};

const API_BASE = '/api/v1';

const defaultItem: BookingItemInput = {
  description: 'General package',
  quantity: 1,
  weight: 1,
  length: 20,
  width: 20,
  height: 20,
};

export default function ConsumerPortal() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const [toastMsg, setToastMsg] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [bookingQuote, setBookingQuote] = useState<BookingQuote | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmResult | null>(null);

  const [trackWaybillInput, setTrackWaybillInput] = useState('');
  const [trackedTimeline, setTrackedTimeline] = useState<PublicTimeline | null>(null);

  const [shipments, setShipments] = useState<ShipmentView[]>([]);

  const [bookingForm, setBookingForm] = useState({
    senderName: user?.firstName ? `${user.firstName} ${user?.lastName ?? ''}`.trim() : '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverEmail: '',
    departureServiceCentreId: 1,
    destinationServiceCentreId: 2,
    isCashOnDelivery: false,
    paymentMethod: 'wallet',
  });
  const [item, setItem] = useState<BookingItemInput>(defaultItem);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const getPageTitle = () => {
    const titles: Record<PageKey, string> = {
      home: 'Home',
      shipments: 'My Shipments',
      wallet: 'Wallet',
      addresses: 'Saved Addresses',
    };
    return titles[currentPage];
  };

  const activeShipments = useMemo(() => shipments.filter((x) => x.status.toLowerCase() !== 'delivered').length, [shipments]);

  const buildInitiatePayload = () => ({
    senderName: bookingForm.senderName,
    senderPhone: bookingForm.senderPhone,
    receiverName: bookingForm.receiverName,
    receiverPhone: bookingForm.receiverPhone,
    receiverAddress: bookingForm.receiverAddress,
    receiverEmail: bookingForm.receiverEmail || null,
    departureServiceCentreId: Number(bookingForm.departureServiceCentreId),
    destinationServiceCentreId: Number(bookingForm.destinationServiceCentreId),
    items: [{ ...item }],
    isCashOnDelivery: bookingForm.isCashOnDelivery,
  });

  const openBooking = () => {
    setIsBookingOpen(true);
    setBookingSessionId(null);
    setBookingQuote(null);
    setConfirmation(null);
  };

  const initiateAndQuote = async () => {
    setIsSubmitting(true);
    try {
      const initRes = await fetch(`${API_BASE}/consumer/bookings/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInitiatePayload()),
      });

      if (!initRes.ok) {
        throw new Error('Failed to initiate booking session.');
      }

      const initData = await initRes.json();
      const sessionId = initData?.sessionId as string;
      if (!sessionId) throw new Error('Booking session ID was not returned.');
      setBookingSessionId(sessionId);

      const quoteRes = await fetch(`${API_BASE}/consumer/bookings/${encodeURIComponent(sessionId)}/quote`);
      if (!quoteRes.ok) {
        throw new Error('No pricing found for this route/weight.');
      }

      const quote = (await quoteRes.json()) as BookingQuote;
      setBookingQuote(quote);
      showToast('Quote generated successfully.');
    } catch (error: any) {
      showToast(error?.message || 'Unable to generate quote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmBooking = async () => {
    if (!bookingSessionId) {
      showToast('Generate quote before confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...buildInitiatePayload(),
        sessionId: bookingSessionId,
        paymentMethod: bookingForm.paymentMethod,
      };

      const response = await fetch(`${API_BASE}/consumer/bookings/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Booking confirmation failed.');
      }

      const result = (await response.json()) as ConfirmResult;
      setConfirmation(result);

      const newShipment: ShipmentView = {
        waybill: result.waybill,
        receiver: bookingForm.receiverName,
        destination: bookingForm.receiverAddress,
        status: 'processing',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: `${bookingQuote?.currencySymbol ?? 'N'}${Number(result.grandTotal).toLocaleString()}`,
      };
      setShipments((prev) => [newShipment, ...prev]);
      showToast(`Booking confirmed: ${result.waybill}`);
    } catch (error: any) {
      showToast(error?.message || 'Unable to confirm booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackPublicWaybill = async (waybill: string) => {
    if (!waybill.trim()) {
      showToast('Enter a waybill number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/Tracking/public/${encodeURIComponent(waybill.trim())}`);
      if (!response.ok) {
        throw new Error('Waybill not found.');
      }
      const timeline = (await response.json()) as PublicTimeline;
      setTrackedTimeline(timeline);
      setCurrentPage('shipments');
      showToast(`Tracking loaded for ${timeline.waybill}`);
    } catch (error: any) {
      setTrackedTimeline(null);
      showToast(error?.message || 'Unable to track shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHome = () => (
    <>
      <div className="sec-header">
        <span className="sec-title">Welcome back, {user?.firstName || 'Customer'}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card"><div className="metric-label">Active Shipments</div><div className="metric-value">{activeShipments}</div><div className="metric-delta">In progress</div></div>
        <div className="metric-card"><div className="metric-label">Past Deliveries</div><div className="metric-value">{shipments.filter((x) => x.status.toLowerCase() === 'delivered').length}</div><div className="metric-delta up">Recorded</div></div>
        <div className="metric-card"><div className="metric-label">Wallet Balance</div><div className="metric-value">N/A</div><div className="metric-delta">Wallet API is restricted to finance ops role</div></div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Recent Shipments</div>
          {shipments.length === 0 ? (
            <div className="t-meta">No bookings yet. Start with Send a Package.</div>
          ) : (
            shipments.slice(0, 4).map((s) => (
              <div key={s.waybill} className="tenant-list-item">
                <div className="t-avatar" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>{s.receiver.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-name">{s.receiver} ({s.waybill})</div>
                  <div className="t-meta">{s.destination}</div>
                </div>
                <span className={`badge ${s.status.toLowerCase() === 'delivered' ? 'active' : 'trial'}`}>{s.status}</span>
              </div>
            ))
          )}
          <div style={{ marginTop: '12px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCurrentPage('shipments')}>View all shipments</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Actions</div>
          <div className="tenant-list-item" style={{ cursor: 'pointer' }} onClick={openBooking}>
            <div className="t-avatar" style={{ background: 'var(--bg-info)', color: 'var(--text-info)' }}>+</div>
            <div style={{ flex: 1 }}>
              <div className="t-name">Send a Package</div>
              <div className="t-meta">Initiate booking, get quote, confirm waybill</div>
            </div>
          </div>
          <div className="tenant-list-item" style={{ cursor: 'pointer' }} onClick={() => trackPublicWaybill(trackWaybillInput)}>
            <div className="t-avatar" style={{ background: 'var(--bg-success)', color: 'var(--text-success)' }}>T</div>
            <div style={{ flex: 1 }}>
              <div className="t-name">Track a Package</div>
              <div className="t-meta">Use public waybill tracking timeline</div>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: '8px' }}>
            <input className="form-input" placeholder="Enter waybill (e.g. CM2026...)" value={trackWaybillInput} onChange={(e) => setTrackWaybillInput(e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );

  const renderShipments = () => (
    <>
      <div className="sec-header">
        <span className="sec-title">My Shipments</span>
        <button className="btn primary" onClick={openBooking}>+ Send Package</button>
      </div>

      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Waybill</th><th>To</th><th>Destination</th><th>Cost</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {shipments.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No shipments yet.</td></tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.waybill}>
                    <td className="td-mono">{s.waybill}</td>
                    <td><span style={{ fontWeight: 500, fontSize: '12px' }}>{s.receiver}</span></td>
                    <td>{s.destination}</td>
                    <td className="td-mono">{s.amount}</td>
                    <td><span className={`dot dot-${s.status.toLowerCase() === 'delivered' ? 'green' : 'amber'}`}></span><span style={{ fontSize: '11px' }}>{s.status}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.date}</td>
                    <td>
                      <div className="btn-group">
                        <button className="icon-btn" title="Track" onClick={() => trackPublicWaybill(s.waybill)}>
                          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {trackedTimeline && (
        <div className="full-card">
          <div className="card-title">Tracking Timeline: {trackedTimeline.waybill}</div>
          <div className="t-meta" style={{ marginBottom: '8px' }}>Current status: {trackedTimeline.currentStatus}</div>
          {trackedTimeline.timeline.map((m) => (
            <div key={m.name} className="tenant-list-item">
              <div className="t-avatar" style={{ background: m.completed ? 'var(--bg-success)' : 'var(--bg-subtle)', color: m.completed ? 'var(--text-success)' : 'var(--text-secondary)' }}>{m.completed ? 'OK' : '--'}</div>
              <div style={{ flex: 1 }}>
                <div className="t-name">{m.name}</div>
                <div className="t-meta">{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'Pending'}{m.location ? ` - ${m.location}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderWallet = () => (
    <>
      <div className="sec-header"><span className="sec-title">My Wallet</span></div>
      <div className="full-card">
        <div className="t-meta">Wallet endpoints are protected by `FinanceOps` authorization in this backend build. Consumer wallet top-up/history will be enabled once consumer-scoped wallet APIs are exposed.</div>
      </div>
    </>
  );

  const renderAddresses = () => (
    <>
      <div className="sec-header">
        <span className="sec-title">Saved Addresses</span>
      </div>
      <div className="card-grid">
        <div className="card">
          <div className="card-title">Home</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Address persistence API is not yet exposed for consumer scope in this backend.</div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast('Address API pending')}>Add address</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 16 16"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v2A1.5 1.5 0 0112.5 7h-9A1.5 1.5 0 012 5.5v-2zm0 6A1.5 1.5 0 013.5 8h9A1.5 1.5 0 0114 9.5v3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-3z"/></svg>
            </div>
            <div>
              <div className="logo-name">CargoMint</div>
              <div className="logo-sub">consumer portal</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section">
              <div className="nav-section-label">Overview</div>
              <div className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>Home</div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Logistics</div>
              <div className={`nav-item ${currentPage === 'shipments' ? 'active' : ''}`} onClick={() => setCurrentPage('shipments')}>My Shipments</div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Finance</div>
              <div className={`nav-item ${currentPage === 'wallet' ? 'active' : ''}`} onClick={() => setCurrentPage('wallet')}>Wallet</div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Settings</div>
              <div className={`nav-item ${currentPage === 'addresses' ? 'active' : ''}`} onClick={() => setCurrentPage('addresses')}>Addresses</div>
            </div>
          </nav>

          <div className="sidebar-footer" style={{ position: 'relative' }}>
            {userMenuOpen ? (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={() => { setUserMenuOpen(false); logout(); }}>Log out</button>
              </div>
            ) : null}
            <div className="user-row" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
              <div className="avatar">{(user?.firstName?.[0] ?? 'C')}{(user?.lastName?.[0] ?? 'U')}</div>
              <div>
                <div className="user-name">{user?.firstName ? `${user.firstName} ${user?.lastName ?? ''}`.trim() : 'Consumer User'}</div>
                <div className="user-email">{user?.email || 'consumer@cargomint.io'}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-title">{getPageTitle()}</div>
            <div className="search-wrap">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
              <input placeholder="Track waybill..." value={trackWaybillInput} onChange={(e) => setTrackWaybillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && trackPublicWaybill(trackWaybillInput)} />
            </div>
            <button className="btn primary" onClick={openBooking}>+ Send Package</button>
          </header>

          <div className="content">
            {currentPage === 'home' && renderHome()}
            {currentPage === 'shipments' && renderShipments()}
            {currentPage === 'wallet' && renderWallet()}
            {currentPage === 'addresses' && renderAddresses()}
          </div>
        </div>
      </div>

      <div className={`overlay ${isBookingOpen ? 'open' : ''}`} onClick={(e) => e.currentTarget === e.target && setIsBookingOpen(false)}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Send a Package</div>
            <button className="modal-close" onClick={() => setIsBookingOpen(false)}>x</button>
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Sender Name</label>
              <input className="form-input" value={bookingForm.senderName} onChange={(e) => setBookingForm((p) => ({ ...p, senderName: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Sender Phone</label>
              <input className="form-input" value={bookingForm.senderPhone} onChange={(e) => setBookingForm((p) => ({ ...p, senderPhone: e.target.value }))} />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Receiver Name</label>
              <input className="form-input" value={bookingForm.receiverName} onChange={(e) => setBookingForm((p) => ({ ...p, receiverName: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Receiver Phone</label>
              <input className="form-input" value={bookingForm.receiverPhone} onChange={(e) => setBookingForm((p) => ({ ...p, receiverPhone: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Receiver Address</label>
            <input className="form-input" value={bookingForm.receiverAddress} onChange={(e) => setBookingForm((p) => ({ ...p, receiverAddress: e.target.value }))} />
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Departure Service Centre ID</label>
              <input className="form-input" type="number" value={bookingForm.departureServiceCentreId} onChange={(e) => setBookingForm((p) => ({ ...p, departureServiceCentreId: Number(e.target.value || 1) }))} />
            </div>
            <div>
              <label className="form-label">Destination Service Centre ID</label>
              <input className="form-input" type="number" value={bookingForm.destinationServiceCentreId} onChange={(e) => setBookingForm((p) => ({ ...p, destinationServiceCentreId: Number(e.target.value || 1) }))} />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Item Weight (kg)</label>
              <input className="form-input" type="number" value={item.weight} onChange={(e) => setItem((p) => ({ ...p, weight: Number(e.target.value || 1) }))} />
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" value={item.quantity} onChange={(e) => setItem((p) => ({ ...p, quantity: Number(e.target.value || 1) }))} />
            </div>
          </div>

          {bookingQuote && (
            <div className="full-card" style={{ marginBottom: 0 }}>
              <div className="card-title">Quote ({bookingQuote.zoneName})</div>
              <div className="t-meta">Subtotal: {bookingQuote.currencySymbol}{bookingQuote.subTotal.toLocaleString()} | VAT: {bookingQuote.currencySymbol}{bookingQuote.vatAmount.toLocaleString()} | Insurance: {bookingQuote.currencySymbol}{bookingQuote.insuranceAmount.toLocaleString()}</div>
              <div className="metric-value" style={{ fontSize: '18px', marginTop: 6 }}>{bookingQuote.currencySymbol}{bookingQuote.grandTotal.toLocaleString()}</div>
            </div>
          )}

          {confirmation && (
            <div className="full-card" style={{ marginBottom: 0 }}>
              <div className="card-title">Confirmed</div>
              <div className="t-name">Waybill: {confirmation.waybill}</div>
              <div className="t-meta">Payment: {confirmation.paymentMethod}</div>
            </div>
          )}

          <div className="modal-footer">
            <button className="btn" onClick={() => setIsBookingOpen(false)}>Close</button>
            <button className="btn" disabled={isSubmitting} onClick={initiateAndQuote}>{isSubmitting ? 'Working...' : 'Get Quote'}</button>
            <button className="btn primary" disabled={isSubmitting || !bookingQuote} onClick={confirmBooking}>{isSubmitting ? 'Working...' : 'Confirm Booking'}</button>
          </div>
        </div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
