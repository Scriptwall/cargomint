'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/components/providers/AuthProvider';
import './template.css';
import { pages, ctaMap, titleMap, setTenantTemplateData } from './template-pages';

type PageKey =
  | 'dashboard'
  | 'staff'
  | 'hubs'
  | 'service-centres'
  | 'roles'
  | 'fleet'
  | 'customers'
  | 'merchants'
  | 'finance'
  | 'pricing'
  | 'settings'
  | 'audit';

type ModalId =
  | 'modal-staff'
  | 'modal-staff-import'
  | 'modal-fleet-import'
  | 'modal-staff-password'
  | 'modal-zone'
  | 'modal-hub'
  | 'modal-sc'
  | 'modal-vehicle'
  | 'modal-merchant'
  | 'modal-confirm'
  | 'modal-profile'
  | 'modal-hub-import'
  | null;

type HubOption = { id: number; name: string };
type ServiceCentreOption = { id: number; name: string };
type ServiceCentreRecord = { id: number; name: string; hubId: number };
type CountryDialOption = { id: number; name: string; dialCode: string };
type StaffRecord = { 
  id: number; 
  firstName: string;
  lastName: string;
  name: string; 
  email: string; 
  role: string; 
  assignedServiceCentreId?: number | null;
  phoneNumber?: string | null;
  dialCode?: string | null;
  isRestricted: boolean;
};
type FleetRecord = { id: number; plate: string; type: string; ownership: string; serviceCentreId: number | null; captainId: number | null; captainName: string; make: string; model: string; status: string };
type CustomerRecord = { id: number; name: string; contact: string; email: string; type: string; credit: string; shipments: string; status: string; customerCode: string };
type PricingMatrixRow = { origin: string; values: string[] };
type StationDto = { id: number; name: string };
type TenantPricing = { zones: string[]; matrix: PricingMatrixRow[]; modifiers: Record<string, string>; stations: StationDto[]; globalZones: string[] };
type TenantFinanceMovement = { createdAt: string; stream: string; type: string; amount: number; direction: string; reference: string; description: string };
type TenantMerchantWalletFinance = { walletId: number; merchantCode: string; balance: number; transactionsCount: number };
type TenantFinanceSummary = {
  totalWalletBalance: number;
  totalWalletCredits: number;
  totalWalletDebits: number;
  totalLedgerCredits: number;
  totalLedgerDebits: number;
  pendingInvoicesAmount: number;
  paidInvoicesAmount: number;
  codPendingAmount: number;
  codCollectedAmount: number;
  merchantWalletsCount: number;
  merchantWallets: TenantMerchantWalletFinance[];
  topMerchantWallets: TenantMerchantWalletFinance[];
  recentMovements: TenantFinanceMovement[];
};
type TenantStatusCount = { status: string; count: number };
type TenantServiceCentreActivity = { serviceCentreId: number; serviceCentreName: string; shipmentCount: number };
type TenantDashboardTrace = { metric: string; source: string; filter: string; period: string };
type TenantDashboard = {
  totalShipments: number;
  staffCount: number;
  hubsCount: number;
  revenue: number;
  inTransitShipments: number;
  dispatchedShipments: number;
  deliveredShipments: number;
  cancelledShipments: number;
  deliverySuccessRate: number;
  dispatchRate: number;
  activeStaffCount: number;
  suspendedStaffCount: number;
  serviceCentreCount: number;
  activeServiceCentreCount: number;
  codPendingAmount: number;
  codCollectedAmount: number;
  range: string;
  periodStartUtc: string;
  periodEndUtc: string;
  statusBreakdown: TenantStatusCount[];
  serviceCentreActivity: TenantServiceCentreActivity[];
  trace: TenantDashboardTrace[];
  correlationId?: string | null;
};
type TenantSettings = {
  name: string;
  identifier: string;
  isActive: boolean;
  operationalType: string;
  brandColor: string;
  logoUrl?: string | null;
  tagline?: string | null;
  plan?: string | null;
  adminEmail?: string | null;
  adminPhone?: string | null;
  country?: string | null;
};
type TenantSubscription = {
  plan: string;
  status: string;
  billingCycle: string;
  trialStartAtUtc?: string | null;
  trialEndAtUtc?: string | null;
  currentPeriodStartAtUtc: string;
  currentPeriodEndAtUtc: string;
  nextBillingAtUtc?: string | null;
  hasValidPaymentMethod: boolean;
  paymentMethodLast4?: string | null;
};
type TenantSubscriptionInvoice = {
  id: number;
  invoiceNumber: string;
  periodStartAtUtc: string;
  periodEndAtUtc: string;
  dueAtUtc: string;
  total: number;
  status: string;
};
type InviteStaffForm = {
  firstName: string;
  lastName: string;
  email: string;
  dialCode: string;
  phoneNumber: string;
  temporaryPassword: string;
  role: string;
  serviceCentreId: string;
};
type InitializePaymentResult = {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  gateway: string;
  reference: string;
  authorizationUrl: string;
};

type StaffImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  dialCode: string;
  phoneNumber: string;
  role: string;
  temporaryPassword: string;
  serviceCentreName: string;
  hubName: string;
  mustChangePassword: boolean;
};

type StaffImportPreviewRow = {
  rowNumber: number;
  email: string;
  role: string;
  serviceCentreName: string;
  hubName?: string;
  isValid: boolean;
  errors: string[];
};

type StaffImportPreviewResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: StaffImportPreviewRow[];
};

type StaffImportConfirmRow = {
  rowNumber: number;
  email: string;
  imported: boolean;
  message: string;
};

type StaffImportConfirmResult = {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  rows: StaffImportConfirmRow[];
};

type HubImportRow = { hubName: string; serviceCentreName: string; location: string | null };
type HubImportPreviewRow = { rowNumber: number; hubName: string; serviceCentreName: string; isValid: boolean; errors: string[] };
type HubImportPreviewResult = { totalRows: number; validRows: number; invalidRows: number; rows: HubImportPreviewRow[] };
type FleetImportRow = {
  rowNumber: number;
  registrationNumber: string;
  fleetType: string;
  ownership: string;
  make: string;
  model: string;
  capacity: number;
  serviceCentreName: string;
  captain: string;
  description: string;
};
type TenantPermission = { roleName: string; permissionKey: string; isEnabled: boolean };

type GlobalSearchResult = {
  category: string;
  label: string;
  subLabel: string;
  targetPage: PageKey;
  entityId: number | null;
  entityCode: string | null;
};

type GlobalSearchResponse = {
  query: string;
  total: number;
  results: GlobalSearchResult[];
};

const VEHICLE_MAKE_MODELS: Record<string, string[]> = {
  Toyota: ['Hiace', 'Corolla', 'Hilux', 'Coaster'],
  Honda: ['CB125', 'CBR150', 'Accord', 'Civic'],
  Nissan: ['Urvan', 'Navara', 'Almera'],
  Mercedes: ['Sprinter', 'Actros', 'Atego'],
  Ford: ['Transit', 'Ranger', 'F-150'],
  Hyundai: ['H100', 'County', 'Porter'],
  Kia: ['K2700', 'Bongo', 'Rio'],
  Mitsubishi: ['L300', 'Canter', 'Pajero']
};

declare global {
  interface Window {
    showPage: (name: string) => void;
    openModal: (id: string) => void;
    closeModal: (id: string) => void;
    doAction: (modalId: string, msg: string) => void;
    toast: (msg: string) => void;
    suspendStaff: (id: number, name?: string) => void;
    unsuspendStaff: (id: number, name?: string) => void;
    saveTenantSettings: () => void;
    savePricing: () => void;
    saveTenantPermissions: () => void;
    addPricingZone: () => void;
    editHub: (id: number) => void;
    editServiceCentre: (id: number) => void;
    filterFinanceWallets: (query: string) => void;
    setFleetOwnershipFilter: (value: 'own' | 'third' | 'both') => void;
    applyStaffFilter: () => void;
    applyHubFilter: () => void;
    applyServiceCentreFilter: () => void;
    applyFleetFilter: () => void;
    applyCustomerFilter: () => void;
    onCalcOriginChange: (originId: string) => void;
  }
}

const validPages: PageKey[] = [
  'dashboard',
  'staff',
  'hubs',
  'service-centres',
  'roles',
  'fleet',
  'customers',
  'finance',
  'pricing',
  'settings',
  'audit',
];

const API_BASE = '/api/v1/TenantAdmin';
const DEFAULT_BRAND_COLOR = '#3B82F6';

const defaultTenantSettings: TenantSettings = {
  name: '',
  identifier: '',
  isActive: true,
  operationalType: 'Logistics',
  brandColor: DEFAULT_BRAND_COLOR,
  logoUrl: '',
  tagline: '',
  plan: '',
};

const INITIAL_INVITE_STAFF_FORM: InviteStaffForm = {
  firstName: '',
  lastName: '',
  email: '',
  dialCode: '+234',
  phoneNumber: '',
  temporaryPassword: '',
  role: 'DeskOperator',
  serviceCentreId: '',
};

function normalizeHexColor(color?: string | null) {
  const trimmed = color?.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const shortHex = /^#([0-9a-fA-F]{3})$/;
  const longHex = /^#([0-9a-fA-F]{6})$/;
  if (shortHex.test(withHash)) {
    const [, segment] = withHash.match(shortHex) ?? [];
    if (!segment) return null;
    return `#${segment.split('').map((c) => `${c}${c}`).join('').toUpperCase()}`;
  }
  if (!longHex.test(withHash)) return null;
  return withHash.toUpperCase();
}

function shadeHexColor(color: string, delta: number) {
  const normalized = normalizeHexColor(color) ?? DEFAULT_BRAND_COLOR;
  const raw = normalized.slice(1);
  const adjust = (start: number) => {
    const current = Number.parseInt(raw.slice(start, start + 2), 16);
    const next = Math.min(255, Math.max(0, current + delta));
    return next.toString(16).padStart(2, '0');
  };

  return `#${adjust(0)}${adjust(2)}${adjust(4)}`.toUpperCase();
}

function applyTenantTheme(settings: TenantSettings) {
  const root = document.documentElement;
  const brandColor = normalizeHexColor(settings.brandColor) ?? DEFAULT_BRAND_COLOR;
  root.style.setProperty('--accent', brandColor);
  root.style.setProperty('--accent-hover', shadeHexColor(brandColor, -28));
}

function getToken() {
  const tokenFromCookie = document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1];
  if (tokenFromCookie) return tokenFromCookie;
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('cm_token') ?? '';
  }
  return '';
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init, headers });
  return response;
}

async function apiFetchAbsolute(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { cache: 'no-store', ...init, headers });
  return response;
}

async function readApiSuccess(response: Response) {
  if (!response.ok) return false;
  try {
    const data = await response.clone().json();
    if (typeof data === 'boolean') return data;
    if (typeof data === 'number') return data > 0;
    return true;
  } catch {
    return true;
  }
}

async function readApiErrorMessage(response: Response, fallback = 'Request failed.') {
  try {
    const payload = await response.clone().json();
    if (typeof payload === 'string' && payload.trim()) return payload;
    if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
    if (typeof payload?.title === 'string' && payload.title.trim()) return payload.title;
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) return payload.errors.join('; ');
  } catch {
    try {
      const text = await response.clone().text();
      if (text?.trim()) return text.trim();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function svgDashboard() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>;
}
function svgUsers() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 4a3 3 0 106 0A3 3 0 005 4zM1 13a7 7 0 0114 0H1z" /></svg>;
}
function svgHub() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5v2h14V5L8 1zM2 8v5h3V9h6v4h3V8H2zm4 1h4v4H6V9z" /></svg>;
}
function svgCentres() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 100 10A5 5 0 008 1zm0 2a3 3 0 110 6A3 3 0 018 3zM2.34 12.5A7.97 7.97 0 008 15a7.97 7.97 0 005.66-2.5H2.34z" /></svg>;
}
function svgRoles() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 3a1 1 0 011-1h8a1 1 0 011 1v1.5a.5.5 0 01-.5.5H3.5a.5.5 0 01-.5-.5V3zm0 4a1 1 0 011-1h8a1 1 0 011 1v1.5a.5.5 0 01-.5.5H3.5a.5.5 0 01-.5-.5V7zm0 4a1 1 0 011-1h5a1 1 0 011 1v1.5a.5.5 0 01-.5.5H3.5a.5.5 0 01-.5-.5V11z" /></svg>;
}
function svgFleet() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 5a1 1 0 011-1h8l2.5 3H15v3h-1.05a2 2 0 01-3.9 0H5.95a2 2 0 01-3.9 0H1V5zm2 5.5a1 1 0 102 0 1 1 0 00-2 0zm8 0a1 1 0 102 0 1 1 0 00-2 0z" /></svg>;
}
function svgMerchant() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12l-1 6H3L2 2zM1 1h1.2L3.4 7H13l1.2-7H15l-1.4 8H2.2L1 1zm3 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" /></svg>;
}
function svgPricing() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 9.5H9v1H7v-1h.5V8H7V7h2v3.5h-.5zm-1-6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" /></svg>;
}
function svgSettings() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26-.77zM8 6a2 2 0 100 4A2 2 0 008 6z" /></svg>;
}
function svgAudit() {
  return <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1H3zm1 2h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z" /></svg>;
}

