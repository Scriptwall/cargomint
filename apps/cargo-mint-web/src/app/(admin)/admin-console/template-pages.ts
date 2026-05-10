export type AdminPageKey =
  | 'dashboard'
  | 'tenants'
  | 'invitations'
  | 'finance'
  | 'geography'
  | 'geography-stations'
  | 'geography-matrix-local'
  | 'geography-matrix-country'
  | 'audit'
  | 'settings';

export type FinancePageKey =
  | 'revenue'
  | 'billing'
  | 'tenantwallets'
  | 'merchantwallets'
  | 'settlements'
  | 'gateway'
  | 'riskflags'
  | 'governance';

export type AdminTemplateData = {
  dashboard: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalShipments: number;
    platformGmv: number;
    platformRevenue: number;
    needsReview: number;
    recentTenants: Array<{ id: number; name: string; identifier: string; status: string; shipments: number }>;
    statsByTenant: Array<{ tenantName: string; shipmentCount: number; gmv: number }>;
  };
  tenants: Array<{
    id: number;
    initials: string;
    color: string;
    textColor: string;
    name: string;
    subdomain: string;
    country: string;
    state?: string | null;
    plan: string;
    shipments: number;
    gmv: number;
    status: string;
    created: string;
    adminEmail?: string | null;
    adminPhone?: string | null;
    notes?: string | null;
    type?: string | null;
    contactPerson?: string | null;
    address?: string | null;
  }>;
  invitations: Array<{
    tenantId: number;
    email: string;
    company: string;
    plan: string;
    sent: string;
    expiresAt: string;
    status: string;
    canResend: boolean;
  }>;
  countries: Array<{
    id: number;
    code: string;
    name: string;
    statesCount: number;
    currencyCode: string;
    currencySymbol: string;
    dialCode?: string;
    isActive: boolean;
    regions: Array<{ id: number; name: string; code?: string | null; isActive: boolean; statesCount: number; states: Array<{ id: number; name: string; code?: string | null; isActive: boolean }> }>;
  }>;
  stations: Array<{
    id: number;
    name: string;
    code: string;
    stateId: number;
    stateName: string;
    countryId: number;
    countryName: string;
    isActive: boolean;
  }>;
  routeZones: {
    local: Array<{
      id: number;
      departureStationName: string;
      destinationStationName: string;
      zoneName: string;
      estimatedHoursOfArrival: number;
    }>;
    country: Array<{
      id: number;
      departureCountryName: string;
      destinationCountryName: string;
      zoneName: string;
      estimatedDaysOfArrival: number;
    }>;
  };
  audit: Array<{ time: string; module: string; recordId: string; action: string; detail: string; actor: string }>;
  finance: {
    platformRevenueLedger: number;
    perShipmentPlatformFees: number;
    codExposureAcrossTenants: number;
    failedSettlements: number;
    pendingSettlements: number;
    blockedSettlements: number;
    completedSettlements: number;
    tenantSubscriptionBilling: Array<{ tenantId: number; tenantName: string; plan: string; subscriptionDue: number; billingAccessSuspended: boolean }>;
    tenantSettlementOverview: Array<{ tenantId: number; tenantName: string; pendingAmount: number; completedAmount: number; settlementFrozen: boolean; status: string }>;
    merchantWalletBalances: Array<{ walletId: number; tenantId: number; tenantName: string; ownerCode: string; balance: number; isBlocked: boolean }>;
    tenantWalletBalances: Array<{ walletId: number; tenantId: number; tenantName: string; ownerCode: string; balance: number; isBlocked: boolean }>;
    paymentGatewayTransactions: Array<{ reference: string; gateway: string; amount: number; status: string; time: string }>;
    financeRiskFlags: Array<{ code: string; severity: string; message: string }>;
  };
  subscription: {
    settings: {
      trialEnabled: boolean;
      defaultTrialDays: number;
      maxTrialExtensionDays: number;
      gracePeriodDays: number;
      dunningRetryCount: number;
      oneTrialPerTenant: boolean;
    };
    plans: Array<{
      id: number;
      name: string;
      code: string;
      baseFee: number;
      perShipmentFee: number;
      isActive: boolean;
      version: number;
    }>;
    tenants: Array<{
      id: number;
      tenantId: number;
      tenantName: string;
      plan: string;
      status: string;
      billingCycle: string;
      trialEndAtUtc?: string | null;
      nextBillingAtUtc?: string | null;
      hasValidPaymentMethod: boolean;
      billingAccessSuspended: boolean;
    }>;
  };
};

const NAIRA = '₦';
const DOT = '&middot;';
const DASH = '&mdash;';

const financeTitleMap: Record<FinancePageKey, string> = {
  revenue: 'Revenue Ledger',
  billing: 'Tenant Billing',
  tenantwallets: 'Tenant Wallets',
  merchantwallets: 'Merchant Wallets',
  settlements: 'Settlements',
  gateway: 'Gateway Transactions',
  riskflags: 'Risk Flags',
  governance: 'Governance & Controls',
};

const pageTitleMap: Record<Exclude<AdminPageKey, 'finance'>, string> = {
  dashboard: 'Dashboard',
  tenants: 'Tenant Management',
  invitations: 'Invitations',
  geography: 'Geography',
  'geography-stations': 'Stations',
  'geography-matrix-local': 'Local Route Matrix',
  'geography-matrix-country': 'Country Route Matrix',
  audit: 'Audit Log',
  settings: 'Global Settings',
};

