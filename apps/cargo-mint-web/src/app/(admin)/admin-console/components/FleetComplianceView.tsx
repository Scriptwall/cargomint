'use client';

import React from 'react';

type FleetItem = {
  fleetId: number;
  registrationNumber: string;
  fleetType: string;
  tenantName: string;
  isActive: boolean;
  isUnderMaintenance: boolean;
  maintenanceCount: number;
};

type CaptainItem = {
  captainId: number;
  name: string;
  captainCode: string;
  phoneNumber: string;
  tenantName: string;
  isAvailable: boolean;
  isComplianceLocked: boolean;
  complianceLockReason?: string | null;
};

type FleetComplianceOverview = {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesUnderMaintenance: number;
  totalCaptains: number;
  availableCaptains: number;
  complianceLockedCaptains: number;
  fleets: FleetItem[];
  captains: CaptainItem[];
};

type FleetComplianceViewProps = {
  overview: FleetComplianceOverview | null;
};

export default function FleetComplianceView({ overview }: FleetComplianceViewProps) {
  if (!overview) {
    return (
      <div className="full-card">
        <div className="empty-state">Fleet and compliance data is loading.</div>
      </div>
    );
  }

  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Fleet & Compliance</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total vehicles</div>
          <div className="metric-value">{overview.totalVehicles.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active vehicles</div>
          <div className="metric-value">{overview.activeVehicles.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Captains</div>
          <div className="metric-value">{overview.totalCaptains.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Compliance locked</div>
          <div className="metric-value">{overview.complianceLockedCaptains.toLocaleString()}</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Vehicles</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Type</th>
                  <th>Tenant</th>
                  <th>Maintenance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.fleets.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ paddingTop: 16 }}>
                      <div className="empty-state">No fleet records found.</div>
                    </td>
                  </tr>
                ) : (
                  overview.fleets.slice(0, 12).map((fleet) => (
                    <tr key={fleet.fleetId}>
                      <td className="td-mono">{fleet.registrationNumber}</td>
                      <td>{fleet.fleetType}</td>
                      <td>{fleet.tenantName}</td>
                      <td className="td-mono">{fleet.maintenanceCount}</td>
                      <td>
                        <span className={`dot ${fleet.isUnderMaintenance ? 'dot-amber' : fleet.isActive ? 'dot-green' : 'dot-red'}`} />
                        <span style={{ fontSize: 11 }}>
                          {fleet.isUnderMaintenance ? 'Maintenance' : fleet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Captains</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Captain Code</th>
                  <th>Phone</th>
                  <th>Tenant</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.captains.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ paddingTop: 16 }}>
                      <div className="empty-state">No captain records found.</div>
                    </td>
                  </tr>
                ) : (
                  overview.captains.slice(0, 12).map((captain) => (
                    <tr key={captain.captainId}>
                      <td>{captain.name}</td>
                      <td className="td-mono">{captain.captainCode}</td>
                      <td className="td-mono">{captain.phoneNumber}</td>
                      <td>{captain.tenantName}</td>
                      <td>
                        <span className={`dot ${captain.isComplianceLocked ? 'dot-red' : captain.isAvailable ? 'dot-green' : 'dot-amber'}`} />
                        <span style={{ fontSize: 11 }}>
                          {captain.isComplianceLocked ? 'Locked' : captain.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        {captain.isComplianceLocked && captain.complianceLockReason ? (
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {captain.complianceLockReason}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