export default function TenantConsolePage() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [zoneFormName, setZoneFormName] = useState('');
  const [zoneFormCoverage, setZoneFormCoverage] = useState('');
  const [zoneFormBaseRate, setZoneFormBaseRate] = useState('');
  const [editingZoneLabel, setEditingZoneLabel] = useState('');
  const [zoneModalMode, setZoneModalMode] = useState<'add' | 'edit'>('add');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hubOptions, setHubOptions] = useState<HubOption[]>([]);
  const [serviceCentreOptions, setServiceCentreOptions] = useState<ServiceCentreOption[]>([]);
  const [countryDialOptions, setCountryDialOptions] = useState<CountryDialOption[]>([]);
  const [serviceCentreRecords, setServiceCentreRecords] = useState<ServiceCentreRecord[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [fleetRecords, setFleetRecords] = useState<FleetRecord[]>([]);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingFleetId, setEditingFleetId] = useState<number | null>(null);
  const [editingMerchantId, setEditingMerchantId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('Suspend staff member?');
  const [confirmBody, setConfirmBody] = useState("This will immediately revoke the staff member's login access. They can be unsuspended at any time.");
  const [confirmButtonLabel, setConfirmButtonLabel] = useState('Confirm suspend');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [editingHubId, setEditingHubId] = useState<number | null>(null);
  const [editingServiceCentreId, setEditingServiceCentreId] = useState<number | null>(null);
  const [counts, setCounts] = useState({ staff: 0, hubs: 0, serviceCentres: 0, fleet: 0, customers: 0 });
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>(defaultTenantSettings);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<TenantSubscriptionInvoice[]>([]);
  const [inviteStaffForm, setInviteStaffForm] = useState<InviteStaffForm>(INITIAL_INVITE_STAFF_FORM);
  const [passwordTargetStaff, setPasswordTargetStaff] = useState<StaffRecord | null>(null);
  const [passwordResetForm, setPasswordResetForm] = useState({
    newPassword: '',
    confirmPassword: '',
    mustChangePassword: true,
  });
  const [staffImportRows, setStaffImportRows] = useState<StaffImportRow[]>([]);
  const [staffImportPreview, setStaffImportPreview] = useState<StaffImportPreviewResult | null>(null);
  const [staffImportConfirm, setStaffImportConfirm] = useState<StaffImportConfirmResult | null>(null);
  const [staffImportFileName, setStaffImportFileName] = useState('');
  const [staffImportBusy, setStaffImportBusy] = useState(false);
  const [fleetMake, setFleetMake] = useState('');
  const [fleetModel, setFleetModel] = useState('');
  const [fleetYear, setFleetYear] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchInputUnlocked, setSearchInputUnlocked] = useState(false);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [profilePasswordForm, setProfilePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [hubImportRows, setHubImportRows] = useState<HubImportRow[]>([]);
  const [hubImportFileName, setHubImportFileName] = useState('');
  const [hubImportPreview, setHubImportPreview] = useState<HubImportPreviewResult | null>(null);
  const [hubImportConfirmed, setHubImportConfirmed] = useState(false);
  const [hubImportBusy, setHubImportBusy] = useState(false);
  const [fleetImportRows, setFleetImportRows] = useState<FleetImportRow[]>([]);
  const [fleetImportFileName, setFleetImportFileName] = useState('');
  const [fleetImportBusy, setFleetImportBusy] = useState(false);
  const [fleetImportResult, setFleetImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const [fleetOwnershipFilter, setFleetOwnershipFilter] = useState<'own' | 'third' | 'both'>('both');
  const [tenantPermissions, setTenantPermissions] = useState<TenantPermission[]>([]);
  const [tenantData, setTenantData] = useState<any>(null);

  const [captainOptions, setCaptainOptions] = useState<{ captainId: number; name: string; email: string }[]>([]);

  const modelOptions = useMemo(
    () => (fleetMake ? (VEHICLE_MAKE_MODELS[fleetMake] ?? []) : []),
    [fleetMake]
  );
  const isFleetTenant = useMemo(
    () => tenantSettings.operationalType.trim().toLowerCase() === 'fleet',
    [tenantSettings.operationalType]
  );
  const visiblePages = useMemo(
    () => (isFleetTenant ? validPages.filter((p) => !['hubs', 'service-centres', 'merchants'].includes(p)) : validPages),
    [isFleetTenant]
  );

  const pageHtml = useMemo(() => {
    const render = (pages as Record<string, () => string>)[currentPage] ?? (pages as Record<string, () => string>).dashboard;
    return render();
  }, [currentPage, refreshKey, fleetOwnershipFilter]);

  const ctaLabel = useMemo(() => {
    const map = ctaMap as Record<string, { label: string }>;
    return map[currentPage]?.label ?? '+ Invite staff';
  }, [currentPage]);

  const pageTitle = useMemo(() => {
    const map = titleMap as Record<string, string>;
    return map[currentPage] ?? 'Dashboard';
  }, [currentPage]);

  const tenantName = tenantSettings.name || user?.tenantName || defaultTenantSettings.name || 'Starship NG';
  const tenantPlan = (subscription?.plan || tenantSettings.plan || '').trim() || 'Standard';

  const buildLocalSearchResults = (query: string): GlobalSearchResult[] => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const staff = staffRecords
      .filter((s) => `${s.name} ${s.email} ${s.role}`.toLowerCase().includes(normalized))
      .slice(0, 8)
      .map((s) => ({
        category: (s.role || '').toLowerCase() === 'captain' ? 'captains' : 'staff',
        label: s.name,
        subLabel: `${s.role} | ${s.email}`,
        targetPage: 'staff' as PageKey,
        entityId: s.id,
        entityCode: null,
      }));

    const fleet = fleetRecords
      .filter((f) => `${f.plate} ${f.type} ${f.status}`.toLowerCase().includes(normalized))
      .slice(0, 6)
      .map((f) => ({
        category: 'fleet',
        label: f.plate,
        subLabel: `${f.type} | ${f.status}`,
        targetPage: 'fleet' as PageKey,
        entityId: f.id,
        entityCode: f.plate,
      }));

    const hubs = hubOptions
      .filter((h) => h.name.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((h) => ({
        category: 'hubs',
        label: h.name,
        subLabel: `Hub #${h.id}`,
        targetPage: 'hubs' as PageKey,
        entityId: h.id,
        entityCode: null,
      }));

    const serviceCentres = serviceCentreOptions
      .filter((s) => s.name.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((s) => ({
        category: 'service_centres',
        label: s.name,
        subLabel: `SC #${s.id}`,
        targetPage: 'service-centres' as PageKey,
        entityId: s.id,
        entityCode: null,
      }));

    const customers = customerRecords
      .filter((m) => `${m.name} ${m.email} ${m.contact} ${m.customerCode}`.toLowerCase().includes(normalized))
      .slice(0, 6)
      .map((m) => ({
        category: 'customers',
        label: m.name,
        subLabel: `${m.type} | ${m.email}`,
        targetPage: 'customers' as PageKey,
        entityId: m.id,
        entityCode: m.customerCode,
      }));

    return [...staff, ...fleet, ...hubs, ...serviceCentres, ...customers].slice(0, 20);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(''), 2400);
  };

  const loadTemplateData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const range = (params.get('range') || 'month').trim().toLowerCase();
      const fromUtc = (params.get('fromUtc') || '').trim();
      const toUtc = (params.get('toUtc') || '').trim();
      const query = new URLSearchParams();
      query.set('range', range || 'month');
      if (fromUtc) query.set('fromUtc', fromUtc);
      if (toUtc) query.set('toUtc', toUtc);

      const settingsRes = await apiFetch('/settings');
      const settings = settingsRes.ok ? await settingsRes.json() : null;
      const operationalType = typeof settings?.operationalType === 'string' ? settings.operationalType.trim() : 'Logistics';
      const fleetTenant = operationalType.toLowerCase() === 'fleet';

      const [dashboardRes, staffRes, hubsRes, scRes, fleetRes, merchantsRes, countriesRes, auditRes, financeRes, pricingRes, localRouteZonesRes, subscriptionRes, invoicesRes, permissionsRes, eligibleCaptainsRes, stationsRes] = await Promise.all([
        apiFetch(`/dashboard?${query.toString()}`),
        apiFetch('/staff'),
        fleetTenant ? Promise.resolve(new Response('[]', { status: 200 })) : apiFetch('/hubs'),
        fleetTenant ? Promise.resolve(new Response('[]', { status: 200 })) : apiFetch('/service-centres'),
        apiFetch('/fleet'),
        fleetTenant ? Promise.resolve(new Response('[]', { status: 200 })) : apiFetch('/customers'),
        apiFetch('/countries'),
        apiFetch('/audit'),
        apiFetch('/finance'),
        apiFetch('/pricing'),
        apiFetch('/pricing/route-zones/local'),
        apiFetchAbsolute('/api/v1/tenant/subscription'),
        apiFetchAbsolute('/api/v1/tenant/subscription/invoices'),
        apiFetch('/permissions'),
        apiFetch('/captains/eligible'),
        apiFetch('/stations'),
      ]);

      const dashboard = dashboardRes.ok ? await dashboardRes.json() as TenantDashboard : null;
      const staffRows = staffRes.ok ? await staffRes.json() : [];
      const hubRows = hubsRes.ok ? await hubsRes.json() : [];
      const scRows = scRes.ok ? await scRes.json() : [];
      const fleetRows = fleetRes.ok ? await fleetRes.json() : [];
      const merchantRows = merchantsRes.ok ? await merchantsRes.json() : [];
      const countriesRows = countriesRes.ok ? await countriesRes.json() : [];
      const auditRows = auditRes.ok ? await auditRes.json() : [];
      const finance = financeRes.ok ? await financeRes.json() as TenantFinanceSummary : null;
      const pricing = pricingRes.ok ? await pricingRes.json() : null;
      const localRouteZonePairs: Array<{ departureStationId: number; departureStationName: string; destinationStationId: number; destinationStationName: string; zoneName: string; estimatedHoursOfArrival?: number | null }> = localRouteZonesRes.ok ? await localRouteZonesRes.json() : [];
      const subscriptionData = subscriptionRes.ok ? await subscriptionRes.json() as TenantSubscription : null;
      const invoiceData = invoicesRes.ok ? await invoicesRes.json() as TenantSubscriptionInvoice[] : [];
      const permissionsRows: TenantPermission[] = permissionsRes.ok ? await permissionsRes.json() : [];
      const eligibleCaptainsRows: { captainId: number; userId: number; name: string; email: string }[] = eligibleCaptainsRes.ok ? await eligibleCaptainsRes.json() : [];
      const stationsRows: { id: number; name: string; code: string; stateId: number; stateName: string; countryId: number; countryName: string }[] = stationsRes.ok ? await stationsRes.json() : [];
      setTenantPermissions(Array.isArray(permissionsRows) ? permissionsRows : []);
      const resolvedBrandColor = normalizeHexColor(settings?.brandColor) ?? DEFAULT_BRAND_COLOR;
      const settingsData: TenantSettings = {
        name: typeof settings?.name === 'string' && settings.name.trim() ? settings.name.trim() : (user?.tenantName || ''),
        identifier: typeof settings?.identifier === 'string' && settings.identifier.trim()
          ? settings.identifier.trim()
          : (typeof user?.tenantId === 'number' ? `tenant-${user.tenantId}` : ''),
        isActive: typeof settings?.isActive === 'boolean' ? settings.isActive : true,
        operationalType,
        brandColor: resolvedBrandColor,
        logoUrl: typeof settings?.logoUrl === 'string' ? settings.logoUrl.trim() : '',
        tagline: typeof settings?.tagline === 'string' ? settings.tagline.trim() : '',
        plan: typeof settings?.plan === 'string' ? settings.plan.trim() : '',
        adminEmail: typeof settings?.adminEmail === 'string' ? settings.adminEmail.trim() : '',
        adminPhone: typeof settings?.adminPhone === 'string' ? settings.adminPhone.trim() : '',
        country: typeof settings?.country === 'string' ? settings.country.trim() : '',
      };

      const hubsById = new Map<number, string>(
        Array.isArray(hubRows) ? hubRows.map((h: { id: number; name: string }) => [h.id, h.name]) : []
      );

      const staffList = Array.isArray(staffRows)
        ? staffRows.map((s: { id: number; name: string; firstName: string; lastName: string; email: string; role: string; assignedServiceCentreId?: number | null; dialCode: string; phoneNumber: string; isRestricted?: boolean }) => {
            const firstName = s.firstName || '';
            const lastName = s.lastName || '';
            const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : (s.name || 'Unknown User');
            const initials = (firstName[0] || '') + (lastName[0] || (firstName[1] || ''));
            return {
              id: s.id,
              firstName,
              lastName,
              name: fullName,
              initials: initials.toUpperCase() || 'U',
              color: 'var(--surface-3)',
              tc: 'var(--text-primary)',
              email: s.email || 'unknown@tenant.local',
              dialCode: s.dialCode || '+234',
              phoneNumber: s.phoneNumber || '',
              role: s.role || 'User',
              scope: s.assignedServiceCentreId ? `SC #${s.assignedServiceCentreId}` : 'Tenant-wide',
              status: s.isRestricted ? 'suspended' : 'active',
              assignedServiceCentreId: s.assignedServiceCentreId ?? null,
              lastLogin: 'Recent',
            };
          })
        : [];

      const hubList = Array.isArray(hubRows)
        ? hubRows.map((h: { id: number; name: string; location: string }) => {
            const hubSCs = Array.isArray(scRows) ? scRows.filter((s: { hubId: number }) => s.hubId === h.id) : [];
            const scIds = new Set(hubSCs.map(s => s.id));
            return {
              id: h.id,
              code: `H${h.id}`,
              name: h.name,
              state: h.location || 'N/A',
              scs: hubSCs.length,
              staff: staffList.filter((s: { assignedServiceCentreId: number | null }) => s.assignedServiceCentreId && scIds.has(s.assignedServiceCentreId)).length,
              manager: 'Unassigned',
              status: 'active',
              capacity: 'Enterprise Hub',
            };
          })
        : [];

      const scList = Array.isArray(scRows)
        ? scRows.map((s: { id: number; name: string; hubId: number }) => ({
            id: s.id,
            code: `SC${s.id}`,
            name: s.name,
            hub: hubsById.get(s.hubId) || `Hub #${s.hubId}`,
            zone: 'Coverage zone',
            staff: String(staffList.filter((x: { scope: string }) => x.scope === `SC #${s.id}`).length),
            shipments: '0',
            status: 'active',
            admin: 'Unassigned',
          }))
        : [];

      const dashboardError = !dashboardRes.ok
        ? (await readApiErrorMessage(dashboardRes, 'Unable to load dashboard metrics.'))
        : '';

      const fullTemplateData = {
        dashboardStats: {
          totalShipments: dashboard?.totalShipments ?? 0,
          staffCount: dashboard?.staffCount ?? staffList.length,
          hubsCount: dashboard?.hubsCount ?? hubList.length,
          revenue: dashboard?.revenue ?? 0,
          range: dashboard?.range ?? range,
          periodStartUtc: dashboard?.periodStartUtc ?? null,
          periodEndUtc: dashboard?.periodEndUtc ?? null,
          inTransitShipments: dashboard?.inTransitShipments ?? 0,
          dispatchedShipments: dashboard?.dispatchedShipments ?? 0,
          deliveredShipments: dashboard?.deliveredShipments ?? 0,
          cancelledShipments: dashboard?.cancelledShipments ?? 0,
          deliverySuccessRate: dashboard?.deliverySuccessRate ?? 0,
          dispatchRate: dashboard?.dispatchRate ?? 0,
          activeStaffCount: dashboard?.activeStaffCount ?? staffList.length,
          suspendedStaffCount: dashboard?.suspendedStaffCount ?? 0,
          serviceCentreCount: dashboard?.serviceCentreCount ?? scList.length,
          activeServiceCentreCount: dashboard?.activeServiceCentreCount ?? scList.length,
          codPendingAmount: dashboard?.codPendingAmount ?? 0,
          codCollectedAmount: dashboard?.codCollectedAmount ?? 0,
          statusBreakdown: dashboard?.statusBreakdown ?? [],
          serviceCentreActivity: dashboard?.serviceCentreActivity ?? [],
          trace: dashboard?.trace ?? [],
          recentActivities: dashboard?.recentActivities ?? [],
          correlationId: dashboard?.correlationId ?? null,
        },
        dashboardState: { isLoading: false, hasError: !!dashboardError, errorMessage: dashboardError },
        permissions: Array.isArray(permissionsRows) ? permissionsRows : [],
        staff: staffList,
        hubs: hubList,
        serviceCentres: scList,
        fleet: Array.isArray(fleetRows)
          ? fleetRows.map((f: { id: number; plate: string; type: string; ownership: string; serviceCentre: string; captain: string; status: string }) => ({
              id: f.id,
              plate: f.plate,
              type: f.type,
              ownership: f.ownership || 'own',
              sc: f.serviceCentre || 'N/A',
              captain: f.captain || 'Unassigned',
              status: f.status || 'active',
            }))
          : [],
        filters: {
          fleetOwnership: fleetOwnershipFilter,
        },
        customers: Array.isArray(merchantRows)
          ? merchantRows.map((m: { id: number; name: string; contact: string; email: string; type: string; credit: string; shipments: string; status: string; customerCode: string }) => ({
              id: m.id,
              name: m.name,
              contact: m.contact || 'N/A',
              email: m.email,
              type: m.type || 'Standard',
              credit: m.credit || '₦0',
              shipments: m.shipments || '0',
              status: m.status || 'active',
              customerCode: m.customerCode || 'N/A'
            }))
          : [],
        auditLogs: Array.isArray(auditRows)
          ? auditRows.map((a: { time: string; action: string; detail: string; actor: string; severity: string }) => ({
              time: a.time,
              action: a.action,
              detail: a.detail,
              actor: a.actor,
              severity: a.severity || 'info',
            }))
          : [],
        finance: finance && typeof finance === 'object'
          ? {
              totalWalletBalance: finance.totalWalletBalance ?? 0,
              totalWalletCredits: finance.totalWalletCredits ?? 0,
              totalWalletDebits: finance.totalWalletDebits ?? 0,
              totalLedgerCredits: finance.totalLedgerCredits ?? 0,
              totalLedgerDebits: finance.totalLedgerDebits ?? 0,
              pendingInvoicesAmount: finance.pendingInvoicesAmount ?? 0,
              paidInvoicesAmount: finance.paidInvoicesAmount ?? 0,
              codPendingAmount: finance.codPendingAmount ?? 0,
              codCollectedAmount: finance.codCollectedAmount ?? 0,
              merchantWalletsCount: finance.merchantWalletsCount ?? 0,
              merchantWallets: Array.isArray(finance.merchantWallets) ? finance.merchantWallets : [],
              topMerchantWallets: Array.isArray(finance.topMerchantWallets) ? finance.topMerchantWallets : [],
              recentMovements: Array.isArray(finance.recentMovements) ? finance.recentMovements : [],
            }
          : undefined,
        pricing: pricing && typeof pricing === 'object'
          ? {
              zones: Array.isArray((pricing as TenantPricing).zones) ? (pricing as TenantPricing).zones : [],
              matrix: Array.isArray((pricing as TenantPricing).matrix) ? (pricing as TenantPricing).matrix : [],
              modifiers: (pricing as TenantPricing).modifiers && typeof (pricing as TenantPricing).modifiers === 'object'
                ? (pricing as TenantPricing).modifiers
                : {},
              globalZones: Array.isArray((pricing as TenantPricing).globalZones) ? (pricing as TenantPricing).globalZones : [],
            }
          : undefined,
        stations: stationsRows.map((s) => ({ id: s.id, name: s.name })),
        localRouteZonePairs: Array.isArray(localRouteZonePairs) ? localRouteZonePairs : [],
      };

      setTenantTemplateData(fullTemplateData);
      setTenantData(fullTemplateData);

      setTenantSettings(settingsData);
      setSubscription(subscriptionData);
      setSubscriptionInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      applyTenantTheme(settingsData);
      setHubOptions(hubList.map((h: { id: number; name: string }) => ({ id: h.id, name: h.name })));
      setServiceCentreOptions(scList.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
      const dialOptions = Array.isArray(countriesRows)
        ? countriesRows
            .map((c: { id: number; name: string; dialCode: string }) => ({
              id: c.id,
              name: c.name,
              dialCode: c.dialCode?.trim() ?? '',
            }))
            .filter((c: { dialCode: string }) => c.dialCode.length > 0)
        : [];
      setCountryDialOptions(dialOptions);
      setServiceCentreRecords(
        Array.isArray(scRows) ? scRows.map((s: { id: number; name: string; hubId: number }) => ({ id: s.id, name: s.name, hubId: s.hubId })) : []
      );
      setStaffRecords(staffList);
      setFleetRecords(
        Array.isArray(fleetRows)
          ? fleetRows.map((f: { id: number; plate: string; type: string; ownership: string; serviceCentreId?: number | null; captainId?: number | null; captain: string; make?: string; model?: string; status: string }) => ({
              id: f.id,
              plate: f.plate,
              type: f.type,
              ownership: f.ownership || 'own',
              serviceCentreId: f.serviceCentreId ?? null,
              captainId: f.captainId ?? null,
              captainName: f.captain || 'Unassigned',
              make: f.make || '',
              model: f.model || '',
              status: f.status,
            }))
          : []
      );
      setCaptainOptions(
        Array.isArray(eligibleCaptainsRows)
          ? eligibleCaptainsRows.map((c) => ({
              captainId: c.captainId,
              name: c.name || c.email,
              email: c.email,
            }))
          : []
      );
      setCustomerRecords(
        Array.isArray(merchantRows)
          ? merchantRows.map((m: { id: number; name: string; contact: string; email: string; type: string; credit: string; shipments: string; status: string; customerCode: string }) => ({
              id: m.id,
              name: m.name,
              contact: m.contact || 'N/A',
              email: m.email,
              type: m.type || 'Standard',
              credit: m.credit || '₦0',
              shipments: m.shipments || '0',
              status: m.status || 'active',
              customerCode: m.customerCode || 'N/A'
            }))
          : []
      );
      setCounts({
        staff: staffList.length,
        hubs: hubList.length,
        serviceCentres: scList.length,
        fleet: Array.isArray(fleetRows) ? fleetRows.length : 0,
        customers: Array.isArray(merchantRows) ? merchantRows.length : 0,
      });
      setRefreshKey((k) => k + 1);
    } catch {
      setTenantTemplateData({
        dashboardState: {
          isLoading: false,
          hasError: true,
          errorMessage: 'Unable to load tenant dashboard data right now.',
        },
      });
      showToast('Unable to load tenant data now.');
    }
  };

  useEffect(() => {
    void loadTemplateData();
  }, []);

  useEffect(() => {
    if (visiblePages.includes(currentPage)) {
      return;
    }

    setCurrentPage('dashboard');
  }, [currentPage, visiblePages]);

  useEffect(() => {
    const clearSearchInput = () => {
      setGlobalSearchTerm('');
      const input = document.getElementById('global-search') as HTMLInputElement | null;
      if (input) {
        input.value = '';
      }
    };

    clearSearchInput();
    window.setTimeout(clearSearchInput, 0);
    window.setTimeout(clearSearchInput, 250);
    window.addEventListener('pageshow', clearSearchInput);
    return () => {
      window.removeEventListener('pageshow', clearSearchInput);
    };
  }, []);

  useEffect(() => {
    const query = globalSearchTerm.trim();
    if (!query) {
      setGlobalSearchLoading(false);
      setGlobalSearchError('');
      setGlobalSearchResults([]);
      return;
    }

    if (query.length > 100 || !/[A-Za-z0-9]/.test(query)) {
      setGlobalSearchLoading(false);
      setGlobalSearchResults([]);
      setGlobalSearchError('Enter at least one letter or number.');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setGlobalSearchLoading(true);
        setGlobalSearchError('');
        const response = await apiFetch(`/search?q=${encodeURIComponent(query)}&limit=20`);
        if (!response.ok) {
          const fallback = buildLocalSearchResults(query);
          setGlobalSearchResults(fallback);
          if (fallback.length === 0) {
            setGlobalSearchError(await readApiErrorMessage(response, 'Search unavailable.'));
          }
          return;
        }

        const payload = await response.json() as GlobalSearchResponse;
        const filtered = Array.isArray(payload.results)
          ? payload.results.filter((item) => visiblePages.includes(item.targetPage))
          : [];
        setGlobalSearchResults(filtered);
      } catch {
        const fallback = buildLocalSearchResults(query);
        setGlobalSearchResults(fallback.filter((item) => visiblePages.includes(item.targetPage)));
        if (fallback.length === 0) {
          setGlobalSearchError('Search unavailable.');
        }
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [globalSearchTerm, staffRecords, fleetRecords, hubOptions, serviceCentreOptions, customerRecords, visiblePages]);

  const runTopbarAction = () => {
    if (currentPage === 'dashboard' || currentPage === 'staff') { setEditingStaffId(null); setInviteStaffForm(INITIAL_INVITE_STAFF_FORM); setOpenModal('modal-staff'); }
    else if (currentPage === 'hubs') { setEditingHubId(null); setOpenModal('modal-hub'); }
    else if (currentPage === 'service-centres') { setEditingServiceCentreId(null); setOpenModal('modal-sc'); }
    else if (currentPage === 'fleet') { setEditingFleetId(null); setOpenModal('modal-vehicle'); }
    else if (currentPage === 'customers') { setEditingMerchantId(null); setOpenModal('modal-merchant'); }
    else if (currentPage === 'roles') showToast('Permissions saved!');
    else if (currentPage === 'pricing') void savePricing();
    else if (currentPage === 'settings') void saveTenantSettings();
    else if (currentPage === 'audit') showToast('Exported');
  };

  const onSearchResultClick = (result: GlobalSearchResult) => {
    setGlobalSearchTerm('');
    setGlobalSearchResults([]);
    setGlobalSearchError('');
    setCurrentPage(result.targetPage);

    if (result.targetPage === 'staff' && result.entityId) {
      window.setTimeout(() => editStaff(result.entityId as number), 0);
      return;
    }
    if (result.targetPage === 'fleet' && result.entityId) {
      window.setTimeout(() => editFleet(result.entityId as number), 0);
      return;
    }
    if (result.targetPage === 'hubs' && result.entityId) {
      window.setTimeout(() => editHub(result.entityId as number), 0);
      return;
    }
    if (result.targetPage === 'service-centres' && result.entityId) {
      window.setTimeout(() => editServiceCentre(result.entityId as number), 0);
      return;
    }
    if (result.targetPage === 'merchants' && result.entityId) {
      window.setTimeout(() => editMerchant(result.entityId as number), 0);
      return;
    }
    if (result.targetPage === 'dashboard' && result.entityCode) {
      showToast(`Shipment ${result.entityCode} found in tenant records.`);
    }
  };

  const inviteStaff = async () => {
    const email = inviteStaffForm.email.trim();
    const role = inviteStaffForm.role.trim();
    const serviceCentreId = inviteStaffForm.serviceCentreId ? Number(inviteStaffForm.serviceCentreId) : null;
    const hubId = role === 'HubManager' ? serviceCentreId : null;
    const scopedServiceCentreId = role === 'HubManager' ? null : serviceCentreId;
    const temporaryPassword = inviteStaffForm.temporaryPassword.trim();
    if (!email || !role) return showToast('Email and role are required.');
    if (!temporaryPassword) return showToast('Temporary password is required.');
    const response = await apiFetch('/staff/invite', {
      method: 'POST',
      body: JSON.stringify({
        email,
        role,
        serviceCentreId: scopedServiceCentreId,
        hubId,
        dialCode: inviteStaffForm.dialCode.trim(),
        phoneNumber: inviteStaffForm.phoneNumber.trim(),
        temporaryPassword,
        mustChangePassword: true,
      }),
    });
    if (!(await readApiSuccess(response))) return showToast('Invite failed. Check email/role and try again.');
    setOpenModal(null);
    setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
    showToast(`Invite sent to ${email}`);
    await loadTemplateData();
  };

  const updateStaff = async () => {
    if (!editingStaffId) return;
    const firstName = inviteStaffForm.firstName.trim();
    const lastName = inviteStaffForm.lastName.trim();
    const email = inviteStaffForm.email.trim();
    const role = inviteStaffForm.role.trim();
    const serviceCentreId = inviteStaffForm.serviceCentreId ? Number(inviteStaffForm.serviceCentreId) : null;
    const hubId = role === 'HubManager' ? serviceCentreId : null;
    const scopedServiceCentreId = role === 'HubManager' ? null : serviceCentreId;
    if (!email || !role) return showToast('Email and role are required.');
    const response = await apiFetch(`/staff/${editingStaffId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        staffId: editingStaffId, 
        firstName, 
        lastName, 
        email, 
        role, 
        serviceCentreId: scopedServiceCentreId, 
        hubId,
        dialCode: inviteStaffForm.dialCode.trim(),
        phoneNumber: inviteStaffForm.phoneNumber.trim(),
        newPassword: inviteStaffForm.temporaryPassword.trim() || null
      }),
    });
    if (!(await readApiSuccess(response))) return showToast('Staff update blocked. Create a new user for role changes like this.');
    setEditingStaffId(null);
    setOpenModal(null);
    setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
    showToast('Staff updated successfully');
    await loadTemplateData();
  };

  const editStaff = (staffId: number) => {
    const staff = staffRecords.find((s) => s.id === staffId);
    if (!staff) return;
    setEditingStaffId(staffId);
    setInviteStaffForm({
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email,
      dialCode: staff.dialCode || '+234',
      phoneNumber: staff.phoneNumber || '',
      temporaryPassword: '',
      role: staff.role,
      serviceCentreId: staff.assignedServiceCentreId ? String(staff.assignedServiceCentreId) : '',
    });
    setOpenModal('modal-staff');
  };

  const resetStaffPassword = (staffId: number) => {
    const staff = staffRecords.find((s) => s.id === staffId);
    if (!staff) return;
    setPasswordTargetStaff(staff);
    setPasswordResetForm({
      newPassword: '',
      confirmPassword: '',
      mustChangePassword: true,
    });
    setOpenModal('modal-staff-password');
  };

  const submitStaffPasswordReset = async () => {
    if (!passwordTargetStaff) return;
    const newPassword = passwordResetForm.newPassword.trim();
    const confirmPassword = passwordResetForm.confirmPassword.trim();
    if (!newPassword) return showToast('New password is required.');
    if (newPassword !== confirmPassword) return showToast('Passwords do not match.');
    const response = await apiFetch(`/staff/${passwordTargetStaff.id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword, mustChangePassword: passwordResetForm.mustChangePassword }),
    });
    if (!(await readApiSuccess(response))) {
      showToast('Unable to set staff password.');
      return;
    }
    setOpenModal(null);
    setPasswordTargetStaff(null);
    setPasswordResetForm({ newPassword: '', confirmPassword: '', mustChangePassword: true });
    showToast(`Password updated for ${passwordTargetStaff.email}`);
  };

  const parseStaffImportCsv = (csv: string): StaffImportRow[] => {
    const normalizeScopeValue = (value: string) => {
      const cleaned = (value || '').trim();
      const lower = cleaned.toLowerCase();
      if (!cleaned || lower === '-' || lower === '--' || lower === 'n/a' || lower === 'na' || lower === 'none' || lower === 'null') return '';
      return cleaned;
    };
    const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return [];

    const parseLine = (line: string) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
          continue;
        }
        current += ch;
      }
      values.push(current.trim());
      return values;
    };

    const header = parseLine(lines[0]).map((h) => h.toLowerCase());
    const indexOf = (name: string) => header.indexOf(name);
    const firstNameIdx = indexOf('firstname');
    const lastNameIdx = indexOf('lastname');
    const emailIdx = indexOf('email');
    const dialCodeIdx = indexOf('dialcode');
    const phoneIdx = indexOf('phonenumber');
    const roleIdx = indexOf('role');
    const passwordIdx = indexOf('temporarypassword');
    const scNameIdx = indexOf('servicecentrename');
    const hubNameIdx = indexOf('hubname');
    const mustChangeIdx = indexOf('mustchangepassword');
    const hasHeader = emailIdx >= 0 && roleIdx >= 0;

    const startIndex = hasHeader ? 1 : 0;
    const rows: StaffImportRow[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const role = roleIdx >= 0 ? (cols[roleIdx] ?? '') : (cols[1] ?? '');
      const roleNormalized = role.replace(/\s+/g, '').toLowerCase();
      let serviceCentreName = normalizeScopeValue(scNameIdx >= 0 ? (cols[scNameIdx] ?? '') : '');
      let hubName = normalizeScopeValue(hubNameIdx >= 0 ? (cols[hubNameIdx] ?? '') : '');
      if (roleNormalized === 'deskoperator' || roleNormalized === 'servicecentreadmin' || roleNormalized === 'servicecenteradmin') {
        hubName = '';
      }
      if (roleNormalized === 'hubmanager') {
        serviceCentreName = '';
      }
      rows.push({
        firstName: firstNameIdx >= 0 ? (cols[firstNameIdx] ?? '') : '',
        lastName: lastNameIdx >= 0 ? (cols[lastNameIdx] ?? '') : '',
        email: emailIdx >= 0 ? (cols[emailIdx] ?? '') : (cols[0] ?? ''),
        dialCode: dialCodeIdx >= 0 ? (cols[dialCodeIdx] ?? '+234') : '+234',
        phoneNumber: phoneIdx >= 0 ? (cols[phoneIdx] ?? '') : '',
        role,
        temporaryPassword: passwordIdx >= 0 ? (cols[passwordIdx] ?? '') : '',
        serviceCentreName,
        hubName,
        mustChangePassword: mustChangeIdx >= 0 ? (cols[mustChangeIdx] ?? '').toLowerCase() !== 'false' : true,
      });
    }

    return rows;
  };

  const normalizeStaffImportObjects = (items: Record<string, unknown>[]): StaffImportRow[] => {
    const normalizeScopeValue = (value: string) => {
      const cleaned = (value || '').trim();
      const lower = cleaned.toLowerCase();
      if (!cleaned || lower === '-' || lower === '--' || lower === 'n/a' || lower === 'na' || lower === 'none' || lower === 'null') return '';
      return cleaned;
    };
    const pick = (obj: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) {
        const found = Object.keys(obj).find((k) => k.trim().toLowerCase() === key.toLowerCase());
        if (found) return obj[found];
      }
      return '';
    };

    return items.map((item) => {
      const mustChangeValue = String(pick(item, ['MustChangePassword']) ?? '').trim().toLowerCase();
      const roleRaw = String(pick(item, ['Role']) ?? '').trim();
      const roleNormalized = roleRaw.replace(/\s+/g, '').toLowerCase();
      let serviceCentreName = normalizeScopeValue(String(pick(item, ['ServiceCentreName']) ?? ''));
      let hubName = normalizeScopeValue(String(pick(item, ['HubName']) ?? ''));
      if (roleNormalized === 'deskoperator' || roleNormalized === 'servicecentreadmin' || roleNormalized === 'servicecenteradmin') {
        hubName = '';
      }
      if (roleNormalized === 'hubmanager') {
        serviceCentreName = '';
      }
      return {
        firstName: String(pick(item, ['FirstName']) ?? '').trim(),
        lastName: String(pick(item, ['LastName']) ?? '').trim(),
        email: String(pick(item, ['Email']) ?? '').trim(),
        dialCode: String(pick(item, ['DialCode']) ?? '+234').trim() || '+234',
        phoneNumber: String(pick(item, ['PhoneNumber']) ?? '').trim(),
        role: roleRaw,
        temporaryPassword: String(pick(item, ['TemporaryPassword']) ?? '').trim(),
        serviceCentreName,
        hubName,
        mustChangePassword: !(mustChangeValue === 'false' || mustChangeValue === '0' || mustChangeValue === 'no'),
      };
    });
  };

  const openStaffImportModal = () => {
    setStaffImportRows([]);
    setStaffImportPreview(null);
    setStaffImportConfirm(null);
    setStaffImportFileName('');
    setOpenModal('modal-staff-import');
  };

  const downloadStaffImportSampleExcel = () => {
    const sampleRows: StaffImportRow[] = [
      {
        firstName: 'Amina',
        lastName: 'Yusuf',
        email: 'amina.yusuf@starshipng.com',
        dialCode: '+234',
        phoneNumber: '8010001001',
        role: 'FinanceUser',
        temporaryPassword: 'Temp@Desk001',
        serviceCentreName: '',
        hubName: '',
        mustChangePassword: true,
      },
      {
        firstName: 'Tunde',
        lastName: 'Balogun',
        email: 'tunde.balogun@starshipng.com',
        dialCode: '+234',
        phoneNumber: '8010001002',
        role: 'TenantAdmin',
        temporaryPassword: 'Temp@Hub002',
        serviceCentreName: '',
        hubName: '',
        mustChangePassword: true,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StaffImportSample');
    XLSX.writeFile(workbook, 'staff-bulk-import-sample.xlsx');
  };

  const onStaffImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    let rows: StaffImportRow[] = [];
    if (lower.endsWith('.csv')) {
      const text = await file.text();
      rows = parseStaffImportCsv(text);
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      rows = normalizeStaffImportObjects(objects);
    } else {
      showToast('Please upload .csv or .xlsx file.');
      return;
    }

    if (!rows.length) {
      showToast('No import rows found in file.');
      return;
    }

    setStaffImportRows(rows);
    setStaffImportPreview(null);
    setStaffImportConfirm(null);
    setStaffImportFileName(file.name);
    showToast(`${rows.length} rows loaded from ${file.name}`);
  };

  const previewStaffImport = async () => {
    if (!staffImportRows.length) {
      showToast('Upload CSV first.');
      return;
    }
    setStaffImportBusy(true);
    const response = await apiFetch('/import/staff/preview', {
      method: 'POST',
      body: JSON.stringify({ rows: staffImportRows }),
    });
    setStaffImportBusy(false);
    if (!response.ok) {
      showToast(await readApiErrorMessage(response, 'Preview failed.'));
      return;
    }
    const result = await response.json() as StaffImportPreviewResult;
    setStaffImportPreview(result);
    setStaffImportConfirm(null);
    showToast(`Preview ready: ${result.validRows} valid, ${result.invalidRows} invalid`);
  };

  const confirmStaffImport = async () => {
    if (!staffImportRows.length) {
      showToast('Upload CSV first.');
      return;
    }
    setStaffImportBusy(true);
    const response = await apiFetch('/import/staff/confirm', {
      method: 'POST',
      body: JSON.stringify({ rows: staffImportRows }),
    });
    setStaffImportBusy(false);
    if (!response.ok) {
      showToast(await readApiErrorMessage(response, 'Import failed.'));
      return;
    }
    const result = await response.json() as StaffImportConfirmResult;
    setStaffImportConfirm(result);
    showToast(`Import complete: ${result.importedRows} succeeded, ${result.failedRows} failed`);
    await loadTemplateData();
  };
  const hasInvalidStaffPreviewRows = !!staffImportPreview && staffImportPreview.invalidRows > 0;
  const downloadFleetImportSampleExcel = () => {
    const sampleRows = [
      { registrationNumber: 'KJA-412-AA', fleetType: 'Van', ownership: 'own', make: 'Toyota', model: 'Hiace', capacity: 800, serviceCentreName: 'Ikeja SC', captain: '', description: 'Primary city van' },
      { registrationNumber: 'ABJ-221-TR', fleetType: 'Truck', ownership: 'third party', make: 'Mercedes', model: 'Actros', capacity: 2000, serviceCentreName: 'Wuse SC', captain: '', description: 'Third-party long haul' },
      { registrationNumber: 'LOS-109-VN', fleetType: 'Van', ownership: 'own', make: 'Ford', model: 'Transit', capacity: 900, serviceCentreName: 'Lekki SC', captain: '', description: 'Island corridor' },
      { registrationNumber: 'ENU-908-BK', fleetType: 'Bike', ownership: 'third', make: 'Honda', model: 'CB125', capacity: 80, serviceCentreName: '', captain: '', description: 'Express bike' },
      { registrationNumber: 'RIV-554-TR', fleetType: 'Truck', ownership: 'own', make: 'MAN', model: 'TGS', capacity: 3000, serviceCentreName: '', captain: '', description: 'Heavy interstate' },
      { registrationNumber: 'EDO-631-VN', fleetType: 'Van', ownership: 'third party', make: 'Nissan', model: 'Urvan', capacity: 750, serviceCentreName: '', captain: '', description: '3PL backup van' },
      { registrationNumber: 'DEL-774-VN', fleetType: 'Van', ownership: 'own', make: 'Peugeot', model: 'Boxer', capacity: 1000, serviceCentreName: '', captain: '', description: 'Warri lane' },
      { registrationNumber: 'ABJ-442-BK', fleetType: 'Bike', ownership: 'third', make: 'Bajaj', model: 'Boxer', capacity: 90, serviceCentreName: 'Garki SC', captain: '', description: 'CBD bike' },
      { registrationNumber: 'LOS-333-TR', fleetType: 'Truck', ownership: 'own', make: 'Volvo', model: 'FMX', capacity: 2500, serviceCentreName: '', captain: '', description: 'Cross-dock truck' },
      { registrationNumber: 'KAD-515-VN', fleetType: 'Van', ownership: 'third party', make: 'Hyundai', model: 'H350', capacity: 850, serviceCentreName: '', captain: '', description: 'Northern partner' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FleetImportSample');
    XLSX.writeFile(workbook, 'fleet-bulk-import-sample.xlsx');
  };

  const normalizeFleetImportRows = (items: Record<string, unknown>[]): FleetImportRow[] => {
    const normalizeOwnership = (value: unknown): 'own' | 'third' => {
      const token = String(value ?? '').trim().toLowerCase();
      return token.includes('third') ? 'third' : 'own';
    };
    const pick = (obj: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) {
        const found = Object.keys(obj).find((k) => k.trim().toLowerCase() === key.toLowerCase());
        if (found) return obj[found];
      }
      return '';
    };
    return items.map((item, idx) => {
      const capacityValue = Number(pick(item, ['capacity', 'weightcapacity', 'maxcapacity']) ?? 0);
      return {
        rowNumber: idx + 1,
        registrationNumber: String(pick(item, ['registrationnumber', 'plate', 'platenumber']) ?? '').trim(),
        fleetType: String(pick(item, ['fleettype', 'type', 'vehicletype']) ?? 'Bike').trim() || 'Bike',
        ownership: normalizeOwnership(pick(item, ['ownership', 'owner'])),
        make: String(pick(item, ['make']) ?? '').trim(),
        model: String(pick(item, ['model']) ?? '').trim(),
        capacity: Number.isFinite(capacityValue) && capacityValue > 0 ? Math.floor(capacityValue) : 100,
        serviceCentreName: String(pick(item, ['servicecentrename', 'servicecentre', 'service_center']) ?? '').trim(),
        captain: String(pick(item, ['captain', 'captainemail', 'captaincode']) ?? '').trim(),
        description: String(pick(item, ['description', 'notes']) ?? '').trim(),
      };
    }).filter((row) => row.registrationNumber.length > 0);
  };

  const parseFleetImportCsv = (text: string): FleetImportRow[] => {
    const normalizeOwnership = (value: string): 'own' | 'third' => {
      const token = String(value ?? '').trim().toLowerCase();
      return token.includes('third') ? 'third' : 'own';
    };
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const indexOf = (name: string) => headers.findIndex((h) => h === name);
    const plateIdx = [indexOf('registrationnumber'), indexOf('plate'), indexOf('platenumber')].find((x) => x >= 0) ?? -1;
    const typeIdx = [indexOf('fleettype'), indexOf('type'), indexOf('vehicletype')].find((x) => x >= 0) ?? -1;
    const ownershipIdx = [indexOf('ownership'), indexOf('owner')].find((x) => x >= 0) ?? -1;
    const makeIdx = indexOf('make');
    const modelIdx = indexOf('model');
    const capacityIdx = [indexOf('capacity'), indexOf('weightcapacity'), indexOf('maxcapacity')].find((x) => x >= 0) ?? -1;
    const scIdx = [indexOf('servicecentrename'), indexOf('servicecentre'), indexOf('service_center')].find((x) => x >= 0) ?? -1;
    const captainIdx = [indexOf('captain'), indexOf('captainemail'), indexOf('captaincode')].find((x) => x >= 0) ?? -1;
    const descIdx = [indexOf('description'), indexOf('notes')].find((x) => x >= 0) ?? -1;

    return lines.slice(1).map((line, i) => {
      const cols = line.split(',').map((v) => v.trim());
      const rawOwnership = ownershipIdx >= 0 ? (cols[ownershipIdx] ?? '') : '';
      const normalizedOwnership = normalizeOwnership(rawOwnership);
      const cap = Number(capacityIdx >= 0 ? (cols[capacityIdx] ?? '0') : '0');
      return {
        rowNumber: i + 1,
        registrationNumber: plateIdx >= 0 ? (cols[plateIdx] ?? '') : '',
        fleetType: typeIdx >= 0 ? (cols[typeIdx] ?? 'Bike') : 'Bike',
        ownership: normalizedOwnership,
        make: makeIdx >= 0 ? (cols[makeIdx] ?? '') : '',
        model: modelIdx >= 0 ? (cols[modelIdx] ?? '') : '',
        capacity: Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 100,
        serviceCentreName: scIdx >= 0 ? (cols[scIdx] ?? '') : '',
        captain: captainIdx >= 0 ? (cols[captainIdx] ?? '') : '',
        description: descIdx >= 0 ? (cols[descIdx] ?? '') : '',
      };
    }).filter((row) => row.registrationNumber.trim().length > 0);
  };

  const openFleetImportModal = () => {
    setFleetImportRows([]);
    setFleetImportFileName('');
    setFleetImportResult(null);
    setOpenModal('modal-fleet-import');
  };

  const onFleetImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    let rows: FleetImportRow[] = [];
    if (lower.endsWith('.csv')) {
      rows = parseFleetImportCsv(await file.text());
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: 'array' });
      const first = workbook.SheetNames[0];
      const sheet = workbook.Sheets[first];
      const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      rows = normalizeFleetImportRows(objects);
    } else {
      showToast('Please upload .csv or .xlsx file.');
      return;
    }
    if (!rows.length) {
      showToast('No fleet rows found in file.');
      return;
    }
    setFleetImportRows(rows);
    setFleetImportFileName(file.name);
    setFleetImportResult(null);
    showToast(`${rows.length} fleet rows loaded from ${file.name}`);
  };

  const submitFleetImport = async () => {
    if (!fleetImportRows.length || fleetImportBusy) return;
    setFleetImportBusy(true);
    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    const scMap = new Map(serviceCentreOptions.map((s) => [s.name.trim().toLowerCase(), s.id]));
    for (const row of fleetImportRows) {
      const scId = row.serviceCentreName ? (scMap.get(row.serviceCentreName.trim().toLowerCase()) ?? null) : null;
      const response = await apiFetch('/fleet', {
        method: 'POST',
        body: JSON.stringify({
          registrationNumber: row.registrationNumber,
          fleetType: row.fleetType,
          ownership: row.ownership,
          make: row.make || null,
          model: row.model || null,
          capacity: row.capacity,
          serviceCentreId: scId,
          captain: row.captain || null,
          description: row.description || null,
        }),
      });
      if (response.ok) {
        created++;
      } else {
        failed++;
        const msg = await readApiErrorMessage(response, 'Import failed.');
        errors.push(`Row ${row.rowNumber} (${row.registrationNumber}): ${msg}`);
      }
    }
    setFleetImportBusy(false);
    setFleetImportResult({ created, failed, errors });
    showToast(`Fleet import complete: ${created} created, ${failed} failed`);
    await loadTemplateData();
    setCurrentPage('fleet');
  };

  // ── Hub / SC bulk import ───────────────────────────────────────────
  const downloadHubImportTemplate = () => {
    const csv = 'HubName,ServiceCentreName,Location\nLagos Hub,Ikeja SC,Lagos\nAbuja Hub,Wuse SC,Abuja';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hub_sc_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onHubImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    let rows: HubImportRow[] = [];
    if (lower.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const isHeader = lines[0]?.toLowerCase().includes('hubname');
      const dataLines = isHeader ? lines.slice(1) : lines;
      rows = dataLines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return { hubName: parts[0] ?? '', serviceCentreName: parts[1] ?? '', location: parts[2] ?? null };
      }).filter((r) => r.hubName || r.serviceCentreName);
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const first = workbook.SheetNames[0];
      const sheet = workbook.Sheets[first];
      const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      rows = objects.map((obj) => {
        const findValue = (keys: string[]) => {
          const hit = Object.keys(obj).find((k) => keys.includes(k.trim().toLowerCase()));
          return hit ? String(obj[hit] ?? '').trim() : '';
        };
        return {
          hubName: findValue(['hubname', 'hub']),
          serviceCentreName: findValue(['servicecentrename', 'servicecentre', 'service_center', 'scname']),
          location: findValue(['location', 'state', 'city']) || null,
        };
      }).filter((r) => r.hubName || r.serviceCentreName);
    } else {
      showToast('Please upload .csv or .xlsx file.');
      return;
    }
    setHubImportRows(rows);
    setHubImportPreview(null);
    setHubImportConfirmed(false);
    setHubImportFileName(file.name);
    showToast(`${rows.length} rows loaded from ${file.name}`);
  };

  const previewHubImport = async () => {
    if (!hubImportRows.length) return showToast('Upload a CSV/XLSX file first.');
    setHubImportBusy(true);
    const response = await apiFetch('/import/hubs-service-centres/preview', {
      method: 'POST',
      body: JSON.stringify({ rows: hubImportRows }),
    });
    setHubImportBusy(false);
    if (!response.ok) return showToast(await readApiErrorMessage(response, 'Preview failed.'));
    const result = await response.json() as HubImportPreviewResult;
    setHubImportPreview(result);
    setHubImportConfirmed(false);
    showToast(`Preview: ${result.validRows} valid, ${result.invalidRows} invalid`);
  };

  const confirmHubImport = async () => {
    if (!hubImportRows.length) return showToast('Upload a CSV/XLSX file first.');
    const validRows = hubImportPreview?.validRows ?? hubImportRows.length;
    if (validRows === 0) return showToast('No valid rows to import.');
    setHubImportBusy(true);
    const response = await apiFetch('/import/hubs-service-centres', {
      method: 'POST',
      body: JSON.stringify({ rows: hubImportRows }),
    });
    setHubImportBusy(false);
    if (!response.ok) return showToast(await readApiErrorMessage(response, 'Import failed.'));
    const result = await response.json() as { hubsCreated?: number; serviceCentresCreated?: number; rowsSkipped?: number; errors?: string[] };
    const hubsCreated = result.hubsCreated ?? 0;
    const serviceCentresCreated = result.serviceCentresCreated ?? 0;
    const rowsSkipped = result.rowsSkipped ?? 0;
    const errors = Array.isArray(result.errors) ? result.errors : [];
    const summary = `Done: ${hubsCreated} hubs, ${serviceCentresCreated} SCs created, ${rowsSkipped} skipped`;
    if (hubsCreated === 0 && serviceCentresCreated === 0 && (rowsSkipped > 0 || errors.length > 0)) {
      showToast(`${summary}. Likely duplicates/existing records.`);
    } else {
      showToast(summary);
    }
    if (errors.length > 0) {
      showToast(`Import notes: ${errors.slice(0, 2).join(' | ')}`);
    }
    if (hubsCreated > 0 || serviceCentresCreated > 0) {
      setHubImportConfirmed(true);
      setHubImportRows([]);
      setHubImportPreview(null);
      setHubImportFileName('');
      setOpenModal(null);
      await loadTemplateData();
      setCurrentPage('hubs');
      return;
    }

    // Keep modal open when nothing was created so user can see/fix row issues.
    setHubImportConfirmed(false);
  };

  const openHubImportModal = () => {
    setHubImportRows([]);
    setHubImportPreview(null);
    setHubImportConfirmed(false);
    setHubImportFileName('');
    setOpenModal('modal-hub-import');
  };

  const importHubServiceCentres = openHubImportModal;


  const createHub = async () => {
    const name = (document.getElementById('hub-name') as HTMLInputElement | null)?.value?.trim();
    const location = (document.getElementById('hub-location') as HTMLSelectElement | null)?.value?.trim() || 'N/A';
    if (!name) return showToast('Hub name is required.');
    const response = await apiFetch('/hubs', { method: 'POST', body: JSON.stringify({ name, location }) });
    if (!(await readApiSuccess(response))) return showToast('Hub creation failed.');
    setOpenModal(null);
    showToast('Hub created successfully');
    await loadTemplateData();
    setCurrentPage('hubs');
  };

  const editHub = (hubId: number) => {
    const hub = hubOptions.find((h) => h.id === hubId);
    if (!hub) return;
    setEditingHubId(hubId);
    setOpenModal('modal-hub');
    window.setTimeout(() => {
      const nameInput = document.getElementById('hub-name') as HTMLInputElement | null;
      const locationSel = document.getElementById('hub-location') as HTMLSelectElement | null;
      if (nameInput) nameInput.value = hub.name;
      // pre-select the matching location option if possible
      if (locationSel) {
        const options = Array.from(locationSel.options);
        const match = options.find((o) => o.value.toLowerCase() === (hub.name || '').toLowerCase());
        if (match) locationSel.value = match.value;
      }
    }, 0);
  };

  const saveHub = async () => {
    if (!editingHubId) {
      await createHub();
      return;
    }

    const name = (document.getElementById('hub-name') as HTMLInputElement | null)?.value?.trim();
    const location = (document.getElementById('hub-location') as HTMLSelectElement | null)?.value?.trim() || 'N/A';
    if (!name) return showToast('Hub name is required.');
    const response = await apiFetch(`/hubs/${editingHubId}`, { method: 'PUT', body: JSON.stringify({ hubId: editingHubId, name, location }) });
    if (!(await readApiSuccess(response))) return showToast('Hub update failed.');
    setEditingHubId(null);
    setOpenModal(null);
    showToast('Hub updated successfully');
    await loadTemplateData();
    setCurrentPage('hubs');
  };

  const createServiceCentre = async () => {
    const name = (document.getElementById('sc-name') as HTMLInputElement | null)?.value?.trim();
    const hubId = Number((document.getElementById('sc-parent-hub') as HTMLSelectElement | null)?.value?.trim() ?? '0');
    if (!name || !hubId) return showToast('Service centre name and parent hub are required.');
    const response = await apiFetch('/service-centres', { method: 'POST', body: JSON.stringify({ name, hubId }) });
    if (!(await readApiSuccess(response))) return showToast('Service centre creation failed.');
    setOpenModal(null);
    showToast('Service centre created successfully');
    await loadTemplateData();
    setCurrentPage('service-centres');
  };

  const editServiceCentre = (serviceCentreId: number) => {
    const serviceCentre = serviceCentreRecords.find((s) => s.id === serviceCentreId);
    if (!serviceCentre) return;
    setEditingServiceCentreId(serviceCentreId);
    setOpenModal('modal-sc');
    window.setTimeout(() => {
      const nameInput = document.getElementById('sc-name') as HTMLInputElement | null;
      const hubSelect = document.getElementById('sc-parent-hub') as HTMLSelectElement | null;
      if (nameInput) nameInput.value = serviceCentre.name;
      if (hubSelect) hubSelect.value = String(serviceCentre.hubId);
    }, 0);
  };

  const saveServiceCentre = async () => {
    if (!editingServiceCentreId) {
      await createServiceCentre();
      return;
    }

    const name = (document.getElementById('sc-name') as HTMLInputElement | null)?.value?.trim();
    const hubId = Number((document.getElementById('sc-parent-hub') as HTMLSelectElement | null)?.value?.trim() ?? '0');
    if (!name || !hubId) return showToast('Service centre name and parent hub are required.');
    const response = await apiFetch(`/service-centres/${editingServiceCentreId}`, {
      method: 'PUT',
      body: JSON.stringify({ serviceCentreId: editingServiceCentreId, name, hubId }),
    });
    if (!(await readApiSuccess(response))) return showToast('Service centre update failed.');
    setEditingServiceCentreId(null);
    setOpenModal(null);
    showToast('Service centre updated successfully');
    await loadTemplateData();
    setCurrentPage('service-centres');
  };

  const suspendStaff = async (staffId?: number, name?: string) => {
    if (!staffId) return showToast('Invalid staff record.');
    const response = await apiFetch(`/staff/${staffId}/suspend`, { method: 'PUT' });
    if (!(await readApiSuccess(response))) return showToast('Unable to suspend staff now.');
    showToast(name ? `${name} suspended` : 'Staff suspended');
    await loadTemplateData();
  };

  const unsuspendStaff = async (staffId?: number, name?: string) => {
    if (!staffId) return showToast('Invalid staff record.');
    const response = await apiFetch(`/staff/${staffId}/unsuspend`, { method: 'PUT' });
    if (!(await readApiSuccess(response))) return showToast('Unable to unsuspend staff now.');
    showToast(name ? `${name} unsuspended` : 'Staff unsuspended');
    await loadTemplateData();
  };

  const createFleet = async () => {
    const plate = (document.getElementById('fleet-plate') as HTMLInputElement | null)?.value?.trim();
    const type = (document.getElementById('fleet-type') as HTMLSelectElement | null)?.value?.trim() || 'Bike';
    const ownership = (document.getElementById('fleet-ownership') as HTMLSelectElement | null)?.value?.trim() || 'own';
    const serviceCentreId = (document.getElementById('fleet-service-centre') as HTMLSelectElement | null)?.value?.trim();
    const captain = (document.getElementById('fleet-captain') as HTMLSelectElement | null)?.value?.trim() || '';
    const description = fleetYear ? `Year: ${fleetYear}` : '';
    if (!plate) return showToast('Plate number is required.');
    if (!fleetMake || !fleetModel) return showToast('Vehicle make and model are required.');
    const response = await apiFetch('/fleet', {
      method: 'POST',
      body: JSON.stringify({
        registrationNumber: plate,
        fleetType: type,
        ownership,
        make: fleetMake,
        model: fleetModel,
        capacity: type === 'Truck' ? 2000 : type === 'Van' ? 800 : 30,
        serviceCentreId: serviceCentreId ? Number(serviceCentreId) : null,
        captain,
        description
      }),
    });
    if (!(await readApiSuccess(response))) {
      return showToast(await readApiErrorMessage(response));
    }
    setOpenModal(null);
    showToast('Vehicle registered successfully');
    await loadTemplateData();
    setCurrentPage('fleet');
    setFleetMake('');
    setFleetModel('');
    setFleetYear('');
  };

  const editFleet = (fleetId: number) => {
    const fleet = fleetRecords.find((f) => f.id === fleetId);
    if (!fleet) return;
    setEditingFleetId(fleetId);
    // Pre-fill React-controlled state before opening modal
    setFleetMake(fleet.make || '');
    setFleetModel(fleet.model || '');
    setFleetYear('');
    setOpenModal('modal-vehicle');
    window.setTimeout(() => {
      const plateInput = document.getElementById('fleet-plate') as HTMLInputElement | null;
      const typeSelect = document.getElementById('fleet-type') as HTMLSelectElement | null;
      const ownershipSelect = document.getElementById('fleet-ownership') as HTMLSelectElement | null;
      const scSelect = document.getElementById('fleet-service-centre') as HTMLSelectElement | null;
      const captainSelect = document.getElementById('fleet-captain') as HTMLSelectElement | null;
      if (plateInput) plateInput.value = fleet.plate;
      if (typeSelect) typeSelect.value = fleet.type;
      if (ownershipSelect) ownershipSelect.value = fleet.ownership || 'own';
      if (scSelect) scSelect.value = fleet.serviceCentreId ? String(fleet.serviceCentreId) : '';
      if (captainSelect) captainSelect.value = fleet.captainId ? String(fleet.captainId) : '';
    }, 50);
  };

  const saveFleet = async () => {
    if (!editingFleetId) {
      await createFleet();
      return;
    }
    const plate = (document.getElementById('fleet-plate') as HTMLInputElement | null)?.value?.trim() || '';
    const type = (document.getElementById('fleet-type') as HTMLSelectElement | null)?.value?.trim() || 'Bike';
    const ownership = (document.getElementById('fleet-ownership') as HTMLSelectElement | null)?.value?.trim() || 'own';
    const serviceCentreId = (document.getElementById('fleet-service-centre') as HTMLSelectElement | null)?.value?.trim();
    const captain = (document.getElementById('fleet-captain') as HTMLSelectElement | null)?.value?.trim() || '';
    const description = fleetYear ? `Year: ${fleetYear}` : '';
    if (!plate) return showToast('Plate number is required.');
    const response = await apiFetch(`/fleet/${editingFleetId}`, {
      method: 'PUT',
      body: JSON.stringify({
        fleetId: editingFleetId,
        registrationNumber: plate,
        fleetType: type,
        make: fleetMake,
        model: fleetModel,
        ownership,
        serviceCentreId: serviceCentreId ? Number(serviceCentreId) : null,
        capacity: type === 'Truck' ? 2000 : type === 'Van' ? 800 : 30,
        description,
        captain,
        isActive: null
      }),
    });
    if (!(await readApiSuccess(response))) return showToast('Fleet update failed.');
    setEditingFleetId(null);
    setOpenModal(null);
    showToast('Fleet updated successfully');
    await loadTemplateData();
    setCurrentPage('fleet');
  };

  const toggleFleetStatus = async (fleetId: number) => {
    const fleet = fleetRecords.find((f) => f.id === fleetId);
    if (!fleet) return;
    const nextActive = fleet.status !== 'active';
    const response = await apiFetch(`/fleet/${fleetId}`, {
      method: 'PUT',
      body: JSON.stringify({ fleetId, registrationNumber: fleet.plate, fleetType: fleet.type, isActive: nextActive }),
    });
    if (!(await readApiSuccess(response))) return showToast('Unable to update fleet status.');
    showToast(nextActive ? 'Fleet activated' : 'Fleet deactivated');
    await loadTemplateData();
  };

  const createMerchant = async () => {
    const name = (document.getElementById('merchant-name') as HTMLInputElement | null)?.value?.trim();
    const contact = (document.getElementById('merchant-contact') as HTMLInputElement | null)?.value?.trim() || '';
    const dialCode = (document.getElementById('merchant-phone-code') as HTMLSelectElement | null)?.value?.trim() || '';
    const phone = (document.getElementById('merchant-phone-number') as HTMLInputElement | null)?.value?.trim();
    const email = (document.getElementById('merchant-email') as HTMLInputElement | null)?.value?.trim();
    const type = (document.getElementById('merchant-type') as HTMLSelectElement | null)?.value?.trim() || 'Ecommerce';
    const credit = Number((document.getElementById('merchant-credit') as HTMLInputElement | null)?.value ?? '0');
    if (!name || !phone || !email) return showToast('Name, phone, and email are required.');
    const response = await apiFetch('/merchants', {
      method: 'POST',
      body: JSON.stringify({ name, contact, email, dialCode, phoneNumber: phone, type, creditLimit: credit }),
    });
    if (!(await readApiSuccess(response))) return showToast('Merchant onboarding failed.');
    setOpenModal(null);
    showToast('Merchant onboarded successfully');
    await loadTemplateData();
    setCurrentPage('merchants');
  };

  const editMerchant = (merchantId: number) => {
    const merchant = customerRecords.find((m) => m.id === merchantId);
    if (!merchant) return;
    setEditingMerchantId(merchantId);
    setOpenModal('modal-merchant');
    window.setTimeout(() => {
      const nameInput = document.getElementById('merchant-name') as HTMLInputElement | null;
      const contactInput = document.getElementById('merchant-contact') as HTMLInputElement | null;
      const emailInput = document.getElementById('merchant-email') as HTMLInputElement | null;
      const typeSelect = document.getElementById('merchant-type') as HTMLSelectElement | null;
      if (nameInput) nameInput.value = merchant.name;
      if (contactInput) contactInput.value = merchant.contact;
      if (emailInput) emailInput.value = merchant.email;
      if (typeSelect) {
        const normalizedType = (merchant.type ?? '').trim().toLowerCase();
        typeSelect.value = normalizedType === 'enterprise' || normalizedType === 'corporate' ? 'Enterprise' : 'Ecommerce';
      }
    }, 0);
  };

  const saveMerchant = async () => {
    if (!editingMerchantId) {
      await createMerchant();
      return;
    }
    const name = (document.getElementById('merchant-name') as HTMLInputElement | null)?.value?.trim() || '';
    const contact = (document.getElementById('merchant-contact') as HTMLInputElement | null)?.value?.trim() || '';
    const dialCode = (document.getElementById('merchant-phone-code') as HTMLSelectElement | null)?.value?.trim() || '';
    const phone = (document.getElementById('merchant-phone-number') as HTMLInputElement | null)?.value?.trim() || '';
    const email = (document.getElementById('merchant-email') as HTMLInputElement | null)?.value?.trim() || '';
    const type = (document.getElementById('merchant-type') as HTMLSelectElement | null)?.value?.trim() || 'Ecommerce';
    if (!name || !phone || !email) return showToast('Name, phone, and email are required.');
    const response = await apiFetch(`/merchants/${editingMerchantId}`, {
      method: 'PUT',
      body: JSON.stringify({ merchantId: editingMerchantId, name, contact, email, dialCode, phoneNumber: phone, type, isActive: null }),
    });
    if (!(await readApiSuccess(response))) return showToast('Merchant update failed.');
    setEditingMerchantId(null);
    setOpenModal(null);
    showToast('Merchant updated successfully');
    await loadTemplateData();
    setCurrentPage('merchants');
  };

  const toggleMerchantStatus = async (merchantId: number) => {
    const merchant = customerRecords.find((m) => m.id === merchantId);
    if (!merchant) return;
    const nextActive = merchant.status !== 'active';
    const response = await apiFetch(`/merchants/${merchantId}`, {
      method: 'PUT',
      body: JSON.stringify({
        merchantId,
        name: merchant.name,
        contact: merchant.contact,
        email: merchant.email,
        dialCode: '',
        phoneNumber: '',
        type: merchant.type,
        isActive: nextActive,
      }),
    });
    if (!(await readApiSuccess(response))) return showToast('Unable to update merchant status.');
    showToast(nextActive ? 'Merchant reactivated' : 'Merchant suspended');
    await loadTemplateData();
  };

  useEffect(() => {
    const container = document.getElementById('content-area');
    if (!container) return;

    const onContentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const actionNode = target?.closest<HTMLElement>('[data-action]');
      if (!actionNode) return;

      const action = actionNode.getAttribute('data-action');
      const id = Number(actionNode.getAttribute('data-id') ?? '0');

      if (action === 'initialize-subscription-payment') {
        void initializeSubscriptionPayment();
        return;
      }
      if (action === 'import-hubs-scs') {
        void importHubServiceCentres();
        return;
      }
      if (action === 'import-staff') {
        openStaffImportModal();
        return;
      }
      if (action === 'import-fleet') {
        openFleetImportModal();
        return;
      }
      if (action === 'edit-pricing-zone') {
        const zoneLabel = actionNode.getAttribute('data-zone-label') ?? '';
        if (!zoneLabel) return;
        setZoneModalMode('edit');
        setEditingZoneLabel(zoneLabel);
        setZoneFormName(zoneLabel);
        const coverageInput = Array.from(document.querySelectorAll<HTMLInputElement>('[data-pricing-zone-coverage]'))
          .find((node) => node.getAttribute('data-pricing-zone-coverage') === zoneLabel);
        const baseRateInput = Array.from(document.querySelectorAll<HTMLInputElement>('[data-pricing-zone-base-rate]'))
          .find((node) => node.getAttribute('data-pricing-zone-base-rate') === zoneLabel);
        setZoneFormCoverage(coverageInput?.value ?? '');
        setZoneFormBaseRate(baseRateInput?.value ?? '');
        setOpenModal('modal-zone');
        return;
      }

      if (!id) return;

      if (action === 'edit-hub') {
        editHub(id);
      } else if (action === 'edit-service-centre') {
        editServiceCentre(id);
      } else if (action === 'edit-staff') {
        editStaff(id);
      } else if (action === 'reset-staff-password') {
        resetStaffPassword(id);
      } else if (action === 'edit-fleet') {
        editFleet(id);
      } else if (action === 'toggle-fleet-status') {
        void toggleFleetStatus(id);
      } else if (action === 'view-customer') {
        showToast('Customer profile view is coming next.');
      } else if (action === 'edit-customer') {
        editMerchant(id);
      } else if (action === 'toggle-customer-status') {
        void toggleMerchantStatus(id);
      }
    };

    container.addEventListener('click', onContentClick);
    return () => {
      container.removeEventListener('click', onContentClick);
    };
  }, [pageHtml, editHub, editServiceCentre, editStaff, resetStaffPassword, editFleet, editMerchant, fleetRecords, customerRecords]);

  const saveTenantSettings = async () => {
    const name = (document.getElementById('settings-company-name') as HTMLInputElement | null)?.value?.trim();
    const brandColorInput = (document.getElementById('settings-brand-color') as HTMLInputElement | null)?.value?.trim();
    const logoUrl = (document.getElementById('settings-logo-url') as HTMLInputElement | null)?.value?.trim() || null;
    const tagline = (document.getElementById('settings-tagline') as HTMLInputElement | null)?.value?.trim() || null;
    const adminEmail = (document.getElementById('settings-admin-email') as HTMLInputElement | null)?.value?.trim() || null;
    const adminPhone = (document.getElementById('settings-admin-phone') as HTMLInputElement | null)?.value?.trim() || null;
    const country = (document.getElementById('settings-country') as HTMLSelectElement | null)?.value?.trim() || null;
    
    const brandColor = normalizeHexColor(brandColorInput ?? tenantSettings.brandColor);
    if (!name) return showToast('Company name is required.');
    if (!brandColor) return showToast('Brand color must be a valid hex value.');
    const response = await apiFetch('/settings', { method: 'PUT', body: JSON.stringify({ name, brandColor, logoUrl, tagline, adminEmail, adminPhone, country }) });
    if (!(await readApiSuccess(response))) return showToast('Unable to save settings now.');
    showToast('Settings saved!');
    await loadTemplateData();
  };

  const savePricing = async () => {
    if (isFleetTenant) {
      const modifiers: Record<string, string> = {};
      document.querySelectorAll<HTMLInputElement>('[data-pricing-modifier]').forEach((input) => {
        const key = input.getAttribute('data-pricing-modifier') ?? '';
        if (key) modifiers[key] = input.value.trim();
      });
      document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-pricing-rule]').forEach((field) => {
        const key = field.getAttribute('data-pricing-rule') ?? '';
        if (key) modifiers[key] = field.value.trim();
      });

      const fleetZones = ['Fleet Trip Fees'];
      const fleetMatrix: PricingMatrixRow[] = [{ origin: 'Trip Fee', values: ['NGN 0'] }];
      const response = await apiFetch('/pricing', { method: 'PUT', body: JSON.stringify({ zones: fleetZones, matrix: fleetMatrix, modifiers }) });
      if (!(await readApiSuccess(response))) return showToast(await readApiErrorMessage(response, 'Unable to save fleet fees now.'));
      showToast('Fleet fees saved!');
      await loadTemplateData();
      return;
    }

    const matrixRows = Array.from(document.querySelectorAll('.matrix-table tbody tr'));
    const normalizeMoneyInput = (raw: string) => {
      const cleaned = (raw || '')
        .replace(/NGN/gi, '')
        .replace(/[?₦]/g, '')
        .replace(/,/g, '')
        .trim();
      return cleaned || '0';
    };
    const zoneLabels = Array.from(document.querySelectorAll<HTMLElement>('[data-pricing-zone]'))
      .map((el) => el.textContent?.trim() || '');

    const expectedZoneCount = Number(document.querySelector('[data-pricing-matrix-table]')?.getAttribute('data-pricing-zone-count') ?? '0');
    if (expectedZoneCount > 0 && zoneLabels.length !== expectedZoneCount) {
      return showToast('Zone columns mismatch. Refresh the page and avoid adding/removing zone columns.');
    }

    const matrix: PricingMatrixRow[] = matrixRows.map((rowEl, rowIndex) => {
      const originEl = rowEl.querySelector<HTMLElement>('[data-pricing-weight-band]');
      const origin = originEl?.textContent?.trim() || `Row ${rowIndex + 1}`;
      
      const values = zoneLabels.map((_, colIndex) => {
        const cell = rowEl.querySelector<HTMLElement>(`[data-pricing-cell][data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`);
        if (!cell) return '0';
        return normalizeMoneyInput(cell.textContent || '');
      });

      return { origin, values };
    });

    const modifiers: Record<string, string> = {};
    document.querySelectorAll<HTMLInputElement>('[data-pricing-modifier]').forEach((input) => {
      const key = input.getAttribute("data-pricing-modifier");
      if (key) modifiers[key] = input.value.trim();
    });
    document.querySelectorAll<HTMLInputElement>("[data-pricing-zone-coverage]").forEach((input) => {
      const zoneLabel = input.getAttribute("data-pricing-zone-coverage");
      if (zoneLabel) modifiers[`Zone coverage: ${zoneLabel}`] = input.value.trim();
    });
    document.querySelectorAll<HTMLInputElement>('[data-pricing-zone-base-rate]').forEach((input) => {
      const zoneLabel = input.getAttribute('data-pricing-zone-base-rate');
      if (zoneLabel) modifiers[`Zone base rate: ${zoneLabel}`] = input.value.trim();
    });
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-pricing-rule]').forEach((field) => {
      const key = field.getAttribute('data-pricing-rule');
      if (key) modifiers[key] = field.value.trim();
    });
    const hasDuplicateZone = new Set(zoneLabels.map((label) => label.toLowerCase())).size !== zoneLabels.length;
    if (!zoneLabels.length || !matrix.length || hasDuplicateZone) {
      return showToast(hasDuplicateZone ? 'Zone names must be unique.' : 'Pricing matrix is incomplete.');
    }
    const hasInvalidRow = matrix.some((row) => row.values.length !== zoneLabels.length);
    if (hasInvalidRow) {
      return showToast('Pricing matrix is incomplete.');
    }
    const response = await apiFetch('/pricing', { method: 'PUT', body: JSON.stringify({ zones: zoneLabels, matrix, modifiers }) });
    if (!(await readApiSuccess(response))) return showToast(await readApiErrorMessage(response, 'Unable to save pricing now.'));
    showToast('Pricing saved!');
    await loadTemplateData();
  };

  const testPricingCalculation = async () => {
    const originId = (document.getElementById('calc-origin') as HTMLSelectElement)?.value;
    const destinationId = (document.getElementById('calc-destination') as HTMLSelectElement)?.value;
    const weight = parseFloat((document.getElementById('calc-weight') as HTMLInputElement)?.value || '0');
    const length = parseFloat((document.getElementById('calc-length') as HTMLInputElement)?.value || '0');
    const width = parseFloat((document.getElementById('calc-width') as HTMLInputElement)?.value || '0');
    const height = parseFloat((document.getElementById('calc-height') as HTMLInputElement)?.value || '0');
    
    if (!originId || !destinationId || isNaN(weight) || weight <= 0) {
      showToast('Please select origin, destination and a valid weight.');
      return;
    }

    try {
      const query = `DepartureStationId=${originId}&DestinationStationId=${destinationId}&Weight=${weight}&Length=${length}&Width=${width}&Height=${height}`;
      const response = await apiFetchAbsolute(`/api/v1/Pricing/quote?${query}`);
      if (!response.ok) {
        const err = await response.text();
        showToast(err || 'Calculation failed');
        return;
      }

      const data = await response.json();
      
      const resZone = document.getElementById('res-zone');
      const resRoute = document.getElementById('res-route');
      const resEta = document.getElementById('res-eta');
      const resBase = document.getElementById('res-base');
      const resVat = document.getElementById('res-vat');
      const resIns = document.getElementById('res-insurance');
      const resTotal = document.getElementById('res-total');
      const resDiv = document.getElementById('calc-result');

      if (resZone) resZone.textContent = data.zoneName || 'Resolved';
      if (resRoute) resRoute.textContent = data.routeCombination || `${originId} -> ${destinationId}`;
      if (resEta) resEta.textContent = data.estimatedHoursOfArrival != null ? String(data.estimatedHoursOfArrival) : 'N/A';
      if (resBase) resBase.textContent = `₦${(data.basePrice || 0).toLocaleString()}`;
      if (resVat) resVat.textContent = `₦${(data.vat || 0).toLocaleString()}`;
      if (resIns) resIns.textContent = `₦${(data.insurance || 0).toLocaleString()}`;
      if (resTotal) resTotal.textContent = `₦${(data.grandTotal || 0).toLocaleString()}`;
      if (resDiv) resDiv.style.display = 'block';
    } catch (e) {
      showToast('Network error during calculation.');
    }
  };

  useEffect(() => {
    (window as any).testPricingCalculation = testPricingCalculation;
  }, [testPricingCalculation]);


  const addPricingZone = (zoneLabel?: string, coverageLabel?: string, baseRateValue?: string) => {
    const table = document.querySelector<HTMLTableElement>('[data-pricing-matrix-table]');
    if (!table) return showToast('Pricing matrix is not ready yet.');

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return showToast('Pricing matrix header is missing.');

    const zoneCount = headerRow.querySelectorAll<HTMLElement>('[data-pricing-zone]').length;
    const nextZoneNumber = zoneCount + 1;
    const finalLabel = (zoneLabel ?? '').trim() || `Zone ${nextZoneNumber}`;

    const th = document.createElement('th');
    th.setAttribute('data-pricing-zone', '');
    th.setAttribute('data-zone-index', String(zoneCount));
    const span = document.createElement('span');
    span.setAttribute('data-pricing-zone-label', '');
    span.setAttribute('contenteditable', 'true');
    span.setAttribute('spellcheck', 'false');
    span.textContent = finalLabel;
    th.appendChild(span);
    headerRow.appendChild(th);

    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    rows.forEach((row, rowIndex) => {
      const td = row.insertCell(-1);
      td.className = 'editable';
      td.setAttribute('contenteditable', 'true');
      td.setAttribute('spellcheck', 'false');
      td.setAttribute('data-pricing-cell', '');
      td.setAttribute('data-row-index', String(rowIndex));
      td.setAttribute('data-col-index', String(zoneCount));
      td.textContent = 'NGN 0';
      row.appendChild(td);
    });

    const baseTableBody = document.querySelector<HTMLTableSectionElement>('[data-pricing-base-body]');
    if (baseTableBody) {
      const baseRow = document.createElement('tr');
      const zoneTd = document.createElement('td');
      zoneTd.innerHTML = `<span class="badge own">${finalLabel}</span>`;
      const coverageTd = document.createElement('td');
      coverageTd.style.fontSize = '11px';
      const resolvedCoverage = (coverageLabel || '').trim() || 'Extended delivery coverage';
      coverageTd.textContent = resolvedCoverage;
      const coverageHidden = document.createElement('input');
      coverageHidden.type = 'hidden';
      coverageHidden.setAttribute('data-pricing-zone-coverage', finalLabel);
      coverageHidden.value = resolvedCoverage;
      coverageTd.appendChild(coverageHidden);
      const rateTd = document.createElement('td');
      rateTd.className = 'td-mono';
      const resolvedBaseRate = (baseRateValue || '').trim() || 'NGN 0';
      rateTd.textContent = resolvedBaseRate;
      const baseHidden = document.createElement('input');
      baseHidden.type = 'hidden';
      baseHidden.setAttribute('data-pricing-zone-base-rate', finalLabel);
      baseHidden.value = resolvedBaseRate;
      rateTd.appendChild(baseHidden);
      const actionTd = document.createElement('td');
      actionTd.innerHTML = `
        <button class="icon-btn" data-action="edit-pricing-zone" data-zone-label="${finalLabel.replace(/"/g, '&quot;')}" title="Edit zone">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg>
        </button>`;
      baseRow.appendChild(zoneTd);
      baseRow.appendChild(coverageTd);
      baseRow.appendChild(rateTd);
      baseRow.appendChild(actionTd);
      baseTableBody.appendChild(baseRow);
    }

    showToast(`${finalLabel} added`);
  };


  const createPricingZoneFromModal = () => {
    const zoneName = zoneFormName.trim();
    if (!zoneName) return showToast('Zone name is required.');

    const oldLabel = editingZoneLabel.trim();
    const coverageInput = document.querySelector(`[data-pricing-zone-coverage="${oldLabel}"]`) as HTMLInputElement | null;
    const baseRateInput = document.querySelector(`[data-pricing-zone-base-rate="${oldLabel}"]`) as HTMLInputElement | null;
    if (coverageInput) {
      coverageInput.value = zoneFormCoverage;
      if (zoneName !== oldLabel) coverageInput.setAttribute('data-pricing-zone-coverage', zoneName);
    }
    if (baseRateInput) {
      baseRateInput.value = zoneFormBaseRate;
      if (zoneName !== oldLabel) baseRateInput.setAttribute('data-pricing-zone-base-rate', zoneName);
    }

    if (zoneName !== oldLabel) {
      document.querySelectorAll<HTMLElement>('[data-pricing-zone]').forEach((th) => {
        if ((th.textContent || '').trim() === oldLabel) th.textContent = zoneName;
      });
      document.querySelectorAll<HTMLElement>('tbody[data-pricing-base-body] .badge.own').forEach((badge) => {
        if ((badge.textContent || '').trim() === oldLabel) badge.textContent = zoneName;
      });
      document.querySelectorAll<HTMLElement>('[data-action="edit-pricing-zone"]').forEach((btn) => {
        const label = (btn.getAttribute('data-zone-label') || '').trim();
        if (label === oldLabel) btn.setAttribute('data-zone-label', zoneName);
      });
    }

    showToast(`${zoneName} updated locally. Save changes to persist.`);
    closeZoneModal();
  };

  const closeZoneModal = () => {
    setOpenModal(null);
    setZoneModalMode('add');
    setEditingZoneLabel('');
    setZoneFormName('');
    setZoneFormCoverage('');
    setZoneFormBaseRate('');
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
      const response = await apiFetchAbsolute('/api/v1/Account/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: profilePasswordForm.currentPassword,
          newPassword: profilePasswordForm.newPassword,
        }),
      });

      if (response.ok) {
        showToast('Password updated successfully.');
        setProfilePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setOpenModal(null);
      } else {
        const msg = await readApiErrorMessage(response, 'Failed to update password.');
        showToast(msg);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Network error.');
    } finally {
      setProfileBusy(false);
    }
  };

  const initializeSubscriptionPayment = async () => {
    const response = await apiFetchAbsolute('/api/v1/tenant/subscription/pay', { method: 'POST' });
    if (!response.ok) {
      showToast('Unable to initialize subscription payment.');
      return;
    }

    const payload = await response.json() as InitializePaymentResult;
    if (!payload?.authorizationUrl) {
      showToast('Payment link unavailable right now.');
      return;
    }

    const dueCount = subscriptionInvoices.filter((i) => i.status === 'Issued' || i.status === 'Failed').length;
    window.open(payload.authorizationUrl, '_blank', 'noopener,noreferrer');
    showToast(`Payment link opened (${dueCount} due invoice${dueCount === 1 ? '' : 's'})`);
    await loadTemplateData();
  };

  useEffect(() => {
    window.showPage = (name: string) => {
      if (validPages.includes(name as PageKey)) setCurrentPage(name as PageKey);
    };
    window.openModal = (id: string) => {
      if (id === 'modal-staff') {
        setEditingStaffId(null);
        setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
      }
      if (id === 'modal-hub') setEditingHubId(null);
      if (id === 'modal-sc') setEditingServiceCentreId(null);
      if (id === 'modal-vehicle') {
        setEditingFleetId(null);
        setFleetMake('');
        setFleetModel('');
        setFleetYear('');
      }
      if (id === 'modal-merchant') setEditingMerchantId(null);
      if (id === 'modal-zone') {
        setZoneModalMode('add');
        setEditingZoneLabel('');
        setZoneFormName('');
        setZoneFormCoverage('');
        setZoneFormBaseRate('');
      }
      if (id === 'modal-hub-import') openHubImportModal();
      else if (id === 'modal-fleet-import') openFleetImportModal();
      else setOpenModal((id as ModalId) ?? null);
    };
    window.closeModal = () => setOpenModal(null);
    window.doAction = (_modalId: string, msg: string) => {
      setOpenModal(null);
      showToast(msg);
    };
    window.toast = (msg: string) => showToast(msg);
    window.setDashboardRange = (range: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set('range', range);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      void loadTemplateData();
    };
    window.exportDashboardData = () => {
      const d = (tenantTemplateData as any)?.dashboardStats;
      if (!d) return showToast('No dashboard data to export.');
      const csv = [
        ['Metric', 'Value'],
        ['Total Shipments', d.totalShipments],
        ['Active Staff', d.activeStaffCount],
        ['Hubs', d.hubsCount],
        ['Revenue (NGN)', d.revenue],
        ['Delivery Success Rate', `${d.deliverySuccessRate}%`],
        ['Dispatch Rate', `${d.dispatchRate}%`],
        ['COD Pending', d.codPendingAmount],
        ['Range', d.range],
      ].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-summary-${d.range}-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Dashboard summary exported');
    };
    window.suspendStaff = (id: number, name?: string) => {
      void suspendStaff(id, name);
    };
    window.unsuspendStaff = (id: number, name?: string) => {
      void unsuspendStaff(id, name);
    };
    window.saveTenantSettings = () => {
      void saveTenantSettings();
    };
    window.savePricing = () => {
      void savePricing();
    };
    window.onCalcOriginChange = (originId: string) => {
      const destinationSelect = document.getElementById('calc-destination') as HTMLSelectElement | null;
      if (!destinationSelect) return;
      const selectedOrigin = Number(originId || '0');
      const currentDestination = destinationSelect.value;
      let hasCurrentDestination = false;

      Array.from(destinationSelect.options).forEach((option) => {
        if (!option.value) {
          option.hidden = false;
          return;
        }

        const validOriginsRaw = option.getAttribute('data-valid-origins') || '';
        const validOrigins = validOriginsRaw
          .split(',')
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0);

        const allowed = selectedOrigin > 0 && validOrigins.includes(selectedOrigin);
        option.hidden = !allowed;
        if (allowed && option.value === currentDestination) {
          hasCurrentDestination = true;
        }
      });

      if (!hasCurrentDestination) {
        destinationSelect.value = '';
      }
    };
    window.saveTenantPermissions = async () => {
      const table = document.getElementById('permissions-table');
      if (!table) return;
      const payload: { roleName: string; permissionKey: string; isEnabled: boolean }[] = [];
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(tr => {
        const key = tr.getAttribute('data-key');
        if (!key) return;
        const inputs = tr.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(input => {
          const cb = input as HTMLInputElement;
          const role = cb.getAttribute('data-role');
          if (role) {
            payload.push({ roleName: role, permissionKey: key, isEnabled: cb.checked });
          }
        });
      });

      const response = await apiFetch('/permissions', {
        method: 'POST',
        body: JSON.stringify({ permissions: payload })
      });
      if (!(await readApiSuccess(response))) return showToast('Failed to save permissions.');
      showToast('Permissions saved successfully.');
      await loadTemplateData();
    };
    window.addPricingZone = () => {
        setZoneModalMode('add');
        setEditingZoneLabel('');
        setZoneFormName('');
        setZoneFormCoverage('');
        setZoneFormBaseRate('');
        setOpenModal('modal-zone');
      };
    window.editHub = (id: number) => {
      editHub(id);
    };
    window.editServiceCentre = (id: number) => {
      editServiceCentre(id);
    };
    window.filterFinanceWallets = (query: string) => {
      const needle = (query || '').trim().toLowerCase();
      const rows = document.querySelectorAll<HTMLTableRowElement>('[data-finance-wallet-row]');
      rows.forEach((row) => {
        const hay = (row.getAttribute('data-search') || '').toLowerCase();
        row.style.display = !needle || hay.includes(needle) ? '' : 'none';
      });
    };
    window.setFleetOwnershipFilter = (value: 'own' | 'third' | 'both') => {
      setFleetOwnershipFilter(value);
      setTenantTemplateData({ filters: { fleetOwnership: value } });
      setRefreshKey((prev) => prev + 1);
    };
    const searchDbFallback = async (needle: string, categories: string[], label: string) => {
      if (!needle || needle.length < 2) return;
      try {
        const response = await apiFetch(`/search?q=${encodeURIComponent(needle)}&limit=20`);
        if (!response.ok) return;
        const payload = await response.json() as { results?: Array<{ category?: string; label?: string }> };
        const hits = (payload.results ?? []).filter((r) => categories.includes(String(r.category || '').toLowerCase()));
        if (hits.length > 0) {
          showToast(`Found ${hits.length} ${label} result(s) in database. Refine search or use global search for full list.`);
        }
      } catch {
        // Ignore fallback search errors to keep local filter responsive.
      }
    };
    window.applyStaffFilter = () => {
      const input = document.getElementById('staff-search-input') as HTMLInputElement | null;
      const roleSelect = document.getElementById('staff-role-filter') as HTMLSelectElement | null;
      const scopeSelect = document.getElementById('staff-scope-filter') as HTMLSelectElement | null;
      const needle = (input?.value || '').trim().toLowerCase();
      const roleNeedle = (roleSelect?.value || '').trim().toLowerCase();
      const scopeNeedle = (scopeSelect?.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll<HTMLTableRowElement>('.staff-row');
      let visible = 0;
      rows.forEach((row) => {
        const hay = (row.getAttribute('data-search') || '').toLowerCase();
        const roleHay = (row.getAttribute('data-role') || '').toLowerCase();
        const scopeHay = (row.getAttribute('data-scope') || '').toLowerCase();
        const roleMatch = !roleNeedle || roleHay === roleNeedle;
        const scopeMatch = !scopeNeedle || scopeHay.includes(scopeNeedle);
        const textMatch = !needle || hay.includes(needle);
        const show = roleMatch && scopeMatch && textMatch;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('staff-empty-row');
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
      const count = document.getElementById('staff-search-count');
      if (count) count.textContent = `${visible} staff`;
      if (visible === 0) void searchDbFallback(needle, ['staff', 'captains'], 'staff');
    };
    window.applyHubFilter = () => {
      const input = document.getElementById('hub-search-input') as HTMLInputElement | null;
      const stateSelect = document.getElementById('hub-state-filter') as HTMLSelectElement | null;
      const needle = (input?.value || '').trim().toLowerCase();
      const stateNeedle = (stateSelect?.value || '').trim().toLowerCase();
      const cards = document.querySelectorAll<HTMLElement>('.hub-card');
      let visible = 0;
      cards.forEach((card) => {
        const hay = (card.getAttribute('data-search') || '').toLowerCase();
        const stateHay = (card.getAttribute('data-state') || '').toLowerCase();
        const stateMatch = !stateNeedle || stateHay === stateNeedle;
        const textMatch = !needle || hay.includes(needle);
        const show = stateMatch && textMatch;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('hub-empty-row');
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
      const count = document.getElementById('hub-search-count');
      if (count) count.textContent = `${visible} hubs`;
      if (visible === 0) void searchDbFallback(needle, ['hubs'], 'hub');
    };
    window.applyServiceCentreFilter = () => {
      const input = document.getElementById('service-centre-search-input') as HTMLInputElement | null;
      const hubSelect = document.getElementById('service-centre-hub-filter') as HTMLSelectElement | null;
      const needle = (input?.value || '').trim().toLowerCase();
      const hubNeedle = (hubSelect?.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll<HTMLTableRowElement>('.service-centre-row');
      let visible = 0;
      rows.forEach((row) => {
        const hay = (row.getAttribute('data-search') || '').toLowerCase();
        const hubHay = (row.getAttribute('data-hub') || '').toLowerCase();
        const hubMatch = !hubNeedle || hubHay === hubNeedle;
        const textMatch = !needle || hay.includes(needle);
        const show = hubMatch && textMatch;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('service-centre-empty-row');
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
      const count = document.getElementById('service-centre-search-count');
      if (count) count.textContent = `${visible} service centres`;
      if (visible === 0) void searchDbFallback(needle, ['service-centres'], 'service centre');
    };
    window.applyFleetFilter = () => {
      const input = document.getElementById('fleet-search-input') as HTMLInputElement | null;
      const needle = (input?.value || '').trim().toLowerCase();
      const cards = document.querySelectorAll<HTMLElement>('.fleet-row');
      let visible = 0;
      cards.forEach((card) => {
        const hay = (card.getAttribute('data-search') || '').toLowerCase();
        const show = !needle || hay.includes(needle);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('fleet-empty-row');
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
      const count = document.getElementById('fleet-search-count');
      if (count) count.textContent = `${visible} vehicles`;
      if (visible === 0) void searchDbFallback(needle, ['fleet'], 'fleet');
    };
    window.applyCustomerFilter = () => {
      const input = document.getElementById('customer-search-input') as HTMLInputElement | null;
      const needle = (input?.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll<HTMLTableRowElement>('.customer-row');
      let visible = 0;
      rows.forEach((row) => {
        const hay = (row.getAttribute('data-search') || '').toLowerCase();
        const show = !needle || hay.includes(needle);
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('customer-empty-row');
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
      const count = document.getElementById('customer-search-count');
      if (count) count.textContent = `${visible} customers`;
      if (visible === 0) void searchDbFallback(needle, ['customers', 'merchants'], 'customer');
    };
    window.setTimeout(() => {
      const originSelect = document.getElementById('calc-origin') as HTMLSelectElement | null;
      if (originSelect) {
        window.onCalcOriginChange?.(originSelect.value);
      }
    }, 0);

    return () => {
      window.showPage = () => {};
      window.openModal = () => {};
      window.closeModal = () => {};
      window.doAction = () => {};
      window.toast = () => {};
      window.suspendStaff = () => {};
      window.unsuspendStaff = () => {};
      window.saveTenantSettings = () => {};
      window.savePricing = () => {};
      window.saveTenantPermissions = () => {};
      window.onCalcOriginChange = () => {};
      window.addPricingZone = () => {};
      window.editHub = () => {};
      window.editServiceCentre = () => {};
      window.filterFinanceWallets = () => {};
      window.setFleetOwnershipFilter = () => {};
      window.applyStaffFilter = () => {};
      window.applyHubFilter = () => {};
      window.applyServiceCentreFilter = () => {};
      window.applyFleetFilter = () => {};
      window.applyCustomerFilter = () => {};
    };
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            {tenantSettings.logoUrl ? (
              <img
                src={tenantSettings.logoUrl}
                alt={`${tenantName} logo`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              />
            ) : (
              <svg viewBox="0 0 16 16"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v2A1.5 1.5 0 0112.5 7h-9A1.5 1.5 0 012 5.5v-2zm0 6A1.5 1.5 0 013.5 8h9A1.5 1.5 0 0114 9.5v3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-3z" /></svg>
            )}
          </div>
          <div>
            <div className="logo-name">{tenantName}</div>
            <div className="logo-sub">Admin</div>
          </div>
        </div>

        <div className="tenant-chip">
          <div className="tenant-chip-dot"></div>
          <div style={{ minWidth: 0 }}>
            <div className="tenant-chip-name">Subscription</div>
            <div className="tenant-chip-plan">{tenantPlan}</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">
            <div className="nav-section-label">Overview</div>
            <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} data-page="dashboard" onClick={() => setCurrentPage('dashboard')}>{svgDashboard()}Dashboard</div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Organisation</div>
            <div className={`nav-item ${currentPage === 'staff' ? 'active' : ''}`} data-page="staff" onClick={() => setCurrentPage('staff')}>{svgUsers()}Staff Management<span className="nav-badge">{counts.staff}</span></div>
            {!isFleetTenant ? <div className={`nav-item ${currentPage === 'hubs' ? 'active' : ''}`} data-page="hubs" onClick={() => setCurrentPage('hubs')}>{svgHub()}Hubs<span className="nav-badge">{counts.hubs}</span></div> : null}
            {!isFleetTenant ? <div className={`nav-item ${currentPage === 'service-centres' ? 'active' : ''}`} data-page="service-centres" onClick={() => setCurrentPage('service-centres')}>{svgCentres()}Service Centres<span className="nav-badge">{counts.serviceCentres}</span></div> : null}
            <div className={`nav-item ${currentPage === 'roles' ? 'active' : ''}`} data-page="roles" onClick={() => setCurrentPage('roles')}>{svgRoles()}Roles & Permissions</div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Operations</div>
            <div className={`nav-item ${currentPage === 'fleet' ? 'active' : ''}`} data-page="fleet" onClick={() => setCurrentPage('fleet')}>{svgFleet()}Fleet Setup<span className="nav-badge">{counts.fleet}</span></div>
            {!isFleetTenant ? <div className={`nav-item ${currentPage === 'customers' ? 'active' : ''}`} data-page="customers" onClick={() => setCurrentPage('customers')}>{svgMerchant()}Customers<span className="nav-badge">{counts.customers}</span></div> : null}
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Finance</div>
            <div className={`nav-item ${currentPage === 'finance' ? 'active' : ''}`} data-page="finance" onClick={() => setCurrentPage('finance')}>{svgPricing()}Finance Management</div>
            <div className={`nav-item ${currentPage === 'pricing' ? 'active' : ''}`} data-page="pricing" onClick={() => setCurrentPage('pricing')}>{svgPricing()}Pricing Engine</div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">System</div>
            <div className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} data-page="settings" onClick={() => setCurrentPage('settings')}>{svgSettings()}Global Settings</div>
            <div className={`nav-item ${currentPage === 'audit' ? 'active' : ''}`} data-page="audit" onClick={() => setCurrentPage('audit')}>{svgAudit()}Audit Log</div>
            <a href="/tenant-console/support" className="nav-item" style={{ textDecoration: 'none' }}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z" /></svg>Support Desk</a>
          </div>
        </nav>

        <div className="sidebar-footer" style={{ position: 'relative' }}>
          {userMenuOpen ? (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', background: 'rgba(10,14,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', animation: 'slideUpCard 160ms ease-out', zIndex: 100 }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }} type="button" onClick={() => { setUserMenuOpen(false); setOpenModal('modal-profile'); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-7 5s1-4 7-4 7 4 7 4H1z" /></svg>
                User Profile
              </button>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }} type="button" onClick={() => { setUserMenuOpen(false); logout(); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}><path d="M10 12.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 0010 2h-7A1.5 1.5 0 001.5 3.5v9A1.5 1.5 0 003 14h7a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/><path d="M9 10.5a.5.5 0 00.854.354l2.5-2.5a.5.5 0 000-.708l-2.5-2.5A.5.5 0 009 5.5v5z"/><path d="M12.5 8H5.5a.5.5 0 000 1h7a.5.5 0 000-1z"/></svg>
                Log out
              </button>
            </div>
          ) : null}
          <div className="user-row" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
            <div className="avatar">AO</div>
            <div>
              <div className="user-name">{user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Amaka Okafor'}</div>
              <div className="user-email">{user?.email || 'admin@swiftlog.com'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title" id="page-title">{pageTitle}</div>
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" /></svg>
            <input
              placeholder="Search staff, hubs, shipments..."
              id="global-search"
              readOnly={!searchInputUnlocked}
              type="search"
              name="q_global_search"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              value={globalSearchTerm}
              onFocus={() => setSearchInputUnlocked(true)}
              onChange={(event) => setGlobalSearchTerm(event.target.value)}
            />
            {globalSearchTerm.trim() ? (
              <div className="search-results-panel">
                {globalSearchLoading ? <div className="search-state">Loading...</div> : null}
                {!globalSearchLoading && globalSearchError ? <div className="search-state error">{globalSearchError}</div> : null}
                {!globalSearchLoading && !globalSearchError && globalSearchResults.length === 0 ? <div className="search-state">No results found.</div> : null}
                {!globalSearchLoading && !globalSearchError && globalSearchResults.length > 0 ? (
                  <div className="search-results-list">
                    {globalSearchResults.map((result, index) => (
                      <button
                        key={`${result.category}-${result.entityId ?? 'x'}-${result.entityCode ?? 'x'}-${index}`}
                        className="search-result-item"
                        onClick={() => onSearchResultClick(result)}
                        type="button"
                      >
                        <div className="search-result-title">{result.label}</div>
                        <div className="search-result-meta">{result.category} | {result.subLabel}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <button className="btn" onClick={() => setCurrentPage('settings')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.07 1.48a1 1 0 011.86 0l.26.77a5.06 5.06 0 011.23.71l.8-.18a1 1 0 011.1.56l.44.88a1 1 0 01-.28 1.24l-.63.5a5.1 5.1 0 010 1.44l.63.5a1 1 0 01.28 1.24l-.44.88a1 1 0 01-1.1.56l-.8-.18a5.06 5.06 0 01-1.23.71l-.26.77a1 1 0 01-1.86 0l-.26-.77a5.06 5.06 0 01-1.23-.71l-.8.18a1 1 0 01-1.1-.56l-.44-.88a1 1 0 01.28-1.24l.63-.5a5.1 5.1 0 010-1.44l-.63-.5a1 1 0 01-.28-1.24l.44-.88a1 1 0 011.1-.56l.8.18a5.06 5.06 0 011.23-.71l.26-.77zM8 6a2 2 0 100 4A2 2 0 008 6z" /></svg>
            Settings
          </button>
          <button className="btn primary" id="topbar-cta" onClick={runTopbarAction}>{ctaLabel}</button>
        </header>
        <div className="content" id="content-area" dangerouslySetInnerHTML={{ __html: pageHtml }} />
      </div>

      <div className={`overlay ${openModal === 'modal-staff' ? 'open' : ''}`} id="modal-staff" onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOpenModal(null);
          setEditingStaffId(null);
          setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
        }
      }}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <div>
              <div className="modal-title">{editingStaffId ? 'Edit staff profile' : 'Invite new staff member'}</div>
              <div className="modal-sub">Staff members will receive an email to activate their account.</div>
            </div>
            <button className="modal-close" onClick={() => {
              setOpenModal(null);
              setEditingStaffId(null);
              setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
            }}></button>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">First name</label>
              <input className="form-input" placeholder="e.g. John" value={inviteStaffForm.firstName} onChange={(e) => setInviteStaffForm((s) => ({ ...s, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Last name</label>
              <input className="form-input" placeholder="e.g. Doe" value={inviteStaffForm.lastName} onChange={(e) => setInviteStaffForm((s) => ({ ...s, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="staff@starshipng.com" value={inviteStaffForm.email} onChange={(e) => setInviteStaffForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Phone number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-select" style={{ width: 100 }} value={inviteStaffForm.dialCode} onChange={(e) => setInviteStaffForm((s) => ({ ...s, dialCode: e.target.value }))}>
                  {(countryDialOptions.length > 0 ? countryDialOptions : [{ id: 0, name: 'Nigeria', dialCode: '+234' }]).map((opt) => (
                    <option key={opt.id} value={opt.dialCode}>{opt.dialCode} ({opt.name})</option>
                  ))}
                </select>
                <input className="form-input" style={{ flex: 1 }} placeholder="8012345678" value={inviteStaffForm.phoneNumber} onChange={(e) => setInviteStaffForm((s) => ({ ...s, phoneNumber: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Account role</label>
              <select className="form-select" value={inviteStaffForm.role} onChange={(e) => setInviteStaffForm((s) => ({ ...s, role: e.target.value, serviceCentreId: '' }))}>
                <option value="TenantAdmin">TenantAdmin</option>
                <option value="HubManager">HubManager</option>
                <option value="ServiceCentreAdmin">ServiceCentreAdmin</option>
                <option value="DeskOperator">DeskOperator</option>
                <option value="Captain">Captain</option>
                <option value="FinanceUser">FinanceUser</option>
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">{inviteStaffForm.role === 'HubManager' ? 'Hub scope' : 'Service centre scope'}</label>
              <select className="form-select" value={inviteStaffForm.serviceCentreId} onChange={(e) => setInviteStaffForm((s) => ({ ...s, serviceCentreId: e.target.value }))}>
                <option value="">{inviteStaffForm.role === 'HubManager' ? 'Select hub' : 'Tenant-wide (Global)'}</option>
                {(inviteStaffForm.role === 'HubManager' ? hubOptions : serviceCentreOptions).map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">{editingStaffId ? 'Set new password (optional)' : 'Temporary password'}</label>
              <input className="form-input" type="password" placeholder={editingStaffId ? 'Leave blank to keep current' : 'e.g. Welcome@2026!'} value={inviteStaffForm.temporaryPassword} onChange={(e) => setInviteStaffForm((s) => ({ ...s, temporaryPassword: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => {
              setOpenModal(null);
              setEditingStaffId(null);
              setInviteStaffForm(INITIAL_INVITE_STAFF_FORM);
            }}>Cancel</button>
            <button className="btn primary" onClick={() => { if (editingStaffId) void updateStaff(); else void inviteStaff(); }}>
              {editingStaffId ? 'Save changes' : 'Send invitation'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-staff-import' ? 'open' : ''}`} id="modal-staff-import" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal modal-lg">
          <div className="modal-header"><div><div className="modal-title">Import staff (CSV/XLSX)</div><div className="modal-sub">Upload CSV or Excel, preview validation, then confirm import.</div></div><button className="modal-close" onClick={() => setOpenModal(null)}></button></div>
          <div className="form-row">
            <label className="form-label">Import file</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={downloadStaffImportSampleExcel}>
                Download sample Excel
              </button>
              <label
                htmlFor="staff-import-file"
                className="btn"
                style={{ cursor: 'pointer', background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}
              >
                Choose file
              </label>
              <input
                id="staff-import-file"
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={(e) => { void onStaffImportFileSelected(e); }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              {staffImportFileName ? `Loaded: ${staffImportFileName}` : 'Use the provided sample Excel or CSV template.'}
            </div>
          </div>
          {staffImportRows.length > 0 && !staffImportPreview ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Parsed rows: {staffImportRows.length}. Click Preview to run server validation.
              </div>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginTop: 8 }}>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8 }}>#</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                      <th style={{ textAlign: 'left', padding: 8 }}>Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffImportRows.slice(0, 50).map((row, idx) => (
                      <tr key={`${row.email}-${idx}`}>
                        <td style={{ padding: 8 }}>{idx + 1}</td>
                        <td style={{ padding: 8 }}>{`${row.firstName} ${row.lastName}`.trim() || '-'}</td>
                        <td style={{ padding: 8 }}>{row.email || '-'}</td>
                        <td style={{ padding: 8 }}>{row.role || '-'}</td>
                        <td style={{ padding: 8 }}>{row.serviceCentreName || row.hubName || 'Tenant-wide'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {staffImportPreview ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Preview: total {staffImportPreview.totalRows} | valid {staffImportPreview.validRows} | invalid {staffImportPreview.invalidRows}
              </div>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginTop: 8 }}>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>Row</th><th style={{ textAlign: 'left', padding: 8 }}>Email</th><th style={{ textAlign: 'left', padding: 8 }}>Status</th><th style={{ textAlign: 'left', padding: 8 }}>Message</th></tr></thead>
                  <tbody>
                    {staffImportPreview.rows.slice(0, 50).map((r) => (
                      <tr key={`${r.rowNumber}-${r.email}`}>
                        <td style={{ padding: 8 }}>{r.rowNumber}</td>
                        <td style={{ padding: 8 }}>{r.email}</td>
                        <td style={{ padding: 8 }}>{r.isValid ? 'Valid' : 'Invalid'}</td>
                        <td style={{ padding: 8 }}>{r.errors.length ? r.errors.join('; ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {staffImportConfirm ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Result: imported {staffImportConfirm.importedRows} | failed {staffImportConfirm.failedRows}
              </div>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginTop: 8 }}>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>Row</th><th style={{ textAlign: 'left', padding: 8 }}>Email</th><th style={{ textAlign: 'left', padding: 8 }}>Status</th><th style={{ textAlign: 'left', padding: 8 }}>Message</th></tr></thead>
                  <tbody>
                    {staffImportConfirm.rows.slice(0, 50).map((r) => (
                      <tr key={`${r.rowNumber}-${r.email}`}>
                        <td style={{ padding: 8 }}>{r.rowNumber}</td>
                        <td style={{ padding: 8 }}>{r.email}</td>
                        <td style={{ padding: 8 }}>{r.imported ? 'Imported' : 'Failed'}</td>
                        <td style={{ padding: 8 }}>{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)}>Close</button>
            <button className="btn" onClick={() => { void previewStaffImport(); }} disabled={staffImportBusy}>Preview</button>
            <button className="btn primary" onClick={() => { void confirmStaffImport(); }} disabled={staffImportBusy || hasInvalidStaffPreviewRows}>Confirm import</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-staff-password' ? 'open' : ''}`} id="modal-staff-password" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-header"><div><div className="modal-title">Reset staff password</div><div className="modal-sub">Set a temporary password for {passwordTargetStaff?.email ?? 'selected staff'}.</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setPasswordTargetStaff(null); }}></button></div>
          <div className="form-row"><label className="form-label">Temporary password</label><input className="form-input" type="password" placeholder="Password123!" value={passwordResetForm.newPassword} onChange={(e) => setPasswordResetForm((s) => ({ ...s, newPassword: e.target.value }))} /></div>
          <div className="form-row"><label className="form-label">Confirm password</label><input className="form-input" type="password" placeholder="Re-enter password" value={passwordResetForm.confirmPassword} onChange={(e) => setPasswordResetForm((s) => ({ ...s, confirmPassword: e.target.value }))} /></div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="must-change-password" type="checkbox" checked={passwordResetForm.mustChangePassword} onChange={(e) => setPasswordResetForm((s) => ({ ...s, mustChangePassword: e.target.checked }))} />
            <label htmlFor="must-change-password" className="form-label" style={{ margin: 0 }}>Require password change at next login</label>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setPasswordTargetStaff(null); }}>Cancel</button><button className="btn primary" onClick={() => { void submitStaffPasswordReset(); }}>Update password</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-hub' ? 'open' : ''}`} id="modal-hub" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-header"><div><div className="modal-title">{editingHubId ? 'Update hub' : 'Create hub'}</div><div className="modal-sub">Hubs are central sorting stations. Service centres report to a hub.</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setEditingHubId(null); }}></button></div>
          <div className="form-row"><label className="form-label">Hub name</label><input id="hub-name" className="form-input" placeholder="e.g. Lagos VI Hub" /></div>
          <div className="form-grid"><div><label className="form-label">State / Region</label><select id="hub-location" className="form-select"><option>Lagos</option><option>Abuja</option><option>Kano</option><option>Rivers</option><option>Oyo</option></select></div><div><label className="form-label">Hub code</label><input className="form-input" placeholder="LOS-VI" style={{ fontFamily: 'var(--font-mono)' }} /></div></div>
          <div className="form-row"><label className="form-label">Physical address</label><input className="form-input" placeholder="12 Marina Road, Lagos Island" /></div>
          <div className="form-grid"><div><label className="form-label">Hub Manager (assign now)</label><select className="form-select"><option>Unassigned</option></select></div><div><label className="form-label">Sort capacity (shipments/day)</label><input className="form-input" type="number" placeholder="500" /></div></div>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setEditingHubId(null); }}>Cancel</button><button className="btn primary" onClick={() => { void saveHub(); }}>{editingHubId ? 'Update hub' : 'Create hub'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-sc' ? 'open' : ''}`} id="modal-sc" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal modal-lg">
          <div className="modal-header"><div><div className="modal-title">{editingServiceCentreId ? 'Update service centre' : 'Create service centre'}</div><div className="modal-sub">Service centres are last-mile delivery points. Ops officers are scoped here.</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setEditingServiceCentreId(null); }}></button></div>
          <div className="form-grid"><div><label className="form-label">Service centre name</label><input id="sc-name" className="form-input" placeholder="e.g. Ikeja Service Centre" /></div><div><label className="form-label">SC code</label><input className="form-input" placeholder="IKJ" style={{ fontFamily: 'var(--font-mono)' }} /></div></div>
          <div className="form-grid"><div><label className="form-label">Parent hub</label><select id="sc-parent-hub" className="form-select">{hubOptions.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div><div><label className="form-label">Coverage zone / LGA</label><select className="form-select"><option>Ikeja</option><option>Victoria Island</option><option>Surulere</option><option>Lekki</option></select></div></div>
          <div className="form-row"><label className="form-label">Physical address</label><input className="form-input" placeholder="45 Allen Avenue, Ikeja, Lagos" /></div>
          <div className="form-grid"><div><label className="form-label">SC Admin (assign now)</label><select className="form-select"><option>Unassigned</option></select></div><div><label className="form-label">Max staff capacity</label><input className="form-input" type="number" placeholder="20" /></div></div>
          <div className="modal-section-title">Coverage polygon (lat/lng pairs, one per line)</div>
          <textarea className="form-textarea" placeholder={'6.5958, 3.3467\n6.6012, 3.3520\n6.5990, 3.3580'} rows={3}></textarea>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setEditingServiceCentreId(null); }}>Cancel</button><button className="btn primary" onClick={() => { void saveServiceCentre(); }}>{editingServiceCentreId ? 'Update service centre' : 'Create service centre'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-vehicle' ? 'open' : ''}`} id="modal-vehicle" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-header"><div><div className="modal-title">{editingFleetId ? 'Update vehicle' : 'Register vehicle'}</div><div className="modal-sub">Add a vehicle to your fleet.</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setEditingFleetId(null); setFleetMake(''); setFleetModel(''); setFleetYear(''); }}></button></div>
          <div className="form-grid"><div><label className="form-label">Plate number</label><input id="fleet-plate" className="form-input" placeholder="KJA-412-AA" style={{ fontFamily: 'var(--font-mono)' }} /></div><div><label className="form-label">Vehicle type</label><select id="fleet-type" className="form-select"><option>Bike</option><option>Van</option><option>Truck</option></select></div></div>
          <div className="form-grid"><div><label className="form-label">Ownership</label><select id="fleet-ownership" className="form-select"><option value="own">Own fleet</option><option value="third">Third party</option></select></div><div><label className="form-label">Assigned service centre</label><select id="fleet-service-centre" className="form-select"><option value="">Not selected</option>{serviceCentreOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div></div>
          <div className="form-grid">
            <div>
              <label className="form-label">Make</label>
              <select className="form-select" value={fleetMake} onChange={(e) => { setFleetMake(e.target.value); setFleetModel(''); }}>
                <option value="">Select make</option>
                {Object.keys(VEHICLE_MAKE_MODELS).map((make) => <option key={make} value={make}>{make}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Model</label>
              <select className="form-select" value={fleetModel} onChange={(e) => setFleetModel(e.target.value)} disabled={!fleetMake}>
                <option value="">{fleetMake ? 'Select model' : 'Select make first'}</option>
                {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid"><div><label className="form-label">Year</label><input className="form-input" type="number" placeholder="2022" value={fleetYear} onChange={(e) => setFleetYear(e.target.value)} /></div><div></div></div>
          <div className="form-row">
            <label className="form-label">Assign captain (optional)</label>
            <select id="fleet-captain" className="form-select">
              <option value="">Assign later</option>
              {captainOptions.map((captain) => <option key={captain.captainId} value={captain.captainId}>{captain.name}</option>)}
            </select>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setEditingFleetId(null); setFleetMake(''); setFleetModel(''); setFleetYear(''); }}>Cancel</button><button className="btn primary" onClick={() => { void saveFleet(); }}>{editingFleetId ? 'Save changes' : 'Register vehicle'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-merchant' ? 'open' : ''}`} id="modal-merchant" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-header"><div><div className="modal-title">{editingMerchantId ? 'Update merchant' : 'Onboard merchant'}</div><div className="modal-sub">Merchants create and pay for shipments via the merchant portal.</div></div><button className="modal-close" onClick={() => { setOpenModal(null); setEditingMerchantId(null); }}></button></div>
          <div className="form-row"><label className="form-label">Business name</label><input id="merchant-name" className="form-input" placeholder="e.g. Jumia Food Lagos" /></div>
          <div className="form-grid"><div><label className="form-label">Contact person</label><input id="merchant-contact" className="form-input" placeholder="Full name" /></div><div><label className="form-label">Phone code</label><select id="merchant-phone-code" className="form-select">{(countryDialOptions.length > 0 ? countryDialOptions : [{ id: 0, name: 'Default', dialCode: '+234' }]).map((country) => <option key={`merchant-${country.id}-${country.dialCode}`} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}</select></div></div>
          <div className="form-row"><label className="form-label">Contact phone number</label><input id="merchant-phone-number" className="form-input" placeholder="800 000 0000" /></div>
          <div className="form-row"><label className="form-label">Business email</label><input id="merchant-email" className="form-input" type="email" placeholder="ops@merchant.com" /></div>
          <div className="form-grid"><div><label className="form-label">Account type</label><select id="merchant-type" className="form-select"><option value="Ecommerce">E-commerce</option><option value="Enterprise">Enterprise</option></select></div><div><label className="form-label">Credit limit (NGN)</label><input id="merchant-credit" className="form-input" type="number" placeholder="500000" /></div></div>
          <div className="form-row">
            <label className="form-label">Default pickup service centre (optional preference)</label>
            <select id="merchant-default-pickup-sc" className="form-select">
              <option value="">No default preference</option>
              {serviceCentreOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Preference only. Merchant is not restricted to this service centre.
            </div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => { setOpenModal(null); setEditingMerchantId(null); }}>Cancel</button><button className="btn primary" onClick={() => { void saveMerchant(); }}>{editingMerchantId ? 'Save changes' : 'Onboard merchant'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-fleet-import' ? 'open' : ''}`} id="modal-fleet-import" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal modal-lg">
          <div className="modal-header"><div><div className="modal-title">Import Fleet (CSV/XLSX)</div><div className="modal-sub">Upload sheet, preview rows, then import vehicles with optional captain assignment.</div></div><button className="modal-close" onClick={() => setOpenModal(null)}></button></div>
          <div className="form-row">
            <label className="form-label">Import file</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={downloadFleetImportSampleExcel}>Download sample Excel</button>
              <label htmlFor="fleet-import-file" className="btn" style={{ cursor: 'pointer', background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}>Choose file</label>
              <input id="fleet-import-file" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} onChange={(e) => { void onFleetImportFileSelected(e); }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              {fleetImportFileName ? `Loaded: ${fleetImportFileName}` : 'Columns: registrationNumber, fleetType, ownership, make, model, capacity, serviceCentreName, captain, description'}
            </div>
          </div>
          {fleetImportRows.length > 0 ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Preview ({fleetImportRows.length})</div>
              <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>#</th><th style={{ textAlign: 'left', padding: 8 }}>Plate</th><th style={{ textAlign: 'left', padding: 8 }}>Type</th><th style={{ textAlign: 'left', padding: 8 }}>Owner</th><th style={{ textAlign: 'left', padding: 8 }}>Capacity</th><th style={{ textAlign: 'left', padding: 8 }}>SC</th><th style={{ textAlign: 'left', padding: 8 }}>Captain</th></tr></thead>
                  <tbody>
                    {fleetImportRows.slice(0, 60).map((row) => (
                      <tr key={`${row.rowNumber}-${row.registrationNumber}`}>
                        <td style={{ padding: 8 }}>{row.rowNumber}</td>
                        <td style={{ padding: 8 }}>{row.registrationNumber}</td>
                        <td style={{ padding: 8 }}>{row.fleetType}</td>
                        <td style={{ padding: 8 }}>{row.ownership}</td>
                        <td style={{ padding: 8 }}>{row.capacity}</td>
                        <td style={{ padding: 8 }}>{row.serviceCentreName || '-'}</td>
                        <td style={{ padding: 8 }}>{row.captain || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {fleetImportResult ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Result: created {fleetImportResult.created} | failed {fleetImportResult.failed}</div>
              {fleetImportResult.errors.length > 0 ? (
                <div style={{ marginTop: 8, maxHeight: 160, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 12 }}>
                  {fleetImportResult.errors.slice(0, 20).map((err, index) => <div key={`${index}-${err}`}>{err}</div>)}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)}>Close</button>
            <button className="btn primary" onClick={() => { void submitFleetImport(); }} disabled={fleetImportBusy || fleetImportRows.length === 0}>{fleetImportBusy ? 'Importing...' : 'Run fleet import'}</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-hub-import' ? 'open' : ''}`} id="modal-hub-import" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <div>
              <div className="modal-title">Import Hubs &amp; Service Centres</div>
              <div className="modal-sub">Upload CSV/XLSX, preview validation, then confirm to import.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)}></button>
          </div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="form-label" style={{ margin: 0, flexShrink: 0 }}>Import file</label>
            <button className="btn" style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={downloadHubImportTemplate}>Download template</button>
            <label htmlFor="hub-import-file" className="btn" style={{ cursor: 'pointer', background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}>Choose file</label>
            <input id="hub-import-file" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} onChange={(e) => { void onHubImportFileSelected(e); }} />
          </div>
          {hubImportFileName ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Loaded: <strong>{hubImportFileName}</strong> — {hubImportRows.length} row{hubImportRows.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              CSV columns: <code>HubName, ServiceCentreName, Location</code>. Download the template above to get started.
            </div>
          )}
          {hubImportPreview ? (
            <div className="form-row">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Preview: <strong>{hubImportPreview.totalRows}</strong> total · <span style={{ color: 'var(--success)' }}>{hubImportPreview.validRows} valid</span> · <span style={{ color: 'var(--danger)' }}>{hubImportPreview.invalidRows} invalid</span>
              </div>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>Row</th><th style={{ textAlign: 'left', padding: 8 }}>Hub</th><th style={{ textAlign: 'left', padding: 8 }}>Service Centre</th><th style={{ textAlign: 'left', padding: 8 }}>Status</th><th style={{ textAlign: 'left', padding: 8 }}>Issues</th></tr></thead>
                  <tbody>
                    {hubImportPreview.rows.slice(0, 100).map((r) => (
                      <tr key={r.rowNumber} style={{ background: r.isValid ? undefined : 'rgba(220,53,69,0.05)' }}>
                        <td style={{ padding: 8 }}>{r.rowNumber}</td>
                        <td style={{ padding: 8 }}>{r.hubName || '—'}</td>
                        <td style={{ padding: 8 }}>{r.serviceCentreName || '—'}</td>
                        <td style={{ padding: 8 }}><span className={`badge ${r.isValid ? 'active' : 'inactive'}`}>{r.isValid ? 'Valid' : 'Invalid'}</span></td>
                        <td style={{ padding: 8, color: 'var(--danger)', fontSize: 11 }}>{r.errors.length ? r.errors.join('; ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <div className="modal-footer">
            <button className="btn" onClick={() => setOpenModal(null)}>Close</button>
            <button className="btn" onClick={() => { void previewHubImport(); }} disabled={hubImportBusy || !hubImportRows.length}>
              {hubImportBusy ? 'Checking…' : 'Preview'}
            </button>
            <button className="btn primary" onClick={() => { void confirmHubImport(); }} disabled={hubImportBusy || !hubImportRows.length}>
              {hubImportBusy ? 'Importing…' : 'Confirm import'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-zone' ? 'open' : ''}`} id="modal-zone" onClick={(e) => e.target === e.currentTarget && closeZoneModal()}>
        <div className="modal">
          <div className="modal-header"><div><div className="modal-title">{editingZoneLabel ? 'Edit pricing zone' : 'Add pricing zone'}</div><div className="modal-sub">{editingZoneLabel ? 'Update zone name, coverage, and base rate.' : 'Create a tenant-specific zone column for the base rate matrix.'}</div></div><button className="modal-close" onClick={closeZoneModal}></button></div>
          <div className="form-row">
            <label className="form-label">Zone name</label>
            {editingZoneLabel ? (
              <input className="form-input" disabled value={zoneFormName} />
            ) : (
              <select className="form-select" value={zoneFormName} onChange={(e) => setZoneFormName(e.target.value)}>
                <option value="">Select a platform zone</option>
                {Array.from(new Set(tenantData?.pricing?.globalZones || [])).map((z, idx) => (
                  <option key={`${z}-${idx}`} value={z}>{z}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-row"><label className="form-label">Coverage</label><input className="form-input" placeholder="e.g. 2-3 states away" value={zoneFormCoverage} onChange={(e) => setZoneFormCoverage(e.target.value)} /></div>
          <div className="form-row"><label className="form-label">Base rate (NGN/kg)</label><input className="form-input" placeholder="e.g. NGN 1,200" value={zoneFormBaseRate} onChange={(e) => setZoneFormBaseRate(e.target.value)} /></div>
          <div className="modal-footer"><button className="btn" onClick={closeZoneModal}>Cancel</button><button className="btn primary" onClick={createPricingZoneFromModal}>{editingZoneLabel ? 'Save zone' : 'Add zone'}</button></div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-profile' ? 'open' : ''}`} id="modal-profile" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-title">User Profile</div>
              <div className="modal-sub">View your account details and update your password.</div>
            </div>
            <button className="modal-close" onClick={() => setOpenModal(null)}></button>
          </div>
          <div className="form-row">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'N/A'} disabled />
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Email address</label>
              <input className="form-input" value={user?.email || 'N/A'} disabled />
            </div>
            <div>
              <label className="form-label">Role</label>
              <input className="form-input" value={user?.role || 'TenantAdmin'} disabled />
            </div>
          </div>
          <div className="modal-section-title">Change Password</div>
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
            <button className="btn" onClick={() => setOpenModal(null)}>Close</button>
            <button className="btn primary" onClick={() => { void updateProfilePassword(); }} disabled={profileBusy}>
              {profileBusy ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${openModal === 'modal-confirm' ? 'open' : ''}`} id="modal-confirm" onClick={(e) => e.target === e.currentTarget && setOpenModal(null)}>
        <div className="modal" style={{ width: 400 }}>
          <div className="modal-header"><div className="modal-title" id="confirm-title">{confirmTitle}</div><button className="modal-close" onClick={() => setOpenModal(null)}>x</button></div>
          <p id="confirm-body" style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>{confirmBody}</p>
          <div className="form-row"><label className="form-label">Reason (required)</label><input className="form-input" placeholder="e.g. Policy violation, temporary leave..." id="confirm-reason" /></div>
          <div className="modal-footer"><button className="btn" onClick={() => setOpenModal(null)}>Cancel</button><button className="btn danger" onClick={() => { if (confirmAction) confirmAction(); else { setOpenModal(null); showToast('No action selected'); } }}>{confirmButtonLabel}</button></div>
        </div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`} id="toast">{toastMsg}</div>
    </div>
  );
}


