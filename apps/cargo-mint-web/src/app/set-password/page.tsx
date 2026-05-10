'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import '../landing.css';

export default function SetPasswordPage() {
  const { user, login, getAuthToken } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cursor = document.getElementById('cm-cursor');
    const ring = document.getElementById('cm-cursor-ring');

    const handleMouseMove = (event: MouseEvent) => {
      if (cursor && ring) {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        setTimeout(() => {
          ring.style.left = `${event.clientX}px`;
          ring.style.top = `${event.clientY}px`;
        }, 60);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Your session expired. Please log in again.');
      }

      const response = await fetch('/api/v1/Account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Unable to update password.');
      }

      if (user) {
        login(token, {
          ...user,
          mustChangePassword: false
        });
      } else {
        router.push('/login');
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-body" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="cm-cursor" id="cm-cursor"></div>
      <div className="cm-cursor-ring" id="cm-cursor-ring"></div>
      <div className="grid-bg"></div>
      <div className="orb orb-1" style={{ top: '10%', left: '20%', width: '800px', height: '800px' }}></div>

      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(20,20,20,0.8)', border: '0.5px solid var(--border-md)', borderRadius: 16, padding: 28, backdropFilter: 'blur(20px)', zIndex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--text-1)' }}>Set a new password</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>
          Your tenant account was created with a temporary password. Update it before continuing.
        </p>

        {error ? (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255,59,85,0.1)', color: 'var(--red)', borderRadius: 10, fontSize: 13, border: '0.5px solid rgba(255,59,85,0.2)' }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
            Current password
            <input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
            New password
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
            Confirm new password
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required style={inputStyle} />
          </label>

          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Saving...' : 'Save password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: '0.5px solid var(--border-md)',
  background: 'var(--raised)',
  color: 'var(--text-1)',
  padding: '0 12px',
  fontSize: 14
};

const buttonStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: 'none',
  background: 'var(--teal)',
  color: '#fff',
  cursor: 'pointer',
  marginTop: 4
};
