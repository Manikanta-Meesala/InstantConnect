const STORAGE_USER_KEY = 'instantconnect_current_user';
const STORAGE_THEME_KEY = 'instantconnect_theme';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days in Milliseconds

export function getStoredUser() {
  const data = localStorage.getItem(STORAGE_USER_KEY);
  if (!data) return null;

  try {
    const session = JSON.parse(data);
    
    // Support legacy stored user object or new session object with loginTimestamp
    if (!session.loginTimestamp) {
      // If user exists from previous session without timestamp, assign timestamp now
      session.loginTimestamp = Date.now();
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
      return session.user || session;
    }

    const now = Date.now();
    const timeElapsed = now - session.loginTimestamp;

    if (timeElapsed > THREE_DAYS_MS) {
      // Session expired after 3 days from frequent login!
      localStorage.removeItem(STORAGE_USER_KEY);
      return null;
    }

    return session.user;
  } catch (err) {
    localStorage.removeItem(STORAGE_USER_KEY);
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_USER_KEY);
  } else {
    const session = {
      user: user,
      loginTimestamp: Date.now()
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
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