export const adminConsolePageTitles = pageTitleMap;
export const adminConsoleFinanceTitles = financeTitleMap;

const n = (value: number) => value.toLocaleString();
const m = (value: number) => `${NAIRA}${value.toLocaleString()}`;
const shortMoney = (value: number) => {
  if (value >= 1_000_000_000) return `${NAIRA}${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${NAIRA}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${NAIRA}${(value / 1_000).toFixed(1)}K`;
  return `${NAIRA}${value.toLocaleString()}`;
};

const defaultTemplateData: AdminTemplateData = {
  dashboard: {
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalShipments: 0,
    platformGmv: 0,
    platformRevenue: 0,
    needsReview: 0,
    recentTenants: [],
    statsByTenant: [],
  },
  tenants: [],
  invitations: [],
  countries: [],
  stations: [],
  routeZones: {
    local: [],
    country: [],
  },
  audit: [],
  finance: {
    platformRevenueLedger: 0,
    perShipmentPlatformFees: 0,
    codExposureAcrossTenants: 0,
    failedSettlements: 0,
    pendingSettlements: 0,
    blockedSettlements: 0,
    completedSettlements: 0,
    tenantSubscriptionBilling: [],
    tenantSettlementOverview: [],
    merchantWalletBalances: [],
    tenantWalletBalances: [],
    paymentGatewayTransactions: [],
    financeRiskFlags: [],
  },
  subscription: {
    settings: {
      trialEnabled: true,
      defaultTrialDays: 14,
      maxTrialExtensionDays: 14,
      gracePeriodDays: 3,
      dunningRetryCount: 3,
      oneTrialPerTenant: true,
    },
    plans: [],
    tenants: [],
  },
};

let templateData: AdminTemplateData = defaultTemplateData;

export function setAdminTemplateData(data: Partial<AdminTemplateData>) {
  templateData = {
    ...templateData,
    ...data,
    dashboard: { ...templateData.dashboard, ...(data.dashboard ?? {}) },
    finance: { ...templateData.finance, ...(data.finance ?? {}) },
    subscription: { ...templateData.subscription, ...(data.subscription ?? {}) },
  };
}

const renderFinanceTabs = (active: FinancePageKey) =>
  Object.entries(financeTitleMap)
    .map(([key, title]) => `<div class="ftab${key === active ? ' active' : ''}" onclick="window.showFinance('${key}')">${title}</div>`)
    .join('');

