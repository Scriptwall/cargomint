"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  useEffect(() => {
    // Custom cursor
    const cursor = document.getElementById('cm-cursor');
    const ring = document.getElementById('cm-cursor-ring');
    
    const handleMouseMove = (e: MouseEvent) => {
      if (cursor && ring) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        setTimeout(() => {
          ring.style.left = e.clientX + 'px';
          ring.style.top = e.clientY + 'px';
        }, 60);
      }

      // Orb parallax
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      const orb1 = document.querySelector('.orb-1') as HTMLElement;
      const orb2 = document.querySelector('.orb-2') as HTMLElement;
      const orb3 = document.querySelector('.orb-3') as HTMLElement;
      if (orb1) orb1.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
      if (orb2) orb2.style.transform = `translate(${-x * 0.3}px, ${-y * 0.3}px)`;
      if (orb3) orb3.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 60);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => observer.observe(el));

    // Ticker animation
    const animateVal = (el: Element, target: number, prefix = '', suffix = '') => {
      const isFloat = target % 1 !== 0;
      const duration = 1800;
      const start = performance.now();
      const update = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease);
        el.textContent = prefix + val.toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    setTimeout(() => {
      const vals = document.querySelectorAll('.ticker-val');
      const data = [
        [5, '', ''],
        [84000, '', 'K+'],
        [98.2, '', '%'],
        [12, '', ''],
        [2.4, '₦', 'B'],
      ];
      vals.forEach((el, i) => {
        if (data[i]) animateVal(el, data[i][0] as number, data[i][1] as string, data[i][2] as string);
      });
    }, 400);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-body">
      <div className="cm-cursor" id="cm-cursor"></div>
      <div className="cm-cursor-ring" id="cm-cursor-ring"></div>

      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="wrap">
        <nav className="landing-nav">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v2A1.5 1.5 0 0113.5 7h-11A1.5 1.5 0 011 5.5v-2zm0 6A1.5 1.5 0 012.5 8h11A1.5 1.5 0 0115 9.5v3A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-3z"/></svg>
            </div>
            <div>
              <div className="nav-logo-name">CargoMint</div>
            </div>
            <div className="nav-logo-ver">v2.0</div>
          </Link>
          <div className="nav-links">
            <a href="#modules" className="nav-link">Modules</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#architecture" className="nav-link">Architecture</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
            <div className="nav-pill">
              <div className="nav-pill-dot"></div>
              <div className="nav-pill-txt">Now live</div>
            </div>
          </div>
          <Link href="/login" className="nav-cta">Sign In →</Link>
        </nav>

        <div className="hero">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot"></div>
            Introducing <span>CargoMint 2.0</span> — The Logistics OS
          </div>
          <h1 className="hero-title">Ship Smarter.<br/><span className="hero-title-accent">Scale Faster.</span></h1>
          <p className="hero-title-line2">Deliver Better.</p>
          <p className="hero-sub">
            CargoMint is the <strong>all-in-one logistics operating system</strong> built for African cargo companies. From shipment creation to last-mile delivery — everything in one platform.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
              Create free account
            </Link>
            <a href="#features" className="btn-outline">
              See how it works →
            </a>
          </div>
          <div className="hero-ticker">
            <div className="ticker-item">
              <div className="ticker-val">5</div>
              <div className="ticker-lbl">App modules</div>
              <div className="ticker-delta">↑ Full ecosystem</div>
            </div>
            <div className="ticker-item">
              <div className="ticker-val">84K+</div>
              <div className="ticker-lbl">Shipments / mo</div>
              <div className="ticker-delta">↑ 12% growth</div>
            </div>
            <div className="ticker-item">
              <div className="ticker-val">98.2%</div>
              <div className="ticker-lbl">Delivery rate</div>
              <div className="ticker-delta">Industry best</div>
            </div>
            <div className="ticker-item">
              <div className="ticker-val">12</div>
              <div className="ticker-lbl">Tenants live</div>
              <div className="ticker-delta">↑ 2 this month</div>
            </div>
            <div className="ticker-item">
              <div className="ticker-val">₦2.4B</div>
              <div className="ticker-lbl">Platform GMV</div>
              <div className="ticker-delta">↑ 8.3%</div>
            </div>
          </div>
        </div>

        <hr className="full-divider" />

        <div className="modules-section" id="modules">
          <div className="section-eyebrow">5 Purpose-built modules</div>
          <h2 className="section-title">One platform.<br/>Every actor covered.</h2>
          <p className="section-sub">From the platform owner down to the delivery captain — CargoMint has a dedicated, purpose-built interface for every stakeholder in the logistics chain.</p>

          <div className="modules-grid">
            <Link href="/admin-console" className="module-card reveal" style={{ '--card-color': 'var(--purple)', '--card-glow': 'rgba(155,110,245,0.06)' } as React.CSSProperties}>
              <div className="module-num">Module 01 · Super Admin</div>
              <div className="module-header">
                <div>
                  <div className="module-title">Master Console</div>
                  <div className="module-desc">Onboard and manage all logistics company tenants. Global settings, country config, audit logs, and platform-wide metrics.</div>
                </div>
                <div className="module-icon-wrap" style={{ background: 'rgba(155,110,245,0.1)', border: '0.5px solid rgba(155,110,245,0.25)' }}>
                  <svg viewBox="0 0 16 16" fill="#9B6EF5"><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z"/></svg>
                </div>
              </div>
              <div className="module-tags">
                <span className="module-tag">Tenant CRUD</span>
                <span className="module-tag">Global Config</span>
                <span className="module-tag">Audit Logs</span>
                <span className="module-tag">Analytics</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span className="module-badge" style={{ background: 'rgba(155,110,245,0.1)', color: '#9B6EF5', border: '0.5px solid rgba(155,110,245,0.25)' }}>Platform Owner</span>
                <div className="module-arrow">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              </div>
            </Link>

            <Link href="/ops-dashboard" className="module-card reveal" style={{ '--card-color': 'var(--teal)', '--card-glow': 'rgba(0,212,170,0.06)' } as React.CSSProperties}>
              <div className="module-num">Module 02 · Staff / Managers</div>
              <div className="module-header">
                <div>
                  <div className="module-title">Operations Dashboard</div>
                  <div className="module-desc">Full operations command centre. Create shipments, manifest dispatch, manage fleet, configure pricing zones, and track daily revenue.</div>
                </div>
                <div className="module-icon-wrap" style={{ background: 'var(--teal-d)', border: '0.5px solid var(--teal-b)' }}>
                  <svg viewBox="0 0 16 16" fill="var(--teal)"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
                </div>
              </div>
              <div className="module-tags">
                <span className="module-tag">Shipment Desk</span>
                <span className="module-tag">Manifest Board</span>
                <span className="module-tag">Fleet Mgmt</span>
                <span className="module-tag">Pricing Engine</span>
                <span className="module-tag">Financials</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span className="module-badge" style={{ background: 'var(--teal-d)', color: 'var(--teal)', border: '0.5px solid var(--teal-b)' }}>Hub Managers · Staff</span>
                <div className="module-arrow">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              </div>
            </Link>

            <div className="module-card reveal" style={{ '--card-color': 'var(--blue)', '--card-glow': 'rgba(61,158,245,0.06)' } as React.CSSProperties}>
              <div className="module-num">Module 03 · B2B / E-Commerce</div>
              <div className="module-header">
                <div>
                  <div className="module-title">Merchant Portal</div>
                  <div className="module-desc">Self-service portal for high-volume shippers. Bulk uploads, COD ledger, invoicing, wallet top-ups, and API key management.</div>
                </div>
                <div className="module-icon-wrap" style={{ background: 'rgba(61,158,245,0.1)', border: '0.5px solid rgba(61,158,245,0.25)' }}>
                  <svg viewBox="0 0 16 16" fill="#3D9EF5"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 5a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V8zm1 4a1 1 0 000 2h6a1 1 0 000-2H3z"/></svg>
                </div>
              </div>
              <div className="module-tags">
                <span className="module-tag">Bulk Shipping</span>
                <span className="module-tag">COD Ledger</span>
                <span className="module-tag">Wallet</span>
                <span className="module-tag">API Keys</span>
                <span className="module-tag">Webhooks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span className="module-badge" style={{ background: 'rgba(61,158,245,0.1)', color: '#3D9EF5', border: '0.5px solid rgba(61,158,245,0.25)' }}>Corporate Shippers</span>
                <div className="module-arrow">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              </div>
            </div>

            <div className="module-card span-2 reveal" style={{ '--card-color': 'var(--green)', '--card-glow': 'rgba(34,212,106,0.05)' } as React.CSSProperties}>
              <div className="module-num">Module 04 · B2C Consumers</div>
              <div className="module-header">
                <div>
                  <div className="module-title">Consumer Mobile App</div>
                  <div className="module-desc">Beautiful, low-friction shipping for everyday individuals. Live tracking, instant quotes, 3-step booking wizard, and wallet management with Paystack / Flutterwave integration.</div>
                </div>
                <div className="module-icon-wrap" style={{ background: 'rgba(34,212,106,0.1)', border: '0.5px solid rgba(34,212,106,0.25)' }}>
                  <svg viewBox="0 0 16 16" fill="#22D46A"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z"/></svg>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '5px' }}>Includes</div>
                  <div className="module-tags">
                    <span className="module-tag">Track & Trace</span>
                    <span className="module-tag">Live Quote</span>
                    <span className="module-tag">Booking Wizard</span>
                    <span className="module-tag">My Wallet</span>
                    <span className="module-tag">Shipment History</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span className="module-badge" style={{ background: 'rgba(34,212,106,0.1)', color: '#22D46A', border: '0.5px solid rgba(34,212,106,0.25)' }}>Individual Customers</span>
                <div className="module-arrow">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              </div>
            </div>

            <div className="module-card reveal" style={{ '--card-color': 'var(--amber)', '--card-glow': 'rgba(255,176,32,0.05)' } as React.CSSProperties}>
              <div className="module-num">Module 05 · Drivers / Riders</div>
              <div className="module-header">
                <div>
                  <div className="module-title">Captain App</div>
                  <div className="module-desc">Mobile-first app for delivery captains. Active trip manifest, barcode scanner, OTP verification, signature capture, and fuel logging.</div>
                </div>
                <div className="module-icon-wrap" style={{ background: 'rgba(255,176,32,0.1)', border: '0.5px solid rgba(255,176,32,0.25)' }}>
                  <svg viewBox="0 0 16 16" fill="#FFB020"><path d="M1 6l2-3h10l2 3v5H1V6zm3.5 4a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm5 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/></svg>
                </div>
              </div>
              <div className="module-tags">
                <span className="module-tag">Scanner</span>
                <span className="module-tag">OTP Verify</span>
                <span className="module-tag">e-Signature</span>
                <span className="module-tag">Navigation</span>
                <span className="module-tag">Fuel Log</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span className="module-badge" style={{ background: 'rgba(255,176,32,0.1)', color: '#FFB020', border: '0.5px solid rgba(255,176,32,0.25)' }}>Delivery Captains</span>
                <div className="module-arrow">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="full-divider" />

        <section id="features" className="landing-section">
          <div className="section-eyebrow">Built for scale</div>
          <h2 className="section-title">Everything a logistics<br/>company needs.</h2>
          <p className="section-sub">CargoMint is engineered from the ground up for African logistics — multi-tenant, real-time, and built to handle the complexity of cross-state cargo operations.</p>

          <div className="features-grid">
            {[
              ['#9B6EF5', <path key="1" d="M2 2h12v4H2zm0 5h12v4H2zm0 5h12v2H2z" fill="currentColor"/>, 'Multi-Tenant Architecture', 'Every logistics company gets a fully isolated, dedicated environment. Zero data bleed between tenants — guaranteed.'],
              ['var(--teal)', <path key="2" d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 3.5v4.25l3 1.75-.75 1.3L7.5 9.5V4.5h1z" fill="currentColor"/>, 'Real-Time Tracking', 'Live shipment status updates across the entire chain — from hub scan to last-mile delivery handover.'],
              ['#3D9EF5', <React.Fragment key="3"><path d="M8 1l6 3.5v7L8 15 2 11.5v-7L8 1z" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M8 8l6-3.5M8 8v7M8 8L2 4.5"/></React.Fragment>, 'Pricing Engine', 'Dynamic zone-based pricing matrix with weight brackets, surcharges, and per-tenant overrides. No more spreadsheets.'],
              ['#22D46A', <path key="4" d="M2 4a2 2 0 012-2h8a2 2 0 012 2v1H2V4zm0 2h12v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm9 3a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/>, 'Wallet & Payments', 'Prepaid wallets, post-paid invoicing, and COD settlement — all integrated with Paystack and Flutterwave.'],
              ['#FFB020', <path key="5" d="M2 4h4V2H2v2zm0 2h2V4H2v2zm14-6h4v4h-2V4h-2V2zm2 4h2V4h-2v2zM2 20h4v2H2v-2zm16 2h4v2h-4v-2zM5 7h14v10H5V7zm2 2v6h10V9H7z" fill="currentColor"/>, 'API-First Design', 'Every feature exposed via REST API. Merchants integrate via API keys and webhooks — plug into Shopify, WooCommerce, or any platform.'],
              ['#FF3B55', <path key="6" d="M4 1h8v4H4zm-2 5h12a1 1 0 011 1v4h-3v3H4v-3H1V7a1 1 0 011-1zm2 5v2h8v-2H4z" fill="currentColor"/>, 'Manifest & Dispatch', 'Drag-and-drop manifest builder. Assign vehicles, captains, and departure times in seconds. Track trips live.'],
              ['var(--teal)', <path key="7" d="M8 1a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-5 9.5a5 5 0 0110 0V12H3v-1.5z" fill="currentColor"/>, 'Role-Based Access', 'Granular permissions for platform owners, hub managers, cashiers, merchants, captains, and consumers — each with the right access.'],
              ['#9B6EF5', <path key="8" d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4zm1 1h2v2H5V5zm3 0h2v2H8V5zm-3 3h2v2H5V8zm3 0h2v2H8V8z" fill="currentColor"/>, 'COD Management', 'Full cash-on-delivery lifecycle — collection, reconciliation, and merchant payouts on configurable settlement periods.'],
              ['#3D9EF5', <path key="9" d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 1.9.7-4L2.2 5.2l4-.6z" fill="currentColor"/>, 'Compliance & OTP', 'Recipient OTP verification, digital signature capture, and proof-of-delivery photo — full compliance built in.'],
            ].map((item, i) => (
              <div key={i} className="feature-cell reveal">
                <div className="feature-icon" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <svg viewBox="0 0 16 16" style={{ width: '16px', height: '16px', fill: item[0] as string }}>{item[1]}</svg>
                </div>
                <div className="feature-title">{item[2] as string}</div>
                <div className="feature-desc">{item[3] as string}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="full-divider" />

        <div className="arch-section" id="architecture">
          <div className="section-eyebrow">Technical architecture</div>
          <h2 className="section-title">Designed for<br/>enterprise scale.</h2>
          <p className="section-sub">Built on a clean multi-tenant .NET backend with MediatR CQRS pattern. Five purpose-built frontends consuming a single REST API.</p>

          <div className="arch-diagram reveal">
            <div className="arch-layer">
              <div className="arch-layer-label">Frontend layer — 5 apps</div>
              <div className="arch-row">
                {[
                  ['#9B6EF5', 'Master Console'],
                  ['var(--teal)', 'Operations Dashboard'],
                  ['#3D9EF5', 'Merchant Portal'],
                  ['#22D46A', 'Consumer App'],
                  ['#FFB020', 'Captain App'],
                ].map(([c, n], i) => (
                  <div key={i} className="arch-node">
                    <div className="arch-node-dot" style={{ background: c }}></div>{n}
                  </div>
                ))}
              </div>
            </div>
            <div className="arch-connector"><div className="arch-connector-line"></div></div>
            <div className="arch-layer">
              <div className="arch-layer-label">API layer</div>
              <div className="arch-row">
                {['REST API /v1', 'JWT Auth · IMustHaveTenant', 'MediatR CQRS', 'Rate Limiting', 'Webhook Engine'].map((n, i) => (
                  <div key={i} className="arch-node"><div className="arch-node-dot" style={{ background: 'var(--teal)' }}></div>{n}</div>
                ))}
              </div>
            </div>
            <div className="arch-connector"><div className="arch-connector-line"></div></div>
            <div className="arch-layer">
              <div className="arch-layer-label">Domain / service layer</div>
              <div className="arch-row">
                {['Shipments', 'Manifests · Fleet', 'Pricing Engine', 'Wallet · Payments', 'COD Settlement', 'Compliance · OTP', 'Notifications'].map((n, i) => (
                  <div key={i} className="arch-node"><div className="arch-node-dot" style={{ background: '#3D9EF5' }}></div>{n}</div>
                ))}
              </div>
            </div>
            <div className="arch-connector"><div className="arch-connector-line"></div></div>
            <div className="arch-layer">
              <div className="arch-layer-label">Integrations</div>
              <div className="arch-row">
                {['Paystack', 'Flutterwave', 'Google Maps', 'SMS Gateway', 'Barcode Scanner SDK', 'Webhook Consumers'].map((n, i) => (
                  <div key={i} className="arch-node"><div className="arch-node-dot" style={{ background: '#FFB020' }}></div>{n}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className="full-divider" />

        <div className="cta-section">
          <div className="cta-box reveal">
            <div className="hero-eyebrow" style={{ marginBottom: '20px', animation: 'none' }}>
              <div className="hero-eyebrow-dot"></div>
              Ready to modernise your logistics?
            </div>
            <h2 className="cta-title">Your logistics company<br/>deserves better software.</h2>
            <p className="cta-sub">Join 12+ logistics companies already running on CargoMint 2.0. Onboard in under a day.</p>
            <div className="cta-actions">
              <Link href="/register" className="btn-primary">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 10a5 5 0 0110 0v1.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V10z"/></svg>
                Get Started Now
              </Link>
              <Link href="/login" className="btn-outline">Sign In</Link>
            </div>
            <p className="cta-note">Sign up for a free trial — no credit card required.</p>
          </div>
        </div>

        <footer className="landing-footer">
          <div className="footer-logo">
            <div className="nav-logo-mark" style={{ width: '26px', height: '26px', borderRadius: '7px' }}>
              <svg viewBox="0 0 16 16" style={{ width: '12px', height: '12px', fill: 'var(--teal)' }}><path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v2A1.5 1.5 0 0113.5 7h-11A1.5 1.5 0 011 5.5v-2zm0 6A1.5 1.5 0 012.5 8h11A1.5 1.5 0 0115 9.5v3A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-3z"/></svg>
            </div>
            <span className="footer-logo-name">CargoMint 2.0</span>
          </div>
          <div className="footer-links">
            <Link href="/login" className="footer-link">Login</Link>
            <Link href="/register" className="footer-link">Register</Link>
          </div>
          <div className="footer-copy">© 2026 CargoMint · The Logistics OS for Africa</div>
        </footer>
      </div>
    </div>
  );
}
