import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE });

export async function fetchAndStore(cntrNo, track = true) {
  return api.post('/containers/fetch', { cntrNo, track }).then(r => r.data);
}

export async function getPoints(containers = []) {
  const q = containers.join(',');
  return api.get(`/containers/points?containers=${encodeURIComponent(q)}`).then(r => r.data);
}

export async function getSummary(cntrNo) {
  return api.get(`/containers/${encodeURIComponent(cntrNo)}/summary`).then(r => r.data);
}

export async function addTracker(cntrNo) {
  return api.post('/trackers', { containerNumber: cntrNo }).then(r => r.data);
}

export async function listTrackers() {
  return api.get('/trackers').then(r => r.data);
}

export async function removeTracker(cntrNo) {
  return api.delete(`/trackers/${encodeURIComponent(cntrNo)}`).then(r => r.data);
}
