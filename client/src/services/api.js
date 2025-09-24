import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function fetchAndStore(cntrNo) {
  const url = `${API_BASE}/containers/fetch?cntrNo=${encodeURIComponent(cntrNo)}`;
  const res = await axios.post(url);
  return res.data;
}

export async function getPoints(cntrNo) {
  const url = `${API_BASE}/containers/${encodeURIComponent(cntrNo)}/points`;
  const res = await axios.get(url);
  return res.data;
}

export async function getSummary(cntrNo) {
  const url = `${API_BASE}/containers/${encodeURIComponent(cntrNo)}/summary`;
  const res = await axios.get(url);
  return res.data;
}
