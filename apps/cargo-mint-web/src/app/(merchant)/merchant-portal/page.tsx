'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function MerchantPortal() {
  const API_BASE = '/api/v1';
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [shipmentsList, setShipmentsList] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [addressBook, setAddressBook] = useState<any[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<any[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const getAuthToken = () => document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];

  React.useEffect(() => {
    if (currentPage === 'dashboard') fetchDashboardData();
    else if (currentPage === 'shipments') fetchShipments();
    else if (currentPage === 'wallet') fetchWalletData();
    else if (currentPage === 'customers') fetchAddressBook();
  }, [currentPage]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Customers/merchant/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setDashboardData(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Customers/merchant/shipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setShipmentsList(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Customers/merchant/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setWalletData(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddressBook = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Customers/merchant/address-book`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setAddressBook(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  };

  const handleTemplateDownload = () => {
    const template = [
      'ReceiverName,ReceiverPhone,ReceiverAddress,DestinationServiceCentreId,DeclaredValue,Description,Quantity,Weight,IsCod',
      'John Doe,+2348012345678,12 Allen Avenue Ikeja,2,5000,Mobile Accessory,1,1.2,false',
      'Amina Bello,+2348098765432,5 Wuse Zone 2 Abuja,3,12000,Fashion Package,2,2.4,true'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cargomint-bulk-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreviewBulkUpload = async () => {
    if (!bulkFile) {
      showToast('Select a file first');
      return;
    }

    setIsBulkSubmitting(true);
    setBulkResult(null);
    setBulkUploadErrors([]);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', bulkFile);

      const response = await fetch(`${API_BASE}/Customers/merchant/bulk/preview`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to preview upload');

      setBulkPreview(data);
      setBulkUploadErrors(data?.errors || []);
      showToast('Preview generated');
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Preview failed');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleConfirmBulkUpload = async () => {
    if (!bulkFile) {
      showToast('Select a file first');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('skipInvalidRows', 'true');

      const response = await fetch(`${API_BASE}/Customers/merchant/bulk/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to confirm upload');

      setBulkResult(data);
      setBulkUploadErrors(data?.errors || []);
      showToast(`Batch processed: ${data?.createdCount || 0} shipments`);
      await fetchDashboardData();
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Bulk upload failed');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const createMerchantShipment = async (receiverName?: string, receiverAddress?: string, receiverPhone?: string) => {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        customerCode: 'IND-001',
        customerType: 0,
        receiverName: receiverName || 'New Receiver',
        receiverPhoneNumber: receiverPhone || '+2348000000000',
        receiverAddress: receiverAddress || 'Lagos, Nigeria',
        receiverEmail: null,
        departureServiceCentreId: 1,
        destinationServiceCentreId: 2,
        items: [{ description: 'Merchant package', quantity: 1, weight: 1, price: 5000 }],
        originType: 0,
        isCashOnDelivery: false
      };

      const response = await fetch(`${API_BASE}/Shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create shipment');
      const result = await response.json();
      const waybill = result?.waybill?.waybill || result?.waybill || 'generated';
      showToast(`Shipment created (${waybill})`);
      if (currentPage === 'shipments') await fetchShipments();
      await fetchDashboardData();
    } catch (error) {
      console.error(error);
      showToast('Failed to create shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Merchant Overview', shipments: 'All Shipments', bulk: 'Bulk Upload',
      wallet: 'Wallet & Invoices', api: 'API Keys', customers: 'My Customers'
    };
    return titles[currentPage] || 'Dashboard';
  };

  const shipments = [
    { waybill: 'CM-9821-34A', receiver: 'John Doe', destination: 'Lagos, NG', status: 'delivered', date: 'Apr 24, 2026', amount: '₦2,500', driver: null },
    { waybill: 'CM-8812-99B', receiver: 'Jane Smith', destination: 'Abuja, NG', status: 'transit', date: 'Apr 23, 2026', amount: '₦4,200', driver: 'Emeka Okafor · 0801...' },
    { waybill: 'CM-7721-11C', receiver: 'Tech Corp', destination: 'Port Harcourt, NG', status: 'transit', date: 'Apr 23, 2026', amount: '₦1,800', driver: 'Yemi Alade · 0706...' },
    { waybill: 'CM-6632-44D', receiver: 'Mike Ross', destination: 'Kano, NG', status: 'pending', date: 'Apr 22, 2026', amount: '₦3,100', driver: null },
  ];

  const renderDashboard = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">Merchant Overview</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-label">Total Shipments</div><div className="metric-value">{dashboardData?.totalShipments || 0}</div><div className="metric-delta up">↑ All time</div></div>
        <div className="metric-card"><div className="metric-label">Successful Deliveries</div><div className="metric-value">{dashboardData?.successfulDeliveries || 0}</div><div className="metric-delta up">Completed</div></div>
        <div className="metric-card"><div className="metric-label">Total Spend</div><div className="metric-value">₦{dashboardData?.totalSpend?.toLocaleString() || 0}</div><div className="metric-delta">Gross</div></div>
        <div className="metric-card"><div className="metric-label">Wallet Balance</div><div className="metric-value">₦{dashboardData?.walletBalance?.toLocaleString() || 0}</div><div className="metric-delta up">Available</div></div>
      </div>
      <div className="card-grid">
        <div className="card card-p">
          <div className="card-title">Recent Shipments</div>
          {(dashboardData?.recentShipments || []).map((s: any, i: number) => (
            <div key={i} className="tenant-list-item">
              <div className="t-avatar" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: '12px', height: '12px' }}><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-name">{s.waybill}</div>
                <div className="t-meta">{s.receiver} · {s.destination}</div>
                {s.driver && <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-info)' }}><span className="badge" style={{ background: 'var(--bg-info)', padding: '2px 6px' }}>Driver Assigned: {s.driver}</span></div>}
              </div>
              <span className={`badge ${s.status === 'delivered' ? 'badge-green' : s.status === 'transit' ? 'badge-amber' : 'badge-red'}`}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
            </div>
          ))}
          {(dashboardData?.recentShipments?.length === 0) && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No shipments found</div>
          )}
          <div style={{ marginTop: '12px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCurrentPage('shipments')}>View all shipments →</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderShipments = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">All Shipments</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={() => showToast('Exported CSV')}>Export CSV</button>
          <button className="btn primary" onClick={() => createMerchantShipment()} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : '+ New Shipment'}</button>
        </div>
      </div>
      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Waybill</th><th>Receiver</th><th>Destination</th><th>Cost</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {shipmentsList.map((s: any, i: number) => (
                <tr key={i}>
                  <td className="td-mono">{s.waybill}</td>
                  <td><span style={{ fontWeight: 500, fontSize: '12px' }}>{s.receiver}</span></td>
                  <td>{s.destination}</td>
                  <td className="td-mono">{s.amount}</td>
                  <td>
                    <span className={`dot dot-${s.status === 'delivered' ? 'green' : s.status === 'transit' ? 'amber' : 'red'}`}></span>
                    <span style={{ fontSize: '11px' }}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
                    {s.driver && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Driver: {s.driver}</div>}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.date}</td>
                  <td>
                    <div className="btn-row">
                      <button className="ibtn" title="Track" onClick={() => showToast(`Tracking ${s.waybill}`)}>
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shipmentsList.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No shipments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderBulk = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">Bulk Upload</span>
      </div>
      <div className="full-card" style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Merchant Batch Upload (.csv / .xlsx)</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Upload up to 10,000 rows. Use Preview to validate rows before creating waybills.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            accept=".csv,.xlsx"
            className="inp"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setBulkFile(selected);
              setBulkPreview(null);
              setBulkResult(null);
              setBulkUploadErrors([]);
            }}
          />
          <button className="btn" onClick={handleTemplateDownload}>Download Template</button>
          <button className="btn" onClick={handlePreviewBulkUpload} disabled={isBulkSubmitting || !bulkFile}>
            {isBulkSubmitting ? 'Previewing...' : 'Preview'}
          </button>
          <button className="btn primary" onClick={handleConfirmBulkUpload} disabled={isBulkSubmitting || !bulkFile}>
            {isBulkSubmitting ? 'Processing...' : 'Confirm Upload'}
          </button>
        </div>
      </div>

      {bulkPreview && (
        <div className="full-card" style={{ marginBottom: '14px' }}>
          <div className="sec-hd"><span className="sec-ttl">Preview Summary</span></div>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '10px' }}>
            <div className="metric-card"><div className="metric-label">Total Rows</div><div className="metric-value">{bulkPreview.totalRows || 0}</div></div>
            <div className="metric-card"><div className="metric-label">Valid Rows</div><div className="metric-value">{bulkPreview.validRows || 0}</div></div>
            <div className="metric-card"><div className="metric-label">Invalid Rows</div><div className="metric-value">{bulkPreview.invalidRows || 0}</div></div>
            <div className="metric-card"><div className="metric-label">Estimated Total</div><div className="metric-value">₦{(bulkPreview.estimatedTotalAmount || 0).toLocaleString()}</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Row</th><th>Receiver</th><th>Phone</th><th>Address</th><th>Est. Amount</th><th>COD</th></tr></thead>
              <tbody>
                {(bulkPreview.previewRows || []).slice(0, 10).map((row: any) => (
                  <tr key={row.rowNumber}>
                    <td className="td-mono">{row.rowNumber}</td>
                    <td>{row.receiverName}</td>
                    <td>{row.receiverPhone}</td>
                    <td>{row.receiverAddress}</td>
                    <td className="td-mono">₦{(row.estimatedAmount || 0).toLocaleString()}</td>
                    <td>{row.isCod ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bulkResult && (
        <div className="full-card" style={{ marginBottom: '14px' }}>
          <div className="sec-hd"><span className="sec-ttl">Batch Result</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            <div className="metric-card"><div className="metric-label">Batch ID</div><div className="metric-value" style={{ fontSize: '13px' }}>{bulkResult.batchId || '-'}</div></div>
            <div className="metric-card"><div className="metric-label">Created</div><div className="metric-value">{bulkResult.createdCount || 0}</div></div>
            <div className="metric-card"><div className="metric-label">Failed</div><div className="metric-value">{bulkResult.failedCount || 0}</div></div>
            <div className="metric-card"><div className="metric-label">Total Amount</div><div className="metric-value">₦{(bulkResult.totalAmount || 0).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      {bulkUploadErrors.length > 0 && (
        <div className="full-card">
          <div className="sec-hd"><span className="sec-ttl">Row Validation Errors</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Row</th><th>Error</th></tr></thead>
              <tbody>
                {bulkUploadErrors.slice(0, 20).map((err: any, idx: number) => (
                  <tr key={`${err.rowNumber}-${idx}`}>
                    <td className="td-mono">{err.rowNumber}</td>
                    <td>{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderWallet = () => (
    <>
      <div className="sec-hd"><span className="sec-ttl">Wallet & Invoices</span></div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-label">Available Balance</div><div className="metric-value">₦{walletData?.balance?.toLocaleString() || 0}</div><button className="btn primary" style={{ marginTop: '8px' }} onClick={() => showToast('Top up modal')}>Top up wallet</button></div>
      </div>
      <div className="full-card">
        <div className="sec-title" style={{ marginBottom: '12px' }}>Recent Transactions</div>
        <div className="table-wrap">
          <table style={{ width: '100%' }}>
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {(walletData?.transactions || []).map((t: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t.date}</td>
                  <td>{t.description}</td>
                  <td className="td-mono" style={{ color: t.isCredit ? 'var(--text-success)' : 'var(--text-danger)' }}>{t.isCredit ? '+' : '-'}{t.amount}</td>
                </tr>
              ))}
              {(!walletData?.transactions || walletData.transactions.length === 0) && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderCustomers = () => (
    <>
      <div className="sec-hd">
        <span className="sec-ttl">My Customers (Address Book)</span>
        <button className="btn primary" onClick={() => showToast('Add customer modal')}>+ Add Customer</button>
      </div>
      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Saved Address</th><th>Total Orders</th><th></th></tr></thead>
            <tbody>
              {(addressBook || []).map((c: any, i: number) => (
                <tr key={i}>
                  <td><span style={{ fontWeight: 500, fontSize: '12px' }}>{c.name}</span></td>
                  <td className="td-mono">{c.phone}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.address}</td>
                  <td className="td-mono">{c.totalOrders}</td>
                  <td><button className="btn sm" onClick={() => createMerchantShipment(c.name, c.address, c.phone)} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Ship to Customer'}</button></td>
                </tr>
              ))}
              {(addressBook.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No customers found in address book</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderApi = () => (
    <>
      <div className="sec-hd"><span className="sec-ttl">API Keys</span><button className="btn primary" onClick={() => showToast('Generate new key')}>+ Generate Key</button></div>
      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Token</th><th>Created</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td>Production Key</td>
                <td className="td-mono">pk_live_*******************</td>
                <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Jan 12, 2026</td>
                <td><span className="dot dot-green"></span><span style={{ fontSize: '11px' }}>Active</span></td>
                <td><button className="btn" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => showToast('Copied')}>Copy</button></td>
              </tr>
              <tr>
                <td>Test Key</td>
                <td className="td-mono">pk_test_*******************</td>
                <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Jan 12, 2026</td>
                <td><span className="dot dot-green"></span><span style={{ fontSize: '11px' }}>Active</span></td>
                <td><button className="btn" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => showToast('Copied')}>Copy</button></td>
              </tr>
            </tbody>
          </table>
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
              <div className="logo-sub">merchant portal</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section">
              <div className="nav-section-label">Overview</div>
              <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
                Dashboard
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Logistics</div>
              <div className={`nav-item ${currentPage === 'shipments' ? 'active' : ''}`} onClick={() => setCurrentPage('shipments')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z"/></svg>
                Shipments
              </div>
              <div className={`nav-item ${currentPage === 'bulk' ? 'active' : ''}`} onClick={() => setCurrentPage('bulk')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm1 0v.511l5 3.125 5-3.125V4H3zm0 1.736V12h10V5.736L8 8.86 3 5.736z"/></svg>
                Bulk Upload
              </div>
              <div className={`nav-item ${currentPage === 'customers' ? 'active' : ''}`} onClick={() => setCurrentPage('customers')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>
                My Customers
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Finance</div>
              <div className={`nav-item ${currentPage === 'wallet' ? 'active' : ''}`} onClick={() => setCurrentPage('wallet')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 3A1.5 1.5 0 001 4.5v7A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0013.5 3h-11zM2 4.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v1.516L8 8.86 2 6.016V4.5zM14 11.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-4.25l5.548 2.589a1 1 0 00.844 0L14 7.25v4.25z"/></svg>
                Wallet & Invoices
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Developers</div>
              <div className={`nav-item ${currentPage === 'api' ? 'active' : ''}`} onClick={() => setCurrentPage('api')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26.77zM8 6a2 2 0 100 4A2 2 0 008 6z"/></svg>
                API Keys
              </div>
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Help</div>
              <a href="/merchant-portal/support" className="nav-item" style={{ textDecoration: 'none' }}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z"/></svg>
                Help Center
              </a>
            </div>
          </nav>

          <div className="sidebar-footer" style={{ position: 'relative' }}>
            {userMenuOpen ? (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', background: 'rgba(10,14,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', animation: 'slideUpCard 160ms ease-out' }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={() => { setUserMenuOpen(false); logout(); }}>Log out</button>
              </div>
            ) : null}
            <div className="user-row" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
              <div className="avatar" style={{ background: 'var(--accent)', color: 'white' }}>
                {user?.firstName?.substring(0, 1) || 'M'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName || 'Merchant'} {user?.lastName}</div>
                <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'merchant@cargomint.io'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-title">{getPageTitle()}</div>
            <div className="search-wrap">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4.5"/>
                <path d="M10.5 10.5l3 3"/>
              </svg>
              <input placeholder="Search waybills…" />
            </div>
            <button className="btn primary" onClick={() => createMerchantShipment()} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : '+ New Shipment'}</button>
          </header>

          <div className="content">
            {currentPage === 'dashboard' && renderDashboard()}
            {currentPage === 'shipments' && renderShipments()}
            {currentPage === 'bulk' && renderBulk()}
            {currentPage === 'customers' && renderCustomers()}
            {currentPage === 'wallet' && renderWallet()}
            {currentPage === 'api' && renderApi()}
          </div>
        </div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
