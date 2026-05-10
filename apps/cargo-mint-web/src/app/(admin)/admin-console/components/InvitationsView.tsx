'use client';

import React from 'react';

type Invitation = {
  tenantId: number;
  email: string;
  company: string;
  plan: string;
  sent: string;
  status: string;
  expiresAt: string;
  canResend: boolean;
};

type InvitationsViewProps = {
  invitations: Invitation[];
  onResendInvite: (tenantId: number) => void;
};

export default function InvitationsView({ invitations, onResendInvite }: InvitationsViewProps) {
  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Invitations</span>
      </div>

      <div className="full-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Company</th>
                <th>Plan</th>
                <th>Sent</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ paddingTop: 16 }}>
                    <div className="empty-state">No invitations matched the current search.</div>
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={`${invitation.tenantId}-${invitation.email}`}>
                    <td className="td-mono">{invitation.email}</td>
                    <td>{invitation.company}</td>
                    <td>{invitation.plan}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{invitation.sent}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{invitation.expiresAt}</td>
                    <td>
                      <span
                        className={`dot ${
                          invitation.status === 'Accepted'
                            ? 'dot-green'
                            : invitation.status === 'Expired'
                              ? 'dot-red'
                              : 'dot-amber'
                        }`}
                      />
                      <span style={{ fontSize: 11 }}>{invitation.status}</span>
                    </td>
                    <td>
                      {invitation.canResend && invitation.status !== 'Accepted' ? (
                        <button
                          className="btn"
                          style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                          onClick={() => onResendInvite(invitation.tenantId)}
                          type="button"
                        >
                          Resend
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Complete</span>
                      )}
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
