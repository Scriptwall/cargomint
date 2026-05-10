'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import * as XLSX from 'xlsx';
import './template.css';
import {
  adminConsoleFinanceTitles,
  adminConsolePageTitles,
  type AdminPageKey,
  type AdminTemplateData,
  type FinancePageKey,
  renderAdminPage,
  renderFinanceContent,
  setAdminTemplateData,
} from './template-pages';

type ModalId = 'newTenant' | 'bulkTenantImport' | 'bulkStationImport' | 'bulkLocalMatrixImport' | 'suspend' | 'blockwallet' | 'freeze' | 'credit' | 'invite' | 'geo' | 'region' | 'geoEdit' | 'countryMatrix' | 'localMatrix' | 'subscriptionSettings' | 'plan' | 'modal-profile' | null;

type TenantForm = {
  name: string;
  subdomain: string;
  country: string;
  state: string;
  dialCode: string;
  plan: string;
  temporaryPassword: string;
  adminEmail: string;
  adminPhone: string;
  notes: string;
  type: string;
  contactPerson: string;
  address: string;
};

type InviteForm = {
  email: string;
  company: string;
  plan: string;
};

type BulkTenantImportRow = {
  company: string;
  name: string;
  identifier: string;
  adminEmail: string;
  country: string;
  state: string;
  plan: string;
  adminPhone: string;
  notes: string;
  temporaryPassword: string;
  type: string;
  contactPerson: string;
  address: string;
};

type BulkStationImportRow = {
  stationName: string;
  code: string;
  stateName: string;
  countryName: string;
};

type BulkLocalMatrixImportRow = {
  departureStationName: string;
  destinationStationName: string;
  zoneName: string;
  estimatedHoursOfArrival: number;
};

type CountryForm = {
  name: string;
  code: string;
  currencyCode: string;
  currencySymbol: string;
};

type RegionForm = {
  name: string;
  code: string;
  states: string[];
};

declare global {
  interface Window {
    showPage: (page: string) => void;
    showFinance: (page: string) => void;
    openModal: (id: string) => void;
    closeModal: (id: string) => void;
    toast: (message: string) => void;
    doCreate: () => void;
    doGeoEdit: () => void;
    doPlan: () => void;
    doCountryMatrix: () => void;
    doLocalMatrix: () => void;
    doSubscriptionSettings: () => void;
    setCurrentFinancePage: (page: string) => void;
    adminAction: (action: string, id?: number) => void;
    applyLocalMatrixFilter: () => void;
    applyStationFilter: () => void;
    applyTenantFilter: () => void;
    applyInvitationFilter: () => void;
    selectGeoCountry: (countryId: number) => void;
    stationLimit: number;
    loadMoreStations: () => void;
  }
}

const SEARCH_PLACEHOLDER = 'Search tenants, waybills, logs...';
const API_BASE = '/api/v1/Admin';

function LogoMark() {
  return (
    <svg viewBox="0 0 16 16">
      <path d="M2 3a1 1 0 011-1h4a1 1 0 011 1v2h2V3a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2H8v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5l3 3" />
    </svg>
  );
}

function initialsFrom(value?: string | null) {
  const source = value?.trim() || 'Super Admin';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return source.slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeDialCode(value?: string | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function normalizePhoneWithDialCode(input: string, dialCode?: string | null) {
  const normalizedDial = normalizeDialCode(dialCode);
  const raw = input.trim();
  if (!raw) return normalizedDial;
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return normalizedDial;

  if (!normalizedDial) {
    return raw.startsWith('+') ? `+${digitsOnly}` : digitsOnly;
  }

  const dialDigits = normalizedDial.slice(1);
  let localDigits = digitsOnly;
  if (localDigits.startsWith(dialDigits)) {
    localDigits = localDigits.slice(dialDigits.length);
  } else if (localDigits.startsWith('0')) {
    localDigits = localDigits.replace(/^0+/, '');
  }
  return `${normalizedDial}${localDigits}`;
}

function getToken() {
  return document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1] ?? '';
}

async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const target = path.startsWith('/api/') ? path : `${API_BASE}${path}`;
  const response = await fetch(target, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired or invalid. Please log in again as SuperAdmin.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. Admin Console requires SuperAdmin/Admin role.');
    }
    const text = await response.text();
    let message = text || `Request failed: ${response.status}`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { title?: string; detail?: string; errors?: Record<string, string[]> };
        if (parsed.title || parsed.detail) {
          message = [parsed.title, parsed.detail].filter(Boolean).join(': ');
        } else if (parsed.errors) {
          const firstKey = Object.keys(parsed.errors)[0];
          const firstError = firstKey ? parsed.errors[firstKey]?.[0] : null;
          if (firstError) message = firstError;
        }
      } catch {
        // keep plain text as-is
      }
    }
    throw new Error(message);
  }
  return response;
}