export function renderAdminPage(page: Exclude<AdminPageKey, 'finance'>) {
  if (page === 'dashboard') {
    const d = templateData.dashboard;
    const top = [...d.statsByTenant].sort((a, b) => b.shipmentCount - a.shipmentCount).slice(0, 5);
    const max = top.length > 0 ? top[0].shipmentCount : 1;
    return `
      <div class="sec-header">
        <div class="sec-title">Platform Dashboard</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-select" style="width:120px;height:32px;font-size:11px" onchange="window.setAdminDashboardRange(this.value)">
            <option value="day" ${d.range === 'day' ? 'selected' : ''}>Today</option>
            <option value="week" ${d.range === 'week' ? 'selected' : ''}>This Week</option>
            <option value="month" ${d.range === 'month' ? 'selected' : ''}>This Month</option>
            <option value="year" ${d.range === 'year' ? 'selected' : ''}>This Year</option>
          </select>
          <button class="btn" onclick="window.exportAdminDashboard()">Export Summary</button>
        </div>
      </div>

      ${d.needsReview > 0 ? `
      <div class="risk-banner">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>
        <span class="risk-text"><strong>${d.needsReview} risk flags</strong> require attention - platform settlement and compliance reviews pending.</span>
        <button class="btn sm danger" onclick="window.showFinance('riskflags')">Review flags &rarr;</button>
      </div>` : ''}
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Active tenants</div><div class="metric-value">${n(d.activeTenants)}</div><div class="metric-delta up">${n(d.totalTenants)} total</div></div>
        <div class="metric-card"><div class="metric-label">Platform GMV</div><div class="metric-value">${shortMoney(d.platformGmv)}</div><div class="metric-delta up">${n(d.totalShipments)} shipments</div></div>
        <div class="metric-card"><div class="metric-label">Platform revenue</div><div class="metric-value">${shortMoney(d.platformRevenue)}</div><div class="metric-delta up">ledger-backed</div></div>
        <div class="metric-card"><div class="metric-label">Suspended tenants</div><div class="metric-value">${n(d.suspendedTenants)}</div><div class="metric-delta warn">needs follow-up</div></div>
      </div>
      <div class="card-grid">
        <div class="card">
          <div class="card-hdr"><div class="card-title">Recent tenants</div><button class="btn sm" onclick="window.showPage('tenants')">View all</button></div>
          ${d.recentTenants.map((t) => `
            <div class="t-row" style="cursor:pointer" onclick="window.adminAction('viewTenant', ${t.id})">
              <div class="t-chip" style="background:rgba(62,166,255,0.15);color:#8BCBFF">${t.name.slice(0,2).toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div class="t-name">${t.name}</div>
                <div class="t-meta">${t.identifier}.cargomint.io ${DOT} ${n(t.shipments)} shipments</div>
              </div>
              <span class="badge ${t.status === 'active' ? 'active' : 'suspended'}">${t.status === 'active' ? 'Active' : 'Suspended'}</span>
            </div>
          `).join('')}
        </div>
        <div class="card">
          <div class="card-hdr"><div class="card-title">Shipment volume - top 5</div></div>
          <div class="bar-chart">
            ${top.map((s) => `
              <div class="bar-row">
                <div class="bar-lbl">${s.tenantName}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, Math.round((s.shipmentCount / max) * 100))}%"></div></div>
                <div class="bar-val">${n(s.shipmentCount)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  if (page === 'tenants') {
    const rows = templateData.tenants;
    return `
      <div class="sec-hdr">
        <div><div class="sec-title-lg">Tenant Management</div><div style="font-size:11px;color:#4B5563;margin-top:3px">${rows.length} tenants registered</div></div>
        <div style="display:flex;gap:8px"><button class="btn" onclick="window.adminAction('exportTenants')">Export CSV</button><button class="btn" onclick="window.adminAction('openBulkImport')">Bulk import</button><button class="btn primary" onclick="window.openModal('newTenant')">+ New tenant</button></div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="tenant-search-input" type="text" placeholder="Search tenants..." autocomplete="off" oninput="window.applyTenantFilter()" />
          </div>
          <div id="tenant-search-count" style="font-size:11px;color:#6B7280">${rows.length} tenants</div>
        </div>
        <div class="table-wrap" style="padding:0 18px"><table id="tenants-table">
        <thead><tr><th>Company</th><th>Email</th><th>Subdomain</th><th>Country</th><th>Tenant Type</th><th>Plan</th><th>Shipments</th><th>GMV</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>
          ${rows.map((t) => `
            <tr class="tenant-tr" data-name="${(t.name ?? '').toLowerCase()}" data-email="${(t.adminEmail ?? '').toLowerCase()}" data-subdomain="${(t.subdomain ?? '').toLowerCase()}" data-status="${(t.status ?? '').toLowerCase()}" data-country="${(t.country ?? '').toLowerCase()}" data-type="${(t.type ?? '').toLowerCase()}">
              <td><div style="display:flex;align-items:center;gap:8px"><div class="t-chip" style="background:${t.color};color:${t.textColor}">${t.initials}</div><span class="td-strong">${t.name}</span></div></td>
              <td class="td-mono" style="font-size:11.5px;color:#9CA3AF">${t.adminEmail ?? DASH}</td>
              <td class="td-mono">${t.subdomain}</td>
              <td><span style="font-size:10.5px;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:4px;font-family:var(--font-dm-mono),monospace;color:#9CA3AF">${t.country}</span></td>
              <td style="font-size:11.5px;color:#9CA3AF">${t.type ?? 'Logistics'}</td>
              <td style="font-size:11.5px;color:#6B7280">${t.plan}</td>
              <td class="td-mono">${n(t.shipments)}</td>
              <td class="td-mono">${shortMoney(t.gmv)}</td>
              <td><span class="badge ${t.status === 'active' ? 'active' : t.status === 'onboarding' ? 'pending' : 'suspended'}">${t.status === 'active' ? 'Active' : t.status === 'onboarding' ? 'Onboarding' : 'Suspended'}</span></td>
              <td style="font-size:11px;color:#4B5563">${t.created}</td>
              <td><div class="btn-grp">
                <button class="icon-btn" title="View details" onclick="window.adminAction('viewTenant', ${t.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg></button>
                <button class="icon-btn" title="Edit" onclick="window.adminAction('editTenant', ${t.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                <button class="icon-btn" title="${t.status === 'active' ? 'Suspend' : 'Reactivate'}" onclick="window.adminAction('${t.status === 'active' ? 'suspendTenant' : 'reactivateTenant'}', ${t.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><line x1="10" y1="6" x2="6" y2="10"/><line x1="6" y1="6" x2="10" y2="10"/></svg></button>
                <button class="icon-btn" title="Force activate onboarding" onclick="window.adminAction('forceActivateTenant', ${t.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 8l3 3 7-7"/></svg></button>
              </div></td>
            </tr>
          `).join('')}
          <tr id="tenant-empty-row" style="display:none"><td colspan="11" style="text-align:center;color:#6B7280;padding:20px">No tenants match your search.</td></tr>
        </tbody>
      </table></div></div>`;
  }

  if (page === 'invitations') {
    const rows = templateData.invitations;
    return `
      <div class="sec-hdr"><div class="sec-title-lg">Invitations</div><button class="btn primary" onclick="window.openModal('invite')">+ Send invitation</button></div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="invitation-search-input" type="text" placeholder="Search invitations..." autocomplete="off" oninput="window.applyInvitationFilter()" />
          </div>
          <div id="invitation-search-count" style="font-size:11px;color:#6B7280">${rows.length} invitations</div>
        </div>
        <div class="table-wrap" style="padding:0 18px"><table id="invitations-table">
        <thead><tr><th>Email</th><th>Company</th><th>Plan</th><th>Sent</th><th>Expires</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map((i) => `
          <tr class="invitation-row" data-email="${i.email.toLowerCase()}" data-company="${i.company.toLowerCase()}" data-status="${i.status.toLowerCase()}" data-plan="${i.plan.toLowerCase()}">
            <td class="td-mono">${i.email}</td>
            <td class="td-strong">${i.company}</td>
            <td style="color:#6B7280;font-size:11.5px">${i.plan}</td>
            <td class="td-mono">${i.sent}</td>
            <td class="td-mono">${i.expiresAt}</td>
            <td><span class="badge ${i.status.toLowerCase() === 'accepted' ? 'active' : i.status.toLowerCase() === 'expired' ? 'failed' : 'pending'}">${i.status}</span></td>
            <td>${i.canResend ? `<button class="btn sm" onclick="window.adminAction('resendInvitation', ${i.tenantId})">Resend</button>` : `<span style="font-size:11px;color:#4B5563">${DASH}</span>`}</td>
          </tr>`).join('')}
          <tr id="invitation-empty-row" style="display:none"><td colspan="7" style="text-align:center;color:#6B7280;padding:20px">No invitations match your search.</td></tr>
        </tbody>
      </table></div></div>`;
  }

  if (page === 'geography') {
    const countries = templateData.countries;
    return `
      <div class="sec-hdr">
        <div class="sec-title-lg">Geography</div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="window.showPage('geography-stations')">Manage Stations</button>
          <button class="btn" onclick="window.showPage('geography-matrix-local')">Local Matrix</button>
          <button class="btn" onclick="window.showPage('geography-matrix-country')">Country Matrix</button>
          <button class="btn primary" onclick="window.openModal('geo')">+ Add country</button>
        </div>
      </div>
      <div class="card-grid-3">
        ${countries.map((c) => `
          <div class="card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
              <div class="t-chip" style="width:36px;height:36px;border-radius:9px;background:rgba(62,166,255,0.15);color:#8BCBFF;font-size:11px;font-family:var(--font-dm-mono),monospace">${c.code}</div>
              <div><div style="font-size:14px;font-weight:600;color:#F0EEE9">${c.name}</div><div style="font-size:11px;color:#4B5563">${c.regions.length} Regions ${DOT} ${c.statesCount} States</div></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px">${c.regions.slice(0, 8).map((r) => `<span style="font-size:10px;background:rgba(255,255,255,0.05);color:#6B7280;padding:2px 7px;border-radius:4px">${r.name}</span>`).join('')}</div>
            <div style="display:flex;gap:6px">
              <button class="btn sm" style="flex:1;justify-content:center" onclick="window.adminAction('manageCountry', ${c.id})">Manage regions</button>
              <button class="badge ${c.isActive ? 'active' : 'suspended'}" style="border:none;cursor:pointer" onclick="window.adminAction('toggleCountryStatus', ${c.id})">${c.isActive ? 'Active' : 'Inactive'}</button>
              <button class="icon-btn" onclick="window.adminAction('editCountry', ${c.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
            </div>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-hdr">
          <div class="card-title">Region &rarr; State Hierarchy</div>
          <button class="btn sm" onclick="window.adminAction('addRegion')">+ Add region</button>
        </div>
        <div style="font-size:12px;color:#6B7280;margin-bottom:14px">Click a country to explore its geopolitical zones and states.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
          ${countries.map((c, ci) => `<button id="geo-ctab-${c.id}" onclick="window.selectGeoCountry(${c.id})" class="btn sm${ci === 0 ? ' primary' : ''}">${c.name} <span style="opacity:.6;font-size:10px">${c.regions.reduce((a, r) => a + r.states.length, 0)} states</span></button>`).join('')}
        </div>
        ${countries.map((country, ci) => `
        <div id="geo-cpanel-${country.id}" style="display:${ci === 0 ? 'block' : 'none'}">
          ${country.regions.map(region => `
          <div style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;margin-bottom:10px;overflow:hidden">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,0.03);cursor:pointer" onclick="var b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none'">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-weight:600;color:#F0EEE9;font-size:13px">${region.name}</span>
                ${region.code ? `<span style="font-size:10px;background:rgba(255,255,255,0.05);padding:2px 6px;border-radius:4px;color:#6B7280;font-family:monospace">${region.code}</span>` : ''}
                <span style="font-size:10.5px;background:rgba(62,166,255,0.12);color:#8BCBFF;padding:2px 8px;border-radius:12px">${region.states.length} states</span>
              </div>
              <div style="display:flex;gap:5px;align-items:center" onclick="event.stopPropagation()">
                <button class="btn sm" style="height:24px;font-size:10px;padding:0 10px" onclick="window.adminAction('editRegion', ${region.id})">Edit</button>
              </div>
            </div>
            <div style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px">
              ${region.states.map(state => `
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:8px 12px;flex:1;min-width:200px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-weight:500;font-size:12px;color:${state.isActive ? '#D1D5DB' : '#4B5563'}">${state.name}</span>
                    <span style="font-size:9.5px;color:#6B7280;background:rgba(255,255,255,0.05);padding:2px 5px;border-radius:4px">${(state as any).stations?.length || 0} stations</span>
                  </div>
                  <div style="display:flex;gap:4px;align-items:center">
                    <button title="Edit state" style="background:none;border:none;cursor:pointer;padding:0;opacity:.55;color:currentColor" onclick="window.adminAction('editState', ${state.id})">
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:10px;height:10px;display:block"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
                    </button>
                    <button title="${state.isActive ? 'Deactivate' : 'Activate'}" style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;opacity:.55;color:currentColor" onclick="window.adminAction('toggleStateStatus', ${state.id})">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:10px;height:10px;display:block"><circle cx="8" cy="8" r="6"/>${state.isActive ? '<line x1="10" y1="6" x2="6" y2="10"/><line x1="6" y1="6" x2="10" y2="10"/>' : '<line x1="5" y1="11" x2="11" y2="5"/>'}</svg>
                    </button>
                  </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${(state as any).stations?.length ? (state as any).stations.map((st: any) => `<span style="font-size:10px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.03);color:#9CA3AF;padding:2px 6px;border-radius:4px">${st.name}</span>`).join('') : '<span style="font-size:10px;color:#4B5563">No stations yet</span>'}
                </div>
              </div>`).join('')}
              ${region.states.length === 0 ? '<span style="font-size:11px;color:#4B5563;padding:4px 0">No states in this region yet.</span>' : ''}
            </div>
          </div>`).join('')}
          ${country.regions.length === 0 ? '<div style="text-align:center;color:#4B5563;padding:24px;font-size:12px">No regions configured for this country. Use &ldquo;+ Add region&rdquo; to get started.</div>' : ''}
        </div>`).join('')}
      </div>`;
  }

  if (page === 'geography-stations') {
    const stations = templateData.stations;
    return `
      <div class="sec-hdr">
        <div><div class="sec-title-lg">Stations Management</div><div style="font-size:11px;color:#4B5563;margin-top:3px">${stations.length} platform stations and hubs</div></div>
        <div style="display:flex;gap:8px">
          <input type="text" id="station-filter-input" placeholder="Search stations, states..." style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #fff; font-size: 13px;" onkeyup="window.applyStationFilter()" />
          <button class="btn" onclick="window.showPage('geography')">&larr; Back</button>
          <button class="btn" onclick="window.openModal('bulkStationImport')">Import stations</button>
          <button class="btn primary" onclick="window.openModal('newStation')">+ New station</button>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="padding:0 18px">
          <table id="stations-table">
            <thead><tr><th>Station Name</th><th>Code</th><th>State</th><th>Country</th><th>Type</th><th></th></tr></thead>
            <tbody>
              ${stations.length === 0 ? '<tr class="empty-row"><td colspan="6" style="text-align:center;color:#6B7280;padding:16px">No stations found.</td></tr>' : stations.map((s, idx) => `
                <tr data-name="${s.name.toLowerCase()}" data-state="${s.stateName.toLowerCase()}" data-code="${s.code.toLowerCase()}" style="display: ${idx < 20 ? '' : 'none'}" class="station-row">
                  <td class="td-strong">${s.name}</td>
                  <td class="td-mono">${s.code}</td>
                  <td style="font-size:11.5px;color:#9CA3AF">${s.stateName}</td>
                  <td style="font-size:11px;color:#6B7280">${s.countryName}</td>
                  <td><span class="badge ${s.isActive ? 'active' : 'suspended'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><span class="badge ${s.code.includes('HUB') ? 'active' : 'pending'}">${s.code.includes('HUB') ? 'Hub' : 'SC'}</span></td>
                  <td>
                    <div class="btn-grp">
                      <button class="icon-btn" title="Toggle status" onclick="window.adminAction('toggleStationStatus', ${s.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="4" x2="8" y2="12"/><line x1="4" y1="8" x2="12" y2="8"/></svg></button>
                      <button class="icon-btn" onclick="window.adminAction('editStation', ${s.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                      <button class="icon-btn danger" onclick="window.adminAction('deleteStation', ${s.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4l1 1h2v1H3V3h2L6 2zm1 4v6H5V6h2zm4 0v6H9V6h2z"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${stations.length > 20 ? `<div style="padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);"><button id="load-more-stations-btn" class="btn sm" onclick="window.loadMoreStations()">Load More</button></div>` : ''}
        </div>
      </div>`;
  }

  if (page === 'geography-matrix-local') {
    const localRows = templateData.routeZones.local ?? [];
    // Build unique station name lists from the route data itself + stations list
    const stationNames = Array.from(new Set([
      ...localRows.map(r => r.departureStationName),
      ...localRows.map(r => r.destinationStationName),
      ...templateData.stations.map(s => s.name),
    ])).sort();

    const stationOptions = stationNames.map(name =>
      `<option value="${name}">${name}</option>`
    ).join('');

    return `
      <div class="sec-hdr">
        <div><div class="sec-title-lg">Local Route Matrix</div><div style="font-size:11px;color:#4B5563;margin-top:3px">${localRows.length} station-to-station mappings</div></div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="window.showPage('geography')">&larr; Back</button>
          <button class="btn" onclick="window.openModal('bulkLocalMatrixImport')">Import matrix</button>
          <button class="btn primary" onclick="window.adminAction('newRouteMap')">+ Add mapping</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <label style="display:block;font-size:11px;color:#9CA3AF;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Origin Station</label>
            <select id="filter-departure" class="input sm" style="width:100%;background:var(--raised,#1a1a1a);color:var(--text-1,#F0EEE9);border:0.5px solid var(--border-md,rgba(255,255,255,0.1));border-radius:8px;padding:0 10px;height:36px;font-size:13px;cursor:pointer" onchange="window.applyLocalMatrixFilter()">
              <option value="">All origins</option>
              ${stationOptions}
            </select>
          </div>
          <div style="flex:1;min-width:180px">
            <label style="display:block;font-size:11px;color:#9CA3AF;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Destination Station</label>
            <select id="filter-destination" class="input sm" style="width:100%;background:var(--raised,#1a1a1a);color:var(--text-1,#F0EEE9);border:0.5px solid var(--border-md,rgba(255,255,255,0.1));border-radius:8px;padding:0 10px;height:36px;font-size:13px;cursor:pointer" onchange="window.applyLocalMatrixFilter()">
              <option value="">All destinations</option>
              ${stationOptions}
            </select>
          </div>
          <button class="btn sm" onclick="window.adminAction('clearLocalMatrixFilter')">Clear</button>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="padding:0 18px">
          <table id="local-matrix-table">
            <thead><tr><th>Origin Station</th><th>Destination Station</th><th>Zone</th><th>ETA (hrs)</th><th></th></tr></thead>
            <tbody>
              ${localRows.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#6B7280;padding:16px">No route zone mapping configured yet. Use the seeder or add manually.</td></tr>' : localRows.map((r) => `
                <tr data-departure="${r.departureStationName.toLowerCase()}" data-destination="${r.destinationStationName.toLowerCase()}">
                  <td class="td-strong">${r.departureStationName}</td>
                  <td class="td-strong">${r.destinationStationName}</td>
                  <td><span class="badge active">${r.zoneName}</span></td>
                  <td class="td-mono">${n(r.estimatedHoursOfArrival)}h</td>
                  <td>
                    <div class="btn-grp">
                      <button class="icon-btn" onclick="window.adminAction('editLocalMatrix', ${r.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                      <button class="icon-btn danger" onclick="window.adminAction('deleteLocalMatrix', ${r.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4l1 1h2v1H3V3h2L6 2zm1 4v6H5V6h2zm4 0v6H9V6h2z"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  if (page === 'geography-matrix-country') {
    const countryRows = templateData.routeZones.country ?? [];
    return `
      <div class="sec-hdr">
        <div><div class="sec-title-lg">Country Route Matrix</div><div style="font-size:11px;color:#4B5563;margin-top:3px">Country to Country mapping</div></div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="window.showPage('geography')">&larr; Back</button>
          <button class="btn primary" onclick="window.adminAction('newCountryRouteMap')">+ Add mapping</button>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="padding:0 18px">
          <table>
            <thead><tr><th>Origin Country</th><th>Destination Country</th><th>Zone</th><th>ETA (days)</th><th></th></tr></thead>
            <tbody>
              ${countryRows.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#6B7280;padding:16px">No country route zone mapping found.</td></tr>' : countryRows.map((r) => `
                <tr>
                  <td class="td-strong">${r.departureCountryName}</td>
                  <td class="td-strong">${r.destinationCountryName}</td>
                  <td><span class="badge pending">${r.zoneName}</span></td>
                  <td class="td-mono">${n(r.estimatedDaysOfArrival)}</td>
                  <td>
                    <div class="btn-grp">
                      <button class="icon-btn" onclick="window.adminAction('editCountryMatrix', ${r.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                      <button class="icon-btn danger" onclick="window.adminAction('deleteCountryMatrix', ${r.id})"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4l1 1h2v1H3V3h2L6 2zm1 4v6H5V6h2zm4 0v6H9V6h2z"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }
  if (page === 'audit') {
    return `
      <div class="sec-hdr"><div class="sec-title-lg">Audit Log</div><div style="display:flex;gap:8px"><button class="btn" onclick="window.adminAction('exportAudit')">Export</button></div></div>
      <div class="card" style="padding:0;overflow:hidden"><div class="table-wrap" style="padding:0 18px"><table>
        <thead><tr><th>Timestamp</th><th>Action</th><th>Detail</th><th>Record</th><th>Type</th><th>Actor</th></tr></thead>
        <tbody>${templateData.audit.map((a) => `
          <tr>
            <td class="td-mono">${a.time}</td>
            <td><span style="font-weight:500;color:#E8E6E1;font-size:12.5px">${a.action}</span></td>
            <td style="font-size:11.5px;color:#6B7280">${a.detail}</td>
            <td class="td-mono">${a.recordId}</td>
            <td><span class="badge info">${a.module}</span></td>
            <td class="td-mono">${a.actor}</td>
          </tr>`).join('')}
        </tbody>
      </table></div></div>`;
  }

  if (page === 'settings') {
    const jobs = [
      { id: 'InvoiceReminders', name: 'Invoice Reminders', desc: 'Sends payment reminders to tenants with due invoices (via Brevo).' },
      { id: 'SubscriptionTrialExpiry', name: 'Trial Expiry Check', desc: 'Checks for expired trials and transitions tenants to restricted status.' },
      { id: 'SubscriptionBillingCycle', name: 'Billing Cycle Processing', desc: 'Processes monthly/yearly renewals and generates new invoices.' },
      { id: 'SubscriptionDunning', name: 'Dunning Management', desc: 'Retries failed payments and manages automated account suspension.' },
      { id: 'AutomatedBankSettlements', name: 'Bank Settlements', desc: 'Triggers the financial clearing process for completed shipments.' },
      { id: 'WalletReminders', name: 'Wallet Balance Alerts', desc: 'Notifies merchants and tenants when wallet balances fall below threshold.' }
    ];

    return `
      <div class="sec-hdr"><div class="sec-title-lg">System Maintenance</div></div>
      <div class="card">
        <div class="card-hdr">
          <div class="card-title">Background jobs</div>
          <div style="font-size:11px;color:#6B7280">Manually trigger recurring system tasks</div>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Job Name</th><th>Description</th><th>Action</th></tr></thead>
          <tbody>${jobs.map((j) => `
            <tr>
              <td><span style="font-weight:500;color:#E8E6E1">${j.name}</span><div style="font-size:10px;color:#6B7280">${j.id}</div></td>
              <td style="font-size:11.5px;color:#9CA3AF">${j.desc}</td>
              <td><button class="btn sm primary" onclick="window.adminAction('triggerJob', '${j.id}')">Run Now</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-hdr">
          <div class="card-title">System cache</div>
          <button class="btn sm" onclick="window.adminAction('clearCache')">Clear all cache</button>
        </div>
        <p style="font-size:12px;color:#6B7280;margin-top:8px">Clears global platform cache including pricing matrices and geography lookups.</p>
      </div>`;
  }
}

function renderRevenue() {
  const f = templateData.finance;
  return `
    <div class="metrics-grid">
      <div class="metric-card" onclick="window.setCurrentFinancePage('revenue')" style="cursor:pointer"><div class="metric-label">Platform revenue</div><div class="metric-value">${shortMoney(f.platformRevenueLedger)}</div><div class="metric-delta up">Ledger total</div></div>
      <div class="metric-card" onclick="window.setCurrentFinancePage('governance')" style="cursor:pointer"><div class="metric-label">Governance & Controls</div><div class="metric-value">Policies</div><div class="metric-delta up">Manage plans</div></div>
      <div class="metric-card" onclick="window.setCurrentFinancePage('settlements')" style="cursor:pointer"><div class="metric-label">COD exposure</div><div class="metric-value">${shortMoney(f.codExposureAcrossTenants)}</div><div class="metric-delta warn">Across tenants</div></div>
      <div class="metric-card" onclick="window.setCurrentFinancePage('riskflags')" style="cursor:pointer"><div class="metric-label">Risk Flags</div><div class="metric-value">${n(f.failedSettlements)}</div><div class="metric-delta down">Needs review</div></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden"><div class="table-wrap" style="padding:0 18px"><table>
      <thead><tr><th>Tenant</th><th>Plan</th><th>Subscription Due</th><th>Billing</th><th>Pending Settlement</th><th>Completed Settlement</th></tr></thead>
      <tbody>${f.tenantSubscriptionBilling.map((t) => {
        const settlement = f.tenantSettlementOverview.find((s) => s.tenantId === t.tenantId);
        return `<tr>
          <td class="td-strong">${t.tenantName}</td>
          <td style="font-size:11.5px;color:#6B7280">${t.plan}</td>
          <td class="td-mono">${m(t.subscriptionDue)}</td>
          <td><span class="badge ${t.billingAccessSuspended ? 'suspended' : 'active'}">${t.billingAccessSuspended ? 'Suspended' : 'Active'}</span></td>
          <td class="td-mono">${m(settlement?.pendingAmount ?? 0)}</td>
          <td class="td-mono">${m(settlement?.completedAmount ?? 0)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
}

function renderWallets(kind: 'tenant' | 'merchant') {
  const rows = kind === 'tenant' ? templateData.finance.tenantWalletBalances : templateData.finance.merchantWalletBalances;
  return `<div class="card" style="padding:0;overflow:hidden"><div class="table-wrap" style="padding:0 18px"><table>
    <thead><tr><th>Owner</th><th>Wallet Code</th><th>Balance</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map((w) => `
      <tr>
        <td class="td-strong">${w.tenantName}</td>
        <td class="td-mono">${w.ownerCode}</td>
        <td class="td-mono">${m(w.balance)}</td>
        <td><span class="badge ${w.isBlocked ? 'blocked' : 'active'}">${w.isBlocked ? 'Blocked' : 'Healthy'}</span></td>
        <td><button class="btn sm ${w.isBlocked ? 'success' : 'danger'}" onclick="window.adminAction('${w.isBlocked ? 'unblockWallet' : 'blockWallet'}', ${w.walletId})">${w.isBlocked ? 'Unblock' : 'Block'}</button></td>
      </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderSettlements() {
  const rows = templateData.finance.tenantSettlementOverview;
  return `<div class="card" style="padding:0;overflow:hidden"><div class="table-wrap" style="padding:0 18px"><table>
    <thead><tr><th>Tenant</th><th>Pending</th><th>Completed</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map((s) => `
      <tr>
        <td class="td-strong">${s.tenantName}</td>
        <td class="td-mono">${m(s.pendingAmount)}</td>
        <td class="td-mono">${m(s.completedAmount)}</td>
        <td><span class="badge ${s.settlementFrozen ? 'blocked' : 'active'}">${s.settlementFrozen ? 'Frozen' : s.status}</span></td>
        <td><button class="btn sm ${s.settlementFrozen ? 'success' : 'danger'}" onclick="window.adminAction('${s.settlementFrozen ? 'releaseSettlement' : 'freezeSettlement'}', ${s.tenantId})">${s.settlementFrozen ? 'Release' : 'Freeze'}</button></td>
      </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderGateway() {
  const rows = templateData.finance.paymentGatewayTransactions;
  return `<div class="card" style="padding:0;overflow:hidden"><div class="table-wrap" style="padding:0 18px"><table>
    <thead><tr><th>Ref ID</th><th>Gateway</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead>
    <tbody>${rows.map((t) => `<tr><td class="td-mono">${t.reference}</td><td>${t.gateway}</td><td class="td-mono">${m(t.amount)}</td><td><span class="badge ${t.status.toLowerCase() === 'failed' ? 'failed' : t.status.toLowerCase() === 'pending' ? 'pending' : 'active'}">${t.status}</span></td><td class="td-mono">${t.time}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderRiskFlags() {
  const rows = templateData.finance.financeRiskFlags;
  return rows.map((f) => `<div class="flag-card"><div class="flag-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg></div><div style="flex:1"><div class="flag-title">${f.code}</div><div class="flag-detail">${f.message}</div></div></div>`).join('');
}

export function renderFinancePage(page: FinancePageKey) {
  if (page === 'revenue' || page === 'billing') return renderRevenue();
  if (page === 'tenantwallets') return renderWallets('tenant');
  if (page === 'merchantwallets') return renderWallets('merchant');
  if (page === 'settlements') return renderSettlements();
  if (page === 'gateway') return renderGateway();
  if (page === 'governance') {
    return `
      <div class="card">
        <div class="card-hdr">
          <div class="card-title">Subscription policy</div>
          <button class="btn sm" onclick="window.adminAction('editSubscriptionSettings')">Edit policy</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px">
          <div style="font-size:11px;color:#9CA3AF">Trial: <strong style="color:#F0EEE9">${templateData.subscription.settings.trialEnabled ? 'Enabled' : 'Disabled'}</strong></div>
          <div style="font-size:11px;color:#9CA3AF">Trial days: <strong style="color:#F0EEE9">${templateData.subscription.settings.defaultTrialDays}</strong></div>
          <div style="font-size:11px;color:#9CA3AF">Max extension: <strong style="color:#F0EEE9">${templateData.subscription.settings.maxTrialExtensionDays}</strong></div>
          <div style="font-size:11px;color:#9CA3AF">Grace days: <strong style="color:#F0EEE9">${templateData.subscription.settings.gracePeriodDays}</strong></div>
          <div style="font-size:11px;color:#9CA3AF">Dunning retries: <strong style="color:#F0EEE9">${templateData.subscription.settings.dunningRetryCount}</strong></div>
          <div style="font-size:11px;color:#9CA3AF">One trial per tenant: <strong style="color:#F0EEE9">${templateData.subscription.settings.oneTrialPerTenant ? 'Yes' : 'No'}</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr">
          <div class="card-title">Plan catalog</div>
          <button class="btn sm" onclick="window.adminAction('createSubscriptionPlan')">+ New plan</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Plan</th><th>Code</th><th>Base Fee</th><th>Per Shipment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${templateData.subscription.plans.map((p) => `
            <tr>
              <td><span style="font-weight:500;color:#E8E6E1">${p.name}</span></td>
              <td class="td-mono">${p.code}</td>
              <td class="td-mono">₦${p.baseFee.toLocaleString()}</td>
              <td class="td-mono">₦${p.perShipmentFee.toLocaleString()}</td>
              <td><span class="badge ${p.isActive ? 'active' : 'inactive'}">${p.isActive ? 'Active' : 'Inactive'}</span></td>
              <td><button class="btn sm" onclick="window.adminAction('editSubscriptionPlan', ${p.id})">Edit</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-title">Tenant subscriptions</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Tenant</th><th>Plan</th><th>Status</th><th>Cycle</th><th>Next billing</th><th>Trial end</th><th></th></tr></thead>
          <tbody>
            ${templateData.subscription.tenants.map((t) => `
              <tr>
                <td class="td-strong">${t.tenantName}</td>
                <td>${t.plan}</td>
                <td><span class="badge ${t.billingAccessSuspended ? 'blocked' : t.status.toLowerCase().includes('trial') ? 'pending' : 'active'}">${t.status}</span></td>
                <td>${t.billingCycle}</td>
                <td class="td-mono">${t.nextBillingAtUtc ?? '-'}</td>
                <td class="td-mono">${t.trialEndAtUtc ?? '-'}</td>
                <td>
                  <div class="btn-grp">
                    <button class="btn sm" onclick="window.adminAction('resumeTenantSubscription', ${t.tenantId})">Resume</button>
                    <button class="btn sm" onclick="window.adminAction('pauseTenantSubscription', ${t.tenantId})">Pause</button>
                    <button class="btn sm" onclick="window.adminAction('extendTenantTrial', ${t.tenantId})">Extend trial</button>
                    <button class="btn sm danger" onclick="window.adminAction('cancelTenantSubscription', ${t.tenantId})">Cancel</button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${templateData.subscription.tenants.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#6B7280;padding:16px">No tenant subscriptions yet.</td></tr>` : ''}
          </tbody>
        </table></div>
      </div>`;
  }
  return renderRiskFlags();
}

export function renderFinanceContent(page: FinancePageKey) {
  return `<div class="ftabs">${renderFinanceTabs(page)}</div>${renderFinancePage(page)}`;
}

