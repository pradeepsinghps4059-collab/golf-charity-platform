const TOKEN_KEY = 'gc_token';

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const tokenStorage = {
  get() {
    return hasBrowserStorage() ? window.localStorage.getItem(TOKEN_KEY) : null;
  },
  set(token) {
    if (hasBrowserStorage()) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clear() {
    if (hasBrowserStorage()) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem('gc_user');
    }
  },
};

export const navigateToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