function toReadableAuditDetail(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (!text.startsWith('{') && !text.startsWith('[')) return text;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (Array.isArray(parsed)) return text;
    const entries = Object.entries(parsed)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${String(v)}`);
    return entries.length > 0 ? entries.join(' | ') : text;
  } catch {
    return text;
  }
}

async function downloadFile(path: string, filename: string) {
  const response = await apiFetch(path);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const INITIAL_TENANT_FORM: TenantForm = {
  name: '',
  subdomain: '',
  country: 'Nigeria',
  state: '',
  dialCode: '+234',
  plan: 'Free Trial',
  temporaryPassword: '',
  adminEmail: '',
  adminPhone: '',
  notes: '',
  type: 'Logistics',
  contactPerson: '',
  address: '',
};

const INITIAL_INVITE_FORM: InviteForm = {
  email: '',
  company: '',
  plan: 'Free Trial',
};

const INITIAL_COUNTRY_FORM: CountryForm = {
  name: '',
  code: '',
  currencyCode: 'NGN',
  currencySymbol: 'N',
};

const INITIAL_REGION_FORM: RegionForm = {
  name: '',
  code: '',
  states: [''],
};

const INITIAL_SUBSCRIPTION_SETTINGS_FORM = {
  trialEnabled: true,
  defaultTrialDays: 14,
  maxTrialExtensionDays: 14,
  gracePeriodDays: 3,
  dunningRetryCount: 3,
  oneTrialPerTenant: true
};

const INITIAL_PLAN_FORM = {
  name: '',
  code: '',
  baseFee: 25000,
  perShipmentFee: 50,
  isActive: true
};

export default function AdminConsolePage() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<AdminPageKey>('dashboard');
  const [currentFinancePage, setCurrentFinancePage] = useState<FinancePageKey>('revenue');
  const [financeOpen, setFinanceOpen] = useState(false);
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [data, setData] = useState<AdminTemplateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantForm, setTenantForm] = useState<TenantForm>(INITIAL_TENANT_FORM);
  const [inviteForm, setInviteForm] = useState<InviteForm>(INITIAL_INVITE_FORM);
  const [countryForm, setCountryForm] = useState<CountryForm>(INITIAL_COUNTRY_FORM);
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
  const [regionForm, setRegionForm] = useState<RegionForm>(INITIAL_REGION_FORM);
  const [regionCountryId, setRegionCountryId] = useState<number | null>(null);
  const [viewRegionId, setViewRegionId] = useState<number | null>(null);
  const [pendingRegionFocusId, setPendingRegionFocusId] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [selectedSettlementTenantId, setSelectedSettlementTenantId] = useState<number | null>(null);
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
  const [profilePasswordForm, setProfilePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState('');
  const [topbarFocused, setTopbarFocused] = useState(false);
  const [editingGeoType, setEditingGeoType] = useState<'region' | 'state' | 'station' | null>(null);
  const [editingGeoId, setEditingGeoId] = useState<number | null>(null);
  const [geoEditForm, setGeoEditForm] = useState({ name: '', code: '', parentId: 0 });
  const [countryMatrixForm, setCountryMatrixForm] = useState({ departureCountryId: 0, destinationCountryId: 0, zoneName: 'National', estimatedDays: 3 });
  const [localMatrixForm, setLocalMatrixForm] = useState({ departureStationId: 0, destinationStationId: 0, zoneName: 'Zone 1', estimatedHours: 12 });
  const [subscriptionSettingsForm, setSubscriptionSettingsForm] = useState(INITIAL_SUBSCRIPTION_SETTINGS_FORM);
  const [planForm, setPlanForm] = useState(INITIAL_PLAN_FORM);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [bulkTenantRows, setBulkTenantRows] = useState<BulkTenantImportRow[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportFileName, setBulkImportFileName] = useState('');
  const [bulkStationRows, setBulkStationRows] = useState<BulkStationImportRow[]>([]);
  const [bulkStationImporting, setBulkStationImporting] = useState(false);
  const [bulkStationFileName, setBulkStationFileName] = useState('');
  const [bulkLocalMatrixRows, setBulkLocalMatrixRows] = useState<BulkLocalMatrixImportRow[]>([]);
  const [bulkLocalMatrixImporting, setBulkLocalMatrixImporting] = useState(false);
  const [bulkLocalMatrixFileName, setBulkLocalMatrixFileName] = useState('');
  const toastTimerRef = useRef<number | null>(null);

  const pageTitle = useMemo(() => (currentPage === 'finance' ? adminConsoleFinanceTitles[currentFinancePage] : adminConsolePageTitles[currentPage]), [currentPage, currentFinancePage]);

  const pageHtml = useMemo(() => {
    if (!data) return '<div class="card"><div class="card-title">Loading data...</div></div>';
    if (currentPage === 'finance') return renderFinanceContent(currentFinancePage) || '';
    return renderAdminPage(currentPage) || '';
  }, [currentPage, currentFinancePage, data]);
  const tenantPlanOptions = useMemo(() => {
    const activePlans = (data?.subscription?.plans ?? [])
      .filter((p) => p.isActive)
      .map((p) => p.name)
      .filter((name): name is string => Boolean(name && name.trim()));
    return activePlans.length > 0 ? activePlans : ['Free Trial', 'Starter', 'Growth', 'Enterprise'];
  }, [data]);

  const topbarResults = useMemo(() => {
    const q = topbarSearch.toLowerCase().trim();
    if (!q || !data) return [];
    type SearchResult = { type: string; label: string; sub: string; page: AdminPageKey };
    const results: SearchResult[] = [];
    for (const t of data.tenants) {
      if (t.name.toLowerCase().includes(q) || (t.adminEmail ?? '').toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q) || (t.status ?? '').toLowerCase().includes(q)) {
        results.push({ type: 'Tenant', label: t.name, sub: t.adminEmail ?? t.subdomain, page: 'tenants' });
        if (results.length >= 8) break;
      }
    }
    for (const inv of data.invitations) {
      if (results.length >= 8) break;
      if (inv.email.toLowerCase().includes(q) || inv.company.toLowerCase().includes(q) || inv.status.toLowerCase().includes(q)) {
        results.push({ type: 'Invite', label: inv.company, sub: inv.email, page: 'invitations' });
      }
    }
    for (const c of data.countries) {
      if (results.length >= 8) break;
      if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
        results.push({ type: 'Country', label: c.name, sub: `${c.currencyCode} · ${c.regions.length} regions`, page: 'geography' });
      }
    }
    return results.slice(0, 8);
  }, [topbarSearch, data]);
  useEffect(() => {
    if (!tenantPlanOptions.includes(tenantForm.plan)) {
      const preferred = tenantPlanOptions.find((x) => x.toLowerCase() === 'free trial') ?? tenantPlanOptions[0] ?? 'Free Trial';
      setTenantForm((s) => ({ ...s, plan: preferred }));
    }
  }, [tenantPlanOptions, tenantForm.plan]);
  useEffect(() => {
    const country = (data?.countries ?? []).find((c) => c.name === tenantForm.country) ?? null;
    const states = (country?.regions ?? [])
      .flatMap((region) => region.states.map((state) => state.name))
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
    const nextState = states.includes(tenantForm.state) ? tenantForm.state : (states[0] ?? '');
    if (nextState !== tenantForm.state) {
      setTenantForm((s) => ({ ...s, state: nextState }));
    }
  }, [data?.countries, tenantForm.country, tenantForm.state]);
  useEffect(() => {
    if (tenantForm.dialCode) return;
    const nextDial = normalizeDialCode((data?.countries ?? []).find((c) => c.name === tenantForm.country)?.dialCode);
    if (nextDial) {
      setTenantForm((s) => ({ ...s, dialCode: nextDial }));
    }
  }, [data?.countries, tenantForm.country, tenantForm.dialCode]);

  const firstName = (user as { firstName?: string | null } | null)?.firstName?.trim() ?? '';
  const lastName = (user as { lastName?: string | null } | null)?.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || user?.fullName?.trim() || user?.name?.trim() || user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'Super Admin';
  const displayRole = user?.email || user?.role || 'root@cargomint.io';

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 2600);
  };

  const openNewTenantModal = () => {
    const fallbackCountry = (data?.countries ?? []).find((c) => c.name === 'Nigeria') ?? data?.countries?.[0] ?? null;
    const fallbackCountryName = fallbackCountry?.name ?? INITIAL_TENANT_FORM.country;
    const fallbackDialCode = normalizeDialCode(fallbackCountry?.dialCode) || '+234';
    const fallbackStates = (fallbackCountry?.regions ?? [])
      .flatMap((region) => region.states.map((state) => state.name))
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));

    setEditingTenantId(null);
    setTenantForm({
      ...INITIAL_TENANT_FORM,
      country: fallbackCountryName,
      state: fallbackStates[0] ?? '',
      dialCode: fallbackDialCode,
    });
    setOpenModal('newTenant');
  };

  const findRegionById = (regionId: number) => {
    for (const country of data?.countries ?? []) {
      const region = country.regions.find((x) => x.id === regionId);
      if (region) return { country, region };
    }
    return null;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const range = (params.get('range') || 'month').trim().toLowerCase();
      const fromUtc = (params.get('fromUtc') || '').trim();
      const toUtc = (params.get('toUtc') || '').trim();
      const queryParams = new URLSearchParams();
      queryParams.set('range', range);
      if (fromUtc) queryParams.set('fromUtc', fromUtc);
      if (toUtc) queryParams.set('toUtc', toUtc);

      const [dashboardRes, tenantsRes, invitationsRes, countriesRes, routeZonesLocalRes, routeZonesCountryRes, auditRes, revenueRes, billingRes, settlementsRes, merchantWalletsRes, tenantWalletsRes, gatewayRes, riskFlagsRes, subscriptionSettingsRes, subscriptionPlansRes, subscriptionTenantsRes] = await Promise.all([
        apiFetch(`/dashboard?${queryParams.toString()}`),
        apiFetch('/tenants'),
        apiFetch('/invitations'),
        apiFetch('/countries'),
        apiFetch('/geography/route-zones/local'),
        apiFetch('/geography/route-zones/country'),
        apiFetch('/audit-log?take=300'),
        apiFetch('/finance/revenue-summary'),
        apiFetch('/finance/billing'),
        apiFetch('/finance/settlements'),
        apiFetch('/finance/wallets/merchant'),
        apiFetch('/finance/wallets/tenant'),
        apiFetch('/finance/gateway-transactions'),
        apiFetch('/finance/risk-flags'),
        apiFetch('/subscription/settings'),
        apiFetch('/subscription/plans'),
        apiFetch('/subscription/tenants'),
        apiFetch('/stations'),
      ]);

      const dashboard = await dashboardRes.json();
      const tenants = await tenantsRes.json();
      const invitations = await invitationsRes.json();
      const countries = await countriesRes.json();
      const routeZonesLocal = await routeZonesLocalRes.json();
      const routeZonesCountry = await routeZonesCountryRes.json();
      const audit = await auditRes.json();
      const revenue = await revenueRes.json();
      const billing = await billingRes.json();
      const settlements = await settlementsRes.json();
      const merchantWallets = await merchantWalletsRes.json();
      const tenantWallets = await tenantWalletsRes.json();
      const gatewayTransactions = await gatewayRes.json();
      const riskFlags = await riskFlagsRes.json();
      const subscriptionSettings = await subscriptionSettingsRes.json();
      const subscriptionPlans = await subscriptionPlansRes.json();
      const subscriptionTenants = await subscriptionTenantsRes.json();
      const stationsData = await (await apiFetch('/stations')).json();

      const regionLists = await Promise.all(
        (countries as Array<{ id: number }>).map(async (c) => {
          const rr = await apiFetch(`/countries/${c.id}/regions`);
          const regions = await rr.json();
          const statesByRegion = await Promise.all(
            (regions as Array<{ id: number }>).map(async (r) => {
              const sr = await apiFetch(`/regions/${r.id}/states`);
              const states = await sr.json();
              return { regionId: r.id, states };
            })
          );
          return { countryId: c.id, regions, statesByRegion };
        })
      );

      const colorPalette = [
        { bg: 'rgba(62,166,255,0.15)', fg: '#8BCBFF' },
        { bg: 'rgba(35,134,54,0.16)', fg: '#8AE6A3' },
        { bg: 'rgba(137,87,229,0.16)', fg: '#C0A4FF' },
        { bg: 'rgba(245,158,11,0.16)', fg: '#F5C26B' },
      ];

      const mapped: AdminTemplateData = {
        dashboard: {
          totalTenants: dashboard.totalTenants ?? 0,
          activeTenants: dashboard.activeTenants ?? 0,
          suspendedTenants: dashboard.suspendedTenants ?? 0,
          totalShipments: dashboard.totalShipments ?? 0,
          platformGmv: dashboard.platformGmv ?? 0,
          platformRevenue: dashboard.platformRevenue ?? 0,
          needsReview: dashboard.needsReview ?? 0,
          recentTenants: (dashboard.recentTenants ?? []).map((t: { id: number; name: string; identifier: string; status: string }) => ({
            id: t.id,
            name: t.name,
            identifier: t.identifier,
            status: t.status,
            shipments: (dashboard.statsByTenant ?? []).find((s: { tenantName: string; shipmentCount: number }) => s.tenantName === t.name)?.shipmentCount ?? 0,
          })),
          statsByTenant: dashboard.statsByTenant ?? [],
        },
        tenants: (tenants ?? []).map((t: Record<string, unknown>, i: number) => {
          const color = colorPalette[i % colorPalette.length];
          return {
            id: Number(t.id),
            initials: String(t.initials ?? 'TN'),
            color: String(t.color ?? color.bg),
            textColor: String(t.textColor ?? color.fg),
            name: String(t.name ?? ''),
            subdomain: String(t.subdomain ?? ''),
            country: String(t.country ?? 'NG'),
            state: (t.state as string | null) ?? null,
            plan: String(t.plan ?? 'Starter'),
            shipments: Number(t.shipments ?? 0),
            gmv: Number(t.gmv ?? 0),
            status: String(t.status ?? 'active'),
            created: String(t.created ?? ''),
            adminEmail: (t.adminEmail as string | null) ?? null,
            adminPhone: (t.adminPhone as string | null) ?? null,
            notes: (t.notes as string | null) ?? null,
            type: (t.type as string | null) ?? null,
            contactPerson: (t.contactPerson as string | null) ?? null,
            address: (t.address as string | null) ?? null,
          };
        }),
        invitations: invitations ?? [],
        countries: (countries ?? []).map((c: Record<string, unknown>) => {
          const regionSource = regionLists.find((r) => r.countryId === Number(c.id));
          const regions = (regionSource?.regions ?? []).map((r: Record<string, unknown>) => {
            const states = regionSource?.statesByRegion.find((x) => x.regionId === Number(r.id))?.states ?? [];
            return {
              id: Number(r.id),
              name: String(r.name ?? ''),
              code: (r.code as string | null) ?? null,
              statesCount: Number(r.statesCount ?? states.length),
              states: (states as Array<Record<string, unknown>>).map((s) => ({
                id: Number(s.id),
                name: String(s.name ?? ''),
                code: (s.code as string | null) ?? null,
                isActive: Boolean(s.isActive ?? true),
                stations: (stationsData ?? []).filter((st: any) => st.stateId === Number(s.id)).map((st: any) => ({
                  id: st.id,
                  name: st.name,
                  code: st.code,
                  isActive: Boolean(st.isActive ?? true)
                }))
              })),
              isActive: Boolean(r.isActive ?? true),
            };
          });

          return {
            id: Number(c.id),
            code: String(c.code ?? '--'),
            name: String(c.name ?? ''),
            statesCount: Number(c.statesCount ?? 0),
            currencyCode: String(c.currencyCode ?? 'NGN'),
            currencySymbol: String(c.currencySymbol ?? 'N'),
            dialCode: String(c.dialCode ?? ''),
            isActive: Boolean(c.isActive ?? true),
            regions,
          };
        }),
        stations: (stationsData ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          stateId: s.stateId,
          stateName: s.stateName,
          countryId: s.countryId,
          countryName: s.countryName,
          isActive: Boolean(s.isActive ?? true),
        })),
        routeZones: {
          local: (routeZonesLocal ?? []).map((r: Record<string, unknown>) => ({
            id: Number(r.id ?? 0),
            departureStationName: String(r.departureStationName ?? ''),
            destinationStationName: String(r.destinationStationName ?? ''),
            zoneName: String(r.zoneName ?? ''),
            estimatedHoursOfArrival: Number(r.estimatedHoursOfArrival ?? 0),
          })),
          country: (routeZonesCountry ?? []).map((r: Record<string, unknown>) => ({
            id: Number(r.id ?? 0),
            departureCountryName: String(r.departureCountryName ?? ''),
            destinationCountryName: String(r.destinationCountryName ?? ''),
            zoneName: String(r.zoneName ?? ''),
            estimatedDaysOfArrival: Number(r.estimatedDaysOfArrival ?? 0),
          })),
        },
        audit: (audit ?? []).map((a: Record<string, unknown>) => ({
          time: String(a.time ?? ''),
          module: String(a.module ?? ''),
          recordId: String(a.recordId ?? ''),
          action: String(a.action ?? ''),
          detail: toReadableAuditDetail(a.detail),
          actor: String(a.actor ?? ''),
        })),
        finance: {
          platformRevenueLedger: Number(revenue.platformRevenueLedger ?? 0),
          perShipmentPlatformFees: Number(revenue.perShipmentPlatformFees ?? 0),
          codExposureAcrossTenants: Number(revenue.codExposureAcrossTenants ?? 0),
          failedSettlements: Number(revenue.failedSettlements ?? 0),
          pendingSettlements: Number(revenue.pendingSettlements ?? 0),
          blockedSettlements: Number(revenue.blockedSettlements ?? 0),
          completedSettlements: Number(revenue.completedSettlements ?? 0),
          tenantSubscriptionBilling: billing ?? [],
          tenantSettlementOverview: settlements ?? [],
          merchantWalletBalances: merchantWallets ?? [],
          tenantWalletBalances: tenantWallets ?? [],
          paymentGatewayTransactions: gatewayTransactions ?? [],
          financeRiskFlags: riskFlags ?? [],
        },
        subscription: {
          settings: {
            trialEnabled: Boolean(subscriptionSettings?.trialEnabled ?? true),
            defaultTrialDays: Number(subscriptionSettings?.defaultTrialDays ?? 14),
            maxTrialExtensionDays: Number(subscriptionSettings?.maxTrialExtensionDays ?? 14),
            gracePeriodDays: Number(subscriptionSettings?.gracePeriodDays ?? 3),
            dunningRetryCount: Number(subscriptionSettings?.dunningRetryCount ?? 3),
            oneTrialPerTenant: Boolean(subscriptionSettings?.oneTrialPerTenant ?? true),
          },
          plans: (subscriptionPlans ?? []).map((p: Record<string, unknown>) => ({
            id: Number(p.id),
            name: String(p.name ?? ''),
            code: String(p.code ?? ''),
            baseFee: Number(p.baseFee ?? 0),
            perShipmentFee: Number(p.perShipmentFee ?? 0),
            isActive: Boolean(p.isActive ?? true),
            version: Number(p.version ?? 1),
          })),
          tenants: (subscriptionTenants ?? []).map((s: Record<string, unknown>) => ({
            id: Number(s.id),
            tenantId: Number(s.tenantId),
            tenantName: String(s.tenantName ?? ''),
            plan: String(s.plan ?? ''),
            status: String(s.status ?? ''),
            billingCycle: String(s.billingCycle ?? ''),
            trialEndAtUtc: (s.trialEndAtUtc as string | null) ?? null,
            nextBillingAtUtc: (s.nextBillingAtUtc as string | null) ?? null,
            hasValidPaymentMethod: Boolean(s.hasValidPaymentMethod ?? false),
            billingAccessSuspended: Boolean(s.billingAccessSuspended ?? false),
          })),
        },
      };

      setData(mapped);
      setAdminTemplateData(mapped);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };


  const updateProfilePassword = async () => {
    if (!profilePasswordForm.currentPassword || !profilePasswordForm.newPassword) {
      return showToast('Please enter both current and new passwords.');
    }
    if (profilePasswordForm.newPassword !== profilePasswordForm.confirmPassword) {
      return showToast('New passwords do not match.');
    }
    if (profilePasswordForm.newPassword.length < 6) {
      return showToast('New password must be at least 6 characters.');
    }

    setProfileBusy(true);
    try {
      await apiFetch('/api/v1/Account/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: profilePasswordForm.currentPassword,
          newPassword: profilePasswordForm.newPassword,
        }),
      });

      showToast('Password updated successfully.');
      setProfilePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOpenModal(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update password.');
    } finally {
      setProfileBusy(false);
    }
  };

  const handleAdminAction = async (action: string, id?: number | string) => {
    try {
      if (action === 'viewTenant' || action === 'editTenant') {
        const tenant = data?.tenants.find((t) => t.id === id);
        if (!tenant) return;
        setEditingTenantId(tenant.id);
        setTenantForm({
          name: tenant.name,
          subdomain: tenant.subdomain,
          country: tenant.country,
          state: tenant.state ?? '',
          dialCode: normalizeDialCode(tenant.adminPhone ?? '') || normalizeDialCode((data?.countries ?? []).find((c) => c.name === tenant.country)?.dialCode) || '+234',
          plan: tenant.plan,
          temporaryPassword: '',
          adminEmail: tenant.adminEmail ?? '',
          adminPhone: tenant.adminPhone ?? '',
          notes: tenant.notes ?? '',
          type: tenant.type ?? 'Logistics',
          contactPerson: tenant.contactPerson ?? '',
          address: tenant.address ?? '',
        });
        setOpenModal('newTenant');
        return;
      }

      if (action === 'suspendTenant' && id) {
        await apiFetch(`/tenants/${id}/suspend`, { method: 'PUT', body: JSON.stringify({ reason: 'Manual super admin action' }) });
        showToast('Tenant suspended');
        await loadData();
        return;
      }

      if (action === 'reactivateTenant' && id) {
        await apiFetch(`/tenants/${id}/reactivate`, { method: 'PUT' });
        showToast('Tenant reactivated');
        await loadData();
        return;
      }

      if (action === 'forceActivateTenant' && id) {
        await apiFetch(`/tenants/${id}/force-activate`, { method: 'PUT' });
        showToast('Tenant onboarding force-activated');
        await loadData();
        return;
      }

      if (action === 'resendInvitation' && id) {
        const temporaryPassword = window.prompt('Temporary password (leave empty to auto-generate)', '') ?? '';
        await apiFetch(`/invitations/${id}/resend`, {
          method: 'POST',
          body: JSON.stringify({ temporaryPassword: temporaryPassword.trim() || null }),
        });
        showToast('Invitation resent');
        await loadData();
        return;
      }

      if (action === 'exportAudit') {
        await downloadFile('/audit-log/export', `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
        return;
      }

      if (action === 'exportTenants') {
        await downloadFile('/finance/reports/export', `tenants-finance-${new Date().toISOString().slice(0, 10)}.csv`);
        return;
      }

      if (action === 'openBulkImport') {
        setBulkTenantRows([]);
        setOpenModal('bulkTenantImport');
        return;
      }

      if (action === 'blockWallet' && id) {
        setSelectedWalletId(Number(id));
        setOpenModal('blockwallet');
        return;
      }

      if (action === 'unblockWallet' && id) {
        await apiFetch(`/finance/wallets/${id}/unblock`, { method: 'PUT', body: JSON.stringify({ reasonCode: 'MANUAL', note: 'Super admin unblock' }) });
        showToast('Wallet unblocked');
        await loadData();
        return;
      }

      if (action === 'freezeSettlement' && id) {
        setSelectedSettlementTenantId(Number(id));
        setOpenModal('freeze');
        return;
      }

      if (action === 'releaseSettlement' && id) {
        await apiFetch(`/finance/settlements/${id}/release`, { method: 'PUT', body: JSON.stringify({ reasonCode: 'MANUAL', note: 'Release settlement' }) });
        showToast('Settlement released');
        await loadData();
        return;
      }

      if (action === 'editCountry' && id) {
        const country = data?.countries.find((c) => c.id === id);
        if (!country) return;
        setEditingCountryId(country.id);
        setCountryForm({ name: country.name, code: country.code, currencyCode: country.currencyCode, currencySymbol: country.currencySymbol });
        setOpenModal('geo');
        return;
      }

      if (action === 'manageCountry' && id) {
        setRegionCountryId(Number(id));
        const country = data?.countries.find((c) => c.id === id);
        setViewRegionId(country?.regions[0]?.id ?? null);
        setRegionForm(INITIAL_REGION_FORM);
        setOpenModal('region');
        return;
      }

      if (action === 'addRegion') {
        const countries = data?.countries ?? [];
        if (countries.length === 0) {
          showToast('No country available. Create a country first.');
          return;
        }
        setRegionCountryId(countries[0].id);
        setViewRegionId(countries[0].regions[0]?.id ?? null);
        setRegionForm(INITIAL_REGION_FORM);
        setOpenModal('region');
        return;
      }

      if (action === 'editRegion' && id) {
        const hit = findRegionById(Number(id));
        if (!hit) return;
        
        // Find the country this region belongs to
        let parentCountryId = 0;
        for (const c of data?.countries ?? []) {
          if (c.regions.some(r => r.id === id)) {
            parentCountryId = c.id;
            break;
          }
        }

        setEditingGeoId(Number(id));
        setEditingGeoType('region');
        setRegionCountryId(parentCountryId);
        setRegionForm({
          name: hit.region.name,
          code: hit.region.code ?? '',
          states: hit.region.states.map(s => s.name).length > 0 
            ? hit.region.states.map(s => s.name) 
            : ['']
        });
        setOpenModal('region');
        return;
      }

      if (action === 'deleteCountry' && id) {
        await apiFetch(`/countries/${id}`, { method: 'DELETE' });
        showToast('Country deleted');
        await loadData();
        return;
      }

      if (action === 'toggleCountryStatus' && id) {
        const country = data?.countries.find(c => c.id === id);
        if (!country) return;
        await apiFetch(`/countries/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ 
            name: country.name, 
            code: country.code, 
            currencyCode: country.currencyCode, 
            currencySymbol: country.currencySymbol,
            isActive: !country.isActive 
          })
        });
        showToast(`Country ${country.isActive ? 'deactivated' : 'activated'}`);
        await loadData();
        return;
      }

      if (action === 'toggleStateStatus' && id) {
        let stateObj: any = null;
        for (const c of data?.countries ?? []) {
          for (const r of c.regions) {
            const s = r.states.find(x => x.id === id);
            if (s) { stateObj = s; break; }
          }
          if (stateObj) break;
        }
        if (!stateObj) return;
        await apiFetch(`/states/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: stateObj.name, code: stateObj.code, isActive: !stateObj.isActive })
        });
        showToast(`State ${stateObj.isActive ? 'deactivated' : 'activated'}`);
        await loadData();
        return;
      }

      if (action === 'toggleStationStatus' && id) {
        const station = data?.stations.find(s => s.id === id);
        if (!station) return;
        await apiFetch(`/stations/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ id: station.id, name: station.name, code: station.code, stateId: station.stateId, isActive: !station.isActive })
        });
        showToast(`Station ${station.isActive ? 'deactivated' : 'activated'}`);
        await loadData();
        return;
      }

      if (action === 'deleteState' && id) {
        await apiFetch(`/states/${id}`, { method: 'DELETE' });
        showToast('State deleted');
        await loadData();
        return;
      }

      if (action === 'editSubscriptionSettings') {
        const current = data?.subscription.settings;
        if (!current) return;
        setSubscriptionSettingsForm({
          trialEnabled: current.trialEnabled,
          defaultTrialDays: current.defaultTrialDays,
          maxTrialExtensionDays: current.maxTrialExtensionDays,
          gracePeriodDays: current.gracePeriodDays,
          dunningRetryCount: current.dunningRetryCount,
          oneTrialPerTenant: current.oneTrialPerTenant
        });
        setOpenModal('subscriptionSettings');
        return;
      }

      if (action === 'createSubscriptionPlan') {
        setEditingPlanId(null);
        setPlanForm(INITIAL_PLAN_FORM);
        setOpenModal('plan');
        return;
      }

      if (action === 'editSubscriptionPlan' && id) {
        const plan = data?.subscription.plans.find((x) => x.id === id);
        if (!plan) return;
        setEditingPlanId(plan.id);
        setPlanForm({
          name: plan.name,
          code: plan.code,
          baseFee: plan.baseFee,
          perShipmentFee: plan.perShipmentFee,
          isActive: plan.isActive
        });
        setOpenModal('plan');
        return;
      }

      if (action === 'pauseTenantSubscription' && id) {
        await apiFetch(`/api/v1/admin/subscription/tenants/${id}/pause`, { method: 'POST' });
        showToast('Tenant subscription paused');
        await loadData();
        return;
      }

      if (action === 'resumeTenantSubscription' && id) {
        await apiFetch(`/api/v1/admin/subscription/tenants/${id}/resume`, { method: 'POST' });
        showToast('Tenant subscription resumed');
        await loadData();
        return;
      }

      if (action === 'cancelTenantSubscription' && id) {
        const atPeriodEnd = (window.prompt('Cancel at period end? (yes/no)', 'yes') ?? '').toLowerCase().startsWith('y');
        await apiFetch(`/api/v1/admin/subscription/tenants/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ atPeriodEnd }),
        });
        showToast('Tenant subscription cancel request saved');
        await loadData();
        return;
      }

      if (action === 'extendTenantTrial' && id) {
        const extensionDays = Number(window.prompt('Extension days', '7') ?? '7');
        await apiFetch(`/api/v1/admin/subscription/tenants/${id}/trial/extend`, {
          method: 'POST',
          body: JSON.stringify({ extensionDays }),
        });
        showToast('Tenant trial extended');
        await loadData();
        return;
      }

      if (action === 'triggerJob' && id) {
        if (!window.confirm(`Trigger background job ${id}?`)) return;
        await apiFetch(`/api/v1/admin/subscription/jobs/${id}/trigger`, { method: 'POST' });
        showToast(`Job ${id} queued for immediate execution`);
        return;
      }

      if (action === 'clearCache') {
        showToast('System cache cleared');
        return;
      }

      if (action === 'newStation') {
        const name = window.prompt('Station name', '');
        if (!name) return;
        const code = window.prompt('Station code', name.slice(0, 3).toUpperCase()) ?? '';
        const stateId = Number(window.prompt('State ID', '1') ?? '1');
        await apiFetch('/stations', {
          method: 'POST',
          body: JSON.stringify({ name, code, stateId }),
        });
        showToast('Station created');
        await loadData();
        return;
      }

      if (action === 'editStation' && id) {
        const station = data?.stations.find((s) => s.id === id);
        if (!station) return;
        setEditingGeoType('station');
        setEditingGeoId(Number(id));
        setGeoEditForm({ name: station.name, code: station.code, parentId: station.stateId });
        setOpenModal('geoEdit');
        return;
      }

      if (action === 'editState' && id) {
        let stateObj: any = null;
        for (const c of data?.countries ?? []) {
          for (const r of c.regions) {
            const s = r.states.find(x => x.id === id);
            if (s) { stateObj = s; break; }
          }
          if (stateObj) break;
        }
        if (!stateObj) return;
        setEditingGeoType('state');
        setEditingGeoId(Number(id));
        setGeoEditForm({ name: stateObj.name, code: stateObj.code ?? '', parentId: 0 });
        setOpenModal('geoEdit');
        return;
      }

      if (action === 'deleteStation' && id) {
        if (!window.confirm('Delete this station?')) return;
        await apiFetch(`/stations/${id}`, { method: 'DELETE' });
        showToast('Station deleted');
        await loadData();
        return;
      }

      if (action === 'filterLocalMatrix') {
        window.applyLocalMatrixFilter?.();
        return;
      }

      if (action === 'clearLocalMatrixFilter') {
        const depEl = document.getElementById('filter-departure') as HTMLSelectElement;
        const destEl = document.getElementById('filter-destination') as HTMLSelectElement;
        if (depEl) depEl.value = '';
        if (destEl) destEl.value = '';
        window.applyLocalMatrixFilter?.();
        return;
      }

      if (action === 'newRouteMap') {
        setLocalMatrixForm({
          departureStationId: data?.stations[0]?.id ?? 0,
          destinationStationId: data?.stations[0]?.id ?? 0,
          zoneName: 'Zone 1',
          estimatedHours: 12
        });
        setOpenModal('localMatrix');
        return;
      }

      if (action === 'editLocalMatrix' && id) {
        const mapping = data?.routeZones.local?.find(m => m.id === id);
        if (!mapping) return;
        const depStation = data?.stations.find(s => s.name === mapping.departureStationName);
        const destStation = data?.stations.find(s => s.name === mapping.destinationStationName);
        setLocalMatrixForm({
          departureStationId: depStation?.id ?? 0,
          destinationStationId: destStation?.id ?? 0,
          zoneName: mapping.zoneName,
          estimatedHours: mapping.estimatedHoursOfArrival
        });
        setOpenModal('localMatrix');
        return;
      }

      if (action === 'deleteLocalMatrix' && id) {
        if (!window.confirm('Delete this route zone mapping?')) return;
        await apiFetch(`/geography/route-zones/local/${id}`, { method: 'DELETE' });
        showToast('Route mapping deleted');
        await loadData();
        return;
      }

      if (action === 'newCountryRouteMap') {
        setCountryMatrixForm({
          departureCountryId: data?.countries[0]?.id ?? 0,
          destinationCountryId: data?.countries[1]?.id ?? data?.countries[0]?.id ?? 0,
          zoneName: 'National',
          estimatedDays: 3
        });
        setOpenModal('countryMatrix');
        return;
      }

      if (action === 'deleteCountryMatrix' && id) {
        if (!window.confirm('Delete this country route zone mapping?')) return;
        await apiFetch(`/geography/route-zones/country/${id}`, { method: 'DELETE' });
        showToast('Country route mapping deleted');
        await loadData();
        return;
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const submitTenant = async () => {
    try {
      const body = JSON.stringify({
        name: tenantForm.name,
        identifier: tenantForm.subdomain,
        adminEmail: tenantForm.adminEmail,
        country: tenantForm.country,
        state: tenantForm.state,
        plan: tenantForm.plan,
        temporaryPassword: tenantForm.temporaryPassword.trim() || null,
        adminPhone: tenantForm.adminPhone,
        notes: tenantForm.notes,
        type: tenantForm.type,
        contactPerson: tenantForm.contactPerson,
        address: tenantForm.address,
      });

      if (editingTenantId) {
        await apiFetch(`/tenants/${editingTenantId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: tenantForm.name,
            country: tenantForm.country,
            state: tenantForm.state,
            plan: tenantForm.plan,
            adminEmail: tenantForm.adminEmail,
            adminPhone: tenantForm.adminPhone,
            notes: tenantForm.notes,
            type: tenantForm.type,
            contactPerson: tenantForm.contactPerson,
            address: tenantForm.address,
          }),
        });
        showToast('Tenant updated');
      } else {
        const createResponse = await apiFetch('/tenants', { method: 'POST', body });
        const raw = await createResponse.text();
        let created: {
          tenantId?: number;
          adminEmail?: string;
          temporaryPassword?: string;
          invitationEmailSent?: boolean;
          invitationEmailError?: string;
        } = {};

        if (raw.trim()) {
          try {
            created = JSON.parse(raw) as {
              tenantId?: number;
              adminEmail?: string;
              temporaryPassword?: string;
              invitationEmailSent?: boolean;
              invitationEmailError?: string;
            };
          } catch {
            // Keep create success even when response body is not JSON.
          }
        }

        const credentialEmail = created.adminEmail || tenantForm.adminEmail;
        const credentialPassword = created.temporaryPassword || tenantForm.temporaryPassword.trim();
        const invitationEmailSent = created.invitationEmailSent ?? true;
        if (invitationEmailSent) {
          showToast(`Tenant created. Login: ${credentialEmail} | Temp password: ${credentialPassword}`);
        } else {
          showToast(`Tenant created. Invite email not sent: ${created.invitationEmailError ?? 'Sender/domain not verified.'}`);
        }
      }

      setOpenModal(null);
      setEditingTenantId(null);
      setTenantForm(INITIAL_TENANT_FORM);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save tenant');
    }
  };

  const submitInvite = async () => {
    setOpenModal(null);
    setTenantForm({
      ...INITIAL_TENANT_FORM,
      name: inviteForm.company,
      subdomain: inviteForm.company.toLowerCase().replace(/\s+/g, '-'),
      adminEmail: inviteForm.email,
      plan: inviteForm.plan,
    });
    setInviteForm(INITIAL_INVITE_FORM);
    setEditingTenantId(null);
    setOpenModal('newTenant');
  };

  const normalizeIdentifier = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const parseBulkCell = (row: Record<string, unknown>, keys: string[], fallback = '') => {
    for (const key of keys) {
      const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey) {
        const val = String(row[foundKey] ?? '').trim();
        if (val) return val;
      }
    }
    return fallback;
  };

  const parseStationBulkCell = (row: Record<string, unknown>, keys: string[], fallback = '') => {
    for (const key of keys) {
      const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey) {
        const val = String(row[foundKey] ?? '').trim();
        if (val) return val;
      }
    }
    return fallback;
  };

  const parseLocalMatrixCell = (row: Record<string, unknown>, keys: string[], fallback = '') => {
    for (const key of keys) {
      const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey) {
        const val = String(row[foundKey] ?? '').trim();
        if (val) return val;
      }
    }
    return fallback;
  };

  const handleBulkFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setBulkImportFileName(file.name);
      let rawRows: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text) as { tenants?: Record<string, unknown>[] } | Record<string, unknown>[];
        rawRows = Array.isArray(parsed) ? parsed : (parsed.tenants ?? []);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          showToast('No sheet found in uploaded file.');
          return;
        }
        const loweredCandidates = wb.SheetNames.map((name) => name.toLowerCase());
        const preferredIndex = loweredCandidates.findIndex((name) => name.includes('route') || name.includes('matrix'));
        const selectedSheetName = preferredIndex >= 0 ? wb.SheetNames[preferredIndex] : firstSheetName;
        const sheet = wb.Sheets[selectedSheetName];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      }

      const mapped = rawRows
        .map((row) => {
          const company = parseBulkCell(row, ['company', 'name']);
          const name = parseBulkCell(row, ['name', 'company']);
          const identifierSource = parseBulkCell(row, ['identifier', 'subdomain'], name);
          return {
            company: company || name,
            name,
            identifier: normalizeIdentifier(identifierSource),
            adminEmail: parseBulkCell(row, ['adminemail', 'email']),
            country: parseBulkCell(row, ['country'], 'Nigeria'),
            state: parseBulkCell(row, ['state']),
            plan: parseBulkCell(row, ['plan'], 'Free Trial'),
            adminPhone: parseBulkCell(row, ['adminphone', 'phone']),
            notes: parseBulkCell(row, ['notes']),
            temporaryPassword: parseBulkCell(row, ['temporarypassword', 'tempPassword'], ''),
            type: parseBulkCell(row, ['type'], 'Logistics'),
            contactPerson: parseBulkCell(row, ['contactperson', 'contact']),
            address: parseBulkCell(row, ['address']),
          } satisfies BulkTenantImportRow;
        })
        .filter((x) => x.name && x.identifier && x.adminEmail);

      setBulkTenantRows(mapped);
      showToast(`Parsed ${mapped.length} valid rows for preview.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to parse bulk import file.');
    }
  };

  const submitBulkImport = async () => {
    if (bulkTenantRows.length === 0 || bulkImporting) return;
    setBulkImporting(true);
    try {
      let success = 0;
      let failed = 0;
      for (const row of bulkTenantRows) {
        try {
          await apiFetch('/tenants', {
            method: 'POST',
            body: JSON.stringify({
              name: row.name,
              identifier: row.identifier,
              adminEmail: row.adminEmail,
              country: row.country,
              state: row.state,
              plan: row.plan,
              adminPhone: row.adminPhone,
              notes: row.notes,
              temporaryPassword: row.temporaryPassword || null,
              type: row.type,
              contactPerson: row.contactPerson,
              address: row.address,
            }),
          });
          success++;
        } catch {
          failed++;
        }
      }

      showToast(`Bulk import finished. ${success} succeeded, ${failed} failed.`);
      setBulkTenantRows([]);
      setOpenModal(null);
      await loadData();
    } finally {
      setBulkImporting(false);
    }
  };

  const downloadBulkSampleExcel = () => {
    const sampleRows: BulkTenantImportRow[] = [
      { company: 'StarShip NG', name: 'StarShip NG', identifier: 'starship-ng', adminEmail: 'admin@starshipng.com', country: 'Nigeria', state: 'Lagos', plan: 'Growth', adminPhone: '+2348010000001', notes: 'High-volume Lagos mainland routes.', temporaryPassword: 'Temp@Starship001', type: 'Logistics', contactPerson: 'Amina Yusuf', address: '12 Marina Road, Lagos Island, Lagos' },
      { company: 'CargoQuest Logistics', name: 'CargoQuest Logistics', identifier: 'cargoquest-ng', adminEmail: 'admin@cargoquest.ng', country: 'Nigeria', state: 'Oyo', plan: 'Starter', adminPhone: '+2348010000002', notes: 'SME parcel operations across South West.', temporaryPassword: 'Temp@CargoQuest002', type: 'Logistics', contactPerson: 'Tunde Balogun', address: '45 Ring Road, Ibadan, Oyo' },
      { company: 'Kola Freight Lines', name: 'Kola Freight Lines', identifier: 'kola-freight', adminEmail: 'admin@kolafreight.com', country: 'Nigeria', state: 'Rivers', plan: 'Enterprise', adminPhone: '+2348010000003', notes: 'Enterprise B2B contracts and COD handling.', temporaryPassword: 'Temp@Kola003', type: 'Logistics', contactPerson: 'Kola Adebiyi', address: '8 GRA Phase 2, Port Harcourt, Rivers' },
      { company: 'SwiftLane Dispatch', name: 'SwiftLane Dispatch', identifier: 'swiftlane-ng', adminEmail: 'admin@swiftlane.ng', country: 'Nigeria', state: 'Federal Capital Territory', plan: 'Growth', adminPhone: '+2348010000004', notes: 'Focused on Abuja metro same-day delivery.', temporaryPassword: 'Temp@Swift004', type: 'Logistics', contactPerson: 'Halima Danjuma', address: '22 Ademola Adetokunbo Crescent, Wuse 2, Abuja' },
      { company: 'PrimeHaul Africa', name: 'PrimeHaul Africa', identifier: 'primehaul-ng', adminEmail: 'admin@primehaul.africa', country: 'Nigeria', state: 'Kano', plan: 'Enterprise', adminPhone: '+2348010000005', notes: 'North-West corridor linehaul operations.', temporaryPassword: 'Temp@Prime005', type: 'Logistics', contactPerson: 'Usman Garba', address: '14 Murtala Muhammed Way, Kano, Kano' },
      { company: 'NovaParcel Express', name: 'NovaParcel Express', identifier: 'novaparcel-ng', adminEmail: 'admin@novaparcel.ng', country: 'Nigeria', state: 'Enugu', plan: 'Starter', adminPhone: '+2348010000006', notes: 'Low-cost urban parcel network.', temporaryPassword: 'Temp@Nova006', type: 'Logistics', contactPerson: 'Ifeoma Nnadi', address: '3 Okpara Avenue, Enugu, Enugu' },
      { company: 'GreenRoute Logistics', name: 'GreenRoute Logistics', identifier: 'greenroute-ng', adminEmail: 'admin@greenroute.ng', country: 'Nigeria', state: 'Abia', plan: 'Growth', adminPhone: '+2348010000007', notes: 'Eco-optimized routing pilot for e-commerce.', temporaryPassword: 'Temp@Green007', type: 'Logistics', contactPerson: 'Emeka Okonkwo', address: '31 Aba Road, Umuahia, Abia' },
      { company: 'ApexCargo Services', name: 'ApexCargo Services', identifier: 'apexcargo-ng', adminEmail: 'admin@apexcargo.ng', country: 'Nigeria', state: 'Edo', plan: 'Enterprise', adminPhone: '+2348010000008', notes: 'Interstate heavy parcel and pallet movement.', temporaryPassword: 'Temp@Apex008', type: 'Logistics', contactPerson: 'Bisi Adewale', address: '60 Akpakpava Road, Benin City, Edo' },
      { company: 'BlueTrack Couriers', name: 'BlueTrack Couriers', identifier: 'bluetrack-ng', adminEmail: 'admin@bluetrack.ng', country: 'Nigeria', state: 'Imo', plan: 'Starter', adminPhone: '+2348010000009', notes: 'Campus and SME courier services.', temporaryPassword: 'Temp@Blue009', type: 'Logistics', contactPerson: 'Chidinma Eze', address: '9 Douglas Road, Owerri, Imo' },
      { company: 'Unity Freight Network', name: 'Unity Freight Network', identifier: 'unityfreight-ng', adminEmail: 'admin@unityfreight.ng', country: 'Nigeria', state: 'Kwara', plan: 'Growth', adminPhone: '+2348010000010', notes: 'Regional hub-and-spoke operations in North Central.', temporaryPassword: 'Temp@Unity010', type: 'Logistics', contactPerson: 'Musa Ibrahim', address: '17 Ahmadu Bello Way, Ilorin, Kwara' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BulkImportSample');
    XLSX.writeFile(workbook, 'tenant-bulk-import-sample.xlsx');
  };

  const normalizeStationCode = (name: string, index: number) => {
    const compact = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = compact.slice(0, 6) || 'STN';
    return `${prefix}${String(index + 1).padStart(3, '0')}`;
  };

  const handleStationBulkFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setBulkStationFileName(file.name);
      let rawRows: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text) as { stations?: Record<string, unknown>[] } | Record<string, unknown>[];
        rawRows = Array.isArray(parsed) ? parsed : (parsed.stations ?? []);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          showToast('No sheet found in uploaded file.');
          return;
        }
        const sheet = wb.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      }

      const mapped = rawRows
        .map((row, index) => {
          const stationName = parseStationBulkCell(row, ['stationName', 'station', 'name']);
          const stateName = parseStationBulkCell(row, ['stateName', 'state']);
          const countryName = parseStationBulkCell(row, ['countryName', 'country'], 'Nigeria');
          const code = parseStationBulkCell(row, ['code'], normalizeStationCode(stationName, index));
          return { stationName, code, stateName, countryName } satisfies BulkStationImportRow;
        })
        .filter((x) => x.stationName && x.stateName);

      setBulkStationRows(mapped);
      showToast(`Parsed ${mapped.length} station rows for preview.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to parse station import file.');
    }
  };

  const submitStationBulkImport = async () => {
    if (bulkStationRows.length === 0 || bulkStationImporting) return;
    if (!data?.countries?.length) {
      showToast('Country/state map is not loaded yet. Refresh and try again.');
      return;
    }
    setBulkStationImporting(true);
    try {
      const countryStateMap = new Map<string, Map<string, number>>();
      for (const country of data.countries) {
        const stateMap = new Map<string, number>();
        for (const region of country.regions) {
          for (const state of region.states) {
            stateMap.set(state.name.trim().toLowerCase(), state.id);
          }
        }
        countryStateMap.set(country.name.trim().toLowerCase(), stateMap);
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      for (const row of bulkStationRows) {
        const countryKey = row.countryName.trim().toLowerCase();
        const stateKey = row.stateName.trim().toLowerCase();
        const states = countryStateMap.get(countryKey) ?? countryStateMap.get('nigeria');
        const stateId = states?.get(stateKey);
        if (!stateId) {
          failed++;
          errors.push(`${row.stationName}: state "${row.stateName}" not found`);
          continue;
        }
        try {
          await apiFetch('/stations', {
            method: 'POST',
            body: JSON.stringify({ name: row.stationName, code: row.code, stateId }),
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`${row.stationName}: ${error instanceof Error ? error.message : 'create failed'}`);
        }
      }
      const errorPreview = errors.slice(0, 3).join(' | ');
      showToast(`Station import finished. ${success} created, ${failed} failed.${errorPreview ? ` ${errorPreview}` : ''}`);
      if (success > 0) {
        setBulkStationRows([]);
        setOpenModal(null);
        await loadData();
      }
    } finally {
      setBulkStationImporting(false);
    }
  };

  const downloadStationSampleExcel = () => {
    const sampleRows: BulkStationImportRow[] = [
      { stationName: 'Ikeja', code: 'LAG-IKEJA', stateName: 'Lagos', countryName: 'Nigeria' },
      { stationName: 'Lekki', code: 'LAG-LEKKI', stateName: 'Lagos', countryName: 'Nigeria' },
      { stationName: 'Yaba', code: 'LAG-YABA', stateName: 'Lagos', countryName: 'Nigeria' },
      { stationName: 'Wuse', code: 'FCT-WUSE', stateName: 'Federal Capital Territory', countryName: 'Nigeria' },
      { stationName: 'Port Harcourt', code: 'RIV-PHC', stateName: 'Rivers', countryName: 'Nigeria' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StationImportSample');
    XLSX.writeFile(workbook, 'station-bulk-import-sample.xlsx');
  };

  const handleLocalMatrixBulkFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setBulkLocalMatrixFileName(file.name);
      let rawRows: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text) as { mappings?: Record<string, unknown>[] } | Record<string, unknown>[];
        rawRows = Array.isArray(parsed) ? parsed : (parsed.mappings ?? []);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          showToast('No sheet found in uploaded file.');
          return;
        }
        const sheet = wb.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      }

      const mapped = rawRows
        .map((row) => {
          const departureStationName = parseLocalMatrixCell(row, ['departureStationName', 'originStation', 'origin', 'fromStation', 'departure']);
          const destinationStationName = parseLocalMatrixCell(row, ['destinationStationName', 'destinationStation', 'destination', 'toStation', 'to']);
          const zoneName = parseLocalMatrixCell(row, ['zoneName', 'zone'], 'Zone 4');
          const eta = Number(parseLocalMatrixCell(row, ['estimatedHoursOfArrival', 'etaHours', 'eta'], '24'));
          return {
            departureStationName,
            destinationStationName,
            zoneName,
            estimatedHoursOfArrival: Number.isFinite(eta) && eta > 0 ? eta : 24,
          } satisfies BulkLocalMatrixImportRow;
        })
        .filter((x) => x.departureStationName && x.destinationStationName && x.zoneName);

      setBulkLocalMatrixRows(mapped);
      showToast(`Parsed ${mapped.length} local route rows for preview.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to parse local matrix file.');
    }
  };

  const submitLocalMatrixBulkImport = async () => {
    if (bulkLocalMatrixRows.length === 0 || bulkLocalMatrixImporting) return;
    if (!data?.stations?.length) {
      showToast('Stations are not loaded yet. Refresh and try again.');
      return;
    }

    setBulkLocalMatrixImporting(true);
    try {
      const stationLookup = new Map<string, number>();
      for (const st of data.stations) {
        stationLookup.set(st.name.trim().toLowerCase(), st.id);
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      for (const row of bulkLocalMatrixRows) {
        const depId = stationLookup.get(row.departureStationName.trim().toLowerCase());
        const destId = stationLookup.get(row.destinationStationName.trim().toLowerCase());
        if (!depId || !destId) {
          failed++;
          errors.push(`${row.departureStationName} -> ${row.destinationStationName}: station not found`);
          continue;
        }

        try {
          await apiFetch('/geography/route-zones/local', {
            method: 'POST',
            body: JSON.stringify({
              departureStationId: depId,
              destinationStationId: destId,
              zoneName: row.zoneName,
              estimatedHoursOfArrival: row.estimatedHoursOfArrival,
            }),
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`${row.departureStationName} -> ${row.destinationStationName}: ${error instanceof Error ? error.message : 'failed'}`);
        }
      }

      const errorPreview = errors.slice(0, 3).join(' | ');
      showToast(`Local matrix import finished. ${success} saved, ${failed} failed.${errorPreview ? ` ${errorPreview}` : ''}`);
      if (success > 0) {
        setBulkLocalMatrixRows([]);
        setOpenModal(null);
        await loadData();
      }
    } finally {
      setBulkLocalMatrixImporting(false);
    }
  };

  const downloadLocalMatrixSampleExcel = () => {
    const sampleRows: BulkLocalMatrixImportRow[] = [
      { departureStationName: 'Ikeja', destinationStationName: 'Lekki', zoneName: 'Zone 1', estimatedHoursOfArrival: 4 },
      { departureStationName: 'Ikeja', destinationStationName: 'Wuse', zoneName: 'Zone 4', estimatedHoursOfArrival: 24 },
      { departureStationName: 'Wuse', destinationStationName: 'Kano Central', zoneName: 'Zone 2', estimatedHoursOfArrival: 12 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LocalRouteZoneSample');
    XLSX.writeFile(workbook, 'local-route-zone-import-sample.xlsx');
  };

  const submitCountry = async () => {
    try {
      if (editingCountryId) {
        await apiFetch(`/countries/${editingCountryId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: countryForm.name,
            code: countryForm.code,
            currencyCode: countryForm.currencyCode,
            currencySymbol: countryForm.currencySymbol,
            isActive: true,
          }),
        });
      } else {
        await apiFetch('/countries', {
          method: 'POST',
          body: JSON.stringify({
            name: countryForm.name,
            code: countryForm.code,
            currencyCode: countryForm.currencyCode,
            currencySymbol: countryForm.currencySymbol,
          }),
        });
      }
      setOpenModal(null);
      setEditingCountryId(null);
      setCountryForm(INITIAL_COUNTRY_FORM);
      showToast(editingCountryId ? 'Country updated' : 'Country added');
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create country');
    }
  };

  const submitPlan = async () => {
    try {
      if (!planForm.name || !planForm.code) {
        showToast('Name and code are required');
        return;
      }
      await apiFetch('/api/v1/admin/subscription/plans', {
        method: 'POST',
        body: JSON.stringify({ id: editingPlanId, ...planForm }),
      });
      showToast(editingPlanId ? 'Subscription plan updated' : 'Subscription plan created');
      setOpenModal(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const submitRegion = async () => {
    try {
      if (!regionCountryId) {
        showToast('Select a country first');
        return;
      }
      if (!regionForm.name.trim()) {
        showToast('Region name is required');
        return;
      }

      let targetRegionId = 0;
      const isEditing = editingGeoId && editingGeoType === 'region';

      if (isEditing) {
        // Update existing region
        await apiFetch(`/regions/${editingGeoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: regionForm.name.trim(),
            code: regionForm.code.trim() || null,
            isActive: true,
          }),
        });
        targetRegionId = editingGeoId;
        showToast('Region updated');
      } else {
        // Create new region
        const regionResponse = await apiFetch(`/countries/${regionCountryId}/regions`, {
          method: 'POST',
          body: JSON.stringify({
            countryId: regionCountryId,
            name: regionForm.name.trim(),
            code: regionForm.code.trim() || null,
          }),
        });
        const regionResult = await regionResponse.json() as { regionId?: number; RegionId?: number };
        targetRegionId = regionResult.regionId ?? regionResult.RegionId ?? 0;
        showToast('Region and states added');
      }

      const states = regionForm.states.map((x) => x.trim()).filter(Boolean);
      if (targetRegionId && states.length > 0) {
        // Find existing state names to avoid duplicates if editing
        const existingStateNames = isEditing 
          ? (findRegionById(targetRegionId)?.region.states.map(s => s.name.toLowerCase()) ?? [])
          : [];

        for (const stateName of states) {
          if (!existingStateNames.includes(stateName.toLowerCase())) {
            await apiFetch(`/regions/${targetRegionId}/states`, {
              method: 'POST',
              body: JSON.stringify({ regionId: targetRegionId, name: stateName, code: null }),
            });
          }
        }
      }

      setRegionForm(INITIAL_REGION_FORM);
      setEditingGeoId(null);
      setEditingGeoType(null);
      setPendingRegionFocusId(targetRegionId || null);
      setOpenModal(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create region');
    }
  };

  const submitGeoEdit = async () => {
    try {
      if (!editingGeoType || !editingGeoId) return;

      if (editingGeoType === 'region') {
        const hit = findRegionById(editingGeoId);
        await apiFetch(`/regions/${editingGeoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: geoEditForm.name,
            code: geoEditForm.code || null,
            isActive: hit?.region.isActive ?? true,
          }),
        });
        showToast('Region updated');
      } else if (editingGeoType === 'state') {
        let stateObj: any = null;
        for (const c of data?.countries ?? []) {
          for (const r of c.regions) {
            const s = r.states.find(x => x.id === editingGeoId);
            if (s) { stateObj = s; break; }
          }
          if (stateObj) break;
        }
        await apiFetch(`/states/${editingGeoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: geoEditForm.name,
            code: geoEditForm.code || null,
            isActive: stateObj?.isActive ?? true,
          }),
        });
        showToast('State updated');
      } else if (editingGeoType === 'station') {
        await apiFetch(`/stations/${editingGeoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            id: editingGeoId,
            name: geoEditForm.name,
            code: geoEditForm.code,
            stateId: geoEditForm.parentId,
          }),
        });
        showToast('Station updated');
      }

      setOpenModal(null);
      setEditingGeoType(null);
      setEditingGeoId(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const submitCountryMatrix = async () => {
    try {
      if (countryMatrixForm.departureCountryId === 0 || countryMatrixForm.destinationCountryId === 0) {
        showToast('Please select both countries');
        return;
      }
      await apiFetch('/geography/route-zones/country', {
        method: 'POST',
        body: JSON.stringify({
          departureCountryId: countryMatrixForm.departureCountryId,
          destinationCountryId: countryMatrixForm.destinationCountryId,
          zoneName: countryMatrixForm.zoneName,
          estimatedDaysOfArrival: countryMatrixForm.estimatedDays
        }),
      });
      showToast('Country matrix mapping saved');
      setOpenModal(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save country matrix');
    }
  };

  const submitLocalMatrix = async () => {
    try {
      if (localMatrixForm.departureStationId === 0 || localMatrixForm.destinationStationId === 0) {
        showToast('Please select both stations');
        return;
      }
      await apiFetch('/geography/route-zones/local', {
        method: 'POST',
        body: JSON.stringify({
          departureStationId: localMatrixForm.departureStationId,
          destinationStationId: localMatrixForm.destinationStationId,
          zoneName: localMatrixForm.zoneName,
          estimatedHoursOfArrival: localMatrixForm.estimatedHours
        }),
      });
      showToast('Route mapping saved');
      setOpenModal(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save local route mapping');
    }
  };

  const submitSubscriptionSettings = async () => {
    try {
      await apiFetch('/subscription/settings', {
        method: 'PUT',
        body: JSON.stringify(subscriptionSettingsForm),
      });
      showToast('Subscription policies updated');
      setOpenModal(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update subscription policies');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refetch on focus/visibility intentionally disabled to prevent
  // disruptive dashboard reloads while navigating between pages.

  useEffect(() => {
    if (!pendingRegionFocusId || !data?.countries) return;
    for (const country of data.countries) {
      const hit = country.regions.find((x) => x.id === pendingRegionFocusId);
      if (hit) {
        setRegionCountryId(country.id);
        setViewRegionId(hit.id);
        setPendingRegionFocusId(null);
        return;
      }
    }
  }, [data, pendingRegionFocusId]);

  useEffect(() => {
    window.showPage = (page: string) => {
      if (page.startsWith('finance-')) {
        setCurrentFinancePage(page.replace('finance-', '') as FinancePageKey);
        setCurrentPage('finance');
        setFinanceOpen(true);
        return;
      }
      setCurrentPage(page as AdminPageKey);
    };

    window.showFinance = (page: string) => {
      setCurrentFinancePage(page as FinancePageKey);
      setCurrentPage('finance');
      setFinanceOpen(true);
    };

    window.openModal = (id: string) => {
      if (id === 'newTenant') {
        openNewTenantModal();
        return;
      }
      if (id === 'geo') {
        setEditingCountryId(null);
        setCountryForm(INITIAL_COUNTRY_FORM);
      }
      if (id === 'region') {
        const firstCountry = data?.countries[0];
        setRegionCountryId(firstCountry?.id ?? null);
        setViewRegionId(firstCountry?.regions[0]?.id ?? null);
        setRegionForm(INITIAL_REGION_FORM);
      }
      setOpenModal(id as ModalId);
    };
    window.closeModal = () => setOpenModal(null);
    window.toast = showToast;
    window.doCreate = submitTenant;
    window.adminAction = (action: string, id?: number | string) => {
      void handleAdminAction(action, id);
    };
    window.doGeoEdit = submitGeoEdit;
    window.doPlan = submitPlan;
    window.doCountryMatrix = submitCountryMatrix;
    window.doLocalMatrix = submitLocalMatrix;
    window.doSubscriptionSettings = submitSubscriptionSettings;
    
    window.setAdminDashboardRange = (range: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set('range', range);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      void loadData();
    };

    window.exportAdminDashboard = () => {
      const d = data?.dashboard;
      if (!d) return showToast('No dashboard data to export.');
      const csv = [
        ['Metric', 'Value'],
        ['Total Tenants', d.totalTenants],
        ['Active Tenants', d.activeTenants],
        ['Platform GMV (NGN)', d.platformGmv],
        ['Platform Revenue (NGN)', d.platformRevenue],
        ['Total Shipments', d.totalShipments],
        ['Active Captains', d.activeCaptains],
        ['Range', d.range],
      ].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-summary-${d.range}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Dashboard summary exported');
    };
    
    window.setCurrentFinancePage = (page: string) => {
      setCurrentFinancePage(page as FinancePageKey);
      setCurrentPage('finance');
      setFinanceOpen(true);
    };
    
    window.applyLocalMatrixFilter = () => {
      const dep = (document.getElementById('filter-departure') as HTMLSelectElement)?.value.toLowerCase() || '';
      const dest = (document.getElementById('filter-destination') as HTMLSelectElement)?.value.toLowerCase() || '';
      const rows = document.querySelectorAll('#local-matrix-table tbody tr[data-departure]');
      
      let count = 0;
      rows.forEach((row: Element) => {
        const r = row as HTMLElement;
        const rDep = r.getAttribute('data-departure') || '';
        const rDest = r.getAttribute('data-destination') || '';
        
        const matchDep = !dep || rDep === dep;
        const matchDest = !dest || rDest === dest;
        
        if (matchDep && matchDest) {
          r.style.display = '';
          count++;
        } else {
          r.style.display = 'none';
        }
      });
      
      // Handle empty state
      const tbody = document.querySelector('#local-matrix-table tbody');
      let emptyRow = tbody?.querySelector('.empty-state-row') as HTMLElement;
      
      if (count === 0 && rows.length > 0) {
        if (!emptyRow && tbody) {
          emptyRow = document.createElement('tr');
          emptyRow.className = 'empty-state-row';
          emptyRow.innerHTML = '<td colspan="5" style="text-align:center;color:#6B7280;padding:16px">No route zone mapping matches the selected filter.</td>';
          tbody.appendChild(emptyRow);
        } else if (emptyRow) {
          emptyRow.style.display = '';
        }
      } else if (emptyRow) {
        emptyRow.style.display = 'none';
      }
    };

    window.stationLimit = 20;
    
    window.applyStationFilter = () => {
      const q = (document.getElementById('station-filter-input') as HTMLInputElement)?.value.toLowerCase() || '';
      const rows = document.querySelectorAll('#stations-table tbody tr.station-row');
      let matchCount = 0;
      
      rows.forEach((row: Element) => {
        const r = row as HTMLElement;
        const name = r.getAttribute('data-name') || '';
        const state = r.getAttribute('data-state') || '';
        const code = r.getAttribute('data-code') || '';
        
        const isMatch = !q || name.includes(q) || state.includes(q) || code.includes(q);
        
        if (isMatch) {
          if (!q) {
            // If no search, respect pagination
            if (matchCount < window.stationLimit) {
              r.style.display = '';
            } else {
              r.style.display = 'none';
            }
          } else {
            // Search overrides pagination
            r.style.display = '';
          }
          matchCount++;
        } else {
          r.style.display = 'none';
        }
      });
      
      // Toggle Load More button based on search
      const loadBtn = document.getElementById('load-more-stations-btn');
      if (loadBtn) {
        loadBtn.parentElement!.style.display = (q || matchCount <= window.stationLimit) ? 'none' : '';
      }
    };
    
    window.loadMoreStations = () => {
      window.stationLimit += 20;
      window.applyStationFilter();
    };

    window.applyTenantFilter = () => {
      const q = (document.getElementById('tenant-search-input') as HTMLInputElement)?.value.toLowerCase() || '';
      const rows = document.querySelectorAll('#tenants-table tbody tr.tenant-tr');
      let count = 0;
      rows.forEach((row: Element) => {
        const r = row as HTMLElement;
        const match = !q || ['data-name','data-email','data-subdomain','data-status','data-country','data-type'].some(attr => (r.getAttribute(attr) || '').includes(q));
        r.style.display = match ? '' : 'none';
        if (match) count++;
      });
      const emptyRow = document.getElementById('tenant-empty-row');
      if (emptyRow) emptyRow.style.display = (count === 0 && rows.length > 0) ? '' : 'none';
      const countEl = document.getElementById('tenant-search-count');
      if (countEl) countEl.textContent = q ? `${count} of ${rows.length} tenants` : `${rows.length} tenants`;
    };

    window.applyInvitationFilter = () => {
      const q = (document.getElementById('invitation-search-input') as HTMLInputElement)?.value.toLowerCase() || '';
      const rows = document.querySelectorAll('#invitations-table tbody tr.invitation-row');
      let count = 0;
      rows.forEach((row: Element) => {
        const r = row as HTMLElement;
        const match = !q || ['data-email','data-company','data-status','data-plan'].some(attr => (r.getAttribute(attr) || '').includes(q));
        r.style.display = match ? '' : 'none';
        if (match) count++;
      });
      const emptyRow = document.getElementById('invitation-empty-row');
      if (emptyRow) emptyRow.style.display = (count === 0 && rows.length > 0) ? '' : 'none';
      const countEl = document.getElementById('invitation-search-count');
      if (countEl) countEl.textContent = q ? `${count} of ${rows.length} invitations` : `${rows.length} invitations`;
    };

    window.selectGeoCountry = (countryId: number) => {
      document.querySelectorAll('[id^="geo-cpanel-"]').forEach((el) => { (el as HTMLElement).style.display = 'none'; });
      document.querySelectorAll('[id^="geo-ctab-"]').forEach((el) => { el.classList.remove('primary'); });
      const panel = document.getElementById(`geo-cpanel-${countryId}`);
      const tab = document.getElementById(`geo-ctab-${countryId}`);
      if (panel) panel.style.display = 'block';
      if (tab) tab.classList.add('primary');
    };
  });

  const navActive = (page: AdminPageKey) => currentPage === page;
  const financeActive = currentPage === 'finance';
  const selectedCountry = (data?.countries ?? []).find((c) => c.name === tenantForm.country) ?? null;
  const selectedCountryStates = (selectedCountry?.regions ?? [])
    .flatMap((region) => region.states.map((state) => state.name))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));
  const selectedCountryDialCode = selectedCountry?.dialCode ?? '';
  const phoneDialOptions = (data?.countries ?? [])
    .map((country) => normalizeDialCode(country.dialCode))
    .filter((code, index, arr) => Boolean(code) && arr.indexOf(code) === index)
    .sort((a, b) => a.localeCompare(b));
  const regionCountry = data?.countries.find((c) => c.id === regionCountryId) ?? null;
  const viewedRegion = regionCountry?.regions.find((r) => r.id === viewRegionId) ?? null;

  return (
    <div className="admin-console">
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-mark"><LogoMark /></div>
            <div><div className="logo-name">CargoMint</div><div className="logo-sub">master console</div></div>
          </div>

          <nav className="nav">
            <div className="nav-group">
              <div className="nav-label">Overview</div>
              <div className={`nav-item ${navActive('dashboard') ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>
                Dashboard
              </div>
            </div>

            <div className="nav-group">
              <div className="nav-label">Tenants</div>
              <div className={`nav-item ${navActive('tenants') ? 'active' : ''}`} onClick={() => setCurrentPage('tenants')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10a1 1 0 011 1v2H2V3a1 1 0 011-1zm9 4H4v7h8V6zm-5 2h2v1H7V8z" /></svg>
                Tenant Management
                <span className="nav-badge">{data?.tenants.length ?? 0}</span>
              </div>
              <div className={`nav-item ${navActive('invitations') ? 'active' : ''}`} onClick={() => setCurrentPage('invitations')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm1 0v.511l5 3.125 5-3.125V4H3zm0 1.736V12h10V5.736L8 8.86 3 5.736z" /></svg>
                Invitations
                <span className="nav-badge">{data?.invitations.length ?? 0}</span>
              </div>
            </div>

            <div className="nav-group">
              <div className="nav-label">Finance</div>
              <div
                className={`nav-item ${financeActive ? 'active' : ''}`}
                onClick={() => {
                  setFinanceOpen((value) => !value);
                  setCurrentPage('finance');
                }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 3.5v1h1a.75.75 0 010 1.5h-1v.75h1.25a.75.75 0 010 1.5H8.75v1a.75.75 0 01-1.5 0v-1H5.75a.75.75 0 010-1.5H7.25V7h-1.5a.75.75 0 010-1.5h1.5v-1a.75.75 0 011.5 0z" /></svg>
                Finance Console
                <svg className={`nav-parent-chevron ${financeOpen ? 'open' : ''}`} viewBox="0 0 16 16" fill="currentColor"><path d="M6 3l5 5-5 5" /></svg>
              </div>
              <div className={`nav-sub ${financeOpen ? 'open' : ''}`}>
                {Object.entries(adminConsoleFinanceTitles).map(([key, label]) => (
                  <div
                    key={key}
                    className={`nav-sub-item ${financeActive && currentFinancePage === key ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentFinancePage(key as FinancePageKey);
                      setCurrentPage('finance');
                      setFinanceOpen(true);
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zM2 6h8v2H2zM2 10h10v2H2z" /></svg>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="nav-group">
              <div className="nav-label">Platform</div>
              <div className={`nav-item ${navActive('geography') ? 'active' : ''}`} onClick={() => setCurrentPage('geography')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5c.7 0 1.45.65 2.02 1.8.22.44.4.96.55 1.54H5.43c.15-.58.33-1.1.55-1.54C6.55 3.15 7.3 2.5 8 2.5zm-3.47 4.34H2.04A5.52 5.52 0 015.43 4.8a8.4 8.4 0 00-.9 2.04zm7.9 0H9.47a8.4 8.4 0 00-.9-2.04A5.52 5.52 0 0112.43 6.84zm.53 1.5A5.52 5.52 0 018 13.5c-.7 0-1.45-.65-2.02-1.8A8.4 8.4 0 015.43 8.34h5.14a8.4 8.4 0 01-.55 3.36z" /></svg>
                Geography
              </div>
              <div className={`nav-item ${navActive('audit') ? 'active' : ''}`} onClick={() => setCurrentPage('audit')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1H3zm1 2h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z" /></svg>
                Audit Log
              </div>
              <div className={`nav-item ${navActive('settings') ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26-.77zM8 6a2 2 0 100 4A2 2 0 008 6z" /></svg>
                Global Settings
              </div>
              <a href="/admin-console/support" className="nav-item" style={{ textDecoration: 'none' }}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 11H1L8 1zm0 4v3m0 2h.01" /></svg>
                Platform Support
              </a>
            </div>
          </nav>

          <div className="sidebar-footer" style={{ position: 'relative' }}>
            {userMenuOpen ? (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 'calc(100% + 8px)',
                  background: 'rgba(10,14,23,0.98)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 8,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                  animation: 'slideUpCard 160ms ease-out',
                }}
              >
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setOpenModal('modal-profile');
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-7 5s1-4 7-4 7 4 7 4H1z" /></svg>
                  User Profile
                </button>
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}><path d="M10 12.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 0010 2h-7A1.5 1.5 0 001.5 3.5v9A1.5 1.5 0 003 14h7a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/><path d="M9 10.5a.5.5 0 00.854.354l2.5-2.5a.5.5 0 000-.708l-2.5-2.5A.5.5 0 009 5.5v5z"/><path d="M12.5 8H5.5a.5.5 0 000 1h7a.5.5 0 000-1z"/></svg>
                  Log out
                </button>
              </div>
            ) : null}
            <div className="user-row" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
              <div className="avatar">{initialsFrom(displayName)}</div>
              <div>
                <div className="user-name">{displayName}</div>
                <div className="user-role">{displayRole}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-breadcrumb"><span className="breadcrumb-root">CargoMint</span><span className="breadcrumb-sep">&rsaquo;</span><span className="breadcrumb-page">{pageTitle}</span></div>
            <div className="search-wrap" style={{ position: 'relative' }}>
              {/* Honeypot inputs to catch browser autofill */}
              <input key="hp_e" type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" readOnly value="" />
              <input key="hp_p" type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" readOnly value="" />
              
              <SearchIcon />
              <input
                key="main_search"
                id="topbar-search-input"
                type="text"
                name="cargomint_search_query"
                placeholder={SEARCH_PLACEHOLDER}
                value={topbarSearch || ''}
                onChange={(e) => setTopbarSearch(e.target.value)}
                onFocus={() => setTopbarFocused(true)}
                onBlur={() => setTimeout(() => setTopbarFocused(false), 180)}
                autoComplete="off"
                data-lpignore="true" /* LastPass ignore */
              />
              {topbarFocused && topbarResults.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'rgba(10,14,23,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 999, overflow: 'hidden' }}>
                  {topbarResults.map((r, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: i < topbarResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseDown={() => { setCurrentPage(r.page); setTopbarSearch(''); setTopbarFocused(false); }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, background: 'rgba(62,166,255,0.15)', color: '#8BCBFF', padding: '2px 6px', borderRadius: 4, minWidth: 44, textAlign: 'center', textTransform: 'uppercase' }}>{r.type}</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#F0EEE9' }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{r.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="btn"
              onClick={() => {
                if (currentPage === 'geography') {
                  setOpenModal('geo');
                  return;
                }
                if (currentPage === 'invitations') {
                  setOpenModal('invite');
                  return;
                }
                openNewTenantModal();
              }}
            >
              {currentPage === 'geography' ? '+ Add country' : currentPage === 'invitations' ? '+ Send invitation' : '+ New Tenant'}
            </button>
          </header>
          <div className="content" dangerouslySetInnerHTML={{ __html: loading ? '<div class="card"><div class="card-title">Loading...</div></div>' : pageHtml }} />
        </div>
      </div>

      <div className={`overlay ${openModal === 'newTenant' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr"><div><div className="modal-title">{editingTenantId ? 'Edit tenant' : 'Onboard new tenant'}</div><div className="modal-sub">Creates or updates logistics company account on CargoMint</div></div><button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button></div>
          <div className="form-grid">
            <div><label className="form-label">Company name</label><input className="form-input" placeholder="e.g. StarShip NG" title="Tenant company name" value={tenantForm.name} onChange={(e) => setTenantForm((s) => ({ ...s, name: e.target.value }))} /></div>
            <div><label className="form-label">Subdomain</label><input className="form-input" placeholder="e.g. starship-ng" title="Unique tenant identifier used for workspace URL" value={tenantForm.subdomain} onChange={(e) => setTenantForm((s) => ({ ...s, subdomain: e.target.value }))} /></div>
          </div>
          <div className="form-row"><label className="form-label">Admin email</label><input className="form-input" placeholder="e.g. admin@starship.ng" title="Tenant admin login email" value={tenantForm.adminEmail} onChange={(e) => setTenantForm((s) => ({ ...s, adminEmail: e.target.value }))} /></div>
          <div className="form-grid">
            <div>
              <label className="form-label">Country</label>
              <select
                className="form-select"
                title="Tenant operating country"
                value={tenantForm.country}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const country = (data?.countries ?? []).find((c) => c.name === selectedName) ?? null;
                  const states = (country?.regions ?? [])
                    .flatMap((region) => region.states.map((state) => state.name))
                    .filter((value, index, arr) => arr.indexOf(value) === index)
                    .sort((a, b) => a.localeCompare(b));
                  setTenantForm((s) => ({
                    ...s,
                    country: selectedName,
                    state: states.includes(s.state) ? s.state : (states[0] ?? ''),
                    dialCode: normalizeDialCode(country?.dialCode),
                    adminPhone: normalizePhoneWithDialCode(s.adminPhone, country?.dialCode ?? ''),
                  }));
                }}
              >
                {(data?.countries ?? []).map((country) => (
                  <option key={country.id} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Subscription plan</label>
              <select className="form-select" title="Subscription plan name" value={tenantForm.plan} onChange={(e) => setTenantForm((s) => ({ ...s, plan: e.target.value }))}>
                {tenantPlanOptions.map((planName) => (
                  <option key={planName} value={planName}>{planName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">State</label>
            <select
              className="form-select"
              title="Tenant operating state"
              value={tenantForm.state}
              onChange={(e) => setTenantForm((s) => ({ ...s, state: e.target.value }))}
            >
              {selectedCountryStates.length > 0 ? selectedCountryStates.map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              )) : <option value="">No states available</option>}
            </select>
          </div>
          <div className="form-row"><label className="form-label">Temporary password (optional)</label><input className="form-input" placeholder="Leave blank to auto-generate" title="Optional temporary password for first tenant admin login" value={tenantForm.temporaryPassword} onChange={(e) => setTenantForm((s) => ({ ...s, temporaryPassword: e.target.value }))} /></div>
          <div className="form-grid">
            <div>
              <label className="form-label">Admin phone</label>
              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 8 }}>
                <select
                  className="form-select"
                  title="Phone country code"
                  value={tenantForm.dialCode || selectedCountryDialCode || '+234'}
                  onChange={(e) => {
                    const nextDial = normalizeDialCode(e.target.value);
                    setTenantForm((s) => ({
                      ...s,
                      dialCode: nextDial,
                      adminPhone: normalizePhoneWithDialCode(s.adminPhone, nextDial),
                    }));
                  }}
                >
                  {(phoneDialOptions.length > 0 ? phoneDialOptions : [selectedCountryDialCode || '+234']).map((dial) => (
                    <option key={dial} value={dial}>{dial}</option>
                  ))}
                </select>
                <input
                  className="form-input"
                  placeholder="e.g. 8012345678"
                  title="Tenant admin contact phone"
                  value={tenantForm.adminPhone}
                  onChange={(e) => setTenantForm((s) => ({ ...s, adminPhone: e.target.value }))}
                  onBlur={(e) => setTenantForm((s) => ({ ...s, adminPhone: normalizePhoneWithDialCode(e.target.value, tenantForm.dialCode || selectedCountryDialCode) }))}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Tenant type</label>
              <select className="form-select" title="Tenant business type" value={tenantForm.type} onChange={(e) => setTenantForm((s) => ({ ...s, type: e.target.value }))}>
                {['Logistics', 'Fleet', 'Ecommerce', 'Enterprise', 'SME', 'Retail'].map((tenantType) => (
                  <option key={tenantType} value={tenantType}>{tenantType}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div><label className="form-label">Contact person</label><input className="form-input" placeholder="e.g. Jane Doe" title="Primary contact person for tenant onboarding" value={tenantForm.contactPerson} onChange={(e) => setTenantForm((s) => ({ ...s, contactPerson: e.target.value }))} /></div>
            <div><label className="form-label">Address</label><input className="form-input" placeholder="e.g. 12 Marina, Lagos" title="Tenant office address" value={tenantForm.address} onChange={(e) => setTenantForm((s) => ({ ...s, address: e.target.value }))} /></div>
          </div>
          <div className="form-row"><label className="form-label">Notes (optional)</label><textarea className="form-input" rows={2} placeholder="Internal onboarding notes" title="Internal notes for super admin audit/onboarding context" value={tenantForm.notes} onChange={(e) => setTenantForm((s) => ({ ...s, notes: e.target.value }))} /></div>
          <div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button><button className="btn primary" onClick={() => void submitTenant()} type="button">{editingTenantId ? 'Update tenant ->' : 'Create tenant ->'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'bulkTenantImport' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Bulk import companies</div>
              <div className="modal-sub">Upload CSV/XLSX, preview rows, then create in batch.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-row">
            <label className="form-label">Upload file</label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button className="btn" type="button" onClick={downloadBulkSampleExcel}>
                Download Sample Excel
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label className="btn" style={{ cursor: 'pointer' }}>
                Choose File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => void handleBulkFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {bulkImportFileName || 'No file selected'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Required columns: `name` or `company`, `identifier/subdomain`, `adminEmail/email`.
            </div>
          </div>
          <div className="form-row">
            <div className="sec-title">Preview ({bulkTenantRows.length})</div>
            <div className="table-wrap" style={{ maxHeight: 260, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Name</th>
                    <th>Subdomain</th>
                    <th>Admin Email</th>
                    <th>Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkTenantRows.length === 0 ? (
                    <tr><td colSpan={5} style={{ color: 'var(--text-tertiary)' }}>No rows parsed yet.</td></tr>
                  ) : (
                    bulkTenantRows.slice(0, 50).map((row, idx) => (
                      <tr key={`${row.identifier}-${idx}`}>
                        <td>{row.company}</td>
                        <td>{row.name}</td>
                        <td className="td-mono">{row.identifier}</td>
                        <td className="td-mono">{row.adminEmail}</td>
                        <td>{row.plan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void submitBulkImport()} type="button" disabled={bulkImporting || bulkTenantRows.length === 0}>
              {bulkImporting ? 'Importing...' : 'Run bulk import ->'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'bulkStationImport' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Import stations (CSV/XLSX)</div>
              <div className="modal-sub">Upload, preview, then import into Geography Stations.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-row">
            <label className="form-label">Import file</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={downloadStationSampleExcel}>Download sample Excel</button>
              <a className="btn" href="/samples/nigeria-stations-master.xlsx" download>Download Nigeria master</a>
              <label className="btn" style={{ cursor: 'pointer' }}>
                Choose file
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => void handleStationBulkFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {bulkStationFileName || 'No file selected'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Required columns: `stationName` (or `name`), `stateName` (or `state`), optional `code`, `countryName`.
            </div>
          </div>
          <div className="form-row">
            <div className="sec-title">Preview ({bulkStationRows.length})</div>
            <div className="table-wrap" style={{ maxHeight: 260, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Station</th>
                    <th>Code</th>
                    <th>State</th>
                    <th>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStationRows.length === 0 ? (
                    <tr><td colSpan={5} style={{ color: 'var(--text-tertiary)' }}>No rows parsed yet.</td></tr>
                  ) : (
                    bulkStationRows.slice(0, 200).map((row, idx) => (
                      <tr key={`${row.stationName}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{row.stationName}</td>
                        <td className="td-mono">{row.code}</td>
                        <td>{row.stateName}</td>
                        <td>{row.countryName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Close</button>
            <button className="btn primary" onClick={() => void submitStationBulkImport()} type="button" disabled={bulkStationImporting || bulkStationRows.length === 0}>
              {bulkStationImporting ? 'Importing...' : 'Confirm import'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'bulkLocalMatrixImport' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Import local route matrix (CSV/XLSX)</div>
              <div className="modal-sub">Origin station to destination station with zone and ETA.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-row">
            <label className="form-label">Import file</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={downloadLocalMatrixSampleExcel}>Download sample Excel</button>
              <a className="btn" href="/samples/nigeria-station-to-station-zone-map.xlsx" download>Download Nigeria station-zone map</a>
              <label className="btn" style={{ cursor: 'pointer' }}>
                Choose file
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => void handleLocalMatrixBulkFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {bulkLocalMatrixFileName || 'No file selected'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Required columns: `departureStationName`, `destinationStationName`, `zoneName`, optional `estimatedHoursOfArrival`.
            </div>
          </div>
          <div className="form-row">
            <div className="sec-title">Preview ({bulkLocalMatrixRows.length})</div>
            <div className="table-wrap" style={{ maxHeight: 260, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Zone</th>
                    <th>ETA (h)</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkLocalMatrixRows.length === 0 ? (
                    <tr><td colSpan={5} style={{ color: 'var(--text-tertiary)' }}>No rows parsed yet.</td></tr>
                  ) : (
                    bulkLocalMatrixRows.slice(0, 300).map((row, idx) => (
                      <tr key={`${row.departureStationName}-${row.destinationStationName}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{row.departureStationName}</td>
                        <td>{row.destinationStationName}</td>
                        <td>{row.zoneName}</td>
                        <td className="td-mono">{row.estimatedHoursOfArrival}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Close</button>
            <button className="btn primary" onClick={() => void submitLocalMatrixBulkImport()} type="button" disabled={bulkLocalMatrixImporting || bulkLocalMatrixRows.length === 0}>
              {bulkLocalMatrixImporting ? 'Importing...' : 'Confirm import'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'invite' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr"><div><div className="modal-title">Send tenant invitation</div><div className="modal-sub">Creates invitation data for onboarding</div></div><button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button></div>
          <div className="form-row"><label className="form-label">Email address</label><input className="form-input" value={inviteForm.email} onChange={(e) => setInviteForm((s) => ({ ...s, email: e.target.value }))} /></div>
          <div className="form-grid">
            <div><label className="form-label">Company name</label><input className="form-input" value={inviteForm.company} onChange={(e) => setInviteForm((s) => ({ ...s, company: e.target.value }))} /></div>
            <div><label className="form-label">Assigned plan</label><input className="form-input" value={inviteForm.plan} onChange={(e) => setInviteForm((s) => ({ ...s, plan: e.target.value }))} /></div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button><button className="btn primary" onClick={() => void submitInvite()} type="button">Prepare onboarding -&gt;</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'geo' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr"><div><div className="modal-title">{editingCountryId ? 'Edit country' : 'Add country'}</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setEditingCountryId(null); setCountryForm(INITIAL_COUNTRY_FORM); }} type="button">x</button></div>
          <div className="form-grid">
            <div><label className="form-label">Country name</label><input className="form-input" value={countryForm.name} onChange={(e) => setCountryForm((s) => ({ ...s, name: e.target.value }))} /></div>
            <div><label className="form-label">ISO code</label><input className="form-input" value={countryForm.code} onChange={(e) => setCountryForm((s) => ({ ...s, code: e.target.value }))} /></div>
          </div>
          <div className="form-grid">
            <div><label className="form-label">Currency</label><input className="form-input" value={countryForm.currencyCode} onChange={(e) => setCountryForm((s) => ({ ...s, currencyCode: e.target.value }))} /></div>
            <div><label className="form-label">Symbol</label><input className="form-input" value={countryForm.currencySymbol} onChange={(e) => setCountryForm((s) => ({ ...s, currencySymbol: e.target.value }))} /></div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setEditingCountryId(null); setCountryForm(INITIAL_COUNTRY_FORM); }} type="button">Cancel</button><button className="btn primary" onClick={() => void submitCountry()} type="button">{editingCountryId ? 'Update country ->' : 'Add country ->'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'region' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">{editingGeoId && editingGeoType === 'region' ? 'Update region' : 'Manage regions'}</div>
              <div className="modal-sub">{editingGeoId && editingGeoType === 'region' ? 'Update region name, code, and add states' : 'Add region with multiple states and view existing region states'}</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>

          <div className="form-row">
            <label className="form-label">Country workspace</label>
            <select
              className="form-select"
              value={regionCountryId ?? ''}
              onChange={(e) => {
                const nextCountryId = Number(e.target.value);
                setRegionCountryId(nextCountryId);
                const country = data?.countries.find((c) => c.id === nextCountryId);
                setViewRegionId(country?.regions[0]?.id ?? null);
              }}
            >
              {(data?.countries ?? []).map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">{editingGeoId && editingGeoType === 'region' ? 'Region name' : 'New region name'}</label>
              <input
                className="form-input"
                placeholder="e.g. South West"
                value={regionForm.name}
                onChange={(e) => setRegionForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Region code (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. SW"
                value={regionForm.code}
                onChange={(e) => setRegionForm((s) => ({ ...s, code: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">{editingGeoId && editingGeoType === 'region' ? 'States in region' : 'States for new region'}</label>
            {regionForm.states.map((value, index) => (
              <div key={`state-input-${index}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder={`State ${index + 1}`}
                  value={value}
                  onChange={(e) => setRegionForm((s) => ({
                    ...s,
                    states: s.states.map((entry, i) => (i === index ? e.target.value : entry)),
                  }))}
                />
                <button
                  className="btn"
                  type="button"
                  onClick={() => setRegionForm((s) => ({ ...s, states: s.states.filter((_, i) => i !== index) }))}
                  disabled={regionForm.states.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="btn" type="button" onClick={() => setRegionForm((s) => ({ ...s, states: [...s.states, ''] }))}>+ Add state field</button>
          </div>

          <div className="form-row">
            <label className="form-label">View region states (selected country only)</label>
            <select
              className="form-select"
              value={viewRegionId ?? ''}
              onChange={(e) => setViewRegionId(Number(e.target.value))}
            >
              {(regionCountry?.regions ?? []).map((region) => (
                <option key={region.id} value={region.id}>{region.name} ({region.statesCount})</option>
              ))}
            </select>
            <div style={{ marginTop: 6, fontSize: 11, color: '#6B7280' }}>
              Country: {regionCountry?.name ?? 'None selected'}
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(viewedRegion?.states ?? []).map((state) => (
                <span key={state.id} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
                  {state.name}
                </span>
              ))}
              {(viewedRegion?.states ?? []).length === 0 ? <span style={{ fontSize: 11, color: '#6B7280' }}>No states in selected region</span> : null}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void submitRegion()} type="button">{editingGeoId && editingGeoType === 'region' ? 'Update region ->' : 'Create region ->'}</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'geoEdit' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Edit {editingGeoType}</div>
              <div className="modal-sub">Update name and metadata for this {editingGeoType}</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-row">
            <label className="form-label">{editingGeoType === 'station' ? 'Station' : editingGeoType === 'state' ? 'State' : 'Region'} name</label>
            <input
              className="form-input"
              value={geoEditForm.name}
              onChange={(e) => setGeoEditForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Code (optional)</label>
            <input
              className="form-input"
              value={geoEditForm.code}
              onChange={(e) => setGeoEditForm((s) => ({ ...s, code: e.target.value }))}
            />
          </div>
          {editingGeoType === 'station' && (
            <div className="form-row">
              <label className="form-label">Parent state</label>
              <select
                className="form-select"
                value={geoEditForm.parentId}
                onChange={(e) => setGeoEditForm((s) => ({ ...s, parentId: Number(e.target.value) }))}
              >
                {(data?.countries ?? []).flatMap(c => c.regions).flatMap(r => r.states).map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void window.doGeoEdit()} type="button">Save changes -&gt;</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'countryMatrix' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">New country mapping</div>
              <div className="modal-sub">Define zone and ETA between two countries</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Origin country</label>
              <select
                className="form-select"
                value={countryMatrixForm.departureCountryId}
                onChange={(e) => setCountryMatrixForm((s) => ({ ...s, departureCountryId: Number(e.target.value) }))}
              >
                {(data?.countries ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Destination country</label>
              <select
                className="form-select"
                value={countryMatrixForm.destinationCountryId}
                onChange={(e) => setCountryMatrixForm((s) => ({ ...s, destinationCountryId: Number(e.target.value) }))}
              >
                {(data?.countries ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Zone name</label>
              <input
                className="form-input"
                value={countryMatrixForm.zoneName}
                onChange={(e) => setCountryMatrixForm((s) => ({ ...s, zoneName: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ETA (days)</label>
              <input
                type="number"
                className="form-input"
                value={countryMatrixForm.estimatedDays}
                onChange={(e) => setCountryMatrixForm((s) => ({ ...s, estimatedDays: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void window.doCountryMatrix()} type="button">Save mapping -&gt;</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'subscriptionSettings' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Subscription settings</div>
              <div className="modal-sub">Configure platform-wide billing policies</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Trial enabled</label>
              <select
                className="form-select"
                value={subscriptionSettingsForm.trialEnabled ? 'yes' : 'no'}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, trialEnabled: e.target.value === 'yes' }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="form-label">One trial per tenant</label>
              <select
                className="form-select"
                value={subscriptionSettingsForm.oneTrialPerTenant ? 'yes' : 'no'}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, oneTrialPerTenant: e.target.value === 'yes' }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Default trial (days)</label>
              <input
                type="number"
                className="form-input"
                value={subscriptionSettingsForm.defaultTrialDays}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, defaultTrialDays: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="form-label">Max trial extension (days)</label>
              <input
                type="number"
                className="form-input"
                value={subscriptionSettingsForm.maxTrialExtensionDays}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, maxTrialExtensionDays: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Grace period (days)</label>
              <input
                type="number"
                className="form-input"
                value={subscriptionSettingsForm.gracePeriodDays}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, gracePeriodDays: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="form-label">Dunning retries</label>
              <input
                type="number"
                className="form-input"
                value={subscriptionSettingsForm.dunningRetryCount}
                onChange={(e) => setSubscriptionSettingsForm((s) => ({ ...s, dunningRetryCount: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void window.doSubscriptionSettings()} type="button">Save changes -&gt;</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'localMatrix' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">Station mapping</div>
              <div className="modal-sub">Define zone and ETA between two stations</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Origin station</label>
              <select
                className="form-select"
                value={localMatrixForm.departureStationId}
                onChange={(e) => setLocalMatrixForm((s) => ({ ...s, departureStationId: Number(e.target.value) }))}
              >
                {(data?.stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Destination station</label>
              <select
                className="form-select"
                value={localMatrixForm.destinationStationId}
                onChange={(e) => setLocalMatrixForm((s) => ({ ...s, destinationStationId: Number(e.target.value) }))}
              >
                {(data?.stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Zone name</label>
              <input
                className="form-input"
                value={localMatrixForm.zoneName}
                onChange={(e) => setLocalMatrixForm((s) => ({ ...s, zoneName: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ETA (hours)</label>
              <input
                type="number"
                className="form-input"
                value={localMatrixForm.estimatedHours}
                onChange={(e) => setLocalMatrixForm((s) => ({ ...s, estimatedHours: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button>
            <button className="btn primary" onClick={() => void window.doLocalMatrix()} type="button">Save mapping -&gt;</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'suspend' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal"><div className="modal-hdr"><div><div className="modal-title">Suspend tenant</div><div className="modal-sub">Tenant access will be revoked immediately</div></div><button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button></div><div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button><button className="btn danger" onClick={() => setOpenModal(null)} type="button">Confirm suspension</button></div></div>
      </div>

      <div className={`overlay ${openModal === 'blockwallet' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal"><div className="modal-hdr"><div><div className="modal-title">Block wallet</div><div className="modal-sub">All wallet transactions will be frozen</div></div><button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button></div><div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button><button className="btn danger" onClick={() => { if (selectedWalletId) void apiFetch(`/finance/wallets/${selectedWalletId}/block`, { method: 'PUT', body: JSON.stringify({ reasonCode: 'MANUAL', note: 'Blocked by super admin' }) }).then(() => { showToast('Wallet blocked'); return loadData(); }).catch((e) => showToast(e.message)); setOpenModal(null); }} type="button">Block wallet</button></div></div>
      </div>

      <div className={`overlay ${openModal === 'modal-profile' ? 'open' : ''}`} id="modal-profile" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">User Profile</div>
              <div className="modal-sub">View your account details and update your password.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-row">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={displayName} disabled />
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Email address</label>
              <input className="form-input" value={user?.email || 'N/A'} disabled />
            </div>
            <div>
              <label className="form-label">Role</label>
              <input className="form-input" value={user?.role || 'SuperAdmin'} disabled />
            </div>
          </div>
          <div className="modal-section-title" style={{ marginTop: 20, marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Change Password</div>
          <div className="form-row">
            <label className="form-label">Current password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={profilePasswordForm.currentPassword}
              onChange={(e) => setProfilePasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
            />
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">New password</label>
              <input
                className="form-input"
                type="password"
                placeholder="New password"
                value={profilePasswordForm.newPassword}
                onChange={(e) => setProfilePasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Confirm new password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat new password"
                value={profilePasswordForm.confirmPassword}
                onChange={(e) => setProfilePasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)} type="button">Close</button>
            <button className="btn primary" onClick={() => { void updateProfilePassword(); }} disabled={profileBusy} type="button">
              {profileBusy ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'freeze' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal"><div className="modal-hdr"><div><div className="modal-title">Freeze settlement</div><div className="modal-sub">COD payout will be held until manually released</div></div><button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button></div><div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)} type="button">Cancel</button><button className="btn danger" onClick={() => { if (selectedSettlementTenantId) void apiFetch(`/finance/settlements/${selectedSettlementTenantId}/freeze`, { method: 'PUT', body: JSON.stringify({ reasonCode: 'MANUAL', note: 'Frozen by super admin' }) }).then(() => { showToast('Settlement frozen'); return loadData(); }).catch((e) => showToast(e.message)); setOpenModal(null); }} type="button">Freeze settlement</button></div></div>
      </div>

      <div className="toast show" style={{ opacity: toastMessage ? 1 : 0, transform: toastMessage ? 'translateY(0)' : 'translateY(8px)' }}>{toastMessage}</div>
      <div className={`overlay ${openModal === 'plan' ? 'open' : ''}`} onClick={(event) => event.target === event.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">{editingPlanId ? 'Edit plan' : 'New subscription plan'}</div>
              <div className="modal-sub">Define base and usage-based fees for tenants</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)} type="button">x</button>
          </div>
          <div className="form-grid">
            <div><label className="form-label">Plan name</label><input className="form-input" placeholder="e.g. Growth" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} /></div>
            <div><label className="form-label">Plan code</label><input className="form-input" placeholder="e.g. growth" value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} /></div>
          </div>
          <div className="form-grid">
            <div><label className="form-label">Base monthly fee (₦)</label><input className="form-input" type="number" value={planForm.baseFee} onChange={(e) => setPlanForm({ ...planForm, baseFee: Number(e.target.value) })} /></div>
            <div><label className="form-label">Per-shipment fee (₦)</label><input className="form-input" type="number" value={planForm.perShipmentFee} onChange={(e) => setPlanForm({ ...planForm, perShipmentFee: Number(e.target.value) })} /></div>
          </div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <input type="checkbox" id="plan-active" checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} />
            <label htmlFor="plan-active" className="form-label" style={{ marginBottom: 0 }}>Plan is active for new subscriptions</label>
          </div>
          <div className="modal-ftr">
            <button className="btn" onClick={() => setOpenModal(null)}>Cancel</button>
            <button className="btn primary" onClick={submitPlan}>{editingPlanId ? 'Save changes' : 'Create plan'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
