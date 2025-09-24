const axios = require('axios');

const LDB_BASE_API = process.env.LDB_BASE_API || 'https://www.ldb.co.in/api/ldb/container/search';

async function fetchFromLDB(containerNumber) {
  if (!containerNumber) throw new Error('containerNumber required');
  const url = `${LDB_BASE_API}?cntrNo=${encodeURIComponent(containerNumber)}&searchType=39`;
  const res = await axios.get(url, { timeout: 20000 });
  return res.data;
}

module.exports = {
  fetchFromLDB
};
