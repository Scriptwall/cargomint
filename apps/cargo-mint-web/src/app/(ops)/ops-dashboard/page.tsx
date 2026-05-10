'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function OpsDashboard() {
  const API_BASE = '/api/v1';
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeTab, setActiveTab] = useState(0);
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [shipmentsList, setShipmentsList] = useState<any[]>([]);
  const [manifestsBoard, setManifestsBoard] = useState<any>({ pending: [], inTransit: [], delivered: [] });
  const [retailCustomers, setRetailCustomers] = useState<any[]>([]);
  const [viewingHub, setViewingHub] = useState<any>(null);
  const [senderType, setSenderType] = useState<'individual' | 'merchant'>('individual');

  const [packageTab, setPackageTab] = useState('sort'); // 'sort' | 'manifest'
  const [stations, setStations] = useState<any[]>([]);
  const [senderSearchResults, setSenderSearchResults] = useState<any[]>([]);
  const [receiverSearchResults, setReceiverSearchResults] = useState<any[]>([]);
  const [pricingQuote, setPricingQuote] = useState<any>(null);
  const [waybillPreview, setWaybillPreview] = useState<any>(null);

  // Sorting & Manifest State
  const GROUP_COLORS = [
    { c: '#00D4AA', d: 'rgba(0,212,170,.12)' },
    { c: '#3D9EF5', d: 'rgba(61,158,245,.12)' },
    { c: '#FFB020', d: 'rgba(255,176,32,.12)' },
    { c: '#22D46A', d: 'rgba(34,212,106,.12)' },
    { c: '#9B6EF5', d: 'rgba(155,110,245,.12)' },
    { c: '#FF7A30', d: 'rgba(255,122,48,.12)' },
  ];
  const SHIPMENT_TYPES: any = {
    'STD': { bg: 'rgba(61,158,245,.12)', c: '#3D9EF5' },
    'EXP': { bg: 'rgba(0,212,170,.12)', c: '#00D4AA' },
    'FRG': { bg: 'rgba(155,110,245,.12)', c: '#9B6EF5' },
    'BLK': { bg: 'rgba(255,176,32,.12)', c: '#FFB020' },
  };

  const [sortPool, setSortPool] = useState<any[]>([
    { id: 'SL-00847', dest: 'Abuja', route: 'LOS→ABJ', wt: '2.5kg', type: 'STD', name: 'Amina Bello', amt: '₦3,175' },
    { id: 'SL-00848', dest: 'Abuja', route: 'LOS→ABJ', wt: '1.8kg', type: 'EXP', name: 'Chidi Nwosu', amt: '₦4,200' },
    { id: 'SL-00849', dest: 'Abuja', route: 'LOS→ABJ', wt: '4.0kg', type: 'STD', name: 'Grace Eze', amt: '₦2,600' },
    { id: 'SL-00850', dest: 'Abuja', route: 'LOS→ABJ', wt: '0.9kg', type: 'FRG', name: 'Musa Kano', amt: '₦3,800' },
    { id: 'SL-00851', dest: 'Kano', route: 'LOS→KAN', wt: '3.2kg', type: 'STD', name: 'Fatima Kabiru', amt: '₦2,900' },
    { id: 'SL-00852', dest: 'Kano', route: 'LOS→KAN', wt: '5.1kg', type: 'BLK', name: 'Ibrahim Musa', amt: '₦5,400' },
  ]);

  const [sortGroups, setSortGroups] = useState<any[]>([
    { id: 'g1', label: 'Lagos → Abuja', route: 'LOS→ABJ', dest: 'Abuja', color: 0, shipments: [], bags: [], collapsed: false },
    { id: 'g2', label: 'Lagos → Kano', route: 'LOS→KAN', dest: 'Kano', color: 1, shipments: [], bags: [], collapsed: false },
    { id: 'g3', label: 'Lagos → Port Harcourt', route: 'LOS→PHC', dest: 'Port Harcourt', color: 2, shipments: [], bags: [], collapsed: false },
    { id: 'g4', label: 'Lagos → Ibadan', route: 'LOS→IBD', dest: 'Ibadan', color: 3, shipments: [], bags: [], collapsed: false },
  ]);

  const [builderManifests, setBuilderManifests] = useState<any[]>([
    { id: 'MAN-0091', label: 'Manifest 001', groups: [], vehicle: '', captain: '', status: 'open' },
    { id: 'MAN-0092', label: 'Manifest 002', groups: [], vehicle: '', captain: '', status: 'open' },
  ]);
  const [activeBuilderManifest, setActiveBuilderManifest] = useState(0);

  const [dragShipId, setDragShipId] = useState<string | null>(null);
  const [dragMGroupId, setDragMGroupId] = useState<string | null>(null);
  const [bagCounter, setBagCounter] = useState(5);
  const [groupCounter, setGroupCounter] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdWaybill, setCreatedWaybill] = useState('');
  const [createdAmount, setCreatedAmount] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ═══════════════════════════════════════════════
  // SORTING ACTIONS
  // ═══════════════════════════════════════════════
  const moveShipToGroup = (shipId: string, groupId: string) => {
    const ship = sortPool.find(s => s.id === shipId) || sortGroups.flatMap(g => g.shipments).find(s => s.id === shipId);
    if (!ship) return;

    setSortPool(prev => prev.filter(s => s.id !== shipId));
    setSortGroups(prev => prev.map(g => {
      const filteredShipments = g.shipments.filter((s: any) => s.id !== shipId);
      if (g.id === groupId) {
        return { ...g, shipments: [...filteredShipments, ship] };
      }
      return { ...g, shipments: filteredShipments };
    }));
    showToast(`Moved ${shipId} → ${groupId}`);
  };

  const returnToPool = (shipId: string) => {
    const ship = sortGroups.flatMap(g => g.shipments).find(s => s.id === shipId);
    if (!ship) return;

    setSortGroups(prev => prev.map(g => ({
      ...g,
      shipments: g.shipments.filter((s: any) => s.id !== shipId)
    })));
    setSortPool(prev => [...prev.filter(s => s.id !== shipId), ship]);
    showToast(`${shipId} returned to pool`);
  };

  const deleteGroup = (gid: string) => {
    const group = sortGroups.find(g => g.id === gid);
    if (!group) return;

    if (group.shipments.length > 0) {
      setSortPool(prev => [...prev, ...group.shipments]);
    }
    setSortGroups(prev => prev.filter(g => g.id !== gid));
    showToast(`Group deleted — shipments returned to pool`);
  };

  const createBag = (gid: string) => {
    setSortGroups(prev => prev.map(g => {
      if (g.id === gid) {
        const bagId = 'BAG-' + String(bagCounter).padStart(4, '0');
        const baggedShips = g.bags.flatMap((b: any) => b.shipments);
        const unbagged = g.shipments.filter((s: any) => !baggedShips.includes(s.id));
        if (unbagged.length === 0) {
          showToast('All shipments already bagged');
          return g;
        }
        const newBag = { id: bagId, label: bagId, shipments: unbagged.map((s: any) => s.id) };
        setBagCounter(prevC => prevC + 1);
        showToast(`${bagId} created — ${unbagged.length} shipments bagged`);
        return { ...g, bags: [...g.bags, newBag] };
      }
      return g;
    }));
  };

  const toggleGroup = (gid: string) => {
    setSortGroups(prev => prev.map(g => g.id === gid ? { ...g, collapsed: !g.collapsed } : g));
  };

  const clearEmptyGroups = () => {
    const before = sortGroups.length;
    setSortGroups(prev => prev.filter(g => g.shipments.length > 0));
    showToast(`Removed ${before - sortGroups.filter(g => g.shipments.length > 0).length} empty groups`);
  };

  // ═══════════════════════════════════════════════
  // MANIFEST ACTIONS
  // ═══════════════════════════════════════════════
  const removeFromManifest = (gid: string) => {
    setBuilderManifests(prev => prev.map((m, i) => {
      if (i === activeBuilderManifest) {
        return { ...m, groups: m.groups.filter((id: string) => id !== gid) };
      }
      return m;
    }));
    showToast(`Group removed from manifest`);
  };

  const addGroupToActiveManifest = (gid: string) => {
    setBuilderManifests((prev) => prev.map((manifest, index) => {
      if (index !== activeBuilderManifest) return manifest;
      if (manifest.groups.includes(gid)) return manifest;
      return { ...manifest, groups: [...manifest.groups, gid] };
    }));
    showToast('Group added to manifest');
  };

  const autoSortByDestination = () => {
    if (sortPool.length === 0) {
      showToast('No unsorted shipments');
      return;
    }

    const grouped = new Map<string, any[]>();
    for (const shipment of sortPool) {
      const destination = shipment.dest || 'Unknown';
      const bucket = grouped.get(destination) ?? [];
      bucket.push(shipment);
      grouped.set(destination, bucket);
    }

    setSortGroups((prev) => {
      const next = [...prev];
      for (const [dest, shipments] of grouped.entries()) {
        const existingIndex = next.findIndex((g) => g.dest === dest);
        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          const merged = [...existing.shipments];
          for (const shipment of shipments) {
            if (!merged.find((m: any) => m.id === shipment.id)) merged.push(shipment);
          }
          next[existingIndex] = { ...existing, shipments: merged };
        } else {
          const routeCode = dest.substring(0, 3).toUpperCase();
          next.push({
            id: `g${Date.now()}${Math.floor(Math.random() * 1000)}`,
            label: `Lagos → ${dest}`,
            route: `LOS→${routeCode}`,
            dest,
            color: next.length,
            shipments: [...shipments],
            bags: [],
            collapsed: false,
          });
        }
      }
      return next;
    });

    setSortPool([]);
    showToast('Auto-sorted by destination');
  };

  // ═══════════════════════════════════════════════
  // DRAG & DROP HANDLERS
  // ═══════════════════════════════════════════════
  const onShipDragStart = (e: React.DragEvent, id: string) => {
    setDragShipId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Required for HTML5 DnD to fire onDrop
  };

  const onMGroupDragStart = (e: React.DragEvent, id: string) => {
    setDragMGroupId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Required for HTML5 DnD to fire onDrop
  };

  const onDragEnd = () => {
    setDragShipId(null);
    setDragMGroupId(null);
  };

  const [shipmentForm, setShipmentForm] = useState({
    senderName: '',
    senderPhone: '',
    pickupAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverEmail: '',
    departureServiceCentreId: 1,
    destinationServiceCentreId: 2,
    weight: 1,
    quantity: 1,
    declaredValue: 0,
    applyInsurance: false,
    itemDescription: '',
    isCashOnDelivery: false,
    isFragile: false,
    isSameDay: false,
    length: 0,
    width: 0,
    height: 0
  });

  const [showValidation, setShowValidation] = useState(false);

  const canGoNext = (step: number) => {
    if (step === 0) { // Sender
      return !!(shipmentForm.senderName && shipmentForm.senderPhone && shipmentForm.pickupAddress && shipmentForm.departureServiceCentreId);
    }
    if (step === 1) { // Recipient
      return !!(shipmentForm.receiverName && shipmentForm.receiverPhone && shipmentForm.receiverAddress && shipmentForm.destinationServiceCentreId);
    }
    if (step === 2) { // Items
      return !!(shipmentForm.weight > 0 && shipmentForm.quantity > 0 && shipmentForm.itemDescription);
    }
    return true;
  };

  const getMissingFields = (step: number) => {
    if (step === 0) {
      const missing = [];
      if (!shipmentForm.senderName) missing.push('Sender Name');
      if (!shipmentForm.senderPhone) missing.push('Phone');
      if (!shipmentForm.pickupAddress) missing.push('Address');
      if (!shipmentForm.departureServiceCentreId) missing.push('Origin');
      return missing;
    }
    if (step === 1) {
      const missing = [];
      if (!shipmentForm.receiverName) missing.push('Receiver Name');
      if (!shipmentForm.receiverPhone) missing.push('Phone');
      if (!shipmentForm.receiverAddress) missing.push('Address');
      if (!shipmentForm.destinationServiceCentreId) missing.push('Destination');
      return missing;
    }
    if (step === 2) {
      const missing = [];
      if (!shipmentForm.weight) missing.push('Weight');
      if (!shipmentForm.quantity) missing.push('Quantity');
      if (!shipmentForm.itemDescription) missing.push('Description');
      return missing;
    }
    return [];
  };

  const getNextStepLabel = (step: number) => {
    if (step === 0) return 'Recipient →';
    if (step === 1) return 'Item Details →';
    if (step === 2) return 'Final Pricing →';
    return 'Finalize & Print →';
  };

  React.useEffect(() => {
    if (openModal === 'shipment' && shipmentForm.departureServiceCentreId && shipmentForm.destinationServiceCentreId && shipmentForm.weight > 0) {
      const timer = setTimeout(() => {
        fetchPricingQuote();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shipmentForm.departureServiceCentreId, shipmentForm.destinationServiceCentreId, shipmentForm.weight, shipmentForm.length, shipmentForm.width, shipmentForm.height, shipmentForm.isFragile, shipmentForm.isSameDay, shipmentForm.applyInsurance, openModal]);

  const tryPrefillSender = (nameOrPhone: string) => {
    const needle = nameOrPhone.trim().toLowerCase();
    if (!needle) return;
    const hit = retailCustomers.find((c: any) => {
      const customerName = String(c?.name ?? '').toLowerCase();
      const customerContact = String(c?.emailPhone ?? '').toLowerCase();
      return customerName.includes(needle) || customerContact.includes(needle);
    });
    if (!hit) return;
    setShipmentForm((prev) => ({
      ...prev,
      senderName: hit.name ?? prev.senderName,
      senderPhone: hit.emailPhone ?? prev.senderPhone,
    }));
  };

  const [manifestForm, setManifestForm] = useState({
    departureServiceCentreId: 1,
    destinationServiceCentreId: 2,
    fleetId: '',
    captainId: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    id: null as number | null,
    registrationNumber: '',
    type: 'Van',
    make: '',
    model: '',
    capacity: 500,
    description: '',
    captainId: ''
  });

  const [newScForm, setNewScForm] = useState({
    id: null as number | null,
    parentHubId: 0,
    name: '',
    code: ''
  });

  const [hubForm, setHubForm] = useState({
    id: null as number | null,
    name: '',
    state: ''
  });


  const [pricingMatrix, setPricingMatrix] = useState<number[][]>([
    [800,1200,1800,2400,3500],
    [1200,2000,3200,4200,4800],
    [1800,2800,4400,5800,6400],
    [2600,3800,5800,7600,8200],
    [4200,6000,9000,12000,15000],
    [7000,10000,16000,22000,26000],
  ]);

  const getAuthToken = () => document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];

  React.useEffect(() => {
    fetchStations();
    if (currentPage === 'dashboard') fetchDashboardData();
    else if (currentPage === 'desk') fetchShipments();
    else if (currentPage === 'package') {
      if (packageTab === 'sort') fetchSortPool();
      else if (packageTab === 'manifest') fetchManifests();
    }
    else if (currentPage === 'customers') fetchCustomers();
  }, [currentPage, packageTab]);

  const fetchStations = async () => {
    try {
      const response = await fetch(`${API_BASE}/Logistics/stations`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (response.ok) setStations(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Logistics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setDashboardData(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Shipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setShipmentsList(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManifests = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Logistics/manifests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const board = await response.json();
        setManifestsBoard(board);

        const pendingRows = Array.isArray(board?.pending) ? board.pending : [];
        if (pendingRows.length > 0) {
          const mapped = pendingRows.map((row: any, index: number) => ({
            id: row.manifestCode || row.id || `MAN-${index + 1}`,
            label: row.manifestCode || row.label || `Manifest ${index + 1}`,
            groups: Array.isArray(row.groupIds) ? row.groupIds : [],
            vehicle: row.vehicleName || '',
            captain: row.captainName || '',
            status: row.status || 'open',
          }));
          setBuilderManifests(mapped);
          setActiveBuilderManifest(0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSortPool = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Consolidation/sort-pool`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((row: any, idx: number) => ({
              id: row.waybill || row.id || `SL-${idx + 1}`,
              dest: row.destination || row.dest || 'Unknown',
              route: row.route || `${row.origin || 'LOS'}→${row.destinationCode || row.destination || 'UNK'}`,
              wt: `${Number(row.weight ?? 1).toFixed(1)}kg`,
              type: row.type || row.shipmentType || 'STD',
              name: row.receiverName || row.customerName || row.name || 'Recipient',
              amt: `₦${Number(row.amount ?? row.total ?? 0).toLocaleString()}`,
            }))
          : [];
        setSortPool(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Customers/retail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setRetailCustomers(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDispatchManifest = async (manifestId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/Consolidation/manifests/${manifestId}/dispatch`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast(`Manifest ${manifestId} dispatched successfully!`);
        // Remove it from the local state or update its status
        setBuilderManifests(prev => prev.filter(m => m.id !== manifestId));
        if (activeBuilderManifest > 0) setActiveBuilderManifest(activeBuilderManifest - 1);
        fetchManifests();
        fetchDashboardData();
      } else {
        showToast(`Failed to dispatch manifest ${manifestId}`);
      }
    } catch (err) {
      console.error(err);
      showToast(`Error dispatching manifest`);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  };

  const closeModal = () => setOpenModal(null);

  const handleSearchCustomers = async (q: string, type: 'sender' | 'receiver') => {
    if (q.length < 3) {
      if (type === 'sender') setSenderSearchResults([]);
      else setReceiverSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/Customers/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (type === 'sender') setSenderSearchResults(data);
        else setReceiverSearchResults(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchPricingQuote = async () => {
    if (!shipmentForm.departureServiceCentreId || !shipmentForm.destinationServiceCentreId || !shipmentForm.weight) return;
    try {
      const query = new URLSearchParams({
        DepartureStationId: shipmentForm.departureServiceCentreId.toString(),
        DestinationStationId: shipmentForm.destinationServiceCentreId.toString(),
        Weight: shipmentForm.weight.toString(),
        Length: (shipmentForm.length || 0).toString(),
        Width: (shipmentForm.width || 0).toString(),
        Height: (shipmentForm.height || 0).toString(),
        IsFragile: shipmentForm.isFragile.toString(),
        IsSameDay: shipmentForm.isSameDay.toString()
      });
      const response = await fetch(`${API_BASE}/Pricing/quote?${query}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (response.ok) setPricingQuote(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleViewShipment = async (waybill: string) => {
    try {
      const response = await fetch(`${API_BASE}/Shipments/${waybill}/preview`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (response.ok) {
        const details = await response.json();
        setWaybillPreview(details);
        setOpenModal('waybill');
      } else {
        showToast(`Failed to load details for ${waybill}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditShipment = (shipment: any) => {
    showToast(`Edit modal for ${shipment.waybill} coming soon`);
  };

  const handleUpdateShipmentStatus = async (waybill: string) => {
    const status = prompt('Enter new status (0=Pending, 1=Processing, 2=InTransit, 3=Delivered):');
    if (!status) return;
    
    const statusCode = parseInt(status) || 1;

    try {
      const response = await fetch(`${API_BASE}/Shipments/${waybill}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ waybill, status: statusCode })
      });
      if (response.ok) {
        showToast(`Status updated for ${waybill}`);
        fetchShipments();
        fetchDashboardData();
      } else {
        showToast(`Failed to update status`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShipment = async () => {
    if (!shipmentForm.receiverName || !shipmentForm.receiverPhone || !shipmentForm.receiverAddress) {
      showToast('Fill all required shipment fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        customerCode: shipmentForm.senderPhone, // Fallback to phone as code if not selected from search
        customerType: senderType === 'merchant' ? 1 : 0,
        senderName: shipmentForm.senderName,
        senderPhoneNumber: shipmentForm.senderPhone,
        senderEmail: null,
        senderAddress: shipmentForm.pickupAddress,
        receiverName: shipmentForm.receiverName,
        receiverPhoneNumber: shipmentForm.receiverPhone,
        receiverAddress: shipmentForm.receiverAddress,
        receiverEmail: shipmentForm.receiverEmail || null,
        departureStationId: Number(shipmentForm.departureServiceCentreId),
        destinationStationId: Number(shipmentForm.destinationServiceCentreId),
        items: [{
          description: shipmentForm.itemDescription || 'Package',
          quantity: Number(shipmentForm.quantity),
          weight: Number(shipmentForm.weight),
          price: 0 // Base price is handled by backend pricing engine
        }],
        declaredValue: Number(shipmentForm.declaredValue || 0),
        applyInsurance: shipmentForm.applyInsurance,
        isFragile: shipmentForm.isFragile,
        isSameDay: shipmentForm.isSameDay,
        originType: 0, // Drop-off by default for desk
        isCashOnDelivery: shipmentForm.isCashOnDelivery,
        length: Number(shipmentForm.length || 0),
        width: Number(shipmentForm.width || 0),
        height: Number(shipmentForm.height || 0)
      };

      const response = await fetch(`${API_BASE}/Shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = 'Failed to create shipment';
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.detail || errObj.message || errText;
        } catch {
          errMsg = errText || 'Failed to create shipment';
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      // Handle both PascalCase (old API) and camelCase (new API with JsonOptions)
      const waybillStr: string = data?.Waybill ?? data?.waybill ?? '';
      const grandTotal: number = data?.GrandTotal ?? data?.grandTotal ?? pricingQuote?.grandTotal ?? 0;
      setCreatedWaybill(waybillStr || 'Generated');

      // Build waybill preview locally from form + pricing quote — avoids round-trip 404
      const depStation = stations.find((s: any) => s.id === shipmentForm.departureServiceCentreId || s.stationId === shipmentForm.departureServiceCentreId);
      const destStation = stations.find((s: any) => s.id === shipmentForm.destinationServiceCentreId || s.stationId === shipmentForm.destinationServiceCentreId);
      const localPreview = {
        waybill: waybillStr,
        senderName: shipmentForm.senderName || 'Walk-in Customer',
        senderPhone: shipmentForm.senderPhone || 'N/A',
        senderAddress: shipmentForm.pickupAddress || 'N/A',
        receiverName: shipmentForm.receiverName,
        receiverPhone: shipmentForm.receiverPhone,
        receiverAddress: shipmentForm.receiverAddress,
        departureStation: depStation?.name ?? depStation?.stationName ?? `SC #${shipmentForm.departureServiceCentreId}`,
        destinationStation: destStation?.name ?? destStation?.stationName ?? `SC #${shipmentForm.destinationServiceCentreId}`,
        items: [{ description: shipmentForm.itemDescription || 'Package', quantity: shipmentForm.quantity, weight: shipmentForm.weight }],
        total: pricingQuote?.basePrice ?? 0,
        vat: pricingQuote?.vat ?? 0,
        insurance: pricingQuote?.insurance ?? 0,
        fuelSurcharge: pricingQuote?.fuelSurcharge ?? 0,
        fragileSurcharge: pricingQuote?.fragileSurcharge ?? 0,
        sameDaySurcharge: pricingQuote?.sameDaySurcharge ?? 0,
        grandTotal,
        isCashOnDelivery: shipmentForm.isCashOnDelivery,
        codAmount: shipmentForm.isCashOnDelivery ? grandTotal : 0,
        createdAt: new Date().toISOString(),
        barcodeData: waybillStr,
      };
      setWaybillPreview(localPreview);

      closeModal();
      setShipmentForm({
        senderName: '',
        senderPhone: '',
        pickupAddress: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        receiverEmail: '',
        departureServiceCentreId: 1,
        destinationServiceCentreId: 2,
        weight: 1,
        quantity: 1,
        declaredValue: 0,
        applyInsurance: false,
        itemDescription: '',
        isCashOnDelivery: false,
        isFragile: false,
        isSameDay: false
      });
      setPricingQuote(null);
      await fetchShipments();
      await fetchSortPool();
      await fetchDashboardData();
      showToast(`Shipment ${waybillStr} created — waybill ready`);
      setTimeout(() => setOpenModal('waybill'), 120);
    } catch (error) {
      console.error(error);
      showToast('Shipment creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManifest = async () => {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        departureServiceCentreId: Number(manifestForm.departureServiceCentreId),
        destinationServiceCentreId: Number(manifestForm.destinationServiceCentreId),
        fleetId: manifestForm.fleetId ? Number(manifestForm.fleetId) : null,
        captainId: manifestForm.captainId ? Number(manifestForm.captainId) : null,
        shipmentWaybills: sortGroups.filter(g => g.shipments.length > 0).flatMap(g => g.shipments.map((s: any) => s.id))
      };

      const response = await fetch(`${API_BASE}/Logistics/manifest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create manifest');
      const data = await response.json();
      showToast(`Manifest ${data?.manifestCode || 'created'} created`);
      closeModal();
      await fetchManifests();
    } catch (error) {
      console.error(error);
      showToast('Manifest creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = (v: any) => {
    setVehicleForm({
      id: v.id || v.fleetId,
      registrationNumber: v.registrationNumber || v.plate || '',
      type: v.type || v.fleetType || 'Van',
      make: v.make || '',
      model: v.model || '',
      capacity: v.capacity || v.cap || 500,
      description: v.description || '',
      captainId: v.assignedCaptainId || v.captainId || ''
    });
    setOpenModal('vehicle');
  };

  const handleRegisterVehicle = async () => {
    if (!vehicleForm.registrationNumber) {
      showToast('Plate number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const fleetTypeMap: Record<string, number> = { Bike: 0, Van: 1, Truck: 2, OceanFreight: 3, AirFreight: 4 };
      const payload = {
        fleetId: vehicleForm.id,
        registrationNumber: vehicleForm.registrationNumber,
        fleetType: vehicleForm.type,
        make: vehicleForm.make,
        model: vehicleForm.model,
        capacity: Number(vehicleForm.capacity),
        description: vehicleForm.description || null,
        captain: vehicleForm.captainId ? String(vehicleForm.captainId) : null
      };

      const url = vehicleForm.id ? `${API_BASE}/TenantAdmin/fleet/${vehicleForm.id}` : `${API_BASE}/TenantAdmin/fleet`;
      const method = vehicleForm.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to register/update vehicle');
      showToast(vehicleForm.id ? 'Vehicle updated' : 'Vehicle registered');
      closeModal();
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      showToast('Vehicle operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStation = async () => {
    if (!newScForm.name || !newScForm.parentHubId) {
      showToast('Station name and parent Hub ID are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = {
        name: newScForm.name,
        hubId: Number(newScForm.parentHubId),
        code: newScForm.code,
        serviceCentreId: newScForm.id
      };

      const url = newScForm.id ? `${API_BASE}/TenantAdmin/service-centres/${newScForm.id}` : `${API_BASE}/TenantAdmin/service-centres`;
      const method = newScForm.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save station');
      
      showToast(newScForm.id ? 'Station updated successfully' : 'Station created successfully');
      closeModal();
      setNewScForm({ id: null, parentHubId: 0, name: '', code: '' });
      fetchDashboardData();
    } catch (error) {
      showToast('Failed to save station');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHub = async () => {
    if (!hubForm.name || !hubForm.state) {
      showToast('Hub name and state are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = { name: hubForm.name, state: hubForm.state, hubId: hubForm.id };
      const url = hubForm.id ? `${API_BASE}/TenantAdmin/hubs/${hubForm.id}` : `${API_BASE}/TenantAdmin/hubs`;
      const response = await fetch(url, {
        method: hubForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save hub');
      showToast(hubForm.id ? 'Hub updated' : 'Hub created');
      closeModal();
      setHubForm({ id: null, name: '', state: '' });
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to save hub');
    } finally { setIsSubmitting(false); }
  };


  const handleSavePricing = async () => {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const payload = { matrix: pricingMatrix };
      const response = await fetch(`${API_BASE}/TenantAdmin/pricing/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save pricing matrix');
      showToast('Pricing Matrix saved securely!');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to save matrix');
    } finally { setIsSubmitting(false); }
  };

  const handlePrimaryAction = () => {
    if (currentPage === 'package') {
      if (packageTab === 'sort') {
        const dest = prompt('Destination name (e.g. "Enugu"):');
        if(dest) {
          setSortGroups([...sortGroups, { id: 'g'+groupCounter, label: `Lagos → ${dest}`, route: `LOS→${dest.substring(0,3).toUpperCase()}`, dest, color: sortGroups.length, shipments: [], bags: [], collapsed: false }]);
          setGroupCounter(c => c+1);
          showToast('Group added');
        }
      } else {
        setBuilderManifests([...builderManifests, { id: 'MAN-00'+(90+builderManifests.length), label: `Manifest 00${builderManifests.length+1}`, groups: [], vehicle: '', captain: '', status: 'open' }]);
        setActiveBuilderManifest(builderManifests.length);
        showToast('Manifest created');
      }
    }
    else if (currentPage === 'fleet') setOpenModal('vehicle');
    else if (currentPage === 'network') { setHubForm({ id: null, name: '', state: '' }); setOpenModal('hub'); }
    else if (currentPage === 'pricing') handleSavePricing();
    else setOpenModal('shipment');
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', desk: 'Shipment Desk', package: 'Sort, Bag & Manifest',
      network: 'Network Config', pricing: 'Pricing Engine', fleet: 'Fleet & Captains', ledger: 'Financial Ledger', customers: 'Retail Customers'
    };
    return titles[currentPage] || 'Dashboard';
  };

  const getPrimaryActionText = () => {
    const btns: Record<string, string> = {
      dashboard: '+ New Shipment', desk: '+ New Shipment',
      network: '+ Add Centre', pricing: 'Save Matrix', fleet: '+ Register Vehicle', ledger: '+ New Invoice', customers: 'Export List'
    };
    return btns[currentPage] || '+ New';
  };

  // ─── PAGES ───

  const renderDashboard = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        <div className="m-card"><div className="m-lbl">Today's shipments</div><div className="m-val">{dashboardData?.todayShipments || 0}</div><div className="m-sub up">↑ {dashboardData?.todayShipments > 0 ? 'Live volume' : '0 vs yesterday'}</div></div>
        <div className="m-card"><div className="m-lbl">In transit</div><div className="m-val">{dashboardData?.inTransitCount || 0}</div><div className="m-sub" style={{ color: 'var(--text-tertiary)' }}>Across active routes</div></div>
        <div className="m-card"><div className="m-lbl">Today's revenue</div><div className="m-val">₦{dashboardData?.todayRevenue?.toLocaleString() || 0}</div><div className="m-sub up">↑ Live metrics</div></div>
        <div className="m-card"><div className="m-lbl">Pending COD</div><div className="m-val">₦{dashboardData?.pendingCod?.toLocaleString() || 0}</div><div className="m-sub dn">Uncleared COD</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: '18px' }}>
        <div className="card card-p">
          <div className="card-ttl">Recent shipments</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Waybill</th><th>Sender → Recipient</th><th>Route</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {(dashboardData?.recentShipments || []).map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="mono">{s.waybill}</td>
                    <td style={{ fontSize: '11px' }}>{s.senderRecipient}</td>
                    <td><span className="badge badge-gray">{s.route}</span></td>
                    <td><span className={`badge ${s.badgeClass}`}>{s.status}</span></td>
                    <td className="mono">{s.amount}</td>
                  </tr>
                ))}
                {(!dashboardData?.recentShipments || dashboardData.recentShipments.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No recent shipments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-p">
          <div className="card-ttl">Shipment pipeline</div>
          <div className="timeline">
            {[
              ['dot-b','Processing',`${dashboardData?.pipeline?.processing || 0} shipments awaiting dispatch`,'Today'],
              ['dot-a','Manifested',`${dashboardData?.pipeline?.manifested || 0} on active manifests`,'Today'],
              ['dot-b','In transit',`${dashboardData?.pipeline?.inTransit || 0} en route`,'Live'],
              ['dot-g','Out for delivery',`${dashboardData?.pipeline?.outForDelivery || 0} with captains`,'Live'],
              ['dot-g','Delivered today',`${dashboardData?.pipeline?.deliveredToday || 0}`,'Today'],
            ].map(([dotcls,title,desc,time], i) => (
              <div key={i} className="tl-item">
                <div className="tl-left"><div className={`tl-dot ${dotcls}`}></div><div className="tl-line"></div></div>
                <div className="tl-content"><div className="tl-title">{title}</div><div className="tl-meta">{desc} · {time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card card-p">
          <div className="card-ttl">Active routes (load factor)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {[
              ['Lagos → Abuja',88],['Lagos → Port Harcourt',72],['Lagos → Kano',55],['Abuja → Kaduna',40],['Lagos → Ibadan',62]
            ].map(([r,v], i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}><span>{r}</span><span className="mono">{v}%</span></div>
                <div className="prog-track"><div className="prog-fill" style={{ width: `${v}%`, background: (v as number) > 80 ? 'var(--red)' : (v as number) > 60 ? 'var(--amber)' : 'var(--accent)' }}></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-p">
          <div className="card-ttl">Fleet status summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div className="m-card"><div className="m-lbl">On route</div><div className="m-val" style={{ fontSize: '18px' }}>8</div></div>
            <div className="m-card"><div className="m-lbl">Available</div><div className="m-val" style={{ fontSize: '18px' }}>4</div></div>
            <div className="m-card"><div className="m-lbl">Maintenance</div><div className="m-val" style={{ fontSize: '18px' }}>2</div></div>
            <div className="m-card"><div className="m-lbl">Total fleet</div><div className="m-val" style={{ fontSize: '18px' }}>14</div></div>
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCurrentPage('fleet')}>View fleet →</button>
        </div>
      </div>
    </>
  );

  const renderDesk = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        <div className="m-card"><div className="m-lbl">Created today</div><div className="m-val">148</div></div>
        <div className="m-card"><div className="m-lbl">Pending pickup</div><div className="m-val">34</div></div>
        <div className="m-card"><div className="m-lbl">Override used</div><div className="m-val">7</div><div className="m-sub dn">Review needed</div></div>
        <div className="m-card"><div className="m-lbl">Today's desk revenue</div><div className="m-val">₦1.2M</div></div>
      </div>
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-ttl">All shipments</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn sm">Filter</button>
            <button className="btn sm">Export</button>
            <button className="btn primary sm" onClick={() => setOpenModal('shipment')}>+ New shipment</button>
          </div>
        </div>
        <div className="full-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Waybill</th><th>Sender</th><th>Recipient</th><th>Route</th><th>Type</th><th>Weight</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {shipmentsList.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="mono">{s.waybill}</td>
                    <td style={{ fontSize: '11px' }}>{s.sender}</td>
                    <td style={{ fontSize: '11px' }}>{s.recipient}</td>
                    <td><span className="badge badge-gray">{s.route}</span></td>
                    <td style={{ fontSize: '11px' }}>{s.type}</td>
                    <td className="mono">{s.weight}</td>
                    <td className="mono">{s.amount}</td>
                    <td style={{ fontSize: '11px' }}>{s.payment}</td>
                    <td><span className={`badge ${s.badgeClass}`}>{s.status}</span></td>
                    <td>
                      <div className="btn-row">
                        <button className="ibtn" title="View" onClick={() => handleViewShipment(s.waybill)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg></button>
                        <button className="ibtn" title="Edit" onClick={() => handleEditShipment(s)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                        <button className="ibtn" title="Update Status" onClick={() => handleUpdateShipmentStatus(s.waybill)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 2h-13C.7 2 0 2.7 0 3.5v9C0 13.3.7 14 1.5 14h13c.8 0 1.5-.7 1.5-1.5v-9c0-.8-.7-1.5-1.5-1.5zM4 11H2V9h2v2zm0-3H2V6h2v2zm0-3H2V3h2v2zm9 6H6V9h7v2zm0-3H6V6h7v2zm0-3H6V3h7v2z"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
                          const renderSorting = () => {
    return (
      <div className="package-module">
        <div className="stats-bar">
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--amber)' }}>{sortPool.length}</div><div className="stat-lbl">Unsorted</div></div></div>
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--teal)' }}>{sortGroups.length}</div><div className="stat-lbl">Groups</div></div></div>
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--green)' }}>{sortGroups.reduce((acc,g)=>acc+g.shipments.length,0)}</div><div className="stat-lbl">Sorted</div></div></div>
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--blue)' }}>{sortGroups.reduce((acc,g)=>acc+g.bags.length,0)}</div><div className="stat-lbl">Bags created</div></div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <button className="btn sm" onClick={() => autoSortByDestination()}>⚡ Auto-sort by destination</button>
            <button className="btn sm primary" onClick={() => setPackageTab('manifest')}>Proceed to manifest →</button>
          </div>
        </div>

        <div className="sort-layout">
          <div className="pool-panel" 
               onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
               onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
               onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); if (dragShipId) returnToPool(dragShipId); }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Unsorted pool</div>
                <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>Drag shipments into destination groups →</div>
              </div>
              <button className="btn sm">Filter</button>
            </div>
            <div className="pool-list">
              {sortPool.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>All shipments sorted
                </div>
              ) : sortPool.map(s => (
                <div key={s.id} className={`ship-card ${dragShipId === s.id ? 'dragging' : ''}`} draggable 
                     onDragStart={(e) => onShipDragStart(e, s.id)} onDragEnd={onDragEnd}>
                  <div className="ship-card-top">
                    <span className="ship-wb">{s.id}</span>
                    <span className="ship-type" style={{ background: SHIPMENT_TYPES[s.type]?.bg, color: SHIPMENT_TYPES[s.type]?.c }}>{s.type}</span>
                    <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: 'auto' }}>{s.wt}</span>
                  </div>
                  <div className="ship-route">{s.name}</div>
                  <div className="ship-meta">
                    <span>{s.route}</span><span>{s.amt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="groups-area">
            <div className="groups-toolbar">
              <span style={{ fontSize: '10.5px', color: 'var(--t2)', fontFamily: 'var(--mono)' }}>Destination groups</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button className="btn sm" onClick={() => handlePrimaryAction()}>+ Add group</button>
                <button className="btn sm danger" onClick={clearEmptyGroups}>Clear empty</button>
              </div>
            </div>
            <div className="groups-scroll">
              {sortGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>No groups yet — click "+ Add group" to start</div>
              ) : sortGroups.map(g => {
                const col = GROUP_COLORS[g.color % GROUP_COLORS.length];
                const totalWeight = g.shipments.reduce((a: any, s: any) => a + parseFloat(s.wt), 0).toFixed(1);
                return (
                  <div key={g.id} className={`group-card ${g.collapsed ? 'collapsed' : ''}`}
                       onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-target'); }}
                       onDragLeave={(e) => { e.currentTarget.classList.remove('drag-target'); }}
                       onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-target'); if (dragShipId) moveShipToGroup(dragShipId, g.id); }}>
                    <div className="group-header" onClick={() => toggleGroup(g.id)}>
                      <div className="group-color-bar" style={{ background: col.c }}></div>
                      <div style={{ flex: 1 }}>
                        <div className="group-title">{g.label}</div>
                        <div className="group-subtitle">{g.shipments.length} shipments · {totalWeight}kg total</div>
                      </div>
                      <span className="group-count" style={{ background: col.d, color: col.c }}>{g.shipments.length}</span>
                      <button className="btn sm danger" style={{ marginLeft: '4px', padding: '0 6px' }} onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }}>✕</button>
                      <span className="group-chevron" style={{ marginLeft: '6px' }}>{g.collapsed ? '▸' : '▾'}</span>
                    </div>
                    {!g.collapsed && (
                      <>
                        <div className="group-body">
                          <div className="group-drop-zone" 
                               onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                               onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
                               onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); if (dragShipId) moveShipToGroup(dragShipId, g.id); }}>
                            {g.shipments.length > 0 ? 'Drop more shipments here' : 'Drop shipments here'}
                          </div>
                          {g.shipments.map((s: any) => {
                            const ts = SHIPMENT_TYPES[s.type];
                            return (
                              <div key={s.id} className={`ship-card ${dragShipId === s.id ? 'dragging' : ''}`} draggable 
                                   onDragStart={(e) => onShipDragStart(e, s.id)} onDragEnd={onDragEnd}>
                                <div className="ship-card-top">
                                  <span className="ship-wb">{s.id}</span>
                                  <span className="ship-type" style={{ background: ts?.bg, color: ts?.c }}>{s.type}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: 'auto' }}>{s.wt}</span>
                                </div>
                                <div className="ship-route">{s.name}</div>
                                <div className="ship-meta"><span>{s.route}</span><span>{s.amt}</span></div>
                                <div className="drag-handle"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 4h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm4-8h2v2H7zm0 4h2v2H7zm0 4h2v2H7zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"/></svg></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="group-footer">
                          <div style={{ display: 'flex', gap: '5px', flex: 1, flexWrap: 'wrap' }}>
                            {g.bags.map((b: any) => (
                              <div key={b.id} className="bag-tag" onClick={() => showToast(`${b.id} selected`)}>
                                <div className="bag-dot" style={{ background: col.c }}></div>
                                <span style={{ fontWeight: 600 }}>{b.label}</span>
                                <span className="bag-tag-count">{b.shipments.length} pkgs</span>
                              </div>
                            ))}
                          </div>
                          <button className="btn sm primary" onClick={() => createBag(g.id)}>+ New bag</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManifestBuilder = () => {
    const sortedGroups = sortGroups.filter(g => g.shipments.length > 0 || g.bags.length > 0);
    const m = builderManifests[activeBuilderManifest];
    
    return (
      <div className="package-module">
        <div className="stats-bar">
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--teal)' }}>{sortedGroups.length}</div><div className="stat-lbl">Groups ready</div></div></div>
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--amber)' }}>{builderManifests.reduce((acc,man)=>acc+man.groups.length,0)}</div><div className="stat-lbl">Manifested</div></div></div>
          <div className="stat-pill"><div><div className="stat-val" style={{ color: 'var(--green)' }}>{builderManifests.length}</div><div className="stat-lbl">Manifests</div></div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <button className="btn sm" onClick={() => handlePrimaryAction()}>+ New manifest</button>
            <button className="btn sm solid" onClick={() => showToast('All manifests dispatched!')}>Dispatch all manifests →</button>
          </div>
        </div>

        <div className="manifest-layout">
          <div className="manifest-pool">
            <div className="panel-header">
              <div>
                <div className="panel-title">Sorted groups — drag into a manifest</div>
                <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>Each group contains its bags. One manifest can hold multiple groups.</div>
              </div>
            </div>
            <div className="manifest-groups-scroll">
              {sortedGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>No sorted groups yet. Complete sorting first.</div>
              ) : sortedGroups.map(g => {
                const col = GROUP_COLORS[g.color % GROUP_COLORS.length];
                const inManifest = builderManifests.some(man => man.groups.includes(g.id));
                return (
                  <div
                    key={g.id}
                    className={`mgroup-row ${inManifest ? 'in-manifest' : ''}`}
                    draggable={!inManifest}
                    onDragStart={(e) => !inManifest && onMGroupDragStart(e, g.id)}
                    onDragEnd={onDragEnd}
                  >
                    <div className="mgroup-bar" style={{ background: col.c }}></div>
                    <div className="mgroup-info">
                      <div className="mgroup-route">{g.label}</div>
                      <div className="mgroup-meta">
                        <span>{g.shipments.length} shipments</span>
                        {inManifest ? <span style={{ color: 'var(--teal)' }}>✓ In manifest</span> : ''}
                      </div>
                      <div className="mgroup-bags">
                        {g.bags.map((b: any) => (
                          <div key={b.id} className="bag-chip">
                            <div className="bag-dot" style={{ background: col.c }}></div>
                            {b.label} · {b.shipments.length}p
                          </div>
                        ))}
                      </div>
                    </div>
                    {inManifest ? <span style={{ fontSize: '18px', color: 'var(--teal)' }}>✓</span> : <span style={{ color: 'var(--t3)', fontSize: '18px' }}>⠿</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="manifest-right" style={{ background: 'var(--s1)' }}>
            <div className="manifest-header" style={{ padding: '12px 14px 10px', borderBottom: '0.5px solid var(--b1)' }}>
              <div className="manifest-header-top">
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t1)' }}>Manifests</span>
              </div>
              <div className="manifest-selector" style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '4px' }}>
                {builderManifests.map((man, i) => (
                  <div
                    key={i}
                    className={`manifest-tab ${i === activeBuilderManifest ? 'active' : ''}`}
                    onClick={() => setActiveBuilderManifest(i)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: '0.5px solid var(--b1)',
                      background: i === activeBuilderManifest ? 'var(--teal-d)' : 'var(--s3)',
                      color: i === activeBuilderManifest ? 'var(--teal)' : 'var(--t2)',
                    }}
                  >
                    {man.label}
                  </div>
                ))}
                <div
                  className="manifest-tab add-btn"
                  onClick={() => handlePrimaryAction()}
                  style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', whiteSpace: 'nowrap', border: '0.5px dashed var(--b2)', background: 'var(--s3)', color: 'var(--t3)' }}
                >
                  + New
                </div>
              </div>
            </div>
            
            {m && (
              <>
                <div className="manifest-scroll" style={{ padding: '12px' }}>
                  <div
                    className="manifest-drop-zone"
                    style={{ minHeight: '80px', border: '1.5px dashed var(--b2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', transition: 'all .15s', marginBottom: '10px', padding: '16px', background: 'var(--s2)' }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--teal)';
                      e.currentTarget.style.background = 'var(--teal-d)';
                      e.currentTarget.style.color = 'var(--teal)';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--b2)';
                      e.currentTarget.style.background = 'var(--s2)';
                      e.currentTarget.style.color = 'var(--t3)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--b2)';
                      e.currentTarget.style.background = 'var(--s2)';
                      e.currentTarget.style.color = 'var(--t3)';
                      if (dragMGroupId) addGroupToActiveManifest(dragMGroupId);
                    }}
                  >
                    <div style={{ fontSize: '32px', lineHeight: 1, color: 'var(--t4)', marginBottom: '8px' }}>+</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--t3)' }}>Drop groups here</div>
                  </div>
                  {m.groups.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      No groups added yet.
                    </div>
                  ) : (
                    m.groups.map((groupId: string) => {
                      const group = sortedGroups.find((g) => g.id === groupId);
                      if (!group) return null;
                      const col = GROUP_COLORS[group.color % GROUP_COLORS.length];
                      return (
                        <div key={group.id} className="mentry" style={{ background: 'var(--s3)', border: '0.5px solid var(--b1)', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
                          <div className="mentry-top" style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
                            <div className="mentry-bar" style={{ width: '4px', height: '28px', borderRadius: '2px', background: col.c }}></div>
                            <div className="mentry-route" style={{ flex: 1, fontSize: '12.5px', fontWeight: 600 }}>{group.label}</div>
                            <button className="mentry-remove" style={{ width: '22px', height: '22px', borderRadius: '5px', border: '0.5px solid var(--b1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }} onClick={() => removeFromManifest(group.id)}>
                              <svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4L4 12" /></svg>
                            </button>
                          </div>
                          <div className="mentry-bags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {group.bags.length > 0 ? group.bags.map((bag: any) => (
                              <div key={bag.id} className="bag-chip">
                                <div className="bag-dot" style={{ background: col.c }}></div>
                                {bag.label} · {bag.shipments.length}p
                              </div>
                            )) : (
                              <div style={{ fontSize: '10.5px', color: 'var(--t3)' }}>No bags yet</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="fleet-assign">
                  <div className="fleet-assign-title">Assign fleet & dispatch</div>
                  <div className="manifest-summary">
                    <div className="ms-row"><span className="ms-key">Manifest ID</span><span className="ms-val accent">{m.id}</span></div>
                    <div className="ms-row"><span className="ms-key">Groups</span><span className="ms-val">{m.groups.length}</span></div>
                    <div className="ms-row"><span className="ms-key">Status</span><span className="ms-val">{m.status}</span></div>
                  </div>
                  <select className="select-field"><option value="">Fleet type…</option><option value="own">Own fleet</option></select>
                  <select 
                    className="select-field" 
                    value={m.vehicle} 
                    onChange={(e) => {
                      const updated = [...builderManifests];
                      updated[activeBuilderManifest].vehicle = e.target.value;
                      setBuilderManifests(updated);
                    }}
                  >
                    <option value="">Select vehicle…</option>
                    {(dashboardData?.eligibleVehicles || []).map((v: any) => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  <select 
                    className="select-field" 
                    value={m.captain} 
                    onChange={(e) => {
                      const updated = [...builderManifests];
                      updated[activeBuilderManifest].captain = e.target.value;
                      setBuilderManifests(updated);
                    }}
                  >
                    <option value="">Select captain…</option>
                    {(dashboardData?.eligibleCaptains || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button className="btn solid" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} onClick={() => handleDispatchManifest(m.id)} disabled={m.groups.length === 0}>
                    Create trip & notify captain →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHubDetails = () => {
    if (!viewingHub) return <div className="sec">Select a hub first</div>;
    return (
      <div className="sec">
        <div className="sec-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="ibtn" onClick={() => setCurrentPage('network')} title="Back to network"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1L5 8l6 7" /></svg></button>
            <span className="sec-ttl">{viewingHub.name} · Stations</span>
          </div>
          <button className="btn primary sm" onClick={() => {
            setNewScForm({ ...newScForm, parentHubId: viewingHub.id });
            showToast(`Pre-filling parent hub: ${viewingHub.name}`);
            setOpenModal('service-centre');
          }}>+ Add station</button>
        </div>
        <div className="full-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Station name</th><th>Code</th><th>Type</th><th>Address</th><th>Shipments today</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {(viewingHub.stationsList || [
                  {name: 'Iyana Ipaja Station', code: 'LAG-IYA', type: 'Station', address: '12 Ipaja Rd', count: 12, status: 'Active'},
                  {name: 'Ogba Station', code: 'LAG-OGB', type: 'Station', address: '45 Ogba St', count: 8, status: 'Active'}
                ]).map((st: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{st.name}</td>
                    <td className="mono">{st.code}</td>
                    <td><span className="badge badge-gray">{st.type}</span></td>
                    <td style={{ fontSize: '11px' }}>{st.address}</td>
                    <td className="mono">{st.count}</td>
                    <td><span className="badge badge-green">{st.status}</span></td>
                    <td><button className="ibtn" onClick={() => {
                      setNewScForm({ id: st.id, parentHubId: viewingHub.id, name: st.name, code: st.code });
                      setOpenModal('service-centre');
                    }}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderNetwork = () => (
    <div className="sec">
      <div className="sec-hd">
        <span className="sec-ttl">Service Centres & Stations</span>
        <button className="btn primary sm" onClick={handlePrimaryAction}>+ Add centre</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
    <div className="card card-p">
      <div className="card-ttl">Hubs</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Hub name</th><th>State</th><th>Stations</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(dashboardData?.hubs || [
              {id: 1, name: 'Lagos VI Hub', state: 'Lagos', stations: 4, status: 'Active'},
              {id: 2, name: 'Ikeja Hub', state: 'Lagos', stations: 3, status: 'Active'},
              {id: 3, name: 'Abuja Wuse Hub', state: 'FCT', stations: 5, status: 'Active'}
            ]).map((hub: any, i: number) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, fontSize: '12px' }}>{hub.name}</td>
                <td style={{ fontSize: '11px' }}>{hub.state}</td>
                <td className="mono">{hub.stations}</td>
                <td>{hub.status === 'Active' ? <span className="badge badge-green">Active</span> : <span className="badge badge-amber">Offline</span>}</td>
                <td>
                  <div className="btn-row">
                    <button className="ibtn" title="View details" onClick={() => { setViewingHub(hub); setCurrentPage('hub-details'); }}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg></button>
                    <button className="ibtn" onClick={() => { setHubForm({ id: hub.id, name: hub.name, state: hub.state }); setOpenModal('hub'); }}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
        <div className="card card-p">
          <div className="card-ttl">Route mapping</div>
          <table>
            <thead><tr><th>Origin</th><th>Destination</th><th>Zone</th><th>Est. hrs</th><th></th></tr></thead>
            <tbody>
              {[
                ['Lagos VI','Abuja Wuse','Zone B','6'],
                ['Lagos VI','Port Harcourt','Zone B','5'],
                ['Lagos VI','Kano','Zone C','9'],
                ['Lagos VI','Ibadan','Zone A','1.5'],
                ['Abuja','Kaduna','Zone A','2'],
              ].map(([o,d,z,h], i) => (
                <tr key={i}>
                  <td style={{ fontSize: '11px' }}>{o}</td>
                  <td style={{ fontSize: '11px' }}>{d}</td>
                  <td><span className="badge badge-blue">{z}</span></td>
                  <td className="mono">{h}h</td>
                  <td><button className="ibtn" onClick={() => showToast('Editing route…')}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => {
    const zones = ['Zone A','Zone B','Zone C','Zone D'];
    const weights = ['0–1kg','1–3kg','3–5kg','5–10kg','10–20kg','20kg+'];
    const matrix = [
      [800,1200,1800,2400],[1200,2000,3200,4200],[1800,2800,4400,5800],
      [2600,3800,5800,7600],[4200,6000,9000,12000],[7000,10000,16000,22000],
    ];
    return (
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-ttl">Pricing Engine</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn sm" onClick={() => showToast('Pricing exported')}>Export</button>
            <button className="btn primary sm" onClick={handlePrimaryAction}>Save matrix</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div className="card card-p">
            <div className="card-ttl">Zone definitions</div>
            <table>
              <thead><tr><th>Zone</th><th>Coverage</th><th>Base rate (₦/kg)</th><th></th></tr></thead>
              <tbody>
                {(dashboardData?.pricing?.zones || [
                  ['Zone 1','Same state / adjacent','800'],
                  ['Zone 2','2–3 states away','1,200'],
                  ['Zone 3','4–6 states away','1,800'],
                  ['Zone 4','Far north / south cross','2,400'],
                  ['Zone 5','Remote areas','3,500'],
                ]).map(([z,cov,rate]: any, i: number) => (
                  <tr key={i}>
                    <td><span className="badge badge-blue">{z}</span></td>
                    <td style={{ fontSize: '11px' }}>{cov}</td>
                    <td className="mono">₦{rate}</td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card card-p">
            <div className="card-ttl">Surcharges & fees</div>
            <table>
              <thead><tr><th>Fee type</th><th>Value</th><th>Applies to</th></tr></thead>
              <tbody>
                {[
                  ['Insurance','1.5%','Declared value'],
                  ['Handling fee','₦150 flat','All shipments'],
                  ['COD fee','1.2%','COD payments'],
                  ['Express surcharge','40%','Express type'],
                  ['Fragile surcharge','25%','Fragile type'],
                  ['Fuel surcharge','8%','All routes'],
                ].map(([f,v,a], i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '11px', fontWeight: 500 }}>{f}</td>
                    <td className="mono">{v}</td>
                    <td style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-p">
          <div className="card-ttl">Weight × Zone price matrix (₦) — click cells to edit</div>
          <div className="matrix-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Weight</th>
                  {zones.map((z, i) => <th key={i}>{z}</th>)}
                </tr>
              </thead>
              <tbody>
                {weights.map((w,wi) => (
                  <tr key={wi}>
                    <td className="zone-lbl">{w}</td>
                    {zones.map((_,zi) => (
                      <td key={zi} className="editable" contentEditable suppressContentEditableWarning onFocus={(e) => e.currentTarget.style.background='var(--bg-info)'} onBlur={(e) => {
                        e.currentTarget.style.background='';
                        const val = parseInt(e.currentTarget.innerText.replace(/[^0-9]/g, ''), 10);
                        if (!isNaN(val)) {
                          const newM = [...pricingMatrix];
                          newM[wi][zi] = val;
                          setPricingMatrix(newM);
                        }
                      }}>
                        ₦{pricingMatrix[wi][zi].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFleet = () => {
    const vehicles = [
      {plate:'LAS-441-KJ',type:'Sprinter Van',cap:'800kg',status:'On Route',trip:'MAN-0085',fuel:'72%',driver:'Emeka Okafor'},
      {plate:'LAS-882-XZ',type:'Box Truck',cap:'2,000kg',status:'On Route',trip:'MAN-0086',fuel:'55%',driver:'Bashir Musa'},
      {plate:'ABJ-220-MN',type:'Pickup Truck',cap:'500kg',status:'On Route',trip:'MAN-0087',fuel:'88%',driver:'Tunde Fashola'},
      {plate:'LAS-103-QP',type:'Sprinter Van',cap:'800kg',status:'On Route',trip:'MAN-0088',fuel:'40%',driver:'Yemi Alade'},
      {plate:'LAS-557-BD',type:'Motorcycle',cap:'30kg',status:'Available',trip:'—',fuel:'90%',driver:'Unassigned'},
      {plate:'LAS-219-WT',type:'Sprinter Van',cap:'800kg',status:'Available',trip:'—',fuel:'95%',driver:'Unassigned'},
      {plate:'ABJ-441-RR',type:'Box Truck',cap:'2,000kg',status:'Maintenance',trip:'—',fuel:'—',driver:'In workshop'},
      {plate:'LAS-774-KX',type:'Pickup Truck',cap:'500kg',status:'Available',trip:'—',fuel:'82%',driver:'Unassigned'},
    ];
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
          <div className="m-card"><div className="m-lbl">Total vehicles</div><div className="m-val">14</div></div>
          <div className="m-card"><div className="m-lbl">On route</div><div className="m-val">8</div><div className="m-sub" style={{ color: 'var(--text-info)' }}>Active trips</div></div>
          <div className="m-card"><div className="m-lbl">Available</div><div className="m-val">4</div><div className="m-sub up">Ready to assign</div></div>
          <div className="m-card"><div className="m-lbl">Maintenance</div><div className="m-val">2</div><div className="m-sub dn">Action needed</div></div>
        </div>
        <div className="sec">
          <div className="sec-hd">
            <span className="sec-ttl">Vehicles</span>
            <button className="btn primary sm" onClick={() => setOpenModal('vehicle')}>+ Register vehicle</button>
          </div>
          <div className="fleet-grid">
            {(dashboardData?.fleet || vehicles).map((v: any, i: number) => (
              <div key={i} className="fleet-card">
                <div className="fleet-plate">{v.registrationNumber || v.plate}</div>
                <div className="fleet-type">{(v.make && v.model) ? `${v.make} ${v.model}` : v.type || v.fleetType} · {v.capacity || v.cap}</div>
                <div style={{ marginBottom: '6px' }}>
                  {v.status === 'On Route' ? <span className="badge badge-blue">On Route</span> : (v.status === 'Available' || v.isActive) ? <span className="badge badge-green">Available</span> : <span className="badge badge-amber">Maintenance</span>}
                </div>
                <div className="fleet-stat-row"><span>Captain</span><span style={{ fontWeight: 500 }}>{v.captainName || v.driver || 'Unassigned'}</span></div>
                <div className="fleet-stat-row"><span>Description</span><span style={{ fontSize: '10.5px' }}>{v.description || '—'}</span></div>
                {v.fuel && v.fuel !== '—' && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}><span style={{ color: 'var(--text-tertiary)' }}>Fuel</span><span className="mono">{v.fuel}</span></div>
                    <div className="prog-track"><div className="prog-fill" style={{ width: v.fuel, background: parseInt(v.fuel) < 40 ? 'var(--red)' : parseInt(v.fuel) < 60 ? 'var(--amber)' : 'var(--green)' }}></div></div>
                  </div>
                )}
                <div className="fleet-actions">
                  <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => showToast(`Viewing ${v.registrationNumber || v.plate}`)}>Details</button>
                  <button className="ibtn" onClick={() => handleEditVehicle(v)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.1 2.9a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L5.7 12.3l-2.2.5.5-2.2L11.1 2.9z"/></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sec" style={{ marginTop: '32px' }}>
          <div className="sec-hd">
            <span className="sec-ttl">Captains (Drivers)</span>
            <button className="btn sm" onClick={() => showToast('Messaging all online captains')}>Message online</button>
          </div>
          <div className="full-card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Captain Name</th><th>ID / Phone</th><th>Status</th><th>Vehicle</th><th>Active Trip</th><th></th></tr></thead>
                <tbody>
                  {[
                    ['Emeka Okafor','CAP-4012 / 0801...','On Route','LAS-441-KJ','MAN-0085'],
                    ['Bashir Musa','CAP-4088 / 0803...','On Route','LAS-882-XZ','MAN-0086'],
                    ['Tunde Fashola','CAP-3921 / 0810...','On Route','ABJ-220-MN','MAN-0087'],
                    ['Yemi Alade','CAP-4105 / 0706...','On Route','LAS-103-QP','MAN-0088'],
                    ['Dave R.','CAP-4012 / 0909...','Online','Unassigned','—'],
                  ].map(([name, phone, status, veh, trip], i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, fontSize: '12px' }}>{name}</td>
                      <td className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{phone}</td>
                      <td>{status === 'Online' ? <span className="badge badge-green">Online</span> : <span className="badge badge-blue">On Route</span>}</td>
                      <td><span className="badge badge-gray">{veh}</span></td>
                      <td className="mono">{trip}</td>
                      <td><button className="ibtn" onClick={() => showToast(`Viewing ${name}`)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderLedger = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        <div className="m-card"><div className="m-lbl">Today's revenue</div><div className="m-val">₦1.2M</div><div className="m-sub up">↑ 8.4%</div></div>
        <div className="m-card"><div className="m-lbl">Month to date</div><div className="m-val">₦28.4M</div><div className="m-sub up">↑ 12% vs Mar</div></div>
        <div className="m-card"><div className="m-lbl">Pending COD</div><div className="m-val">₦340K</div><div className="m-sub dn">12 unsettled</div></div>
        <div className="m-card"><div className="m-lbl">Outstanding invoices</div><div className="m-val">₦1.8M</div><div className="m-sub dn">5 overdue</div></div>
      </div>
      <div className="ledger-split">
        <div className="sec">
          <div className="sec-hd"><span className="sec-ttl">Daily revenue</span><button className="btn sm" onClick={() => showToast('Exported')}>Export</button></div>
          <div className="full-card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Shipments</th><th>Revenue</th><th>COD collected</th></tr></thead>
                <tbody>
                  {[
                    ['Apr 23','148','₦1,241,200','₦184,000'],
                    ['Apr 22','162','₦1,380,400','₦210,000'],
                    ['Apr 21','140','₦1,190,000','₦176,000'],
                    ['Apr 20','155','₦1,312,500','₦196,000'],
                    ['Apr 19','88','₦748,000','₦112,000'],
                  ].map(([d,s,r,c], i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '11px' }}>{d}</td>
                      <td className="mono">{s}</td>
                      <td className="mono" style={{ color: 'var(--green)' }}>{r}</td>
                      <td className="mono">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="sec">
          <div className="sec-hd"><span className="sec-ttl">COD settlements</span><button className="btn primary sm" onClick={() => showToast('Settlement processed')}>Settle selected</button></div>
          <div className="full-card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Merchant</th><th>Amount</th><th>Shipments</th><th>Status</th></tr></thead>
                <tbody>
                  {[
                    ['Konga Nigeria','₦142,000','18','Pending'],
                    ['Jumia Express','₦98,500','12','Pending'],
                    ['SwiftMart NG','₦64,200','8','Processed'],
                    ['ArabaShop','₦35,800','5','Pending'],
                    ['NaijaDeals','₦18,400','3','Processed'],
                  ].map(([m,a,s,st], i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '11px', fontWeight: 500 }}>{m}</td>
                      <td className="mono">{a}</td>
                      <td className="mono">{s}</td>
                      <td>{st === 'Pending' ? <span className="badge badge-amber">Pending</span> : <span className="badge badge-green">Processed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-hd"><span className="sec-ttl">Invoices</span><button className="btn primary sm" onClick={() => showToast('Invoice created')}>+ New invoice</button></div>
        <div className="full-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice #</th><th>Client</th><th>Period</th><th>Shipments</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {[
                  ['INV-0284','Konga Nigeria','Apr 1–15','280','₦840,000','Apr 30','Unpaid'],
                  ['INV-0283','Jumia Express','Apr 1–15','194','₦582,000','Apr 30','Unpaid'],
                  ['INV-0282','SwiftMart NG','Mar 16–31','142','₦426,000','Apr 15','Paid'],
                  ['INV-0281','ArabaShop','Mar 16–31','88','₦264,000','Apr 15','Overdue'],
                  ['INV-0280','NaijaDeals','Mar 1–15','64','₦192,000','Apr 1','Paid'],
                ].map(([inv,cl,per,s,a,due,st], i) => (
                  <tr key={i}>
                    <td className="mono">{inv}</td>
                    <td style={{ fontSize: '11px', fontWeight: 500 }}>{cl}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{per}</td>
                    <td className="mono">{s}</td>
                    <td className="mono">{a}</td>
                    <td style={{ fontSize: '11px' }}>{due}</td>
                    <td>{st === 'Paid' ? <span className="badge badge-green">Paid</span> : st === 'Overdue' ? <span className="badge badge-red">Overdue</span> : <span className="badge badge-amber">Unpaid</span>}</td>
                    <td><button className="ibtn" onClick={() => showToast(`Viewing ${inv}`)}><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 8 1.5 8S4.5 13 8 13s6.5-5 6.5-5S11.5 3 8 3zm0 7a2 2 0 110-4 2 2 0 010 4z"/></svg></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderCustomers = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        <div className="m-card"><div className="m-lbl">Active Retail Users</div><div className="m-val">24,501</div><div className="m-sub up">↑ 340 this week</div></div>
        <div className="m-card"><div className="m-lbl">Total App Downloads</div><div className="m-val">102K</div></div>
        <div className="m-card"><div className="m-lbl">Support Tickets</div><div className="m-val">12</div><div className="m-sub dn">3 high priority</div></div>
      </div>
      <div className="sec">
        <div className="sec-hd"><span className="sec-ttl">Retail Customers Directory</span></div>
        <div className="full-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer Name</th><th>Email / Phone</th><th>Total Shipments</th><th>Wallet Balance</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {retailCustomers.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, fontSize: '12px' }}>{c.name}</td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.emailPhone}</td>
                    <td className="mono">{c.totalShipments}</td>
                    <td className="mono">{c.walletBalance}</td>
                    <td>{c.status === 'Active' ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Blocked</span>}</td>
                    <td><button className="btn sm" onClick={() => showToast(`Viewing profile: ${c.name}`)}>View Profile</button></td>
                  </tr>
                ))}
                {retailCustomers.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );


  return (
    <>
      <div className="shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="logo-bar">
          <div className="logo-icon">
            <svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v2A1.5 1.5 0 0113.5 7h-11A1.5 1.5 0 011 5.5v-2zm0 6A1.5 1.5 0 012.5 8h11A1.5 1.5 0 0115 9.5v3A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-3z"/></svg>
          </div>
          <div>
            <div className="logo-text">SwiftLog NG</div>
            <div className="logo-tenant">ops.cargomint.io</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-grp">
            <div className="nav-grp-label">Overview</div>
            <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
              Dashboard {currentPage === 'dashboard' && <span className="nav-pip"></span>}
            </div>
          </div>
          <div className="nav-grp">
            <div className="nav-grp-label">Shipments</div>
            <div className={`nav-item ${currentPage === 'desk' ? 'active' : ''}`} onClick={() => setCurrentPage('desk')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 5a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V8zm1 4a1 1 0 000 2h6a1 1 0 000-2H3z"/></svg>
              Shipment Desk
            </div>
            <div className={`nav-item ${currentPage === 'customers' ? 'active' : ''}`} onClick={() => setCurrentPage('customers')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z"/></svg>
              Retail Customers
            </div>
          </div>
          
          <div className="nav-grp">
            <div className="nav-grp-label">Handling Operations</div>
            <div className={`nav-item ${currentPage === 'package' && packageTab === 'sort' ? 'active' : ''}`} onClick={() => { setCurrentPage('package'); setPackageTab('sort'); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 4v8l7 3 7-3V4L8 1z"/></svg>
              Sorting & Bagging
            </div>
            <div className={`nav-item ${currentPage === 'package' && packageTab === 'manifest' ? 'active' : ''}`} onClick={() => { setCurrentPage('package'); setPackageTab('manifest'); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>
              Manifest Builder
            </div>
            <div className={`nav-item ${currentPage === 'active_manifests' ? 'active' : ''}`} onClick={() => { setCurrentPage('package'); setPackageTab('manifest'); }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v2H1V3zm0 4h14v2H1V7zm0 4h14v2H1v-2z"/></svg>
              Active Manifests
            </div>
          </div>

          <div className="nav-grp">
            <div className="nav-grp-label">Finance</div>
            <div className={`nav-item ${currentPage === 'ledger' ? 'active' : ''}`} onClick={() => setCurrentPage('ledger')}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zm0 3h12v2H2zm0 3h8v2H2zm0 3h6v2H2z"/></svg>
              Financial Ledger
            </div>
          </div>

          <div className="nav-grp">
            <div className="nav-grp-label">Help</div>
            <a href="/ops-dashboard/support" className="nav-item" style={{ textDecoration: 'none' }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm3 4h2v2H7v-2z"/></svg>
              Need Help?
            </a>
          </div>
        </nav>
        <div className="sidebar-foot" style={{ position: 'relative' }}>
          {userMenuOpen ? (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', background: 'rgba(10,14,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', animation: 'slideUpCard 160ms ease-out' }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="button" onClick={() => { setUserMenuOpen(false); logout(); }}>Log out</button>
            </div>
          ) : null}
          <div className="user-chip" onClick={() => setUserMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
            <div className="ava">{user?.firstName?.substring(0, 1) || 'H'}{user?.lastName?.substring(0, 1) || 'M'}</div>
            <div>
              <div className="u-name">{user?.firstName ? `${user.firstName} ${user?.lastName ?? ''}`.trim() : 'Ops User'}</div>
              <div className="u-role">{user?.email || 'ops@cargomint.io'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{getPageTitle()}</div>
          {currentPage === 'package' ? (
            <div className="page-tabs" style={{ marginLeft: 'auto', marginRight: '16px', display: 'flex', gap: '2px', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)' }}>
              <div className={`page-tab ${packageTab === 'sort' ? 'active' : ''}`} onClick={() => setPackageTab('sort')} style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all .12s', whiteSpace: 'nowrap', ...(packageTab === 'sort' ? { background: 'rgba(0,212,170,.08)', color: 'var(--accent)', border: '0.5px solid rgba(0,212,170,.22)' } : { color: 'var(--text-secondary)' }) }}>1 · Sort & Bag</div>
              <div className={`page-tab ${packageTab === 'manifest' ? 'active' : ''}`} onClick={() => setPackageTab('manifest')} style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all .12s', whiteSpace: 'nowrap', ...(packageTab === 'manifest' ? { background: 'rgba(0,212,170,.08)', color: 'var(--accent)', border: '0.5px solid rgba(0,212,170,.22)' } : { color: 'var(--text-secondary)' }) }}>2 · Manifest Builder</div>
            </div>
          ) : (
            <div className="srch">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
              <input placeholder="Search waybills, customers…" />
            </div>
          )}
          <button className="btn primary" onClick={handlePrimaryAction}>{currentPage === 'package' ? (packageTab === 'sort' ? '+ New group' : '+ New manifest') : getPrimaryActionText()}</button>
        </header>
        <div className={`content ${currentPage === 'package' ? 'no-padding' : ''}`}>
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'desk' && renderDesk()}
          {currentPage === 'package' && (packageTab === 'sort' ? renderSorting() : renderManifestBuilder())}
          {currentPage === 'network' && renderNetwork()}
          {currentPage === 'hub-details' && renderHubDetails()}
          {currentPage === 'pricing' && renderPricing()}
          {currentPage === 'fleet' && renderFleet()}
          {currentPage === 'customers' && renderCustomers()}
          {currentPage === 'ledger' && renderLedger()}
        </div>
      </div>

      </div>

      {/* ── MODALS ── */}
      
      {/* New Shipment Modal */}
      <div className={`overlay ${openModal === 'shipment' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal modal-lg">
          <div className="modal-hd">
            <div className="modal-ttl">Create new shipment</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="tabs">
            {['Sender', 'Recipient', 'Items', 'Pricing'].map((tab, i) => (
              <div 
                key={i} 
                className={`tab ${activeTab === i ? 'active' : ''} ${i > activeTab && !canGoNext(activeTab) ? 'disabled' : ''}`} 
                onClick={() => {
                  if (i === activeTab) return;
                  if (i > activeTab) {
                    // Check if current step is valid before moving forward
                    if (!canGoNext(activeTab)) {
                      setShowValidation(true);
                      showToast(`Please complete the ${['Sender', 'Recipient', 'Items'][activeTab]} step first`);
                      return;
                    }
                    // Also check if we are skipping steps
                    if (i > activeTab + 1) {
                        showToast(`Please complete steps sequentially`);
                        return;
                    }
                  }
                  setActiveTab(i);
                  setShowValidation(false);
                }}
                style={{ 
                  cursor: i <= activeTab || canGoNext(activeTab) ? 'pointer' : 'not-allowed',
                  opacity: i > activeTab && !canGoNext(activeTab) ? 0.5 : 1
                }}
              >
                {tab}
              </div>
            ))}
          </div>
          
          <div className="modal-content-scroll" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: activeTab === 0 ? 'block' : 'none' }}>
              <div className="form-2" style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <label className="lbl">Quick lookup (Sender)</label>
                  <input className="inp" placeholder="Type name or phone..." 
                    onChange={(e) => handleSearchCustomers(e.target.value, 'sender')} />
                  {senderSearchResults.length > 0 && (
                    <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                      {senderSearchResults.map((res: any, i: number) => (
                        <div key={i} className="search-item" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #30363D' }} onClick={() => {
                          setShipmentForm({ ...shipmentForm, senderName: res.name, senderPhone: res.phone, pickupAddress: res.address || '' });
                          setSenderType(res.type === 1 ? 'merchant' : 'individual');
                          setSenderSearchResults([]);
                        }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#E6EDF3' }}>{res.name}</div>
                          <div style={{ fontSize: '10px', color: '#8B949E' }}>{res.phone} · {res.type === 1 ? 'Merchant' : 'Retail'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="lbl">Sender type</label>
                  <select className="sel" value={senderType} onChange={(e) => setSenderType(e.target.value === 'merchant' ? 'merchant' : 'individual')}>
                    <option value="individual">Customer (walk-in/retail)</option>
                    <option value="merchant">Merchant (walk-in/company)</option>
                  </select>
                </div>
              </div>
              <div className="form-2">
                <div><label className="lbl">Sender name</label><input className="inp" style={{ border: showValidation && !shipmentForm.senderName ? '1px solid #FF4444' : '' }} placeholder="Full Name" value={shipmentForm.senderName} onChange={(e) => setShipmentForm({ ...shipmentForm, senderName: e.target.value })} /></div>
                <div><label className="lbl">Phone</label><input className="inp" style={{ border: showValidation && !shipmentForm.senderPhone ? '1px solid #FF4444' : '' }} placeholder="080..." value={shipmentForm.senderPhone} onChange={(e) => setShipmentForm({ ...shipmentForm, senderPhone: e.target.value })} /></div>
              </div>
              <div className="form-row"><label className="lbl">Pickup address</label><input className="inp" style={{ border: showValidation && !shipmentForm.pickupAddress ? '1px solid #FF4444' : '' }} placeholder="Address" value={shipmentForm.pickupAddress} onChange={(e) => setShipmentForm({ ...shipmentForm, pickupAddress: e.target.value })} /></div>
              <div className="form-2">
                <div>
                  <label className="lbl">Origin Station</label>
                  <select className="sel" style={{ border: showValidation && !shipmentForm.departureServiceCentreId ? '1px solid #FF4444' : '' }} value={shipmentForm.departureServiceCentreId} onChange={(e) => { 
                    setShipmentForm({ ...shipmentForm, departureServiceCentreId: Number(e.target.value) });
                    setPricingQuote(null);
                  }}>
                    <option value="">Select origin</option>
                    {stations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Destination Station</label>
                  <select className="sel" style={{ border: showValidation && !shipmentForm.destinationServiceCentreId ? '1px solid #FF4444' : '' }} value={shipmentForm.destinationServiceCentreId} onChange={(e) => {
                    setShipmentForm({ ...shipmentForm, destinationServiceCentreId: Number(e.target.value) });
                    setPricingQuote(null);
                  }}>
                    <option value="">Select destination</option>
                    {stations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          
          <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
            <div className="form-2" style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <label className="lbl">Quick lookup (Recipient)</label>
                <input className="inp" placeholder="Type name or phone..." 
                  onChange={(e) => handleSearchCustomers(e.target.value, 'receiver')} />
                {receiverSearchResults.length > 0 && (
                  <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                    {receiverSearchResults.map((res: any, i: number) => (
                      <div key={i} className="search-item" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #30363D' }} onClick={() => {
                        setShipmentForm({ ...shipmentForm, receiverName: res.name, receiverPhone: res.phone, receiverAddress: res.address || '', receiverEmail: res.email || '' });
                        setReceiverSearchResults([]);
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#E6EDF3' }}>{res.name}</div>
                        <div style={{ fontSize: '10px', color: '#8B949E' }}>{res.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div><label className="lbl">Recipient email (optional)</label><input className="inp" placeholder="email@example.com" value={shipmentForm.receiverEmail} onChange={(e) => setShipmentForm({ ...shipmentForm, receiverEmail: e.target.value })} /></div>
            </div>
            <div className="form-2">
              <div><label className="lbl">Recipient name</label><input className="inp" style={{ border: showValidation && !shipmentForm.receiverName ? '1px solid #FF4444' : '' }} placeholder="Name" value={shipmentForm.receiverName} onChange={(e) => setShipmentForm({ ...shipmentForm, receiverName: e.target.value })} /></div>
              <div><label className="lbl">Phone</label><input className="inp" style={{ border: showValidation && !shipmentForm.receiverPhone ? '1px solid #FF4444' : '' }} placeholder="080..." value={shipmentForm.receiverPhone} onChange={(e) => setShipmentForm({ ...shipmentForm, receiverPhone: e.target.value })} /></div>
            </div>
            <div className="form-row"><label className="lbl">Delivery address</label><input className="inp" style={{ border: showValidation && !shipmentForm.receiverAddress ? '1px solid #FF4444' : '' }} placeholder="Full destination address" value={shipmentForm.receiverAddress} onChange={(e) => setShipmentForm({ ...shipmentForm, receiverAddress: e.target.value })} /></div>
          </div>

          <div style={{ display: activeTab === 2 ? 'block' : 'none' }}>
            <div className="form-3">
              <div><label className="lbl">Weight (kg)</label><input className="inp" style={{ border: showValidation && !shipmentForm.weight ? '1px solid #FF4444' : '' }} type="number" value={shipmentForm.weight} onChange={(e) => { setShipmentForm({ ...shipmentForm, weight: Number(e.target.value) }); setPricingQuote(null); }} /></div>
              <div><label className="lbl">Quantity</label><input className="inp" style={{ border: showValidation && !shipmentForm.quantity ? '1px solid #FF4444' : '' }} type="number" value={shipmentForm.quantity} onChange={(e) => setShipmentForm({ ...shipmentForm, quantity: Number(e.target.value) })} /></div>
              <div><label className="lbl">Declared Value (₦)</label><input className="inp" type="number" value={shipmentForm.declaredValue} onChange={(e) => setShipmentForm({ ...shipmentForm, declaredValue: Number(e.target.value) })} /></div>
            </div>
            <div className="form-3" style={{ marginTop: '10px' }}>
              <div><label className="lbl">Length (cm)</label><input className="inp" type="number" value={shipmentForm.length} onChange={(e) => { setShipmentForm({ ...shipmentForm, length: Number(e.target.value) }); setPricingQuote(null); }} /></div>
              <div><label className="lbl">Width (cm)</label><input className="inp" type="number" value={shipmentForm.width} onChange={(e) => { setShipmentForm({ ...shipmentForm, width: Number(e.target.value) }); setPricingQuote(null); }} /></div>
              <div><label className="lbl">Height (cm)</label><input className="inp" type="number" value={shipmentForm.height} onChange={(e) => { setShipmentForm({ ...shipmentForm, height: Number(e.target.value) }); setPricingQuote(null); }} /></div>
            </div>
            <div className="form-row"><label className="lbl">Item description</label><input className="inp" style={{ border: showValidation && !shipmentForm.itemDescription ? '1px solid #FF4444' : '' }} placeholder="e.g. Spare parts, Clothing" value={shipmentForm.itemDescription} onChange={(e) => setShipmentForm({ ...shipmentForm, itemDescription: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#E6EDF3', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={shipmentForm.applyInsurance} onChange={(e) => setShipmentForm({ ...shipmentForm, applyInsurance: e.target.checked })} />
                <div>
                  <div style={{ fontWeight: 600 }}>Insurance</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>1% of declared value</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#E6EDF3', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={shipmentForm.isCashOnDelivery} onChange={(e) => setShipmentForm({ ...shipmentForm, isCashOnDelivery: e.target.checked })} />
                <div>
                  <div style={{ fontWeight: 600 }}>Cash on Delivery</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Pay at destination</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#E6EDF3', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={shipmentForm.isFragile} onChange={(e) => setShipmentForm({ ...shipmentForm, isFragile: e.target.checked })} />
                <div>
                  <div style={{ fontWeight: 600 }}>Fragile Handling</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Extra care + ₦200</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#E6EDF3', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={shipmentForm.isSameDay} onChange={(e) => setShipmentForm({ ...shipmentForm, isSameDay: e.target.checked })} />
                <div>
                  <div style={{ fontWeight: 600 }}>Same-day Delivery</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Priority + ₦500</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: activeTab === 3 ? 'block' : 'none' }}>
            {!pricingQuote ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calculating best rates for this route...</div>
              </div>
            ) : (
              <div style={{ background: '#0D1117', border: '1px solid #30363D', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#8B949E' }}>Base freight ({pricingQuote.billableWeight}kg · {pricingQuote.zoneName})</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.basePrice.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#8B949E' }}>Fuel Surcharge (3%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.fuelSurcharge.toLocaleString()}</span>
                </div>
                {pricingQuote.fragileSurcharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#8B949E' }}>Fragile Handling</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.fragileSurcharge.toLocaleString()}</span>
                  </div>
                )}
                {pricingQuote.sameDaySurcharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#8B949E' }}>Same-day Premium</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.sameDaySurcharge.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#8B949E' }}>VAT (7.5%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.vat.toLocaleString()}</span>
                </div>
                {shipmentForm.applyInsurance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#8B949E' }}>Insurance</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#E6EDF3' }}>{pricingQuote.currencySymbol}{pricingQuote.insurance.toLocaleString()}</span>
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid #30363D', margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#E6EDF3' }}>Grand Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: '#00D4AA' }}>{pricingQuote.currencySymbol}{pricingQuote.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          </div>
          
          <div className="modal-ft" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
            {showValidation && !canGoNext(activeTab) && (
              <div style={{ fontSize: '12px', color: '#FF4444', background: 'rgba(255,68,68,0.1)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-1A6 6 0 108 2a6 6 0 000 12zm.5-4v1h-1v-1h1zm0-6v5h-1V4h1z"/></svg>
                Missing required information: {getMissingFields(activeTab).join(', ')}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <button className="btn" onClick={closeModal}>Cancel</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {activeTab > 0 && <button className="btn" onClick={() => { setActiveTab(activeTab - 1); setShowValidation(false); }}>← Back</button>}
                {activeTab < 3 ? (
                  <button className="btn primary" onClick={() => {
                    if (canGoNext(activeTab)) {
                      setActiveTab(activeTab + 1);
                      setShowValidation(false);
                    } else {
                      setShowValidation(true);
                    }
                  }}>{getNextStepLabel(activeTab)}</button>
                ) : (
                  <button className="btn primary" onClick={handleCreateShipment} disabled={isSubmitting || !pricingQuote}>{isSubmitting ? 'Creating...' : 'Finalize & Print Waybill →'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waybill Print Modal */}
      <style>{`
        @media print {
          body > *:not(#waybill-print-root) { display: none !important; }
          #waybill-print-root { display: block !important; position: fixed; top:0; left:0; width:100%; z-index:99999; }
          .no-print { display: none !important; }
          .waybill-container { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
      <div className={`overlay ${openModal === 'waybill' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal modal-lg">
          <div className="modal-hd no-print">
            <div className="modal-ttl">Shipment Waybill / Invoice</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          {waybillPreview ? (
            <div id="waybill-print-root">
              <div className="waybill-container" style={{ padding: '24px', background: '#fff', color: '#000', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '1px' }}>CARGOMINT</div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Logistics Operating System</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase' }}>Waybill No.</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px' }}>{waybillPreview.waybill}</div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Date: {new Date(waybillPreview.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>

                {/* Sender / Receiver */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px', background: '#f8f8f8', padding: '12px', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>From (Sender)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{waybillPreview.senderName}</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>{waybillPreview.senderPhone}</div>
                    <div style={{ fontSize: '10px', color: '#444' }}>{waybillPreview.senderAddress}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: '#111' }}>Origin: {waybillPreview.departureStation}</div>
                  </div>
                  <div style={{ borderLeft: '1px dashed #ccc', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>To (Receiver)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{waybillPreview.receiverName}</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>{waybillPreview.receiverPhone}</div>
                    <div style={{ fontSize: '10px', color: '#444' }}>{waybillPreview.receiverAddress}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: '#111' }}>Destination: {waybillPreview.destinationStation}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ background: '#111', color: '#fff' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px' }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waybillPreview.items.map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>{item.description}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.weight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Barcode + Charges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  {/* SVG Barcode */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <svg width="200" height="60" style={{ display: 'block' }}>
                      {(() => {
                        const str = waybillPreview.waybill || '';
                        const bars: React.JSX.Element[] = [];
                        let x = 4;
                        for (let i = 0; i < str.length; i++) {
                          const code = str.charCodeAt(i);
                          // Alternate narrow/wide bars based on char code bits for visual density
                          const w1 = ((code >> 4) & 3) + 1;
                          const w2 = ((code >> 2) & 3) + 1;
                          const w3 = (code & 3) + 1;
                          bars.push(<rect key={`${i}a`} x={x} y={4} width={w1} height={48} fill="#000" />);
                          x += w1 + 1;
                          bars.push(<rect key={`${i}b`} x={x} y={4} width={w2} height={48} fill="#000" />);
                          x += w2 + 2;
                          bars.push(<rect key={`${i}c`} x={x} y={4} width={w3} height={48} fill="#000" />);
                          x += w3 + 2;
                        }
                        return bars;
                      })()}
                    </svg>
                    <div style={{ fontSize: '9px', letterSpacing: '2px', fontFamily: 'monospace', marginTop: '2px' }}>{waybillPreview.waybill}</div>
                    <div style={{ fontSize: '8px', color: '#888', marginTop: '2px' }}>Scan for tracking</div>
                  </div>

                  {/* Charges */}
                  <div style={{ width: '220px', fontSize: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Subtotal</span><span>₦{Number(waybillPreview.total || 0).toLocaleString()}</span></div>
                    {Number(waybillPreview.fuelSurcharge) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Fuel Surcharge</span><span>₦{Number(waybillPreview.fuelSurcharge).toLocaleString()}</span></div>}
                    {Number(waybillPreview.fragileSurcharge) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Fragile Handling</span><span>₦{Number(waybillPreview.fragileSurcharge).toLocaleString()}</span></div>}
                    {Number(waybillPreview.sameDaySurcharge) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Same-day Premium</span><span>₦{Number(waybillPreview.sameDaySurcharge).toLocaleString()}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>VAT (7.5%)</span><span>₦{Number(waybillPreview.vat || 0).toLocaleString()}</span></div>
                    {Number(waybillPreview.insurance) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Insurance</span><span>₦{Number(waybillPreview.insurance).toLocaleString()}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginTop: '8px', borderTop: '2px solid #000', paddingTop: '6px' }}>
                      <span>TOTAL</span><span>₦{Number(waybillPreview.grandTotal || 0).toLocaleString()}</span>
                    </div>
                    {waybillPreview.isCashOnDelivery && (
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#c00', textAlign: 'right', marginTop: '4px', padding: '4px', border: '1px solid #c00', borderRadius: '3px' }}>
                        COD: ₦{Number(waybillPreview.codAmount || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '8px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Powered by CargoMint Logistics OS</span>
                  <span>This waybill is a legally binding document. Keep for your records.</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading waybill data...</div>
          )}
          <div className="modal-ft no-print">
            <button className="btn" onClick={closeModal}>Close</button>
            <button className="btn primary" onClick={() => { window.print(); }}>🖨️ Print Waybill</button>
          </div>
        </div>
      </div>

      {/* New Manifest Modal */}
      <div className={`overlay ${openModal === 'manifest' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-ttl">Create manifest</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="form-2">
            <div>
              <label className="lbl">Origin hub</label>
              <select className="sel" value={manifestForm.departureServiceCentreId} onChange={(e) => setManifestForm({...manifestForm, departureServiceCentreId: Number(e.target.value)})}>
                {stations.map((s: any) => <option key={s.id || s.stationId} value={s.id || s.stationId}>{s.name || s.stationName}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Destination hub</label>
              <select className="sel" value={manifestForm.destinationServiceCentreId} onChange={(e) => setManifestForm({...manifestForm, destinationServiceCentreId: Number(e.target.value)})}>
                {stations.map((s: any) => <option key={s.id || s.stationId} value={s.id || s.stationId}>{s.name || s.stationName}</option>)}
              </select>
            </div>
          </div>
          <div className="form-2">
            <div>
              <label className="lbl">Assign vehicle</label>
              <select className="sel" value={manifestForm.fleetId} onChange={(e) => setManifestForm({...manifestForm, fleetId: e.target.value})}>
                <option value="">Select vehicle…</option>
                {(dashboardData?.eligibleVehicles || []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} · {v.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Assign captain</label>
              <select className="sel" value={manifestForm.captainId} onChange={(e) => setManifestForm({...manifestForm, captainId: e.target.value})}>
                <option value="">Select captain…</option>
                {(dashboardData?.eligibleCaptains || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row"><label className="lbl">Departure date & time</label><input className="inp" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} /></div>
          <div className="modal-ft">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn primary" onClick={handleCreateManifest} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create manifest'}</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Vehicle Modal */}
      <div className={`overlay ${openModal === 'vehicle' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-ttl">{vehicleForm.id ? 'Update vehicle' : 'Register vehicle'}</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="form-2">
            <div><label className="lbl">Plate number</label><input className="inp" placeholder="LAS-000-XX" value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })} /></div>
            <div><label className="lbl">Vehicle type</label><select className="sel" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}><option value="Bike">Bike</option><option value="Van">Van</option><option value="Truck">Truck</option><option value="OceanFreight">Ocean Freight</option><option value="AirFreight">Air Freight</option></select></div>
          </div>
          <div className="form-2">
            <div><label className="lbl">Make</label><input className="inp" placeholder="Toyota / Mercedes" value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></div>
            <div><label className="lbl">Model</label><input className="inp" placeholder="Hiace / Sprinter" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
          </div>
          <div className="form-2">
            <div><label className="lbl">Capacity (kg)</label><input className="inp" type="number" placeholder="500" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value || 0) })} /></div>
            <div><label className="lbl">Assigned captain</label><select className="sel" value={vehicleForm.captainId} onChange={(e) => setVehicleForm({ ...vehicleForm, captainId: e.target.value })}><option value="">— Unassigned —</option>{(dashboardData?.eligibleCaptains || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="form-row"><label className="lbl">Description</label><input className="inp" placeholder="Fleet vehicle description" value={vehicleForm.description} onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })} /></div>
          <div className="modal-ft">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn primary" onClick={handleRegisterVehicle} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (vehicleForm.id ? 'Update vehicle' : 'Register vehicle')}</button>
          </div>
        </div>
      </div>

      {/* Service Centre Modal */}
      <div className={`overlay ${openModal === 'service-centre' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-ttl">{newScForm.id ? 'Edit station' : 'Add service centre / station'}</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="form-row">
            <label className="lbl">Parent hub ID</label>
            <input className="inp" type="number" value={newScForm.parentHubId} disabled />
          </div>
          <div className="form-row">
            <label className="lbl">Station name</label>
            <input className="inp" placeholder="e.g. Ikeja Station" value={newScForm.name} onChange={(e) => setNewScForm({ ...newScForm, name: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="lbl">Code</label>
            <input className="inp" placeholder="e.g. LAG-IKE" value={newScForm.code} onChange={(e) => setNewScForm({ ...newScForm, code: e.target.value })} />
          </div>
          <div className="modal-ft">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn primary" onClick={handleCreateStation} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (newScForm.id ? 'Update Station' : 'Create Station')}
            </button>
          </div>
        </div>
      </div>

      {/* Hub Modal */}
      <div className={`overlay ${openModal === 'hub' ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-ttl">{hubForm.id ? 'Edit hub' : 'Create hub'}</div>
            <button className="x-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="form-row">
            <label className="lbl">Hub Name</label>
            <input className="inp" placeholder="e.g. Lagos VI Hub" value={hubForm.name} onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="lbl">State / Region</label>
            <input className="inp" placeholder="e.g. Lagos" value={hubForm.state} onChange={(e) => setHubForm({ ...hubForm, state: e.target.value })} />
          </div>
          <div className="modal-ft">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn primary" onClick={handleCreateHub} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (hubForm.id ? 'Update Hub' : 'Create Hub')}
            </button>
          </div>
        </div>
      </div>


      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
