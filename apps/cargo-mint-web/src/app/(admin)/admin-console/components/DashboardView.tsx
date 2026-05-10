'use client';

import React from 'react';

type MetricItem = {
  label: string;
  value: string;
  delta?: string;
  tone?: 'up' | 'down';
};

type TenantItem = {
  id: number;
  initials: string;
  color: string;
  textColor: string;
  name: string;
  subdomain: string;
  shipments: string;
  status: 'active' | 'suspended';
};

type ShipmentBar = {
  label: string;
  value: string;
  percentage: number;
};

type DashboardViewProps = {
  currentDate: string;
  metrics: MetricItem[];
  recentTenants: TenantItem[];
  shipmentBars: ShipmentBar[];
  activeCount: number;
  suspendedCount: number;
  onViewAllTenants: () => void;
};

export default function DashboardView({
  currentDate,
  metrics,
  recentTenants,
  shipmentBars,
  activeCount,
  suspendedCount,
  onViewAllTenants
}: DashboardViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Platform overview</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {currentDate}
        </span>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.delta ? <div className={`metric-delta ${metric.tone ?? ''}`}>{metric.delta}</div> : null}
          </div>
        ))}
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Recent tenants</div>
          {recentTenants.length === 0 ? (
            <div className="empty-state">No tenants have been onboarded yet.</div>
          ) : (
            recentTenants.map((tenant) => (
              <div className="tenant-list-item" key={tenant.id}>
                <div className="t-avatar" style={{ background: tenant.color, color: tenant.textColor }}>
                  {tenant.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-name">{tenant.name}</div>
                  <div className="t-meta">
                    {tenant.subdomain}.cargomint.io · {tenant.shipments} shipments
                  </div>
                </div>
                <span className={`badge ${tenant.status}`}>
                  {tenant.status === 'active' ? 'Active' : 'Suspended'}
                </span>
              </div>
            ))
          )}
          <div style={{ marginTop: 12 }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onViewAllTenants} type="button">
              View all tenants
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Shipments by tenant</div>
          <div className="bar-chart">
            {shipmentBars.length === 0 ? (
              <div className="empty-state">No shipment activity has been recorded yet.</div>
            ) : (
              shipmentBars.map((bar) => (
                <div className="bar-row" key={bar.label}>
                  <div className="bar-lbl">{bar.label}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${bar.percentage}%` }} />
                  </div>
                  <div className="bar-val">{bar.value}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
            <div className="sec-title" style={{ marginBottom: 10 }}>
              Status breakdown
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <div>
                <span className="dot dot-green" />
                <span style={{ color: 'var(--text-secondary)' }}>Active - </span>
                <strong>{activeCount}</strong>
              </div>
              <div>
                <span className="dot dot-red" />
                <span style={{ color: 'var(--text-secondary)' }}>Suspended - </span>
                <strong>{suspendedCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
