const API_BASE = window.AEGIS_API_BASE || (window.location.port === '5500' ? 'http://127.0.0.1:8001' : window.location.origin);
export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
    return body;
  } finally { clearTimeout(timeout); }
}
export const getSummary = () => request('/api/dashboard/summary');
export const getAlerts = () => request('/api/dashboard/alerts');
export const detect = (input) => request('/api/detect', { method: 'POST', body: JSON.stringify({ input }) });
