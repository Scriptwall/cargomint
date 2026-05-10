"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../landing.css';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('retail');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const cursor = document.getElementById('cm-cursor');
    const ring = document.getElementById('cm-cursor-ring');

    const handleMouseMove = (e: MouseEvent) => {
      if (cursor && ring) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        setTimeout(() => {
          ring.style.left = `${e.clientX}px`;
          ring.style.top = `${e.clientY}px`;
        }, 60);
      }

      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      const orb2 = document.querySelector('.orb-2') as HTMLElement | null;
      if (orb2) orb2.style.transform = `translate(${-x * 0.3}px, ${-y * 0.3}px)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const mapUserType = () => {
    if (accountType === 'merchant') return 'Partner';
    if (accountType === 'captain') return 'SystemUser';
    return 'Regular';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/Account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          userType: mapUserType()
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed. Please check your details.');
      }

      setSuccess('Account created successfully. You can now sign in.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
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
      <div className="orb orb-2" style={{ bottom: '-10%', right: '10%', width: '800px', height: '800px' }}></div>

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
          width: '100%', maxWidth: '500px',
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
            Create an account
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
            Join the CargoMint logistics network.
          </p>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '20px', background: 'rgba(255,59,85,0.1)', padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(255,59,85,0.2)' }}>{error}</div>}
          {success && <div style={{ color: 'var(--teal)', fontSize: '13px', marginBottom: '20px', background: 'rgba(0,212,170,0.1)', padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(0,212,170,0.2)' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Account Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['retail', 'merchant', 'captain'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    style={{
                      flex: 1, height: '40px', borderRadius: '10px',
                      background: accountType === type ? 'var(--teal-d)' : 'var(--raised)',
                      border: `0.5px solid ${accountType === type ? 'var(--teal)' : 'var(--border-md)'}`,
                      color: accountType === type ? 'var(--teal)' : 'var(--text-2)',
                      fontSize: '13px', fontWeight: accountType === type ? 600 : 400,
                      textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="********"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--text-1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--teal)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
