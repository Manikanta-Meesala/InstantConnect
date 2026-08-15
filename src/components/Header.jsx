import React from 'react';
import { Search, Sun, Moon, BookOpen, BarChart3, LogOut, QrCode } from 'lucide-react';
import AppLogo from './AppLogo';

export default function Header({
  currentUser,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  panelMode,
  setPanelMode,
  onLogout,
  stats,
  onOpenQr
}) {
  return (
    <header className="app-header glass-header">
      <div className="header-brand">
        <div className="brand-logo-icon">
          <AppLogo size={22} color="white" />
        </div>
        <div className="brand-titles">
          <h1 className="brand-name">InstantConnect</h1>
          <span className="brand-subtitle">Connect.Chat.Clear</span>
        </div>
      </div>

      <div className="header-search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, phone number, or chat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      <div className="header-actions">
        {/* User Manual vs Stats Dashboard Toggle */}
        <button
          className={`header-btn ${panelMode === 'stats' ? 'active-tab' : ''}`}
          onClick={() => setPanelMode(panelMode === 'manual' ? 'stats' : 'manual')}
          title={panelMode === 'manual' ? 'Open Live Statistics' : 'Open User Manual'}
        >
          {panelMode === 'manual' ? (
            <>
              <BarChart3 size={18} />
              <span className="btn-text-desktop">Live Stats</span>
              {stats?.expiringSoon > 0 && (
                <span className="badge-notification">{stats.expiringSoon}</span>
              )}
            </>
          ) : (
            <>
              <BookOpen size={18} />
              <span className="btn-text-desktop">Manual</span>
            </>
          )}
        </button>

        {/* Theme Switcher */}
        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} className="text-gold" /> : <Moon size={20} className="text-indigo" />}
        </button>

        {/* User Profile Chip with My QR Code */}
        <div className="user-profile-chip" onClick={onOpenQr} title="View My QR Code" style={{ cursor: 'pointer' }}>
          <div className="user-avatar-circle">
            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : '⚡'}
          </div>
          <div className="user-info-text">
            <span className="user-name">{currentUser.displayName || 'You'}</span>
            <span className="user-phone">{currentUser.phoneNumber}</span>
          </div>
          <QrCode size={16} className="text-indigo" style={{ marginLeft: '4px' }} />
        </div>

        {/* Logout */}
        <button className="header-icon-btn text-danger" onClick={onLogout} title="Logout / Switch User">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
