import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import TileGrid from './components/TileGrid';
import ChatWindow from './components/ChatWindow';
import InfoPanel from './components/InfoPanel';
import TimeWarpBar from './components/TimeWarpBar';
import AuthModal from './components/AuthModal';
import NewChatModal from './components/NewChatModal';
import SavePermanentModal from './components/SavePermanentModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import { getStoredUser, setStoredUser, getStoredTheme, setStoredTheme } from './utils/storage';
import { calculateDaysRemaining } from './utils/formatters';

const API_BASE = '/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [theme, setTheme] = useState(getStoredTheme());
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelMode, setPanelMode] = useState('manual'); // 'manual' or 'stats'
  const [timeOffsetDays, setTimeOffsetDays] = useState(0);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [savingConversation, setSavingConversation] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Apply theme class to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch Conversations from Spring Boot backend (with mock fallback)
  const fetchConversations = async (userPhone) => {
    if (!userPhone) return;
    try {
      const res = await fetch(`${API_BASE}/conversations?userPhone=${encodeURIComponent(userPhone)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(sortConversations(data));
        return;
      }
    } catch (err) {
      console.log('Backend offline, using local fallback state');
    }

    // Fallback to local storage or empty array for new account
    const local = localStorage.getItem(`conversations_${userPhone}`);
    if (local) {
      setConversations(sortConversations(JSON.parse(local)));
    } else {
      setConversations([]);
      localStorage.setItem(`conversations_${userPhone}`, JSON.stringify([]));
    }
  };

  useEffect(() => {
    if (currentUser?.phoneNumber) {
      fetchConversations(currentUser.phoneNumber);
    }
  }, [currentUser]);

  // Sort conversations by lastActivityTimestamp descending
  const sortConversations = (list) => {
    return [...list].sort((a, b) => new Date(b.lastActivityTimestamp) - new Date(a.lastActivityTimestamp));
  };

  // Persist local state whenever conversations change
  useEffect(() => {
    if (currentUser?.phoneNumber) {
      localStorage.setItem(`conversations_${currentUser.phoneNumber}`, JSON.stringify(conversations));
    }
  }, [conversations, currentUser]);

  // Real-time SSE stream & Polling for bi-directional live updates across real mobile numbers
  useEffect(() => {
    if (!currentUser?.phoneNumber) return;

    const phoneParam = encodeURIComponent(currentUser.phoneNumber);
    let es;
    try {
      es = new EventSource(`${API_BASE}/realtime/stream?userPhone=${phoneParam}`);

      es.addEventListener('new_message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          fetchConversations(currentUser.phoneNumber);
          if (selectedConversation && (msg.conversationId === selectedConversation.id || msg.senderPhoneNumber === selectedConversation.peerPhoneNumber)) {
            fetchMessages(selectedConversation.id);
          }
        } catch (err) {}
      });

      es.addEventListener('new_conversation', () => {
        fetchConversations(currentUser.phoneNumber);
      });
    } catch (err) {}

    // Polling fallback (every 3 seconds) for live multi-tab & multi-device sync
    const pollInterval = setInterval(() => {
      fetchConversations(currentUser.phoneNumber);
      if (selectedConversation?.id) {
        fetchMessages(selectedConversation.id);
      }
    }, 3000);

    return () => {
      if (es) es.close();
      clearInterval(pollInterval);
    };
  }, [currentUser, selectedConversation]);

  // Handle URL Hash deep linking for QR code scanning (#connect?phone=...)
  useEffect(() => {
    const checkHashConnect = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('phone=')) {
        const match = hash.match(/phone=([^&]+)/);
        if (match && match[1]) {
          const phone = decodeURIComponent(match[1]);
          if (currentUser?.phoneNumber) {
            handleCreateChat(phone, 'Hi! Connected via InstantConnect QR Code.');
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    };

    checkHashConnect();
    window.addEventListener('hashchange', checkHashConnect);
    return () => window.removeEventListener('hashchange', checkHashConnect);
  }, [currentUser]);

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`${API_BASE}/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        return;
      }
    } catch (err) {
      console.log('Backend offline for messages');
    }

    // Local fallback messages
    const localMsgs = localStorage.getItem(`messages_${convId}`);
    if (localMsgs) {
      setMessages(JSON.parse(localMsgs));
    } else {
      const target = conversations.find(c => c.id === convId);
      const defaultMsgList = [
        {
          id: 1,
          conversationId: convId,
          senderPhoneNumber: target?.peerPhoneNumber || 'peer',
          recipientPhoneNumber: currentUser.phoneNumber,
          content: target?.lastMessage || 'Hello!',
          sentAt: target?.lastActivityTimestamp || new Date().toISOString()
        }
      ];
      setMessages(defaultMsgList);
      localStorage.setItem(`messages_${convId}`, JSON.stringify(defaultMsgList));
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  // Send Message & trigger dynamic re-ordering to (0,0)
  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;

    const newMsg = {
      id: Date.now(),
      conversationId: selectedConversation.id,
      senderPhoneNumber: currentUser.phoneNumber,
      recipientPhoneNumber: selectedConversation.peerPhoneNumber,
      content: content,
      sentAt: new Date().toISOString()
    };

    // Update messages feed
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedConversation.id}`, JSON.stringify(updatedMessages));

    // Update conversation lastActivityTimestamp & lastMessage snippet -> moves tile to top!
    const nowIso = new Date().toISOString();
    const updatedConversations = conversations.map(c => {
      if (c.id === selectedConversation.id) {
        return {
          ...c,
          lastActivityTimestamp: nowIso,
          lastMessage: content,
          expiresAt: c.savedPermanently ? null : new Date(Date.now() + 30 * 86400000).toISOString()
        };
      }
      return c;
    });

    const sorted = sortConversations(updatedConversations);
    setConversations(sorted);

    // Sync with Spring Boot API
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderPhoneNumber: currentUser.phoneNumber,
          recipientPhoneNumber: selectedConversation.peerPhoneNumber,
          content: content
        })
      });
    } catch (ignored) {}
  };

  // Simulate Peer Reply -> triggers real-time tile animation to position 1
  const handleSimulateReply = async () => {
    if (!selectedConversation) return;

    const replyText = "Sounds great! InstantConnect makes temporary chats so easy.";
    const nowIso = new Date().toISOString();

    const replyMsg = {
      id: Date.now(),
      conversationId: selectedConversation.id,
      senderPhoneNumber: selectedConversation.peerPhoneNumber,
      recipientPhoneNumber: currentUser.phoneNumber,
      content: replyText,
      sentAt: nowIso
    };

    const updatedMessages = [...messages, replyMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedConversation.id}`, JSON.stringify(updatedMessages));

    // Move tile to top
    const updatedConversations = conversations.map(c => {
      if (c.id === selectedConversation.id) {
        return {
          ...c,
          lastActivityTimestamp: nowIso,
          lastMessage: replyText
        };
      }
      return c;
    });

    setConversations(sortConversations(updatedConversations));

    try {
      await fetch(`${API_BASE}/messages/${selectedConversation.id}/simulate-reply`, { method: 'POST' });
    } catch (ignored) {}
  };

  // Create New Chat (Adds new tile as first row first cell!)
  const handleCreateChat = async (peerPhone, initialMsg) => {
    setShowNewChatModal(false);
    const nowIso = new Date().toISOString();

    const newConv = {
      id: Date.now(),
      userPhoneNumber: currentUser.phoneNumber,
      peerPhoneNumber: peerPhone,
      alias: null,
      savedPermanently: false,
      createdAt: nowIso,
      lastActivityTimestamp: nowIso,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      deletedByPeer: false,
      lastMessage: initialMsg,
      unreadCount: 0
    };

    // Prepend & sort -> appears first!
    const updatedList = sortConversations([newConv, ...conversations.filter(c => c.peerPhoneNumber !== peerPhone)]);
    setConversations(updatedList);
    setSelectedConversation(newConv);

    const initialMsgObj = {
      id: Date.now() + 1,
      conversationId: newConv.id,
      senderPhoneNumber: currentUser.phoneNumber,
      recipientPhoneNumber: peerPhone,
      content: initialMsg,
      sentAt: nowIso
    };
    setMessages([initialMsgObj]);
    localStorage.setItem(`messages_${newConv.id}`, JSON.stringify([initialMsgObj]));

    try {
      await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhoneNumber: currentUser.phoneNumber,
          peerPhoneNumber: peerPhone,
          initialMessage: initialMsg
        })
      });
    } catch (ignored) {}
  };

  // Save Permanently Handler
  const handleSavePermanently = async (convId, alias) => {
    setSavingConversation(null);

    const updated = conversations.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          alias: alias,
          savedPermanently: true,
          expiresAt: null // Remove expiration
        };
      }
      return c;
    });

    setConversations(sortConversations(updated));

    if (selectedConversation?.id === convId) {
      setSelectedConversation(prev => ({
        ...prev,
        alias: alias,
        savedPermanently: true,
        expiresAt: null
      }));
    }

    try {
      await fetch(`${API_BASE}/conversations/${convId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: alias })
      });
    } catch (ignored) {}
  };

  // Toggle Peer Deleted
  const handleTogglePeerDeleted = async () => {
    if (!selectedConversation) return;

    const updated = conversations.map(c => {
      if (c.id === selectedConversation.id) {
        return { ...c, deletedByPeer: !c.deletedByPeer };
      }
      return c;
    });

    setConversations(updated);
    setSelectedConversation(prev => ({ ...prev, deletedByPeer: !prev.deletedByPeer }));

    try {
      await fetch(`${API_BASE}/conversations/${selectedConversation.id}/toggle-peer-deleted`, { method: 'PUT' });
    } catch (ignored) {}
  };

  // Delete Conversation
  const handleDeleteChat = async () => {
    if (!selectedConversation) return;

    const targetId = selectedConversation.id;
    const updated = conversations.filter(c => c.id !== targetId);
    setConversations(updated);
    setSelectedConversation(null);

    try {
      await fetch(`${API_BASE}/conversations/${targetId}`, { method: 'DELETE' });
    } catch (ignored) {}
  };

  // Time Warp Controls
  const handleAdvanceDays = (days) => {
    setTimeOffsetDays(prev => prev + days);
  };

  const handleResetTime = () => {
    setTimeOffsetDays(0);
  };

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      (c.alias && c.alias.toLowerCase().includes(q)) ||
      c.peerPhoneNumber.toLowerCase().includes(q) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Compute live statistics for InfoPanel
  const stats = useMemo(() => {
    const total = conversations.length;
    const permanent = conversations.filter(c => c.savedPermanently).length;
    
    let activeTemp = 0;
    let expiringSoon = 0;
    let expiredOrDeleted = 0;

    conversations.forEach(c => {
      if (c.savedPermanently) return;
      if (c.deletedByPeer) {
        expiredOrDeleted++;
        return;
      }
      const days = calculateDaysRemaining(c.expiresAt, timeOffsetDays);
      if (days !== null && days <= 0) {
        expiredOrDeleted++;
      } else {
        activeTemp++;
        if (days !== null && days <= 5) {
          expiringSoon++;
        }
      }
    });

    return {
      totalConversations: total,
      activeTemporary: activeTemp,
      permanentSaved: permanent,
      expiringSoon: expiringSoon,
      deletedByPeer: expiredOrDeleted
    };
  }, [conversations, timeOffsetDays]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setStoredUser(user);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setCurrentUser(null);
    setStoredUser(null);
    setConversations([]);
    setSelectedConversation(null);
  };

  // Delete Message (Both Sides)
  const handleDeleteMessage = async (msgId) => {
    if (!selectedConversation || !msgId) return;

    const updatedMessages = messages.filter(m => m.id !== msgId);
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedConversation.id}`, JSON.stringify(updatedMessages));

    const lastMsgObj = updatedMessages[updatedMessages.length - 1];
    const newSnippet = lastMsgObj ? lastMsgObj.content : 'No messages remaining';
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConversation.id) {
        return { ...c, lastMessage: newSnippet };
      }
      return c;
    }));

    try {
      await fetch(`${API_BASE}/messages/${msgId}`, { method: 'DELETE' });
    } catch (ignored) {}
  };

  if (!currentUser) {
    return <AuthModal onLogin={handleLogin} apiBase={API_BASE} />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        panelMode={panelMode}
        setPanelMode={setPanelMode}
        onLogout={handleLogoutClick}
        stats={stats}
        onOpenQr={() => setShowNewChatModal(true)}
      />

      {/* Interactive Time Warp Simulation Bar */}
      <TimeWarpBar
        timeOffsetDays={timeOffsetDays}
        onAdvanceDays={handleAdvanceDays}
        onResetTime={handleResetTime}
      />

      {/* Main App Body Grid */}
      <main className="main-content-layout">
        {/* Left / Center: Conversation Tiles Field */}
        <section className={`tiles-section ${selectedConversation ? 'mobile-hidden' : ''}`}>
          <TileGrid
            conversations={filteredConversations}
            onSelectConversation={handleSelectConversation}
            selectedId={selectedConversation?.id}
            onOpenNewChat={() => setShowNewChatModal(true)}
            timeOffsetDays={timeOffsetDays}
          />
        </section>

        {/* Active Chat Pane */}
        {selectedConversation && (
          <section className="chat-section">
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSavePermanently={() => setSavingConversation(selectedConversation)}
              onSimulateReply={handleSimulateReply}
              onTogglePeerDeleted={handleTogglePeerDeleted}
              onDeleteChat={handleDeleteChat}
              onDeleteMessage={handleDeleteMessage}
              onClose={() => setSelectedConversation(null)}
              timeOffsetDays={timeOffsetDays}
              currentUser={currentUser}
            />
          </section>
        )}

        {/* Right Side: User Manual & Live Stats Panel */}
        <InfoPanel
          mode={panelMode}
          setMode={setPanelMode}
          stats={stats}
          onClosePanel={() => setPanelMode('manual')}
        />
      </main>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateChat={handleCreateChat}
          currentUser={currentUser}
        />
      )}

      {/* Save Permanently Modal */}
      {savingConversation && (
        <SavePermanentModal
          conversation={savingConversation}
          onClose={() => setSavingConversation(null)}
          onSave={handleSavePermanently}
        />
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
