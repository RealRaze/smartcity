import React from 'react';

export default function HUDComponent({ user, children, onReportClick, onSuggestClick, theme, toggleTheme, isMoving, onLogout }) {
  const maxXP = Math.ceil((user.xp + 1) / 1000) * 1000;
  const xpPercentage = (user.xp / maxXP) * 100;

  return (
    <div className="dashboard-container">
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 24, height: 24, backgroundColor: 'var(--text-yellow)' }}></div>
          <h1 style={{ margin: 0, fontSize: '20px', textTransform: 'none' }}>
            <span style={{ color: 'var(--text-yellow)' }}>City</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Trail</span>
          </h1>
        </div>
      </div>
      
      <div className="main-grid">
        <div className="sidebar left-sidebar" style={{ 
          opacity: isMoving ? 0.3 : 1, 
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: isMoving ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ textAlign: 'center', color: 'var(--accent-cyan)', marginBottom: '16px' }}>CIVIC TOOLS</h3>

          <div className="hud-element" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button className="btn-primary" onClick={onReportClick} style={{ backgroundColor: 'var(--accent-red)', padding: '16px', fontSize: '14px' }}>
              REPORT ISSUE
            </button>

            <div className="pixel-panel" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', border: '2px solid #334155' }}>
              <span style={{ fontSize: 24 }}>🔧</span>
              <div style={{ fontSize: 8 }}>
                <div style={{ color: 'var(--accent-cyan)', marginBottom: 4 }}>NEARBY ISSUE!</div>
                <div>POTHOLE DETECTED</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>+50 XP FOR VERIFYING</div>
              </div>
            </div>
            
            <button className="btn-primary" onClick={onSuggestClick} style={{ backgroundColor: 'var(--accent-green)', padding: '16px', fontSize: '14px', marginTop: '16px' }}>
              SUGGEST GEM
            </button>

            <div className="pixel-panel" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', border: '2px solid #334155' }}>
              <span style={{ fontSize: 24, color: 'var(--text-yellow)' }}>📍</span>
              <div style={{ fontSize: 8 }}>
                <div style={{ color: 'var(--text-yellow)', marginBottom: 4 }}>NEW DISCOVERY:</div>
                <div>HIDDEN CAFE</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>BY EXPLORER_99</div>
              </div>
            </div>
          </div>

          <div className="hud-element" style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', backgroundColor: theme === 'dark' ? '#fadb2a' : '#111', color: theme === 'dark' ? '#111' : '#fff' }} 
              onClick={toggleTheme}
            >
              {theme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
            </button>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', borderColor: '#ff4c4c', color: '#ff4c4c' }} 
              onClick={onLogout}
            >
              LOGOUT
            </button>
          </div>
        </div>
        
        <div className="map-column">
          {children}
        </div>

        <div className="sidebar right-sidebar" style={{ 
          opacity: isMoving ? 0.3 : 1, 
          transition: 'opacity 0.3s ease-in-out'
        }}>
          <h3 style={{ textAlign: 'center', color: 'var(--text-yellow)', marginBottom: '16px' }}>EXPLORER STATUS</h3>

          <div className="pixel-panel hud-element">
            <h3 style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>EXPLORATION PROGRESS</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginTop: 12, marginBottom: 4 }}>
               <span>MAP UNLOCKED</span>
               <span>65%</span>
            </div>
            <div className="xp-container" style={{ marginBottom: 16 }}>
              <div className="xp-fill" style={{ width: `65%`, backgroundColor: 'var(--accent-green)' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 4 }}>
               <span style={{ color: 'var(--text-yellow)' }}>EXPERIENCE</span>
               <span>{user.xp} / {maxXP} XP</span>
            </div>
            <div className="xp-container">
              <div className="xp-fill" style={{ width: `${Math.min(100, Math.max(0, xpPercentage))}%` }}></div>
            </div>
          </div>
          
          <div className="pixel-panel hud-element" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: 10, color: 'var(--accent-cyan)', marginBottom: 12 }}>LATEST ACHIEVEMENTS</h3>
            <ul style={{ listStyle: 'none', fontSize: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user.badges && user.badges.length > 0 ? (
                user.badges.map((badge, idx) => (
                  <li key={idx} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', border: '2px solid #334155' }}>🏆 {badge.name}</li>
                ))
              ) : (
                <li style={{ color: 'var(--text-secondary)' }}>NONE YET</li>
              )}
              {(!user.badges || user.badges.length === 0) && (
                <>
                  <li style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', border: '2px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: 16 }}>☕</span> HIDDEN CAFE</li>
                  <li style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', border: '2px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: 16 }}>👢</span> CITY WANDERER</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="pixel-panel hud-element" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: 10, color: 'var(--accent-cyan)', marginBottom: 12 }}>TOP EXPLORERS</h3>
            <ul className="leaderboard-list">
              <li className="leaderboard-item">
                <span className="rank" style={{ color: 'var(--text-yellow)' }}>1 👑 NAME</span> <span>3009</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank">2 GARON</span> <span>2595</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank">3 VIRE</span> <span>2000</span>
              </li>
              <li className="leaderboard-item" style={{borderBottom: 'none'}}>
                <span className="rank">4 CHANET</span> <span>1808</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
