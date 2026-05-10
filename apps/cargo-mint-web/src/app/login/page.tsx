"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../landing.css'; 
import { useAuth } from '@/components/providers/AuthProvider';

const quickAccounts = [
  { label: 'Admin', email: 'admin1@cargomint.com', password: 'Password123!' },
  { label: 'Operator', email: 'operator2@cargomint.com', password: 'Password123!' },
  { label: 'Captain', email: 'captain3@cargomint.com', password: 'Password123!' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

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
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/Account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMsg = 'Invalid email or password';
        try {
          const errData = await response.text();
          if (errData && errData.length < 200) errorMsg = errData;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      login(data.token, data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="cm-cursor" id="cm-cursor"></div>
      <div className="cm-cursor-ring" id="cm-cursor-ring"></div>

      <div className="grid-bg"></div>
      <div className="orb orb-1" style={{ top: '10%', left: '20%', width: '800px', height: '800px' }}></div>

      <div className="wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        
        <Link href="/" className="nav-logo" style={{ marginBottom: '40px' }}>
          <div className="nav-logo-mark">
            <svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 012.5 2h11A1.5 1.5 0 0115 3.5v2A1.5 1.5 0 0113.5 7h-11A1.5 1.5 0 011 5.5v-2zm0 6A1.5 1.5 0 012.5 8h11A1.5 1.5 0 0115 9.5v3A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-3z"/></svg>
          </div>
          <div>
            <div className="nav-logo-name">CargoMint</div>
          </div>
        </Link>

        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(20,20,20,0.8)',
          backdropFilter: 'blur(20px)',
          border: '0.5px solid var(--border-md)',
          borderRadius: '24px',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, var(--teal), transparent)' }}></div>
          
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
            Sign in to your CargoMint account.
          </p>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '20px', background: 'rgba(255,59,85,0.1)', padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(255,59,85,0.2)' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                style={{
                  width: '100%', height: '48px', padding: '0 16px',
                  background: 'var(--raised)', border: '0.5px solid var(--border-md)',
                  borderRadius: '12px', color: 'var(--text-1)', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-md)'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--teal)', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{
                  width: '100%', height: '48px', padding: '0 16px',
                  background: 'var(--raised)', border: '0.5px solid var(--border-md)',
                  borderRadius: '12px', color: 'var(--text-1)', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-md)'}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '22px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Quick test logins
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {quickAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setError('');
                  }}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    border: '0.5px solid var(--border-md)',
                    background: 'var(--raised)',
                    color: 'var(--text-1)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-2)' }}>
            Need test accounts?{' '}
            <Link href="/accounts" style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
              View Demo Credentials
            </Link>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-2)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--text-1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--teal)' }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
