import React from 'react';
import { X, BookOpen, BarChart3, Clock, Lock, AlertTriangle, UserX, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import AppLogo from './AppLogo';

export default function InfoPanel({ mode, setMode, stats, onClosePanel }) {
  return (
    <aside className="info-panel glass-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          {mode === 'manual' ? (
            <>
              <BookOpen size={20} className="text-primary" />
              <h3>User Manual</h3>
            </>
          ) : (
            <>
              <BarChart3 size={20} className="text-accent" />
              <h3>Live Statistics</h3>
            </>
          )}
        </div>

        {/* Toggle X button as specified in handwritten sketch item 3! */}
        <button
          className="panel-toggle-x"
          onClick={() => setMode(mode === 'manual' ? 'stats' : 'manual')}
          title={mode === 'manual' ? 'Switch to Live Stats (X)' : 'Switch to User Manual (X)'}
        >
          <X size={20} />
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="panel-body manual-content">
          <div className="philosophy-box">
            <div className="philosophy-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <AppLogo size={28} color="var(--primary)" />
            </div>
            <h4>"Connect.Chat.Clear"</h4>
            <p>
              InstantConnect lets you chat with anyone instantly without saving their number into your phone book.
            </p>
          </div>

          <div className="manual-section">
            <h5 className="section-heading">🎨 Tile Color Status System</h5>
            <ul className="color-guide-list">
              <li className="guide-item green">
                <span className="dot dot-green"></span>
                <div>
                  <strong>GREEN Tile (Normal)</strong>
                  <p>Newly started temporary conversation (&gt; 5 days left).</p>
                </div>
              </li>
              <li className="guide-item yellow">
                <span className="dot dot-yellow"></span>
                <div>
                  <strong>YELLOW Tile (Approaching Expiration)</strong>
                  <p>Expires in 5 days or less (5d, 4d, 3d, 2d, 1d).</p>
                </div>
              </li>
              <li className="guide-item red">
                <span className="dot dot-red"></span>
                <div>
                  <strong>RED Tile (Unavailable / Deleted)</strong>
                  <p>Recipient deleted the chat room or conversation expired.</p>
                </div>
              </li>
              <li className="guide-item lock">
                <span className="dot dot-lock"><Lock size={10} /></span>
                <div>
                  <strong>🔒 Lock Badge (Saved Permanently)</strong>
                  <p>Saved with Alias/Nickname. Exempt from 30-day deletion!</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="manual-section">
            <h5 className="section-heading">🔄 Dynamic Activity Sorting</h5>
            <p className="manual-text">
              Tiles are automatically sorted by <strong>last activity timestamp</strong>. The most recently active conversation moves to position (0, 0).
            </p>
          </div>

          <div className="panel-footer-tip">
            <Sparkles size={16} /> Click <strong>X</strong> on top right to view live statistics!
          </div>
        </div>
      ) : (
        <div className="panel-body stats-content">
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon-wrap bg-primary-light">
                <BookOpen size={20} className="text-primary" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.totalConversations || 0}</span>
                <span className="stat-label">Total Conversations</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrap bg-green-light">
                <Clock size={20} className="text-green" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.activeTemporary || 0}</span>
                <span className="stat-label">Active Temporary</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrap bg-accent-light">
                <Lock size={20} className="text-accent" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.permanentSaved || 0}</span>
                <span className="stat-label">Permanently Saved 🔒</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrap bg-yellow-light">
                <AlertTriangle size={20} className="text-yellow" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.expiringSoon || 0}</span>
                <span className="stat-label">Expiring in ≤ 5 Days</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon-wrap bg-red-light">
                <UserX size={20} className="text-red" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats?.deletedByPeer || 0}</span>
                <span className="stat-label">Deleted by Peer</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}
