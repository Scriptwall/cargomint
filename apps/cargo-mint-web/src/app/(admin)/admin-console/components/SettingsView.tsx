'use client';

import React from 'react';

type TenantOption = {
  id: number;
  name: string;
  subdomain: string;
  email: string;
};

type TenantSettings = {
  tenantName: string;
  tenantIdentifier: string;
  subdomain: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  logoUrl: string;
  tagline: string;
  isActive: boolean;
};

type SettingsViewProps = {
  tenants: TenantOption[];
  selectedIdentifier: string;
  settings: TenantSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onSelectTenant: (identifier: string) => void;
  onChange: (field: keyof Omit<TenantSettings, 'tenantName' | 'tenantIdentifier' | 'subdomain' | 'logoText' | 'isActive'>, value: string) => void;
  onSave: () => void;
};

export default function SettingsView({
  tenants,
  selectedIdentifier,
  settings,
  isLoading,
  isSaving,
  onSelectTenant,
  onChange,
  onSave
}: SettingsViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Tenant UI Settings</span>
      </div>

      <div className="settings-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="settings-section-title">Tenant workspaces</div>
            {tenants.length === 0 ? (
              <div className="empty-state">No tenants are available.</div>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  className={`tenant-picker ${selectedIdentifier === tenant.subdomain ? 'active' : ''}`}
                  onClick={() => onSelectTenant(tenant.subdomain)}
                  type="button"
                >
                  <div>
                    <div className="t-name">{tenant.name}</div>
                    <div className="t-meta">{tenant.email}</div>
                  </div>
                  <div className="td-mono">{tenant.subdomain}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="settings-section-title">Branding</div>
            {isLoading || !settings ? (
              <div className="empty-state">Loading tenant settings.</div>
            ) : (
              <>
                <div className="form-row">
                  <label className="form-label">Workspace</label>
                  <input className="form-input" value={settings.subdomain} disabled />
                </div>
                <div className="form-grid">
                  <div>
                    <label className="form-label">Primary color</label>
                    <input
                      className="form-input"
                      value={settings.primaryColor}
                      onChange={(event) => onChange('primaryColor', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Accent color</label>
                    <input
                      className="form-input"
                      value={settings.accentColor}
                      onChange={(event) => onChange('accentColor', event.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label className="form-label">Support email</label>
                  <input
                    className="form-input"
                    value={settings.supportEmail}
                    onChange={(event) => onChange('supportEmail', event.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">Logo URL</label>
                  <input
                    className="form-input"
                    value={settings.logoUrl}
                    onChange={(event) => onChange('logoUrl', event.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">Tagline</label>
                  <input
                    className="form-input"
                    value={settings.tagline}
                    onChange={(event) => onChange('tagline', event.target.value)}
                  />
                </div>
                <button
                  className="btn primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  onClick={onSave}
                  type="button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
