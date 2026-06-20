import React, { useEffect, useState } from 'react';

export default function VerifyEmail({ token, onComplete }) {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now enter the city.');
        } else {
          setStatus('error');
          setMessage(data.detail || 'Failed to verify email. The link may be expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error while verifying.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="login-screen">
      <div className="pixel-panel login-panel" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '24px', color: 'var(--text-yellow)' }}>
          City<span style={{ color: 'var(--accent-cyan)' }}>Trail</span>
        </h1>
        
        <div style={{ marginBottom: '32px' }}>
          {status === 'verifying' && <h3 style={{ color: 'var(--text-secondary)' }}>{message}</h3>}
          {status === 'success' && <h3 style={{ color: 'var(--accent-green)' }}>✅ {message}</h3>}
          {status === 'error' && <h3 style={{ color: 'var(--accent-red)' }}>❌ {message}</h3>}
        </div>

        {(status === 'success' || status === 'error') && (
          <button className="btn-primary" onClick={onComplete} style={{ padding: '16px' }}>
            RETURN TO LOGIN
          </button>
        )}
      </div>
    </div>
  );
}
