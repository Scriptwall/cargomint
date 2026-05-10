'use client';

import React from 'react';

type Country = {
  id: number;
  code: string;
  name: string;
  statesCount: number;
  currencyCode: string;
  currencySymbol: string;
  isActive: boolean;
  bg: string;
  color: string;
};

type RegionsViewProps = {
  countries: Country[];
  onManageCountry: (countryId: number) => void;
};

export default function RegionsView({ countries, onManageCountry }: RegionsViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Countries & Regions</span>
      </div>

      <div className="card-grid">
        {countries.length === 0 ? (
          <div className="card">
            <div className="empty-state">No countries have been configured yet.</div>
          </div>
        ) : (
          countries.map((country) => (
            <div className="card" key={country.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  className="t-avatar"
                  style={{
                    width: 36,
                    height: 36,
                    background: country.bg,
                    color: country.color,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    borderRadius: 8
                  }}
                >
                  {country.code}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{country.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {country.statesCount} states · {country.currencyCode} ({country.currencySymbol})
                  </div>
                </div>
              </div>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onManageCountry(country.id)}
                type="button"
              >
                Manage regions
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
