const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Error: ${endpoint}]`, err);
    throw err;
  }
}

export const api = {
  // System & Stats
  getHealth: () => request('/system/health'),
  getNetworkInfo: () => request('/system/network'),
  getDashboardStats: () => request('/system/stats'),
  reseedDatabase: () => request('/system/seed', { method: 'POST' }),
  clearDataset: (payload = {}) => request('/system/clear-dataset', { method: 'POST', body: JSON.stringify(payload) }),
  importDataset: (payload) => request('/system/import-dataset', { method: 'POST', body: JSON.stringify(payload) }),
  exportDataset: () => request('/system/export-dataset'),

  // Products & DPP
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (payload) => request('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateProductStatus: (id, payload) => request(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  // Material Batches
  getBatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/batches${query ? `?${query}` : ''}`);
  },
  getBatchById: (id) => request(`/batches/${id}`),
  quarantineBatch: (id, payload) => request(`/batches/${id}/quarantine`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Components & Shipments
  getComponents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/components${query ? `?${query}` : ''}`);
  },
  createComponent: (payload) => request('/components', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getShipments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shipments${query ? `?${query}` : ''}`);
  },
  getShipmentById: (id) => request(`/shipments/${encodeURIComponent(id)}`),
  getShipmentTraceability: (id) => request(`/shipments/${encodeURIComponent(id)}/traceability`),
  createShipment: (payload) => request('/shipments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateShipmentChecklist: (id, payload) => request(`/shipments/${encodeURIComponent(id)}/checklist`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  // Traceability & Defect Impact
  forwardTrace: (identifier, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trace/forward/${encodeURIComponent(identifier)}${query ? `?${query}` : ''}`);
  },
  backwardTrace: (identifier, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trace/backward/${encodeURIComponent(identifier)}${query ? `?${query}` : ''}`);
  },
  analyzeDefectImpact: (batchId) => request(`/trace/defect-impact/${batchId}`),

  // Genealogy Explorer Graph
  getGenealogyGraph: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/genealogy/graph${query ? `?${query}` : ''}`);
  },

  // Events & Defects & Audit
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  getEventLookups: () => request('/events/lookups'),
  getEventById: (id) => request(`/events/${id}`),
  createEvent: (payload) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  
  getDefects: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/defects${query ? `?${query}` : ''}`);
  },
  getDefectById: (id) => request(`/defects/${id}`),
  previewDefectImpact: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/defects/preview${query ? `?${query}` : ''}`);
  },
  createDefect: (payload) => request('/defects', { method: 'POST', body: JSON.stringify(payload) }),

  getAuditRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit${query ? `?${query}` : ''}`);
  },
  verifyAuditChain: () => request('/audit/verify'),
  simulateAuditTamper: (payload = {}) => request('/audit/tamper-demo', { method: 'POST', body: JSON.stringify(payload) }),
  restoreAuditTamper: (payload = {}) => request('/audit/restore-demo', { method: 'POST', body: JSON.stringify(payload) }),

  // MVTec Anomaly Detection
  getMvtecSamples: () => request('/mvtec/samples'),
  runMvtecInspection: (payload) => request('/mvtec/inspect', { method: 'POST', body: JSON.stringify(payload) }),

  // AI GPS Telematics & Deviation Monitoring
  getTrackingUpdates: () => request('/tracking/updates'),
  getRouteWaypoints: (id) => request(`/tracking/route/${id}`),
  simulateGpsDeviation: (payload = {}) => request('/tracking/simulate-deviation', { method: 'POST', body: JSON.stringify(payload) }),
  acknowledgeTrackingAlert: (payload) => request('/tracking/acknowledge-alert', { method: 'POST', body: JSON.stringify(payload) }),
};
