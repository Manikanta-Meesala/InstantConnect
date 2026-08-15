import React from 'react';
import { Lock, Clock, AlertTriangle, UserX, MessageSquare } from 'lucide-react';
import { calculateDaysRemaining, formatRelativeTime } from '../utils/formatters';

export default function ConversationTile({ conversation, onClick, isSelected, timeOffsetDays = 0 }) {
  const {
    peerPhoneNumber,
    alias,
    savedPermanently,
    lastMessage,
    lastActivityTimestamp,
    expiresAt,
    deletedByPeer,
    unreadCount
  } = conversation;

  // Primary identifier: Alias if available, else Phone number
  const primaryTitle = alias || peerPhoneNumber;
  const secondaryTitle = alias ? peerPhoneNumber : null;

  // Expiration calculation with time-warp offset
  let daysRemaining = null;
  let statusColor = 'green';

  if (savedPermanently) {
    statusColor = 'permanent';
  } else if (deletedByPeer) {
    statusColor = 'red';
  } else if (expiresAt) {
    daysRemaining = calculateDaysRemaining(expiresAt, timeOffsetDays);
    if (daysRemaining <= 0) {
      statusColor = 'red';
    } else if (daysRemaining <= 5) {
      statusColor = 'yellow';
    } else {
      statusColor = 'green';
    }
  }

  const relativeTime = formatRelativeTime(lastActivityTimestamp);

  return (
    <div
      className={`conversation-tile tile-${statusColor} ${isSelected ? 'tile-selected' : ''}`}
      onClick={() => onClick(conversation)}
      role="button"
      tabIndex={0}
    >
      <div className="tile-header">
        <div className="tile-avatar">
          {primaryTitle[0]?.toUpperCase() || '💬'}
        </div>
        <div className="tile-title-box">
          <h3 className="tile-primary-name">{primaryTitle}</h3>
          {secondaryTitle && <span className="tile-secondary-phone">{secondaryTitle}</span>}
        </div>
        {unreadCount > 0 && <span className="tile-unread-badge">{unreadCount}</span>}
      </div>

      <div className="tile-message-preview">
        <p className="last-message-text">
          {lastMessage || 'No messages yet'}
        </p>
      </div>

      <div className="tile-footer">
        <span className="tile-timestamp">{relativeTime}</span>

        {/* Lifespan / Status Badge */}
        {savedPermanently ? (
          <span className="tile-badge badge-permanent" title="Saved Permanently - Never expires">
            <Lock size={12} /> Saved
          </span>
        ) : deletedByPeer ? (
          <span className="tile-badge badge-red" title="Peer deleted conversation or expired">
            <UserX size={12} /> Deleted
          </span>
        ) : statusColor === 'yellow' ? (
          <span className="tile-badge badge-yellow" title="Expiring soon!">
            <AlertTriangle size={12} /> {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
          </span>
        ) : (
          <span className="tile-badge badge-green" title="Temporary 30-day lifecycle">
            <Clock size={12} /> {daysRemaining} days / 30
          </span>
        )}
      </div>
    </div>
  );
}
