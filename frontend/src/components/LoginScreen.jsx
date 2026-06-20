import React, { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [explorerType, setExplorerType] = useState('tourist');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      if (isRegistering) {
        const res = await fetch(`${backendUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, explorer_type: explorerType })
        });
        const data = await res.json();
        
        if (res.ok) {
          setMessage(data.message);
          // Don't auto-login, wait for email verification
        } else {
          setError(data.detail || 'Registration failed');
        }
      } else {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
          // Pass full token payload back to App
          onLogin({
            username: data.username,
            explorerType: data.explorer_type,
            userId: data.user_id,
            token: data.access_token
          });
        } else {
          setError(data.detail || 'Login failed');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="pixel-panel login-panel">
        <h1 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--text-yellow)' }}>
          City<span style={{ color: 'var(--accent-cyan)' }}>Trail</span>
        </h1>
        <h3 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-secondary)' }}>
          {isRegistering ? 'REGISTER' : 'LOGIN'}
        </h3>
        
        {message && <div style={{ color: 'var(--accent-green)', marginBottom: '16px', textAlign: 'center', fontSize: '12px' }}>{message}</div>}
        {error && <div style={{ color: 'var(--accent-red)', marginBottom: '16px', textAlign: 'center', fontSize: '12px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="e.g. explorer@city.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>PASSWORD</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <>
              <div className="form-group">
                <label>USERNAME</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. CityWalker99" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={15}
                />
              </div>

              <div className="form-group">
                <label>CHOOSE YOUR EXPLORER TYPE</label>
                <div className="type-selector">
                  <label className={`type-option ${explorerType === 'tourist' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="explorerType" 
                      value="tourist" 
                      checked={explorerType === 'tourist'} 
                      onChange={() => setExplorerType('tourist')} 
                      style={{ display: 'none' }}
                    />
                    <div className="type-icon">📷</div>
                    <div className="type-details">
                      <h4>TOURIST</h4>
                      <p>Only sees major landmarks (⭐)</p>
                    </div>
                  </label>

                  <label className={`type-option ${explorerType === 'new_resident' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="explorerType" 
                      value="new_resident" 
                      checked={explorerType === 'new_resident'} 
                      onChange={() => setExplorerType('new_resident')} 
                      style={{ display: 'none' }}
                    />
                    <div className="type-icon">🏠</div>
                    <div className="type-details">
                      <h4>NEW RESIDENT</h4>
                      <p>Sees landmarks (⭐) & local favorites (📍)</p>
                    </div>
                  </label>

                  <label className={`type-option ${explorerType === 'local' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="explorerType" 
                      value="local" 
                      checked={explorerType === 'local'} 
                      onChange={() => setExplorerType('local')} 
                      style={{ display: 'none' }}
                    />
                    <div className="type-icon">🗺️</div>
                    <div className="type-details">
                      <h4>LOCAL</h4>
                      <p>Sees everything, including hidden gems (❓)</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', fontSize: '14px', padding: '16px' }} disabled={isLoading}>
            {isLoading ? 'WAKING UP BACKEND... (MIGHT TAKE 50S)' : (isRegistering ? 'SIGN UP' : 'ENTER CITY')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>
          {isRegistering ? (
            <span>Already registered? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Login here</button></span>
          ) : (
            <span>New explorer? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Register here</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
