'use client';

import React from 'react';

type BillingRow = {
  tenantId: number;
  tenantName: string;
  plan: string;
  subscriptionDue: number;
  billingAccessSuspended: boolean;
};

type SettlementRow = {
  tenantId: number;
  tenantName: string;
  pendingAmount: number;
  completedAmount: number;
  settlementFrozen: boolean;
  status: string;
};

type WalletRow = {
  walletId: number;
  tenantId: number;
  tenantName: string;
  ownerCode: string;
  ownerType: string;
  balance: number;
  isBlocked: boolean;
};

type GatewayRow = {
  reference: string;
  gateway: string;
  amount: number;
  status: string;
  time: string;
};

type RiskFlag = {
  code: string;
  severity: string;
  message: string;
};

type FinanceOverview = {
  platformRevenueLedger: number;
  perShipmentPlatformFees: number;
  codExposureAcrossTenants: number;
  failedSettlements: number;
  pendingSettlements: number;
  blockedSettlements: number;
  completedSettlements: number;
  tenantSettlementOverview: SettlementRow[];
  financeRiskFlags: RiskFlag[];
};

type FinanceViewProps = {
  financeOverview: FinanceOverview | null;
  billingRows: BillingRow[];
  merchantWallets: WalletRow[];
  tenantWallets: WalletRow[];
  gatewayTx: GatewayRow[];
  riskFlags: RiskFlag[];
  onExportReport: () => void;
  onExportLedger: () => void;
  onRunAction: (options: {
    title: string;
    endpoint: string;
    method: 'PUT' | 'POST';
    submitLabel: string;
  }) => void;
  onApplyAdjustment: (tenantId: number) => void;
};

function badgeStyle(kind: 'green' | 'red' | 'amber') {
  if (kind === 'green') {
    return { background: 'var(--bg-success)', color: 'var(--text-success)' };
  }

  if (kind === 'red') {
    return { background: 'var(--bg-danger)', color: 'var(--text-danger)' };
  }

  return { background: 'var(--bg-warning)', color: 'var(--text-warning)' };
}

