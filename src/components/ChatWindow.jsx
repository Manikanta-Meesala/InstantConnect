import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, ArrowLeft, Bot, Trash2, UserX, Clock, AlertTriangle, ShieldCheck, Smile, X, CheckCheck, Info, Calendar, UserCheck, MoreVertical } from 'lucide-react';
import { formatMessageTime, calculateDaysRemaining } from '../utils/formatters';

export default function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  onSavePermanently,
  onSimulateReply,
  onTogglePeerDeleted,
  onDeleteChat,
  onDeleteMessage,
  onClose,
  timeOffsetDays = 0,
  currentUser
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [infoModalMsg, setInfoModalMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const longPressTimer = useRef(null);

  const {
    id,
    peerPhoneNumber,
    alias,
    savedPermanently,
    expiresAt,
    deletedByPeer
  } = conversation;

  const titleName = alias || peerPhoneNumber;
  const daysRemaining = !savedPermanently && expiresAt ? calculateDaysRemaining(expiresAt, timeOffsetDays) : null;

  const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '') : '');

  // Exact WhatsApp alignment check: returns TRUE ONLY if sender is currentUser
  const isSender = (msg) => {
    if (!msg) return false;
    if (msg.senderPhoneNumber === 'user') return true;
    if (msg.senderPhoneNumber === 'peer') return false;

    const cleanSender = cleanPhone(msg.senderPhoneNumber);
    const cleanUser = cleanPhone(currentUser?.phoneNumber);

    if (!cleanSender || !cleanUser) return false;

    if (cleanSender === cleanUser) return true;
    if (cleanSender.length >= 10 && cleanUser.length >= 10) {
      return cleanSender.slice(-10) === cleanUser.slice(-10);
    }

    return false;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveMsgMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Long press gesture handlers
  const handleTouchStart = (msgId) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMsgMenuId(msgId);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e, msgId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMsgMenuId(msgId);
  };

  const quickEmojis = ['👍', '❤️', '😂', '🔥', '🎉', '⚡', '🙏', '😊'];

  const formatFullDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (err) {
      return isoStr;
    }
  };

  return (
    <div className="chat-window glass-panel">
      {/* Header */}
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onClose} title="Back to tiles">
          <ArrowLeft size={20} />
        </button>

        <div className="chat-header-avatar">
          {titleName[0]?.toUpperCase() || '💬'}
        </div>

        <div className="chat-header-info">
          <div className="chat-header-name-row">
            <h2 className="chat-peer-name">{titleName}</h2>
            {alias && <span className="chat-peer-sub">{peerPhoneNumber}</span>}
          </div>

          <div className="chat-header-badge-row">
            <span className="badge badge-e2ee" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
              <Lock size={11} /> 🔒 E2EE AES-256
            </span>
            {savedPermanently ? (
              <span className="badge badge-permanent">
                <Lock size={12} /> Saved Permanently
              </span>
            ) : deletedByPeer ? (
              <span className="badge badge-red">
                <UserX size={12} /> Peer Deleted Chat
              </span>
            ) : daysRemaining <= 5 ? (
              <span className="badge badge-yellow">
                <AlertTriangle size={12} /> {daysRemaining} days left before auto-deletion
              </span>
            ) : (
              <span className="badge badge-green">
                <Clock size={12} /> Temporary ({daysRemaining}d remaining)
              </span>
            )}
          </div>
        </div>

        <div className="chat-header-actions">
          {!savedPermanently && !deletedByPeer && (
            <button
              className="btn btn-save-perm pulse-subtle"
              onClick={onSavePermanently}
              title="Save contact permanently so it never expires"
            >
              <Lock size={16} /> Save Permanently
            </button>
          )}

          <button
            className="btn btn-danger-ghost btn-icon-only"
            onClick={onDeleteChat}
            title="Delete Conversation"
          >
            <Trash2 size={18} />
          </button>

          <button
            className="chat-close-x-btn"
            onClick={onClose}
            title="Close Chat (X)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Expiration Banner Warning */}
      {!savedPermanently && daysRemaining !== null && daysRemaining <= 5 && !deletedByPeer && (
        <div className="chat-warning-banner">
          <AlertTriangle size={16} />
          <span>This conversation expires in <strong>{daysRemaining} days</strong>. Save it permanently to keep messages forever.</span>
          <button className="banner-link-btn" onClick={onSavePermanently}>Save Now</button>
        </div>
      )}

      {/* Deleted Notice */}
      {deletedByPeer && (
        <div className="chat-deleted-banner">
          <UserX size={16} />
          <span>The recipient has ended or deleted this chat room. Messages are read-only.</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="chat-messages-feed">
        <div className="chat-start-notice" style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
          <ShieldCheck size={20} style={{ color: '#818cf8' }} />
          <p>🔒 <strong>End-to-End Encrypted (AES-256-GCM)</strong>. Messages and account data are zero-knowledge encrypted on device.</p>
        </div>

        {messages.map((msg, index) => {
          const isOutgoing = isSender(msg);
          const msgId = msg.id || index;
          const isMenuOpen = activeMsgMenuId === msgId;
          const isSeenByRecipient = Boolean(msg.read || msg.isRead);

          return (
            <div key={msgId} className={`message-row ${isOutgoing ? 'msg-outgoing' : 'msg-incoming'}`}>
              <div
                className={`message-bubble ${isMenuOpen ? 'long-press-active' : ''}`}
                onTouchStart={() => handleTouchStart(msgId)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => {
                  if (e.button === 2) {
                    // Right click on PC
                    handleContextMenu(e, msgId);
                  } else {
                    handleTouchStart(msgId);
                  }
                }}
                onMouseUp={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(e, msgId)}
              >
                <p className="message-content">{msg.content}</p>
                <div className="message-meta">
                  <span className="message-time">{formatMessageTime(msg.sentAt)}</span>
                  {isOutgoing && (
                    <CheckCheck
                      size={14}
                      className={`message-ticks ${isSeenByRecipient ? 'ticks-seen' : ''}`}
                      title={isSeenByRecipient ? 'Seen by Recipient' : 'Delivered (Unseen)'}
                    />
                  )}
                </div>

                {/* Quick Action Button for PC users */}
                <button
                  type="button"
                  className="msg-more-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMsgMenuId(isMenuOpen ? null : msgId);
                  }}
                  title="Message options (Right click or Click)"
                >
                  <MoreVertical size={14} />
                </button>

                {/* Long-Press / Right-Click Context Menu Popover */}
                {isMenuOpen && (
                  <div className="msg-context-menu glass-panel animate-scale" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ctx-item-btn"
                      onClick={() => {
                        setActiveMsgMenuId(null);
                        setInfoModalMsg(msg);
                      }}
                    >
                      <Info size={14} /> Message Info
                    </button>

                    {/* Delete for Everyone feature: enabled for sender before or after receiver seen */}
                    <button
                      className="ctx-item-btn btn-danger"
                      onClick={() => {
                        setActiveMsgMenuId(null);
                        if (onDeleteMessage) onDeleteMessage(msg.id);
                      }}
                      title={isOutgoing ? (!isSeenByRecipient ? 'Delete before receiver sees' : 'Delete message on both sides') : 'Delete message'}
                    >
                      <Trash2 size={14} />
                      {isOutgoing
                        ? (!isSeenByRecipient ? 'Delete for Everyone (Unseen)' : 'Delete for Everyone')
                        : 'Delete Message'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      {!deletedByPeer && (
        <form onSubmit={handleSend} className="chat-input-area">
          <div className="emoji-picker-container">
            <button
              type="button"
              className="chat-emoji-toggle"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className="quick-emoji-popover glass-panel">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-item"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Type an instant message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-text-input"
          />

          <button type="submit" className="btn btn-primary chat-send-btn" disabled={!inputText.trim()}>
            <Send size={18} />
          </button>
        </form>
      )}

      {/* Message Info Modal */}
      {infoModalMsg && (
        <div className="modal-overlay" onClick={() => setInfoModalMsg(null)}>
          <div className="modal-card glass-panel msg-info-card animate-scale" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Info size={20} className="modal-icon text-primary" />
                <h3>Message Details</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setInfoModalMsg(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="msg-info-body">
              <div className="msg-info-preview-box">
                <p>"{infoModalMsg.content}"</p>
              </div>

              <div className="msg-info-grid">
                <div className="msg-info-row">
                  <Calendar size={16} className="msg-info-icon" />
                  <div>
                    <div className="msg-info-label">Sent Date & Time</div>
                    <div className="msg-info-val">{formatFullDate(infoModalMsg.sentAt)}</div>
                  </div>
                </div>

                <div className="msg-info-row">
                  <UserCheck size={16} className="msg-info-icon" />
                  <div>
                    <div className="msg-info-label">Sender</div>
                    <div className="msg-info-val">
                      {isSender(infoModalMsg) ? `You (${currentUser?.phoneNumber})` : infoModalMsg.senderPhoneNumber}
                    </div>
                  </div>
                </div>

                <div className="msg-info-row">
                  <UserX size={16} className="msg-info-icon" />
                  <div>
                    <div className="msg-info-label">Recipient</div>
                    <div className="msg-info-val">
                      {isSender(infoModalMsg) ? peerPhoneNumber : `You (${currentUser?.phoneNumber})`}
                    </div>
                  </div>
                </div>

                <div className="msg-info-row">
                  <CheckCheck size={16} className="msg-info-icon text-green" />
                  <div>
                    <div className="msg-info-label">Delivery Status</div>
                    <div className="msg-info-val text-green">Delivered (End-to-End Instant Sync)</div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }} onClick={() => setInfoModalMsg(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

