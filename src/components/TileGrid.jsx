import React from 'react';
import ConversationTile from './ConversationTile';
import { Plus, MessageSquarePlus, Sparkles } from 'lucide-react';
import AppLogo from './AppLogo';

export default function TileGrid({
  conversations,
  onSelectConversation,
  selectedId,
  onOpenNewChat,
  timeOffsetDays
}) {
  return (
    <div className="tile-grid-container">
      {/* Background Watermark */}
      <div className="watermark-bg" aria-hidden="true">
        <div className="watermark-title">InstantConnect</div>
        <div className="watermark-tagline">Security & E2EE Encryption</div>
      </div>
      {conversations.length === 0 ? (
        <div className="empty-tiles-state glass-panel">
          <div className="empty-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppLogo size={36} color="var(--primary)" />
          </div>
          <h3>No Conversations Found</h3>
          <p>Start a new instant chat without saving contacts!</p>
          <button className="btn btn-primary" onClick={onOpenNewChat}>
            <Plus size={18} /> Start New Chat
          </button>
        </div>
      ) : (
        <div className="tile-grid-field">
          {conversations.map((conv) => (
            <ConversationTile
              key={conv.id || conv.peerPhoneNumber}
              conversation={conv}
              onClick={onSelectConversation}
              isSelected={selectedId === conv.id}
              timeOffsetDays={timeOffsetDays}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button (+) for New Chat as drawn in handwritten wireframe! */}
      <button
        className="fab-new-chat pulse-hover"
        onClick={onOpenNewChat}
        title="Start New Instant Chat (+)"
        aria-label="New Chat"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