export default function FinanceView({
  financeOverview,
  billingRows,
  merchantWallets,
  tenantWallets,
  gatewayTx,
  riskFlags,
  onExportReport,
  onExportLedger,
  onRunAction,
  onApplyAdjustment
}: FinanceViewProps) {
  if (!financeOverview) {
    return (
      <div className="full-card">
        <div className="empty-state">Finance data is loading.</div>
      </div>
    );
  }

  return (
    <>
      <div className="sec-header">
        <span className="sec-title">Platform Finance Oversight</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onExportReport} type="button">
            Export report
          </button>
          <button className="btn" onClick={onExportLedger} type="button">
            Export ledger
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Platform revenue ledger</div>
          <div className="metric-value">NGN {Number(financeOverview.platformRevenueLedger ?? 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Per-shipment fees</div>
          <div className="metric-value">NGN {Number(financeOverview.perShipmentPlatformFees ?? 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">COD exposure</div>
          <div className="metric-value">NGN {Number(financeOverview.codExposureAcrossTenants ?? 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending settlements</div>
          <div className="metric-value">{financeOverview.pendingSettlements ?? 0}</div>
        </div>
      </div>

      <div className="full-card">
        <div className="card-title">Finance risk flags</div>
        {riskFlags.length === 0 ? (
          <div className="empty-state">No finance risks are currently flagged.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {riskFlags.map((risk) => (
              <div key={risk.code} className="risk-row">
                <div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{risk.code}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{risk.message}</div>
                </div>
                <span className="badge" style={badgeStyle(risk.severity === 'high' ? 'red' : risk.severity === 'medium' ? 'amber' : 'green')}>
                  {risk.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="full-card">
        <div className="card-title">Tenant billing and settlement governance</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Subscription due</th>
                <th>Billing</th>
                <th>Settlement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ paddingTop: 16 }}>
                    <div className="empty-state">No finance rows matched the current search.</div>
                  </td>
                </tr>
              ) : (
                billingRows.map((row) => {
                  const settlement = financeOverview.tenantSettlementOverview.find((item) => item.tenantId === row.tenantId);
                  const frozen = Boolean(settlement?.settlementFrozen);
                  return (
                    <tr key={row.tenantId}>
                      <td>{row.tenantName}</td>
                      <td>{row.plan}</td>
                      <td className="td-mono">NGN {Number(row.subscriptionDue ?? 0).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={badgeStyle(row.billingAccessSuspended ? 'red' : 'green')}>
                          {row.billingAccessSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={badgeStyle(frozen ? 'amber' : 'green')}>
                          {frozen ? 'Frozen' : settlement?.status ?? 'Completed'}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button
                            className="btn"
                            onClick={() =>
                              onRunAction({
                                title: `${row.billingAccessSuspended ? 'Reactivate' : 'Suspend'} billing for ${row.tenantName}`,
                                endpoint: `/finance/billing/${row.tenantId}/${row.billingAccessSuspended ? 'reactivate' : 'suspend'}`,
                                method: 'PUT',
                                submitLabel: row.billingAccessSuspended ? 'Reactivate billing' : 'Suspend billing'
                              })
                            }
                            type="button"
                          >
                            {row.billingAccessSuspended ? 'Reactivate billing' : 'Suspend billing'}
                          </button>
                          <button
                            className="btn"
                            onClick={() =>
                              onRunAction({
                                title: `${frozen ? 'Release' : 'Freeze'} settlement for ${row.tenantName}`,
                                endpoint: `/finance/settlements/${row.tenantId}/${frozen ? 'release' : 'freeze'}`,
                                method: 'PUT',
                                submitLabel: frozen ? 'Release settlement' : 'Freeze settlement'
                              })
                            }
                            type="button"
                          >
                            {frozen ? 'Release settlement' : 'Freeze settlement'}
                          </button>
                          <button className="btn" onClick={() => onApplyAdjustment(row.tenantId)} type="button">
                            Apply adjustment
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Merchant wallet balances</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Wallet</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {merchantWallets.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ paddingTop: 16 }}>
                      <div className="empty-state">No merchant wallets matched the current search.</div>
                    </td>
                  </tr>
                ) : (
                  merchantWallets.slice(0, 12).map((wallet) => (
                    <tr key={wallet.walletId}>
                      <td>{wallet.tenantName}</td>
                      <td className="td-mono">{wallet.ownerCode}</td>
                      <td className="td-mono">NGN {Number(wallet.balance ?? 0).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={badgeStyle(wallet.isBlocked ? 'red' : 'green')}>
                          {wallet.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() =>
                            onRunAction({
                              title: `${wallet.isBlocked ? 'Unblock' : 'Block'} wallet ${wallet.ownerCode}`,
                              endpoint: `/finance/wallets/${wallet.walletId}/${wallet.isBlocked ? 'unblock' : 'block'}`,
                              method: 'PUT',
                              submitLabel: wallet.isBlocked ? 'Unblock wallet' : 'Block wallet'
                            })
                          }
                          type="button"
                        >
                          {wallet.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Tenant wallet balances</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Wallet</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenantWallets.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ paddingTop: 16 }}>
                      <div className="empty-state">No tenant wallets matched the current search.</div>
                    </td>
                  </tr>
                ) : (
                  tenantWallets.slice(0, 12).map((wallet) => (
                    <tr key={wallet.walletId}>
                      <td>{wallet.tenantName}</td>
                      <td className="td-mono">{wallet.ownerCode}</td>
                      <td className="td-mono">NGN {Number(wallet.balance ?? 0).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={badgeStyle(wallet.isBlocked ? 'red' : 'green')}>
                          {wallet.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() =>
                            onRunAction({
                              title: `${wallet.isBlocked ? 'Unblock' : 'Block'} wallet ${wallet.ownerCode}`,
                              endpoint: `/finance/wallets/${wallet.walletId}/${wallet.isBlocked ? 'unblock' : 'block'}`,
                              method: 'PUT',
                              submitLabel: wallet.isBlocked ? 'Unblock wallet' : 'Block wallet'
                            })
                          }
                          type="button"
                        >
                          {wallet.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="full-card">
        <div className="card-title">Payment gateway transactions</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Gateway</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {gatewayTx.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ paddingTop: 16 }}>
                    <div className="empty-state">No gateway transactions matched the current search.</div>
                  </td>
                </tr>
              ) : (
                gatewayTx.slice(0, 20).map((tx, index) => (
                  <tr key={`${tx.reference}-${index}`}>
                    <td className="td-mono">{tx.reference}</td>
                    <td>{tx.gateway}</td>
                    <td className="td-mono">NGN {Number(tx.amount ?? 0).toLocaleString()}</td>
                    <td>{tx.status}</td>
                    <td className="td-mono">{tx.time}</td>
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
