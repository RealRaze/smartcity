import React from 'react';

export default function HUDComponent({ user, onReportClick, theme, toggleTheme }) {
  const maxXP = Math.ceil((user.xp + 1) / 1000) * 1000;
  const xpPercentage = (user.xp / maxXP) * 100;

  return (
    <div className="hud-container">
      <div className="top-header">
        <h1>SMART CITY EXPLORATION SYSTEM</h1>
      </div>
      
      <div className="sidebar-layout">
        <div className="left-sidebar">
          <button className="btn-primary hud-element" onClick={onReportClick}>
            REPORT ISSUES
          </button>
          
          <button className="btn-secondary hud-element" onClick={() => window.alert('Suggest place coming soon!')}>
            SUGGEST PLACE
          </button>

          <button 
            className="btn-secondary hud-element" 
            style={{ marginTop: 'auto', backgroundColor: theme === 'dark' ? '#fadb2a' : '#111', color: theme === 'dark' ? '#111' : '#fff' }} 
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
          </button>
        </div>
        
        <div className="right-sidebar">
          <div className="pixel-panel hud-element">
            <h2>GAMIFICATION HUD</h2>
            <br />
            <h3>EXPLORATION PROGRESS</h3>
            <div className="xp-container">
              <div className="xp-fill" style={{ width: `${Math.min(100, Math.max(0, xpPercentage))}%` }}></div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, textAlign: 'right', color: 'var(--text-yellow)' }}>
              {user.xp} XP
            </div>
          </div>
          
          <div className="pixel-panel hud-element">
            <h3>ACHIEVEMENTS UNLOCKED</h3>
            <ul style={{ listStyle: 'none', marginTop: 10, fontSize: 10, lineHeight: 1.8 }}>
              {user.badges && user.badges.length > 0 ? (
                user.badges.map((badge, idx) => (
                  <li key={idx}>🏆 {badge.name}</li>
                ))
              ) : (
                <li style={{ color: 'var(--text-secondary)' }}>NONE YET</li>
              )}
              {/* Dummy achievements to match image */}
              {(!user.badges || user.badges.length === 0) && (
                <>
                  <li style={{marginBottom: 8}}>☕ HIDDEN CAFE</li>
                  <li style={{marginBottom: 8}}>👢 CITY WANDERER</li>
                  <li style={{marginBottom: 8}}>🔧 INFRASTRUCTURE HERO</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="pixel-panel hud-element">
            <h3>TOP EXPLORERS</h3>
            <ul className="leaderboard-list">
              <li className="leaderboard-item">
                <span className="rank">1 NAME</span> <span>3009</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank">2 GARON</span> <span>2595</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank">3 VIRIB</span> <span>2000</span>
              </li>
              <li className="leaderboard-item" style={{borderBottom: 'none'}}>
                <span className="rank">4 CHANCY</span> <span>1808</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
