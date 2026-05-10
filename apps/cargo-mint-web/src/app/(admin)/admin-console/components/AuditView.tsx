'use client';

import React from 'react';

type AuditLog = {
  time: string;
  module: string;
  recordId: string;
  action: string;
  detail: string;
  actor: string;
};

type AuditViewProps = {
  logs: AuditLog[];
  onExport: () => void;
};

export default function AuditView({ logs, onExport }: AuditViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Audit Log</span>
        <button className="btn" onClick={onExport} type="button">
          Export CSV
        </button>
      </div>

      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ paddingTop: 16 }}>
                    <div className="empty-state">No audit rows matched the current search.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={`${log.time}-${log.recordId}-${index}`}>
                    <td className="td-mono" style={{ whiteSpace: 'nowrap' }}>
                      {log.time}
                    </td>
                    <td className="td-mono">{log.actor}</td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: 12 }}>{log.action}</span>
                    </td>
                    <td>{log.module}</td>
                    <td className="td-mono">{log.recordId}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{log.detail}</td>
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
