const STORAGE_USER_KEY = 'instantconnect_current_user';
const STORAGE_THEME_KEY = 'instantconnect_theme';
const STORAGE_CONVERSATIONS_KEY = 'instantconnect_conversations';
const STORAGE_MESSAGES_KEY = 'instantconnect_messages';

export function getStoredUser() {
  const data = localStorage.getItem(STORAGE_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_USER_KEY);
  } else {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  }
}

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_THEME_KEY) || 'dark';
}

export function setStoredTheme(theme) {
  localStorage.setItem(STORAGE_THEME_KEY, theme);
}

export function getInitialMockConversations(userPhone) {
  return [];
}
