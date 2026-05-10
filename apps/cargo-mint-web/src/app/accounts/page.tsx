'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const DEFAULT_PASSWORD = 'Password123!';

const accounts = [
  { email: 'superadmin@cargomint.com', password: DEFAULT_PASSWORD, role: 'Super Admin', portal: 'Master Console', url: '/admin-console', description: 'Platform-level control (Manage Tenants, Global Config)' },
  { email: 'admin1@cargomint.com', password: DEFAULT_PASSWORD, role: 'Admin', portal: 'Master Console', url: '/admin-console', description: 'Primary platform admin account for reset validation and governance checks.' },
  { email: 'admin6@cargomint.com', password: DEFAULT_PASSWORD, role: 'Admin', portal: 'Master Console', url: '/admin-console', description: 'Secondary platform admin account for role and access boundary testing.' }
];

export default function AccountsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleReset() {
    setIsResetting(true);
    setStatus(null);
    try {
      const response = await fetch('/api/v1/Maintenance/reset-admin-only', { method: 'POST' });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Reset failed');
      }
      setStatus('Reset complete. Tenant and shipment data removed. Admin users reseeded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to run reset.';
      setStatus(message);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', color: '#fff', padding: '60px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>Test Accounts</h1>
        <p style={{ color: '#888', marginBottom: '20px' }}>Use these admin credentials after a full reset. Default password for listed accounts is <strong>{DEFAULT_PASSWORD}</strong>.</p>

        <div style={{ marginBottom: '30px', background: '#161618', border: '1px solid #28282b', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '14px', color: '#c9c9ce', marginBottom: '10px' }}>
            Clean start action: remove tenants and their shipment/financial data, then reseed admin users only.
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            style={{
              background: isResetting ? '#313136' : '#ffffff',
              color: isResetting ? '#9a9aa0' : '#000000',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isResetting ? 'not-allowed' : 'pointer'
            }}
          >
            {isResetting ? 'Resetting...' : 'Run Reset + Reseed Admins'}
          </button>
          {status && <div style={{ marginTop: '10px', fontSize: '13px', color: '#a7f3d0' }}>{status}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {accounts.map((acc, i) => (
            <div key={i} style={{ background: '#161618', borderRadius: '16px', padding: '24px', border: '1px solid #28282b', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#00d1b2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.role}</span>
                <span style={{ fontSize: '11px', color: '#666', background: '#222', padding: '4px 10px', borderRadius: '999px' }}>{acc.portal}</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'monospace' }}>{acc.email}</div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>Password</div>
                <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'monospace' }}>{acc.password}</div>
              </div>

              <p style={{ fontSize: '13px', color: '#888', marginBottom: '30px', lineHeight: 1.5 }}>{acc.description}</p>

              <div style={{ marginTop: 'auto' }}>
                <Link href="/login" style={{
                  display: 'inline-block',
                  width: '100%',
                  textAlign: 'center',
                  background: '#fff',
                  color: '#000',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  Log in as {acc.role} {'->'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '60px', padding: '20px', borderTop: '1px solid #28282b', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>&lt;- Back to landing page</Link>
        </div>
      </div>
    </div>
  );
}
