/**
 * Frontend API Client for Contract Farming Matchmaker
 * Proxies through Vite /api or directly to backend server
 */

const API_BASE = '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Health & System
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async reseedData(force = true) {
    const res = await fetch(`${API_BASE}/seed?force=${force}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // Farmers
  async getFarmers() {
    const res = await fetch(`${API_BASE}/farmers`);
    return handleResponse(res);
  },

  async getFarmerById(id) {
    const res = await fetch(`${API_BASE}/farmers/${id}`);
    return handleResponse(res);
  },

  async createFarmer(farmerData) {
    const res = await fetch(`${API_BASE}/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerData),
    });
    return handleResponse(res);
  },

  async updateFarmer(id, updates) {
    const res = await fetch(`${API_BASE}/farmers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async updateFarmerParcels(id, parcels) {
    const res = await fetch(`${API_BASE}/farmers/${id}/parcels`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcels }),
    });
    return handleResponse(res);
  },

  async addFarmerParcel(id, parcelData) {
    const res = await fetch(`${API_BASE}/farmers/${id}/parcels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parcelData),
    });
    return handleResponse(res);
  },

  async deleteFarmerParcel(id, parcelId) {
    const res = await fetch(`${API_BASE}/farmers/${id}/parcels/${parcelId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Processors
  async getProcessors() {
    const res = await fetch(`${API_BASE}/processors`);
    return handleResponse(res);
  },

  async getProcessorById(id) {
    const res = await fetch(`${API_BASE}/processors/${id}`);
    return handleResponse(res);
  },

  async createProcessor(processorData) {
    const res = await fetch(`${API_BASE}/processors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processorData),
    });
    return handleResponse(res);
  },

  // AI Matching Engine
  async getMatches(processorId, options = {}) {
    const query = new URLSearchParams(options).toString();
    const url = `${API_BASE}/match/${processorId}${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Contracts
  async generateContract(contractData) {
    const res = await fetch(`${API_BASE}/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractData),
    });
    return handleResponse(res);
  },

  async getContracts(filter = {}) {
    const query = new URLSearchParams(filter).toString();
    const url = `${API_BASE}/contracts${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getContractById(id) {
    const res = await fetch(`${API_BASE}/contracts/${id}`);
    return handleResponse(res);
  },

  async signContract(id) {
    const res = await fetch(`${API_BASE}/contracts/${id}/sign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async serveContract(id, servedBy = 'farmer') {
    const res = await fetch(`${API_BASE}/contracts/${id}/serve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ served_by: servedBy }),
    });
    return handleResponse(res);
  },

  async cancelContract(id, reason = 'Request declined by user', cancelledBy = 'farmer') {
    const res = await fetch(`${API_BASE}/contracts/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelled_by: cancelledBy, reason }),
    });
    return handleResponse(res);
  },

  // Deliveries
  async getDeliveries(filter = {}) {
    const query = new URLSearchParams(filter).toString();
    const url = `${API_BASE}/deliveries${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getDeliveryById(id) {
    const res = await fetch(`${API_BASE}/deliveries/${id}`);
    return handleResponse(res);
  },

  async trackDelivery(trackingData) {
    const res = await fetch(`${API_BASE}/deliveries/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    });
    return handleResponse(res);
  },
};
