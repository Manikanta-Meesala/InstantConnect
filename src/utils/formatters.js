export function calculateDaysRemaining(expiresAt, offsetDays = 0) {
  if (!expiresAt) return null;
  const expireDate = new Date(expiresAt);
  if (isNaN(expireDate.getTime())) return null;

  const simulatedNow = new Date(Date.now() + offsetDays * 86400000);
  const diffMs = expireDate.getTime() - simulatedNow.getTime();

  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'Just now';
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 45) return 'Just now';
  if (diffSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffSeconds / 60));
    return `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hrs = Math.floor(diffSeconds / 3600);
    return `${hrs}h ago`;
  }
  if (diffSeconds < 172800) return 'Yesterday';
  const diffDays = Math.floor(diffSeconds / 86400);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
