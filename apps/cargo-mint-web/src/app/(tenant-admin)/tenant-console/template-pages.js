
/*  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a
   DATA
 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a */
let staff = [];



let hubs = [];



let serviceCentres = [];



let fleet = [];



let customers = [];



let auditLogs = [];



let tenantPermissions = [];



let dashboardStats = {
  totalShipments: 0,
  staffCount: 0,
  hubsCount: 0,
  revenue: 0,
  range: 'month',
  periodStartUtc: null,
  periodEndUtc: null,
  inTransitShipments: 0,
  dispatchedShipments: 0,
  deliveredShipments: 0,
  cancelledShipments: 0,
  deliverySuccessRate: 0,
  dispatchRate: 0,
  activeStaffCount: 0,
  suspendedStaffCount: 0,
  serviceCentreCount: 0,
  activeServiceCentreCount: 0,
  codPendingAmount: 0,
  codCollectedAmount: 0,
  statusBreakdown: [],
  staffByRole: [],
  serviceCentreActivity: [],
  trace: [],
  correlationId: null,
};
let dashboardState = { isLoading: true, hasError: false, errorMessage: '' };


let tenantSettings = { name: '', identifier: '', brandColor: '#185FA5', logoUrl: '', tagline: '' };
let billing = { plan: 'Standard', status: '-', amountDue: 0, dueAt: null, invoices: [] };
let finance = {
  totalWalletBalance: 0,
  totalWalletCredits: 0,
  totalWalletDebits: 0,
  totalLedgerCredits: 0,
  totalLedgerDebits: 0,
  pendingInvoicesAmount: 0,
  paidInvoicesAmount: 0,
  codPendingAmount: 0,
  codCollectedAmount: 0,
  merchantWalletsCount: 0,
  merchantWallets: [],
  topMerchantWallets: [],
  recentMovements: [],
};


let stations = [];
let localRouteZonePairs = [];
let countries = [];
let pricingData = {
  zones: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
  matrix: [],
  modifiers: {},
};
let fleetOwnershipFilter = 'both';

function isFleetTenantMode() {
  return String(tenantSettings.operationalType || '').trim().toLowerCase() === 'fleet';
}

