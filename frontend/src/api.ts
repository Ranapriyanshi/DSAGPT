// Central API utility for base URL

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function apiUrl(path: string) {
  // Ensure no double slashes
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

// Optionally, a helper for fetch
export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(apiUrl(path), options);
} 