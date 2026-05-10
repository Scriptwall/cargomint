'use client';

import React from 'react';

type Tenant = {
  id: number;
  initials: string;
  color: string;
  textColor: string;
  name: string;
  subdomain: string;
  type: string;
  country: string;
  shipments: string;
  gmv: string;
  adminEmail: string;
  adminPhone: string;
  status: 'active' | 'suspended' | 'onboarding';
  created: string;
};

type TenantsViewProps = {
  tenants: Tenant[];
  onExportCsv: () => void;
  onViewTenant: (tenantId: number) => void;
  onEditTenant: (tenantId: number) => void;
  onToggleTenant: (tenantId: number, status: Tenant['status']) => void;
};

export default function TenantsView({
  tenants,
  onExportCsv,
  onViewTenant,
  onEditTenant,
  onToggleTenant
}: TenantsViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">All tenants</span>
        <button className="btn" onClick={onExportCsv} type="button">
          Export CSV
        </button>
      </div>

      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Shipments</th>
                <th>GMV</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ paddingTop: 16 }}>
                    <div className="empty-state">No tenants matched the current search.</div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="t-avatar"
                          style={{
                            width: 26,
                            height: 26,
                            fontSize: 9,
                            background: tenant.color,
                            color: tenant.textColor
                          }}
                        >
                          {tenant.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{tenant.name}</div>
                          <div className="td-mono">{tenant.subdomain}</div>
                        </div>
                      </div>
                    </td>
                    <td>{tenant.type}</td>
                    <td className="td-mono">{tenant.adminEmail}</td>
                    <td className="td-mono">{tenant.adminPhone}</td>
                    <td>{tenant.country}</td>
                    <td className="td-mono">{tenant.shipments}</td>
                    <td className="td-mono">{tenant.gmv}</td>
                    <td>
                      <span className={`dot ${tenant.status === 'active' ? 'dot-g' : tenant.status === 'onboarding' ? 'dot-a' : 'dot-r'}`} />
                      <span style={{ fontSize: 11 }}>
                        {tenant.status === 'active' ? 'Active' : tenant.status === 'onboarding' ? 'Onboarding' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{tenant.created}</td>
                    <td>
                      <div className="btn-group">
                        <button className="icon-btn" title="View" onClick={() => onViewTenant(tenant.id)} type="button">
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => onEditTenant(tenant.id)} type="button">
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z" />
                          </svg>
                        </button>
                        <button
                          className="icon-btn"
                          title={tenant.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          onClick={() => onToggleTenant(tenant.id, tenant.status)}
                          type="button"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm2.5 4.5l-5 5m0-5l5 5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                          </svg>
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
    </>
  );
}