function toInitials(name) {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function toAvatarColor(seed) {
  const palette = [
    ['#E6F1FB', '#185FA5'],
    ['#E1F5EE', '#0F6E56'],
    ['#EEEDFE', '#534AB7'],
    ['#FAEEDA', '#854F0B'],
    ['#FCEBEB', '#A32D2D'],
    ['#EAF3DE', '#3B6D11'],
  ];
  const value = (seed || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[value % palette.length];
}

function replaceList(targetName, items) {
  if (!Array.isArray(items)) return;
  if (targetName === 'staff') staff = items;
  if (targetName === 'hubs') hubs = items;
  if (targetName === 'serviceCentres') serviceCentres = items;
  if (targetName === 'auditLogs') auditLogs = items;
}

function setTenantTemplateData(data) {
  if (!data || typeof data !== 'object') return;

  if (Array.isArray(data.staff)) {
    replaceList('staff', data.staff.map((s) => {
      const [bg, fg] = toAvatarColor(s.email || s.name || '');
      return {
        ...s,
        initials: s.initials || toInitials(s.name),
        color: s.color || bg,
        tc: s.tc || fg,
      };
    }));
  }

  if (Array.isArray(data.hubs)) {
    replaceList('hubs', data.hubs);
  }

  if (Array.isArray(data.serviceCentres)) {
    replaceList('serviceCentres', data.serviceCentres);
  }

  if (Array.isArray(data.auditLogs)) {
    replaceList('auditLogs', data.auditLogs);
  }

  if (Array.isArray(data.permissions)) {
    tenantPermissions = data.permissions;
  }

  if (Array.isArray(data.fleet)) {
    fleet = data.fleet;
  }

  if (Array.isArray(data.customers)) {
    customers = data.customers.map((m) => {
      const [bg, fg] = toAvatarColor(m.email || m.name || '');
      return {
        ...m,
        initials: m.initials || toInitials(m.name),
        color: m.color || bg,
        tc: m.tc || fg,
      };
    });
  }

  if (data.dashboardStats) {
    dashboardStats = {
      ...dashboardStats,
      ...data.dashboardStats,
    };
  }

  if (data.dashboardState && typeof data.dashboardState === 'object') {
    dashboardState = {
      ...dashboardState,
      ...data.dashboardState,
    };
  }

  if (Array.isArray(data.stations)) {
    stations = data.stations;
  }

  if (Array.isArray(data.localRouteZonePairs)) {
    localRouteZonePairs = data.localRouteZonePairs;
  }

  if (Array.isArray(data.countries)) {
    countries = data.countries;
  }

  if (data.pricing && typeof data.pricing === 'object') {
    const incoming = data.pricing;
    pricingData = {
      zones: Array.isArray(incoming.zones) && incoming.zones.length > 0 ? incoming.zones : pricingData.zones,
      matrix: Array.isArray(incoming.matrix) && incoming.matrix.length > 0
        ? incoming.matrix.map((row) => ({
            origin: row.origin || 'Zone',
            values: Array.isArray(row.values) ? row.values : [],
          }))
        : pricingData.matrix,
      modifiers: incoming.modifiers && typeof incoming.modifiers === 'object'
        ? incoming.modifiers
        : pricingData.modifiers,
    };
  }

  if (data.filters && typeof data.filters === 'object') {
    const incoming = String(data.filters.fleetOwnership || 'both').trim().toLowerCase();
    fleetOwnershipFilter = incoming === 'own' || incoming === 'third' ? incoming : 'both';
  }

  if (data.settings && typeof data.settings === 'object') {
    tenantSettings = {
      ...tenantSettings,
      ...data.settings,
    };
  }

  if (data.billing && typeof data.billing === 'object') {
    billing = {
      ...billing,
      ...data.billing,
      invoices: Array.isArray(data.billing.invoices) ? data.billing.invoices : billing.invoices,
    };
  }

  if (data.finance && typeof data.finance === 'object') {
    finance = {
      ...finance,
      ...data.finance,
      merchantWallets: Array.isArray(data.finance.merchantWallets) ? data.finance.merchantWallets : finance.merchantWallets,
      topMerchantWallets: Array.isArray(data.finance.topMerchantWallets) ? data.finance.topMerchantWallets : finance.topMerchantWallets,
      recentMovements: Array.isArray(data.finance.recentMovements) ? data.finance.recentMovements : finance.recentMovements,
    };
  }
}

/*  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a
   PAGES
 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a */
const pages = {

  dashboard() {
    if (dashboardState.isLoading) {
      return `
      <div class="sec-header">
          <span class="sec-title">Tenant overview - ${tenantSettings.name || 'Starship NG'}</span>
      </div>
      <div class="info-banner">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 9.5H9v1H7v-1h.5V8H7V7h2v3.5h-.5zm-1-6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
        Loading tenant dashboard data...
      </div>`;
    }

    if (dashboardState.hasError) {
      return `
      <div class="sec-header">
          <span class="sec-title">Tenant overview - ${tenantSettings.name || 'Starship NG'}</span>
      </div>
      <div class="info-banner">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 9.5H9v1H7v-1h.5V8H7V7h2v3.5h-.5zm-1-6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
        ${dashboardState.errorMessage || 'Dashboard data is unavailable right now.'}
      </div>`;
    }

    const totalShipments = Number(dashboardStats.totalShipments || 0);
    const staffCount = Number(dashboardStats.staffCount || 0);
    const hubCount = Number(dashboardStats.hubsCount || 0);
    const revenue = Number(dashboardStats.revenue || 0);
    const revenueLabel = `NGN ${revenue.toLocaleString()}`;
    const serviceCentreCount = Number(dashboardStats.serviceCentreCount || serviceCentres.length);
    const suspendedCount = Number(dashboardStats.suspendedStaffCount || staff.filter((s) => s.status === 'suspended').length);
    const serviceCentreBars = (Array.isArray(dashboardStats.serviceCentreActivity) ? dashboardStats.serviceCentreActivity : [])
      .map((entry) => ({ label: entry.serviceCentreName || 'Service Centre', raw: Number(entry.shipmentCount || 0) }))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 6);
    const maxBar = serviceCentreBars[0]?.raw || 1;
    const fleetBreakdown = fleet.reduce((acc, item) => {
      const t = String(item.type || '').toLowerCase();
      if (t.includes('van')) acc.van += 1;
      else if (t.includes('truck')) acc.truck += 1;
      else acc.bike += 1;
      return acc;
    }, { bike: 0, van: 0, truck: 0 });
    const ownCount = fleet.filter((v) => String(v.ownership).toLowerCase() === 'own').length;
    const thirdCount = fleet.filter((v) => String(v.ownership).toLowerCase() !== 'own').length;
    const inactiveCount = fleet.filter((v) => String(v.status).toLowerCase() !== 'active').length;
    const activeFleetCount = fleet.filter((v) => String(v.status).toLowerCase() === 'active').length;
    return `
      <div class="sec-header">
          <span class="sec-title">Tenant overview - ${tenantSettings.name || 'Starship NG'}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-select" style="width:120px;height:32px;font-size:11px" onchange="window.setDashboardRange(this.value)">
            <option value="day" ${dashboardStats.range === 'day' ? 'selected' : ''}>Today</option>
            <option value="week" ${dashboardStats.range === 'week' ? 'selected' : ''}>This Week</option>
            <option value="month" ${dashboardStats.range === 'month' ? 'selected' : ''}>This Month</option>
            <option value="year" ${dashboardStats.range === 'year' ? 'selected' : ''}>This Year</option>
          </select>
          <button class="btn" onclick="window.exportDashboardData()">Export</button>
        </div>
      </div>

      ${suspendedCount > 0 ? `
      <div class="info-banner">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 9.5H9v1H7v-1h.5V8H7V7h2v3.5h-.5zm-1-6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
        ${suspendedCount} staff member(s) currently suspended. <span style="cursor:pointer;text-decoration:underline" onclick="showPage('staff')">Review in Staff Management -&gt;</span>
      </div>` : ''}

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Active staff</div>
          <div class="metric-value">${Number(dashboardStats.activeStaffCount || staffCount)}</div>
          <div class="metric-delta neutral">across ${serviceCentreCount} service centres</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total shipments (${String(dashboardStats.range || 'month').toUpperCase()})</div>
          <div class="metric-value">${totalShipments.toLocaleString()}</div>
          <div class="metric-delta neutral">live tenant shipments</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tenant GMV (${String(dashboardStats.range || 'month').toUpperCase()})</div>
          <div class="metric-value">${revenueLabel}</div>
          <div class="metric-delta neutral">live tenant GMV</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Fleet active</div>
          <div class="metric-value">${activeFleetCount}</div>
          <div class="metric-delta neutral">active tenant vehicles</div>
        </div>
      </div>

      <div class="card-grid">
        <div class="card">
          <div class="card-title">Shipments by service centre</div>
          ${serviceCentreBars.length === 0 ? `<div class="row-meta">No service centres created yet.</div>` : serviceCentreBars.map((entry)=>`
            <div class="bar-row">
              <div class="bar-lbl">${entry.label}</div>
              <div class="prog-track"><div class="prog-fill" style="width:${Math.max(8, Math.round((entry.raw / maxBar) * 100))}%"></div></div>
              <div class="bar-val">${entry.raw.toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">Delivery & dispatch performance</div>
          <div class="list-row">
            <div style="flex:1;min-width:0"><div class="row-name">Delivery success</div><div class="row-meta">Delivered shipments in range</div></div>
            <div class="td-mono">${Number(dashboardStats.deliverySuccessRate || 0).toFixed(2)}%</div>
          </div>
          <div class="list-row">
            <div style="flex:1;min-width:0"><div class="row-name">Dispatch rate</div><div class="row-meta">Manifested/in-transit/delivered</div></div>
            <div class="td-mono">${Number(dashboardStats.dispatchRate || 0).toFixed(2)}%</div>
          </div>
          <div class="row-meta" style="margin-top:8px">${(dashboardStats.statusBreakdown || []).map((s)=>`${s.status}: ${s.count}`).join(' | ') || 'No shipments in selected range.'}</div>
        </div>
        <div class="card">
          <div class="card-title">Hub coverage</div>
          ${hubs.map(h=>`
            <div class="list-row">
              <div class="row-avatar" style="background:var(--bg-info);color:var(--text-info);font-size:10px;font-family:var(--font-mono)">${h.code}</div>
              <div style="flex:1;min-width:0">
                <div class="row-name">${h.name}</div>
                <div class="row-meta">${h.scs} service centres - ${h.staff} staff - ${h.capacity}</div>
              </div>
              <span class="badge active">Active</span>
            </div>`).join('')}
          <div style="margin-top:12px">
            <button class="btn" style="width:100%;justify-content:center" onclick="showPage('hubs')">Manage hubs →</button>
          </div>
        </div>
      </div>

      <div class="card-grid">
        <div class="card">
          <div class="card-title">Recent staff activity</div>
          ${(dashboardStats.recentActivities || []).map(s=>`
            <div class="list-row">
              <div class="row-avatar" style="background:var(--surface-3);color:var(--text-primary)">${(s.name || 'U').split(' ').map(n=>n[0]).join('').toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div class="row-name">${s.name}</div>
                <div class="row-meta">${s.role} - ${s.serviceCentreName || 'Tenant-wide'}</div>
              </div>
              <span style="font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);white-space:nowrap">${s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'New'}</span>
            </div>`).join('')}
          <div style="margin-top:12px"><button class="btn" style="width:100%;justify-content:center" onclick="showPage('staff')">View all staff →</button></div>
        </div>
        <div class="card">
          <div class="card-title">Fleet snapshot</div>
          <div style="display:flex;gap:16px;margin-bottom:16px">
            ${[['Motorcycle', String(fleetBreakdown.bike), '#185FA5'],['Van', String(fleetBreakdown.van), '#0F6E56'],['Truck', String(fleetBreakdown.truck), '#854F0B']].map(([t,n,c])=>`
              <div style="text-align:center;flex:1;background:var(--bg-subtle);border-radius:var(--radius-md);padding:10px 8px">
                <div style="font-size:20px;font-weight:500;font-family:var(--font-mono);color:${c}">${n}</div>
                <div style="font-size:10px;color:var(--text-tertiary)">${t}</div>
              </div>`).join('')}
          </div>
          <div style="padding-top:12px;border-top:0.5px solid var(--border)">
            <div style="display:flex;gap:16px;font-size:11px">
              <div><span class="dot dot-green"></span><span style="color:var(--text-secondary)">Own - </span><strong>${ownCount}</strong></div>
              <div><span class="dot dot-blue"></span><span style="color:var(--text-secondary)">Third party - </span><strong>${thirdCount}</strong></div>
              <div><span class="dot dot-amber"></span><span style="color:var(--text-secondary)">Inactive - </span><strong>${inactiveCount}</strong></div>
            </div>
          </div>
          <div style="margin-top:12px"><button class="btn" style="width:100%;justify-content:center" onclick="showPage('fleet')">Manage fleet -></button></div>
        </div>
      </div>`;
  },

  staff() {
    const scOptions = serviceCentres.map((s) => `<option value="${(s.name || '').toLowerCase()}">${s.name}</option>`).join('');
    const staffRows = staff.slice(0, 20);
    return `
      <div class="sec-header">
        <span class="sec-title">Staff Management</span>
        <div style="display:flex;gap:8px">
          <select id="staff-role-filter" class="form-select" style="width:160px;height:32px" onchange="window.applyStaffFilter()">
            <option value="">All roles</option>
            <option value="tenantadmin">TenantAdmin</option>
            <option value="servicecentreadmin">ServiceCentreAdmin</option>
            <option value="deskoperator">DeskOperator</option>
            <option value="hubmanager">HubManager</option>
            <option value="captain">Captain</option>
            <option value="financeuser">FinanceUser</option>
          </select>
          <select id="staff-scope-filter" class="form-select" style="width:180px;height:32px" onchange="window.applyStaffFilter()">
            <option value="">All service centres</option>
            ${scOptions}
          </select>
          <button class="btn" data-action="import-staff">Import staff</button>
          <button class="btn primary" onclick="openModal('modal-staff')">+ Invite staff</button>
        </div>
      </div>
      <div class="full-card">
        <div style="padding:0 0 12px;display:flex;align-items:center;justify-content:space-between">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="staff-search-input" type="text" placeholder="Search staff..." autocomplete="off" oninput="window.applyStaffFilter()" />
          </div>
          <div id="staff-search-count" style="font-size:11px;color:var(--text-tertiary)">${staffRows.length} of ${staff.length} staff</div>
        </div>
        <div class="table-wrap">
          <table id="staff-table">
            <thead><tr><th>Name</th><th>Role</th><th>Scoped to</th><th>Last login</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${staffRows.map(s=>`
                <tr class="staff-row" data-search="${`${s.name || ''} ${s.email || ''} ${s.role || ''} ${s.scope || ''} ${s.status || ''}`.toLowerCase()}" data-role="${String(s.role || '').toLowerCase()}" data-scope="${String(s.scope || '').toLowerCase()}">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="row-avatar" style="width:26px;height:26px;font-size:9px;background:${s.color};color:${s.tc}">${s.initials}</div>
                      <div>
                        <div style="font-weight:500;font-size:12px">${s.name}</div>
                        <div class="td-mono">${s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="chip">${s.role}</span></td>
                  <td style="font-size:11px;color:var(--text-secondary)">${s.scope}</td>
                  <td class="td-mono">${s.lastLogin}</td>
                  <td>
                    <span class="dot dot-${s.status==='active'?'green':'red'}"></span>
                    <span style="font-size:11px">${s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="icon-btn" title="Edit" data-action="edit-staff" data-id="${s.id}">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
                      </button>
                      <button class="icon-btn" title="${s.status==='suspended'?'Unsuspend':'Suspend'}" onclick="${s.status==='suspended'?`window.unsuspendStaff(${s.id || 0},'${(s.name || '').replace(/'/g, "\\'")}')`:`window.suspendStaff(${s.id || 0},'${(s.name || '').replace(/'/g, "\\'")}')`}">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M6 6l4 4M10 6l-4 4"/></svg>
                      </button>
                      <button class="icon-btn" title="Reset password" data-action="reset-staff-password" data-id="${s.id}">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 00-5 5v1H1v7h14V7h-2V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v1H5V6a3 3 0 013-3zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>`).join('')}
              <tr id="staff-empty-row" style="display:none"><td colspan="6" style="text-align:center;color:var(--text-tertiary);padding:20px">No staff match your search.</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
  },

  hubs() {
    const hubRows = hubs.slice(0, 20);
    return `
      <div class="sec-header">
        <span class="sec-title">Hubs</span>
        <div style="display:flex;gap:8px">
          <select id="hub-state-filter" class="form-select" style="width:160px;height:32px" onchange="window.applyHubFilter()">
            <option value="">All locations</option>
            ${Array.from(new Set(hubs.map((h) => String(h.state || 'N/A')))).map((state) => `<option value="${state.toLowerCase()}">${state}</option>`).join('')}
          </select>
          <button class="btn" data-action="import-hubs-scs">Import hubs/SCs</button>
          <button class="btn primary" onclick="openModal('modal-hub')">+ Create hub</button>
        </div>
      </div>
      <div class="full-card" style="margin-bottom:14px;padding:12px 14px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="hub-search-input" type="text" placeholder="Search hubs..." autocomplete="off" oninput="window.applyHubFilter()" />
          </div>
          <div id="hub-search-count" style="font-size:11px;color:var(--text-tertiary)">${hubRows.length} of ${hubs.length} hubs</div>
        </div>
      </div>
      ${hubRows.map(h=>`
        <div class="full-card hub-card" data-search="${`${h.name || ''} ${h.code || ''} ${h.state || ''} ${h.manager || ''}`.toLowerCase()}" data-state="${String(h.state || '').toLowerCase()}" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            <div class="row-avatar" style="width:40px;height:40px;background:var(--bg-info);color:var(--text-info);font-size:11px;font-family:var(--font-mono);border-radius:10px">${h.code}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:500">${h.name}</div>
              <div style="font-size:11px;color:var(--text-tertiary)">${h.state}  -  ${h.scs} service centres - Manager: ${h.manager}</div>
            </div>
            <span class="badge active">Active</span>
            <div class="btn-group">
              <button class="btn" data-action="edit-hub" data-id="${h.id}">Edit hub</button>
              <button class="btn" onclick="showPage('service-centres')">View SCs -></button>
            </div>
          </div>
          <div style="display:flex;gap:10px">
            ${[['Sort capacity',h.capacity],['Staff count',h.staff+' members'],['Service centres',h.scs+' active']].map(([k,v])=>`
              <div style="flex:1;background:var(--bg-subtle);border-radius:var(--radius-md);padding:10px 12px">
                <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px">${k}</div>
                <div style="font-size:13px;font-weight:500;font-family:var(--font-mono)">${v}</div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
      <div id="hub-empty-row" class="full-card" style="display:none;text-align:center;color:var(--text-tertiary);padding:20px">No hubs match your search.</div>`;
  },

  'service-centres'() {
    const hubOptions = hubs.map((h) => `<option value="${(h.name || '').toLowerCase()}">${h.name}</option>`).join('');
    const serviceCentreRows = serviceCentres.slice(0, 20);
    return `
      <div class="sec-header">
        <span class="sec-title">Service Centres</span>
        <div style="display:flex;gap:8px">
          <select id="service-centre-hub-filter" class="form-select" style="width:160px;height:32px" onchange="window.applyServiceCentreFilter()">
            <option value="">All hubs</option>
            ${hubOptions}
          </select>
          <button class="btn primary" onclick="openModal('modal-sc')">+ Create service centre</button>
        </div>
      </div>
      <div class="full-card">
        <div style="padding:0 0 12px;display:flex;align-items:center;justify-content:space-between">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="service-centre-search-input" type="text" placeholder="Search service centres..." autocomplete="off" oninput="window.applyServiceCentreFilter()" />
          </div>
          <div id="service-centre-search-count" style="font-size:11px;color:var(--text-tertiary)">${serviceCentreRows.length} of ${serviceCentres.length} service centres</div>
        </div>
        <div class="table-wrap">
          <table id="service-centre-table">
            <thead><tr><th>Code</th><th>Service Centre</th><th>Parent Hub</th><th>Zone / LGA</th><th>SC Admin</th><th>Staff</th><th>Shipments MTD</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${serviceCentreRows.map(sc=>`
                <tr class="service-centre-row" data-search="${`${sc.code || ''} ${sc.name || ''} ${sc.hub || ''} ${sc.zone || ''} ${sc.admin || ''} ${sc.status || ''}`.toLowerCase()}" data-hub="${String(sc.hub || '').toLowerCase()}">
                  <td class="td-mono">${sc.code}</td>
                  <td style="font-weight:500;font-size:12px">${sc.name}</td>
                  <td style="font-size:11px;color:var(--text-secondary)">${sc.hub}</td>
                  <td style="font-size:11px"><span style="background:var(--bg-subtle);padding:2px 7px;border-radius:4px;font-family:var(--font-mono);font-size:10px">${sc.zone}</span></td>
                  <td style="font-size:11px;color:var(--text-secondary)">${sc.admin}</td>
                  <td class="td-mono">${sc.staff}</td>
                  <td class="td-mono">${sc.shipments}</td>
                  <td>
                    <span class="dot dot-${sc.status==='active'?'green':'amber'}"></span>
                    <span style="font-size:11px">${sc.status.charAt(0).toUpperCase()+sc.status.slice(1)}</span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="icon-btn" title="Edit" data-action="edit-service-centre" data-id="${sc.id}">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
                      </button>
                      <button class="icon-btn" title="View staff" onclick="showPage('staff')">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 4a3 3 0 106 0A3 3 0 005 4zM1 13a7 7 0 0114 0H1z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>`).join('')}
              <tr id="service-centre-empty-row" style="display:none"><td colspan="9" style="text-align:center;color:var(--text-tertiary);padding:20px">No service centres match your search.</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
  },

  roles() {
    const roles = ['Hub Manager','SC Admin','Ops Officer','Finance Officer','Captain'];
    const permissionKeys = [
      { key: 'view_tenant_shipments', label: 'View all shipments (tenant)', defaults: [1,0,0,0,0] },
      { key: 'view_sc_shipments', label: 'View shipments (own SC)', defaults: [1,1,1,0,0] },
      { key: 'create_shipment', label: 'Create shipment', defaults: [1,1,1,0,0] },
      { key: 'edit_shipment', label: 'Edit shipment', defaults: [1,1,0,0,0] },
      { key: 'update_status', label: 'Update shipment status', defaults: [1,1,1,0,1] },
      { key: 'print_waybill', label: 'Print waybill', defaults: [1,1,1,0,0] },
      { key: 'manage_staff_sc', label: 'Manage staff (SC)', defaults: [1,1,0,0,0] },
      { key: 'suspend_staff', label: 'Suspend staff', defaults: [1,1,0,0,0] },
      { key: 'view_finance_sc', label: 'View financials (SC)', defaults: [1,1,0,1,0] },
      { key: 'view_finance_tenant', label: 'View financials (tenant)', defaults: [1,0,0,1,0] },
      { key: 'access_manifest', label: 'Access manifest builder', defaults: [1,1,1,0,0] },
      { key: 'assign_fleet', label: 'Assign vehicle / captain', defaults: [1,1,0,0,0] },
    ];

    const getPerm = (role, key, def) => {
      if (!tenantPermissions || tenantPermissions.length === 0) return def === 1;
      const found = tenantPermissions.find(p => p.roleName === role && p.permissionKey === key);
      return found ? found.isEnabled : false;
    };

    return `
      <div class="sec-header">
        <span class="sec-title">Roles & Permissions</span>
        <button class="btn" onclick="window.saveTenantPermissions()">Save changes</button>
      </div>
      <div class="info-banner">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 9.5H9v1H7v-1h.5V8H7V7h2v3.5h-.5zm-1-6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
        Tenant Admin always has full access. The matrix below configures what each subordinate role can do. Changes apply to all staff in that role immediately.
      </div>
      <div class="full-card">
        <div class="table-wrap">
          <table id="permissions-table">
            <thead>
              <tr>
                <th style="width:220px">Permission</th>
                ${roles.map(r=>`<th style="text-align:center">${r}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${permissionKeys.map(p=>`
                <tr data-key="${p.key}">
                  <td style="font-size:12px;color:var(--text-secondary)">${p.label}</td>
                  ${roles.map((r, i)=>`
                    <td style="text-align:center">
                      <label class="toggle" style="margin:0 auto;display:block">
                        <input type="checkbox" data-role="${r}" ${getPerm(r, p.key, p.defaults[i]) ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  fleet() {
    const filteredFleet = fleet.filter((v) => fleetOwnershipFilter === 'both' ? true : String(v.ownership).toLowerCase() === fleetOwnershipFilter);
    const fleetRows = filteredFleet.slice(0, 20);
    const ownCount = filteredFleet.filter(v=>v.ownership==='own').length;
    const thirdCount = filteredFleet.filter(v=>v.ownership==='third').length;
    const onRouteCount = filteredFleet.filter((v) => String(v.status).toLowerCase() === 'active').length;
    const maintenanceCount = filteredFleet.filter((v) => String(v.status).toLowerCase() === 'maintenance').length;
    const availableCount = Math.max(filteredFleet.length - onRouteCount - maintenanceCount, 0);
    const scOptions = serviceCentres.map((s) => `<option>${s.name}</option>`).join('');
    return `
      <div class="sec-header">
        <span class="sec-title">Fleet & Captains</span>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-select" style="width:160px;height:32px">
            <option>All service centres</option>
            ${scOptions}
          </select>
          <button class="btn" data-action="import-fleet">Import fleet</button>
          <button class="btn primary" onclick="openModal('modal-vehicle')">+ Register vehicle</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        ${[['Own only','own'],['Third party only','third'],['Mixed (both)','both']].map(([l,v])=>`
          <button class="btn ${v===fleetOwnershipFilter?'primary':''}" style="height:28px;font-size:11px;padding:0 12px" onclick="setFleetOwnershipFilter('${v}')">
            ${l}
          </button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px">
        ${[
          ['Total vehicles',filteredFleet.length,''],
          ['On route',onRouteCount,'up'],
          ['Available',availableCount,'up'],
          ['Maintenance',maintenanceCount,'down']
        ].map(([l,v,d])=>`
          <div class="m-card">
            <div class="m-lbl">${l}</div>
            <div class="m-val">${v}</div>
            <div class="m-sub ${d||'neutral'}">${l==='On route'?'Active trips':l==='Available'?'Ready to assign':l==='Maintenance'?'Action needed':''}</div>
          </div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span class="sec-title">VEHICLES</span>
        <div class="search-wrap" style="width:300px;margin-left:auto;margin-right:8px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
          <input id="fleet-search-input" type="text" placeholder="Search fleet..." autocomplete="off" oninput="window.applyFleetFilter()" />
        </div>
        <div id="fleet-search-count" style="font-size:11px;color:var(--text-tertiary)">${fleetRows.length} of ${filteredFleet.length} vehicles</div>
        <div>
          <button class="btn primary" onclick="openModal('modal-vehicle')">+ Register vehicle</button>
        </div>
      </div>
      <div class="fleet-grid">
        ${fleetRows.map(v=>`
          <div class="fleet-card fleet-row" data-search="${`${v.plate || ''} ${v.type || ''} ${v.ownership || ''} ${v.captain || ''} ${v.status || ''}`.toLowerCase()}">
            <div class="fleet-plate">${v.plate}</div>
            <div class="fleet-type">${v.type} · ${(v.type || '').toLowerCase().includes('bike') ? '30kg' : (v.type || '').toLowerCase().includes('truck') ? '2,000kg' : '800kg'}</div>
            <div style="margin-bottom:6px">
              ${String(v.status).toLowerCase()==='maintenance'
                ? '<span class="badge maintenance">Maintenance</span>'
                : String(v.status).toLowerCase()==='active'
                  ? '<span class="badge onroute">On Route</span>'
                  : '<span class="badge available">Available</span>'}
            </div>
            <div class="fleet-stat-row"><span>Driver</span><span style="font-weight:500">${v.captain || 'Unassigned'}</span></div>
            <div class="fleet-stat-row"><span>Trip</span><span class="td-mono">${String(v.status).toLowerCase()==='active' ? `MAN-${String(8000 + Number(v.id || 0)).slice(-4)}` : '—'}</span></div>
            <div style="margin-top:6px">
              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span style="color:var(--text-tertiary)">Fuel</span><span class="td-mono">${String(v.status).toLowerCase()==='maintenance'?'—':(String(v.status).toLowerCase()==='active'?'55%':'90%')}</span></div>
              <div class="prog-track"><div class="prog-fill" style="width:${String(v.status).toLowerCase()==='maintenance'?'0%':(String(v.status).toLowerCase()==='active'?'55%':'90%')};background:${String(v.status).toLowerCase()==='maintenance'?'var(--amber)':(String(v.status).toLowerCase()==='active'?'#facc15':'#4ade80')}"></div></div>
            </div>
            <div class="fleet-actions">
              <button class="btn sm" style="flex:1;justify-content:center" data-action="edit-fleet" data-id="${v.id}">Details</button>
              <button class="icon-btn" title="Edit" data-action="edit-fleet" data-id="${v.id}">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
              </button>
            </div>
          </div>`).join('')}
      </div>
      <div id="fleet-empty-row" class="full-card" style="display:none;text-align:center;color:var(--text-tertiary);padding:20px;margin-top:12px">No fleet records match your search.</div>`;
  },

  customers() {
    const customerRows = customers.slice(0, 20);
    return `
      <div class="sec-header">
        <span class="sec-title">Customers & Merchants</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="toast('CSV exported')">Export CSV</button>
          <button class="btn primary" onclick="openModal('modal-merchant')">+ Onboard merchant</button>
        </div>
      </div>

      <div class="filter-tabs">
        <button class="filter-tab active" onclick="document.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.querySelectorAll('.customer-row').forEach(r=>r.style.display='')">All Customers</button>
        <button class="filter-tab" onclick="document.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.querySelectorAll('.customer-row').forEach(r=>r.style.display=r.dataset.type==='Merchant'?'':'none')">Merchants Only</button>
        <button class="filter-tab" onclick="document.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.querySelectorAll('.customer-row').forEach(r=>r.style.display=r.dataset.type==='Individual'?'':'none')">Individuals Only</button>
      </div>

      <div class="full-card">
        <div style="padding:0 0 12px;display:flex;align-items:center;justify-content:space-between">
          <div class="search-wrap" style="width:300px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input id="customer-search-input" type="text" placeholder="Search customers..." autocomplete="off" oninput="window.applyCustomerFilter()" />
          </div>
          <div id="customer-search-count" style="font-size:11px;color:var(--text-tertiary)">${customerRows.length} of ${customers.length} customers</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Contact</th><th>Type</th><th>Code</th><th>Credit limit</th><th>Shipments MTD</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${customerRows.map((m, index) => {
                const isIndividual = m.type === 'Individual';
                const color = isIndividual ? '#94a3b8' : 'var(--accent)';
                const initials = m.name.substring(0,2).toUpperCase();
                return `
                <tr class="customer-row" data-type="${m.type}" data-search="${`${m.name || ''} ${m.contact || ''} ${m.email || ''} ${m.customerCode || ''} ${m.type || ''} ${m.status || ''}`.toLowerCase()}">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="row-avatar" style="width:26px;height:26px;font-size:9px;background:${color};color:#fff">${initials}</div>
                      <div>
                        <div style="font-weight:500;font-size:12px">${m.name}</div>
                        <div class="td-mono" style="color:var(--text-tertiary)">${m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-size:11px;color:var(--text-secondary)">${m.contact}</td>
                  <td><span class="chip" style="${isIndividual ? 'background:#f1f5f9;color:#64748b' : ''}">${m.type}</span></td>
                  <td class="td-mono">${m.customerCode || 'N/A'}</td>
                  <td class="td-mono">${m.credit}</td>
                  <td class="td-mono">${m.shipments}</td>
                  <td>
                    <span class="dot dot-${m.status==='active'?'green':'amber'}"></span>
                    <span style="font-size:11px">${m.status.charAt(0).toUpperCase()+m.status.slice(1)}</span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="icon-btn" title="View" data-action="view-customer" data-id="${m.id}">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg>
                      </button>
                      <button class="icon-btn" title="Edit" data-action="edit-customer" data-id="${m.id}">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
              <tr id="customer-empty-row" style="display:none"><td colspan="8" style="text-align:center;color:var(--text-tertiary);padding:20px">No customers match your search.</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
  },

  pricing() {
    if (isFleetTenantMode()) {
      const fleetVehicles = ['Motorcycle', 'Pickup Truck', 'Sprinter Van', 'Box Truck'];
      const fleetRows = fleetVehicles.map((vehicle) => {
        const stdKey = `Fleet fee (${vehicle}) - standard`;
        const contractedKey = `Fleet fee (${vehicle}) - contracted`;
        return {
          vehicle,
          standard: pricingData.modifiers?.[stdKey] || 'NGN 0',
          contracted: pricingData.modifiers?.[contractedKey] || 'NGN 0',
          stdKey,
          contractedKey,
        };
      });
      const remittance = pricingData.modifiers?.['Fleet remittance cycle'] || 'Weekly';
      const codWindow = pricingData.modifiers?.['Fleet COD remittance SLA'] || '48 hours';
      const cancellation = pricingData.modifiers?.['Fleet cancellation fee'] || 'NGN 0';
      const overtime = pricingData.modifiers?.['Fleet overtime fee (per hour)'] || 'NGN 0';

      return `
      <div class="sec-header">
        <span class="sec-title">Fleet Fee Schedule</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="toast('Fleet fees exported')">Export</button>
          <button class="btn primary" onclick="savePricing()">Save changes</button>
        </div>
      </div>

      <div class="full-card" style="margin-bottom:16px">
        <div class="card-title">Trip-level pricing by vehicle type</div>
        <div class="row-meta" style="margin-bottom:10px">Fleet tenants price capacity per trip, not shipment zone matrices.</div>
        <table>
          <thead><tr><th>Vehicle type</th><th>Standard fee</th><th>Contracted fee</th></tr></thead>
          <tbody>
            ${fleetRows.map((row) => `
              <tr>
                <td style="font-size:11px;font-weight:500">${row.vehicle}</td>
                <td><input class="form-input" data-pricing-modifier="${row.stdKey}" value="${row.standard}" style="height:28px;padding:0 8px;font-size:11px;font-family:var(--font-mono)"></td>
                <td><input class="form-input" data-pricing-modifier="${row.contractedKey}" value="${row.contracted}" style="height:28px;padding:0 8px;font-size:11px;font-family:var(--font-mono)"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="full-card">
        <div class="card-title" style="margin-bottom:14px">Fleet settlement rules</div>
        <div class="settings-grid">
          <div>
            <div class="form-row">
              <label class="form-label">Fleet remittance cycle</label>
              <select class="form-select" data-pricing-rule="Fleet remittance cycle">
                ${['Daily', 'Weekly', 'Bi-weekly', 'Monthly'].map((option) => `<option value="${option}" ${remittance === option ? 'selected' : ''}>${option}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label class="form-label">COD remittance SLA</label>
              <input class="form-input" data-pricing-rule="Fleet COD remittance SLA" value="${codWindow}">
            </div>
          </div>
          <div>
            <div class="form-row">
              <label class="form-label">Cancellation fee</label>
              <input class="form-input" data-pricing-rule="Fleet cancellation fee" value="${cancellation}">
            </div>
            <div class="form-row">
              <label class="form-label">Overtime fee (per hour)</label>
              <input class="form-input" data-pricing-rule="Fleet overtime fee (per hour)" value="${overtime}">
            </div>
          </div>
        </div>
      </div>`;
    }

    const zones = Array.isArray(pricingData.zones) ? pricingData.zones : [];
    const rates = Array.isArray(pricingData.matrix) ? pricingData.matrix : [];
    const getModifierValue = (key, fallback = '') => {
      const map = pricingData.modifiers && typeof pricingData.modifiers === 'object' ? pricingData.modifiers : {};
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return map[key];
      }
      const normalized = String(key || '').trim().toLowerCase();
      const foundKey = Object.keys(map).find((k) => String(k || '').trim().toLowerCase() === normalized);
      return foundKey ? map[foundKey] : fallback;
    };
    const isRuleKey = (label) => {
      const normalized = String(label || '').trim().toLowerCase();
      return normalized === 'minimum shipment charge'
        || normalized === 'cod remittance cycle'
        || normalized === 'invoice generation'
        || normalized === 'late payment penalty (% per day)'
        || normalized === 'credit term (merchant accounts)'
        || normalized === 'auto-suspend on overdue (days)';
    };
    const isZoneMetaKey = (label) => {
      const normalized = String(label || '').trim().toLowerCase();
      return normalized.startsWith('zone coverage:')
        || normalized.startsWith('zone base rate:');
    };
    const hiddenRuleKeys = new Set([
      'Minimum shipment charge',
      'COD remittance cycle',
      'Invoice generation',
      'Late payment penalty (% per day)',
      'Credit term (merchant accounts)',
      'Auto-suspend on overdue (days)',
    ]);
    const modifiers = pricingData.modifiers && typeof pricingData.modifiers === 'object'
      ? Object.entries(pricingData.modifiers).filter(([label]) => {
          if (hiddenRuleKeys.has(label) || isRuleKey(label)) return false;
          if (isZoneMetaKey(label)) return false;
          return true;
        })
      : [];
    const surchargeCatalog = [
      { label: 'Insurance', defaultValue: '1.5%', appliesTo: 'Declared value' },
      { label: 'Handling fee', defaultValue: 'NGN 150 flat', appliesTo: 'All shipments' },
      { label: 'COD fee', defaultValue: '1.2%', appliesTo: 'COD payments' },
      { label: 'Express surcharge', defaultValue: '40%', appliesTo: 'Express type' },
      { label: 'Fragile surcharge', defaultValue: '25%', appliesTo: 'Fragile type' },
      { label: 'Fuel surcharge', defaultValue: '8%', appliesTo: 'All routes' },
    ];
    const normalizeLabel = (value) => String(value || '').trim().toLowerCase();
    const catalogKeySet = new Set(surchargeCatalog.map((item) => normalizeLabel(item.label)));
    const normalizedModifierMap = new Map(modifiers.map(([label, value]) => [normalizeLabel(label), value]));
    const surchargeRows = surchargeCatalog.map((item) => ({
      label: item.label,
      appliesTo: item.appliesTo,
      value: normalizedModifierMap.get(normalizeLabel(item.label)) || normalizedModifierMap.get(normalizeLabel(`${item.label} (%)`)) || item.defaultValue,
    }));
    const extraSurcharges = modifiers
      .filter(([label]) => !catalogKeySet.has(normalizeLabel(label)))
      .map(([label, value]) => ({ label, appliesTo: 'All applicable shipments', value }));
    const weightBands = ['0–1kg', '1–3kg', '3–5kg', '5–10kg', '10–20kg', '20kg+'];
    const coverageLabels = [
      'Same state / adjacent',
      '2-3 states away',
      '4-6 states away',
      'Far north / south cross',
    ];
    const ruleValues = {
      minimumShipmentCharge: getModifierValue('Minimum shipment charge', 'NGN 500'),
      codRemittanceCycle: getModifierValue('COD remittance cycle', 'Weekly'),
      invoiceGeneration: getModifierValue('Invoice generation', 'Auto - end of month'),
      latePaymentPenalty: getModifierValue('Late payment penalty (% per day)', '0.5%'),
      creditTerm: getModifierValue('Credit term (merchant accounts)', '30 days'),
      autoSuspendDays: getModifierValue('Auto-suspend on overdue (days)', '7'),
    };

    return `
      <div class="sec-header">
        <span class="sec-title">Pricing Engine</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="toast('Pricing exported')">Export</button>
          <button class="btn primary" onclick="savePricing()">Save changes</button>
        </div>
      </div>

      <div class="card-grid" style="margin-bottom:22px">
        <div class="card">
          <div class="card-title">Zone definitions</div>
          <div class="table-wrap">
            <table data-pricing-base-table>
              <thead><tr><th>Zone</th><th>Coverage</th><th>Base rate (NGN/kg)</th><th></th></tr></thead>
              <tbody data-pricing-base-body>
                ${zones.map((zoneName, i) => {
                  const coverage = pricingData.modifiers?.[`Zone coverage: ${zoneName}`] || coverageLabels[i] || 'Extended delivery coverage';
                  const baseRate = pricingData.modifiers?.[`Zone base rate: ${zoneName}`] || rates[0]?.values?.[i] || 'NGN 0';
                  return `
                  <tr>
                    <td><span class="badge own">${zoneName || `Zone ${i + 1}`}</span></td>
                    <td>
                      <input class="form-input" style="height:28px;padding:0 8px;font-size:11px" 
                             data-pricing-zone-coverage="${zoneName}" 
                             value="${coverage}">
                    </td>
                    <td>
                      <input class="form-input" style="height:28px;padding:0 8px;font-size:11px;font-family:var(--font-mono)" 
                             data-pricing-zone-base-rate="${zoneName}" 
                             value="${baseRate}">
                    </td>
                    <td>
                      <button class="icon-btn" onclick="toast('Base rates are saved with global Save button')" title="Edit details">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
                      </button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Surcharges & fees</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Fee type</th><th>Value</th><th>Applies to</th></tr></thead>
              <tbody>
                ${[...surchargeRows, ...extraSurcharges].map((item) => `
                  <tr>
                    <td style="font-size:11px;font-weight:500">${item.label}</td>
                    <td>
                      <input class="form-input" data-pricing-modifier="${item.label}" value="${item.value}" style="height:28px;padding:0 8px;font-size:11px;font-family:var(--font-mono)">
                    </td>
                    <td style="font-size:10.5px;color:var(--text-tertiary)">${item.appliesTo}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="full-card">
        <div class="card-title" style="margin-bottom:14px">Weight × Zone price matrix (₦) — click cells to edit</div>
        <div class="matrix-wrap">
          <table class="matrix-table" data-pricing-matrix-table data-pricing-zone-count="${zones.length}">
            <thead>
              <tr>
                <th>Weight Range</th>
                ${zones.map((z, index) => `<th data-pricing-zone data-zone-index="${index}">${z}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${weightBands.map((weightLabel, i) => `
                <tr>
                  <td class="zone-lbl" data-pricing-weight-band data-row-index="${i}">${weightLabel}</td>
                  ${zones.map((_, j) => `
                    <td class="editable" contenteditable="true" spellcheck="false" data-pricing-cell data-row-index="${i}" data-col-index="${j}">${rates[i]?.values?.[j] || '0'}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="full-card">
        <div class="card-title" style="margin-bottom:14px">Payment & billing rules</div>
        <div class="settings-grid">
          <div>
            <div class="form-row">
              <label class="form-label">Minimum shipment charge</label>
              <input class="form-input" data-pricing-rule="Minimum shipment charge" value="${ruleValues.minimumShipmentCharge}">
            </div>
            <div class="form-row">
              <label class="form-label">COD remittance cycle</label>
              <select class="form-select" data-pricing-rule="COD remittance cycle">
                ${['Daily', 'Weekly', 'Bi-weekly', 'Monthly'].map((option) => `<option value="${option}" ${ruleValues.codRemittanceCycle === option ? 'selected' : ''}>${option}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label class="form-label">Invoice generation</label>
              <select class="form-select" data-pricing-rule="Invoice generation">
                ${['Auto - end of week', 'Auto - end of month', 'Manual'].map((option) => `<option value="${option}" ${ruleValues.invoiceGeneration === option ? 'selected' : ''}>${option}</option>`).join('')}
              </select>
            </div>
          </div>
          <div>
            <div class="form-row">
              <label class="form-label">Late payment penalty (% per day)</label>
              <input class="form-input" data-pricing-rule="Late payment penalty (% per day)" value="${ruleValues.latePaymentPenalty}">
            </div>
            <div class="form-row">
              <label class="form-label">Credit term (merchant accounts)</label>
              <input class="form-input" data-pricing-rule="Credit term (merchant accounts)" value="${ruleValues.creditTerm}">
            </div>
            <div class="form-row">
              <label class="form-label">Auto-suspend on overdue (days)</label>
              <input class="form-input" data-pricing-rule="Auto-suspend on overdue (days)" value="${ruleValues.autoSuspendDays}">
            </div>
          </div>
        </div>
      </div>
      
      <div class="full-card">
        <div class="card-title" style="margin-bottom:14px">Price Calculator (Testing Tool)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
          <div>
            <label class="form-label">Departure Station</label>
            <select id="calc-origin" class="form-select">
              <option value="">Select origin</option>
              ${stations.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Destination Station</label>
            <select id="calc-destination" class="form-select">
              <option value="">Select destination</option>
              ${stations.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-end;margin-bottom:20px">
          <div style="flex:1">
            <label class="form-label">Weight (kg)</label>
            <input type="number" id="calc-weight" class="form-input" value="1.0" step="0.1">
          </div>
          <div style="flex:1">
            <label class="form-label">Length (cm)</label>
            <input type="number" id="calc-length" class="form-input" value="0" step="0.1">
          </div>
          <div style="flex:1">
            <label class="form-label">Width (cm)</label>
            <input type="number" id="calc-width" class="form-input" value="0" step="0.1">
          </div>
          <div style="flex:1">
            <label class="form-label">Height (cm)</label>
            <input type="number" id="calc-height" class="form-input" value="0" step="0.1">
          </div>
          <div style="flex:1.2">
            <button class="btn primary" style="width:100%" onclick="testPricingCalculation()">Calculate Price</button>
          </div>
        </div>
        <div id="calc-result" style="display:none;padding:16px;background:rgba(24,95,165,0.05);border-radius:8px;border:1px dashed var(--accent)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Breakdown</div>
              <div class="list-row"><div class="row-name">Zone Resolved</div><div id="res-zone" class="badge active" style="font-size:10px">-</div></div>
              <div class="list-row"><div class="row-name">Matrix Route</div><div id="res-route" class="td-mono">-</div></div>
              <div class="list-row"><div class="row-name">ETA (hours)</div><div id="res-eta" class="td-mono">-</div></div>
              <div class="list-row"><div class="row-name">Base Rate</div><div id="res-base" class="td-mono">-</div></div>
              <div class="list-row"><div class="row-name">VAT (7.5%)</div><div id="res-vat" class="td-mono">-</div></div>
              <div class="list-row"><div class="row-name">Insurance (1%)</div><div id="res-insurance" class="td-mono">-</div></div>
            </div>
            <div style="text-align:right">
              <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Estimated Total</div>
              <div id="res-total" style="font-size:32px;font-weight:700;color:var(--accent);font-family:var(--font-mono)">₦0.00</div>
              <div id="res-note" style="font-size:11px;color:var(--text-tertiary);margin-top:8px">Includes all surcharges and minimum floors.</div>
            </div>
          </div>
        </div>
      </div>
      `;
  },

  finance() {
    if (isFleetTenantMode()) {
      const money = (amount) => `NGN ${Number(amount || 0).toLocaleString()}`;
      return `
      <div class="sec-header">
        <span class="sec-title">Fleet Earnings & Remittance</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="toast('Fleet finance snapshot exported')">Export</button>
        </div>
      </div>

      <div class="metrics-grid" style="margin-bottom:16px">
        <div class="metric-card"><div class="metric-label">Trip earnings (credits)</div><div class="metric-value">${money(finance.totalLedgerCredits)}</div><div class="metric-delta neutral">all credited trip earnings</div></div>
        <div class="metric-card"><div class="metric-label">Remittance outflow (debits)</div><div class="metric-value">${money(finance.totalLedgerDebits)}</div><div class="metric-delta neutral">settlements/remittance paid out</div></div>
        <div class="metric-card"><div class="metric-label">COD pending</div><div class="metric-value">${money(finance.codPendingAmount)}</div><div class="metric-delta neutral">awaiting remittance</div></div>
        <div class="metric-card"><div class="metric-label">COD remitted</div><div class="metric-value">${money(finance.codCollectedAmount)}</div><div class="metric-delta neutral">already remitted</div></div>
      </div>

      <div class="full-card">
        <div class="card-title">Recent fleet finance movements</div>
        <table>
          <thead><tr><th>Time</th><th>Stream</th><th>Direction</th><th>Amount</th><th>Reference</th><th>Description</th></tr></thead>
          <tbody>
            ${(finance.recentMovements || []).length === 0 ? '<tr><td colspan="6" class="row-meta">No fleet finance movements yet.</td></tr>' : (finance.recentMovements || []).map((m) => `
              <tr>
                <td class="td-mono">${m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</td>
                <td>${m.stream || '-'}</td>
                <td>${m.direction || '-'}</td>
                <td class="td-mono">${money(m.amount)}</td>
                <td class="td-mono">${m.reference || '-'}</td>
                <td style="font-size:11px;color:var(--text-secondary)">${m.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    }

    const money = (amount) => `NGN ${Number(amount || 0).toLocaleString()}`;
    return `
      <div class="sec-header">
        <span class="sec-title">Finance Management</span>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="toast('Finance snapshot exported')">Export</button>
        </div>
      </div>

      <div class="metrics-grid" style="margin-bottom:16px">
        <div class="metric-card"><div class="metric-label">Merchant wallets</div><div class="metric-value">${Number(finance.merchantWalletsCount || 0).toLocaleString()}</div><div class="metric-delta neutral">tenant-scoped wallets</div></div>
        <div class="metric-card"><div class="metric-label">Wallet balances</div><div class="metric-value">${money(finance.totalWalletBalance)}</div><div class="metric-delta neutral">current combined balance</div></div>
        <div class="metric-card"><div class="metric-label">COD pending</div><div class="metric-value">${money(finance.codPendingAmount)}</div><div class="metric-delta neutral">awaiting remittance</div></div>
        <div class="metric-card"><div class="metric-label">COD collected</div><div class="metric-value">${money(finance.codCollectedAmount)}</div><div class="metric-delta neutral">collected in operations</div></div>
      </div>

      <div class="card-grid" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">Money movement summary</div>
          <div class="list-row"><div class="row-name">Wallet credits</div><div class="td-mono">${money(finance.totalWalletCredits)}</div></div>
          <div class="list-row"><div class="row-name">Wallet debits</div><div class="td-mono">${money(finance.totalWalletDebits)}</div></div>
          <div class="list-row"><div class="row-name">Ledger credits</div><div class="td-mono">${money(finance.totalLedgerCredits)}</div></div>
          <div class="list-row"><div class="row-name">Ledger debits</div><div class="td-mono">${money(finance.totalLedgerDebits)}</div></div>
          <div class="list-row"><div class="row-name">Pending invoices</div><div class="td-mono">${money(finance.pendingInvoicesAmount)}</div></div>
          <div class="list-row"><div class="row-name">Paid invoices</div><div class="td-mono">${money(finance.paidInvoicesAmount)}</div></div>
        </div>
        <div class="card">
          <div class="card-title">Top merchant wallets</div>
          ${(finance.topMerchantWallets || []).length === 0 ? '<div class="row-meta">No wallet records yet.</div>' : (finance.topMerchantWallets || []).map((w) => `
            <div class="list-row">
              <div style="flex:1"><div class="row-name">${w.merchantCode || 'MERCHANT'}</div><div class="row-meta">Wallet #${w.walletId} - ${Number(w.transactionsCount || 0)} txns</div></div>
              <div class="td-mono">${money(w.balance)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="full-card" style="margin-bottom:16px">
        <div class="card-title">All merchant wallets</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input class="form-input" style="max-width:360px" placeholder="Search by merchant code or wallet ID..." oninput="filterFinanceWallets(this.value)">
          <button class="btn" onclick="document.querySelectorAll('[data-finance-wallet-row]').forEach((r)=>r.style.display=''); const input=this.parentElement.querySelector('input'); if(input){input.value='';}">Clear</button>
        </div>
        <table>
          <thead><tr><th>Merchant code</th><th>Wallet ID</th><th>Balance</th><th>Transactions</th></tr></thead>
          <tbody>
            ${(finance.merchantWallets || []).length === 0 ? '<tr><td colspan="4" class="row-meta">No merchant wallets available.</td></tr>' : (finance.merchantWallets || []).map((w) => `
              <tr data-finance-wallet-row data-search="${String(w.merchantCode || '').toLowerCase()} ${String(w.walletId || '').toLowerCase()}">
                <td class="td-mono">${w.merchantCode || '-'}</td>
                <td class="td-mono">${w.walletId ?? '-'}</td>
                <td class="td-mono">${money(w.balance)}</td>
                <td class="td-mono">${Number(w.transactionsCount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="full-card">
        <div class="card-title">Recent finance movements</div>
        <table>
          <thead><tr><th>Time</th><th>Stream</th><th>Direction</th><th>Amount</th><th>Reference</th><th>Description</th></tr></thead>
          <tbody>
            ${(finance.recentMovements || []).length === 0 ? '<tr><td colspan="6" class="row-meta">No finance movements yet.</td></tr>' : (finance.recentMovements || []).map((m) => `
              <tr>
                <td class="td-mono">${m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</td>
                <td>${m.stream || '-'}</td>
                <td>${m.direction || '-'}</td>
                <td class="td-mono">${money(m.amount)}</td>
                <td class="td-mono">${m.reference || '-'}</td>
                <td style="font-size:11px;color:var(--text-secondary)">${m.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  },

  settings() {
    const companyName = tenantSettings.name || '';
    const subdomain = tenantSettings.identifier || 'tenant';
    const brandColor = tenantSettings.brandColor || '#185FA5';
    const logoUrl = tenantSettings.logoUrl || '';
    const tagline = tenantSettings.tagline || 'Fast. Reliable. Everywhere.';
    const adminEmail = tenantSettings.adminEmail || 'admin@swiftlog.com';
    const adminPhone = tenantSettings.adminPhone || '+234 800 123 4567';
    const country = tenantSettings.country || 'Nigeria';

    return `
      <div class="sec-header"><span class="sec-title">Tenant Settings</span></div>
      <div class="settings-grid">
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="settings-section-title">Subscription billing</div>
            <div class="list-row" style="padding:8px 0">
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-tertiary)">Plan</div>
                <div style="font-size:13px;font-weight:500">${billing.plan || 'Standard'}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-tertiary)">Status</div>
                <div style="font-size:13px;font-weight:500">${billing.status || '-'}</div>
              </div>
            </div>
            <div class="list-row" style="padding:8px 0">
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-tertiary)">Amount due</div>
                <div style="font-size:16px;font-weight:600">NGN ${Number(billing.amountDue || 0).toLocaleString()}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-tertiary)">Due date</div>
                <div style="font-size:13px;font-weight:500">${billing.dueAt || '-'}</div>
              </div>
            </div>
            <button class="btn primary" style="width:100%;justify-content:center" data-action="initialize-subscription-payment">Pay current invoice</button>
            <div style="margin-top:12px;font-size:11px;color:var(--text-tertiary)">Payment link opens securely and updates automatically after webhook confirmation.</div>
          </div>

          <div class="card" style="margin-bottom:16px">
            <div class="settings-section-title">Tenant profile</div>
            <div class="form-row"><label class="form-label">Company name</label><input id="settings-company-name" class="form-input" value="${companyName}"></div>
            <div class="form-row"><label class="form-label">Subdomain</label><input class="form-input" value="${subdomain}" style="font-family:var(--font-mono)" readonly></div>
            <div class="form-row"><label class="form-label">Admin email</label><input id="settings-admin-email" class="form-input" value="${adminEmail}"></div>
            <div class="form-row"><label class="form-label">Support phone</label><input id="settings-admin-phone" class="form-input" value="${adminPhone}"></div>
            <div class="form-row"><label class="form-label">Registered country</label>
              <select id="settings-country" class="form-select">
                ${countries.length > 0 ? countries.map(c => `<option ${country === c.name ? 'selected' : ''} value="${c.name}">${c.name}</option>`).join('') : '<option selected>Nigeria</option><option>Ghana</option><option>Kenya</option>'}
              </select>
            </div>
            <button class="btn primary" style="width:100%;justify-content:center" onclick="saveTenantSettings()">Save profile</button>
          </div>

          <div class="card">
            <div class="settings-section-title">Branding</div>
            <div class="form-row"><label class="form-label">Brand colour (hex)</label><input id="settings-brand-color" class="form-input" value="${brandColor}" style="font-family:var(--font-mono)"></div>
            <div class="form-row"><label class="form-label">Logo URL</label><input id="settings-logo-url" class="form-input" value="${logoUrl}" placeholder="https:// - /logo.png"></div>
            <div class="form-row"><label class="form-label">Company tagline</label><input id="settings-tagline" class="form-input" value="${tagline}"></div>
            <button class="btn" style="width:100%;justify-content:center" onclick="saveTenantSettings()">Update branding</button>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="settings-section-title">Notifications</div>
            ${[
              ['Shipment created','Email + SMS','active'],
              ['Shipment delivered','SMS to sender','active'],
              ['COD collected','Email to admin','active'],
              ['Staff login from new device','Email to admin','active'],
              ['Low fleet alert (< 2 active)','Email to admin','inactive'],
            ].map(([event,channel,status])=>`
              <div class="list-row" style="padding:10px 0">
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:500">${event}</div>
                  <div style="font-size:11px;color:var(--text-tertiary)">${channel}</div>
                </div>
                <label class="toggle">
                  <input type="checkbox" ${status==='active'?'checked':''} onchange="toast('Notification preference updated')">
                  <span class="toggle-slider"></span>
                </label>
              </div>`).join('')}
          </div>

          <div class="card">
            <div class="settings-section-title">API & integrations</div>
            <div class="form-row">
              <label class="form-label">Tenant API key</label>
              <div style="display:flex;gap:6px">
                <input class="form-input" value="sk_live_${subdomain.replace(/-/g, '')}_xxxxxxxxxxxxxxxx" style="font-family:var(--font-mono);font-size:11px" readonly>
                <button class="btn" style="flex-shrink:0;padding:0 10px" onclick="toast('API key copied!')">Copy</button>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">Webhook URL</label>
              <input class="form-input" placeholder="https://yourserver.com/webhooks/cargomint">
            </div>
            <div class="form-row">
              <label class="form-label">Captain app deep-link scheme</label>
              <input class="form-input" value="${subdomain.replace(/-/g, '')}captain://" style="font-family:var(--font-mono);font-size:11px">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
              <div class="int-card">
                <div class="int-icon">PS</div>
                <div class="int-info"><div class="int-name">Paystack</div><div class="int-desc">Payment gateway</div></div>
                <span class="badge active">Live</span>
              </div>
              <div class="int-card">
                <div class="int-icon">DH</div>
                <div class="int-info"><div class="int-name">DHL API</div><div class="int-desc">Cross-border</div></div>
                <span class="badge inactive">Off</span>
              </div>
              <div class="int-card">
                <div class="int-icon">GM</div>
                <div class="int-info"><div class="int-name">Google Maps</div><div class="int-desc">Geocoding</div></div>
                <span class="badge active">Live</span>
              </div>
              <div class="int-card">
                <div class="int-icon">SG</div>
                <div class="int-info"><div class="int-name">SendGrid</div><div class="int-desc">Transactional email</div></div>
                <span class="badge active">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  audit() {
    return `
      <div class="sec-header">
        <span class="sec-title">Audit Log</span>
        <div style="display:flex;gap:8px">
          <select class="form-select" style="width:140px;height:32px">
            <option>All actions</option>
            <option>Staff changes</option>
            <option>Pricing changes</option>
            <option>Config changes</option>
          </select>
          <button class="btn" onclick="toast('Exported')">Export</button>
        </div>
      </div>
      <div class="full-card">
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>Detail</th><th>Actor</th></tr></thead>
          <tbody>
            ${auditLogs.map(l=>`
              <tr>
                <td class="td-mono" style="white-space:nowrap">${l.time}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="dot dot-${l.severity==='warn'?'amber':'green'}"></span>
                    <span style="font-weight:500;font-size:12px">${l.action}</span>
                  </div>
                </td>
                <td style="font-size:11px;color:var(--text-secondary)">${l.detail}</td>
                <td class="td-mono">${l.actor}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
};

/*  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a
   ROUTING + UI
 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - a */
const ctaMap = {
  dashboard:         { label:'+ Invite staff',    fn: ()=>openModal('modal-staff') },
  staff:             { label:'+ Invite staff',    fn: ()=>openModal('modal-staff') },
  hubs:              { label:'+ Create hub',      fn: ()=>openModal('modal-hub') },
  'service-centres': { label:'+ Create SC',       fn: ()=>openModal('modal-sc') },
  roles:             { label:'Save changes',      fn: ()=>toast('Permissions saved!') },
  fleet:             { label:'+ Register vehicle',fn: ()=>openModal('modal-vehicle') },
  merchants:         { label:'+ Onboard merchant',fn: ()=>openModal('modal-merchant') },
  finance:           { label:'Export finance',    fn: ()=>toast('Finance snapshot exported') },
  pricing:           { label:'Save pricing',      fn: ()=> (typeof window !== 'undefined' && typeof window.savePricing === 'function' ? window.savePricing() : toast('Pricing save unavailable')) },
  settings:          { label:'Save settings',     fn: ()=>toast('Settings saved!') },
  audit:             { label:'Export log',        fn: ()=>toast('Exported') },
};

const titleMap = {
  dashboard:'Dashboard', staff:'Staff Management', hubs:'Hubs',
  'service-centres':'Service Centres', roles:'Roles & Permissions',
  fleet:'Fleet Setup', merchants:'Merchant Accounts',
  finance:'Finance Management', pricing:'Pricing Engine', settings:'Tenant Settings', audit:'Audit Log',
};

let currentCta = ctaMap.dashboard;

export { pages, ctaMap, titleMap, setTenantTemplateData };





