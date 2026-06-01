let accessToken: string | null = null;

// Initialize from sessionStorage if available
if (typeof window !== 'undefined' && sessionStorage.getItem('accessToken')) {
  accessToken = sessionStorage.getItem('accessToken');
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    sessionStorage.setItem('accessToken', token);
  } else {
    sessionStorage.removeItem('accessToken');
  }
};

export const getAccessToken = (): string | null => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
  sessionStorage.removeItem('accessToken');
};
