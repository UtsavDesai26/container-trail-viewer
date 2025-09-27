const ContainerPoint = require('../models/ContainerPoint');
const { fetchFromLDB } = require('../services/ldbService');
const { generateInterpolatedPoints } = require('../utils/interpolate');
const TrackedContainer = require('../models/TrackedContainer');

// simple deterministic color selection
const PALETTE = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe','#008080','#e6beff'];

function colorForContainer(containerNumber) {
  if (!containerNumber) return '#FF0000';
  let hash = 0;
  for (let i = 0; i < containerNumber.length; i++) hash = ((hash << 5) - hash) + containerNumber.charCodeAt(i);
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

async function fetchAndStore(req, res) {
  try {
    const containerNumber = (req.query.cntrNo || req.body.cntrNo || '').toString().trim().toUpperCase();
    if (!containerNumber) return res.status(400).json({ error: 'cntrNo required' });

    const stepMinutes = Number(process.env.STEP_MINUTES || 15);

    const ldbData = await fetchFromLDB(containerNumber);
    const trackPoints = ldbData?.object?.trackPointList || ldbData?.object?.trackLog || [];

    const points = generateInterpolatedPoints(trackPoints, stepMinutes, containerNumber);

    // avoid duplicates
    const times = points.map(p => p.timeInMs);
    const existingTimes = await ContainerPoint.find({ containerNumber, timeInMs: { $in: times } }).distinct('timeInMs');
    const newPoints = points.filter(p => !existingTimes.includes(p.timeInMs));

    let inserted = 0;
    if (newPoints.length > 0) {
      const toInsert = newPoints.map(p => ({
        containerNumber: p.containerNumber,
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp,
        timeInMs: p.timeInMs,
        eventName: p.eventName,
        type: p.type,
        raw: p.raw
      }));
      try {
        await ContainerPoint.insertMany(toInsert, { ordered: false });
        inserted = toInsert.length;
      } catch (err) {
        console.warn('insertMany partial failure', err.message || err);
        const nowCount = await ContainerPoint.countDocuments({ containerNumber, timeInMs: { $in: times } });
        inserted = nowCount - existingTimes.length;
      }
    }

    if (req.body.track === true) {
      await TrackedContainer.updateOne({ containerNumber }, { $set: { enabled: true } }, { upsert: true });
    }

    res.json({ container: containerNumber, totalPoints: points.length, newInserted: inserted, sampleFirst3: points.slice(0,3) });

  } catch (err) {
    console.error('fetchAndStoreRoute error', err.message || err);
    res.status(500).json({ error: err.message || 'server error' });
  }
}

async function getPoints(req, res) {
  try {
    const containerParam = req.params.cntrNo;
    let containers = [];

    if (containerParam) containers = [containerParam.toString().trim().toUpperCase()];
    else if (req.query.containers) containers = req.query.containers.toString().split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    if (!containers.length) return res.status(400).json({ error: 'containers required' });

    const docs = await ContainerPoint.find({ containerNumber: { $in: containers } }).sort({ timeInMs: 1 }).lean();

    // Group by containerNumber
    const byContainer = {};
    docs.forEach(d => {
      byContainer[d.containerNumber] = byContainer[d.containerNumber] || [];
      byContainer[d.containerNumber].push(d);
    });

    const features = [];

    for (const cntr of Object.keys(byContainer)) {
      const arr = byContainer[cntr];
      const coords = arr.map(d => [d.longitude, d.latitude]);

      // point features
      arr.forEach(d => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
          properties: {
            containerNumber: d.containerNumber,
            timeInMs: d.timeInMs,
            timestamp: d.timestamp,
            eventName: d.eventName,
            type: d.type,
            color: colorForContainer(d.containerNumber)
          }
        });
      });

      // line feature for this container
      if (coords.length > 0) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {
            type: 'line',
            containerNumber: cntr,
            color: colorForContainer(cntr)
          }
        });
      }
    }

    return res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error('getPoints error', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
}

async function summary(req, res) {
  try {
    const cntrNo = req.params.cntrNo;
    if (!cntrNo) return res.status(400).json({ error: 'cntrNo required' });
    const count = await ContainerPoint.countDocuments({ containerNumber: cntrNo });
    const last = await ContainerPoint.findOne({ containerNumber: cntrNo }).sort({ timeInMs: -1 }).lean();
    res.json({ container: cntrNo, count, last });
  } catch (err) {
    res.status(500).json({ error: err.message || 'server error' });
  }
}

// cron job to fetch all tracked containers every 15 minutes
async function pollTrackedContainers() {
  try {
    const stepMinutes = Number(process.env.STEP_MINUTES || 15);
    const trackers = await TrackedContainer.find({ enabled: true }).lean();
    for (const t of trackers) {
      try {
        const containerNumber = t.containerNumber;
        const ldbData = await fetchFromLDB(containerNumber);
        const trackPoints = ldbData?.object?.trackPointList || ldbData?.object?.trackLog || [];
        const points = generateInterpolatedPoints(trackPoints, stepMinutes, containerNumber);

        const times = points.map(p => p.timeInMs);
        const existingTimes = await ContainerPoint.find({ containerNumber, timeInMs: { $in: times } }).distinct('timeInMs');
        const newPoints = points.filter(p => !existingTimes.includes(p.timeInMs));

        if (newPoints.length > 0) {
          const toInsert = newPoints.map(p => ({
            containerNumber: p.containerNumber,
            latitude: p.latitude,
            longitude: p.longitude,
            timestamp: p.timestamp,
            timeInMs: p.timeInMs,
            eventName: p.eventName,
            type: p.type,
            raw: p.raw
          }));
          await ContainerPoint.insertMany(toInsert, { ordered: false });
          console.log(`Cron: inserted ${toInsert.length} points for ${containerNumber}`);
        }
      } catch (err) {
        console.error('Cron error for container', t.containerNumber, err.message || err);
      }
    }
  } catch (err) {
    console.error('pollTrackedContainers error', err);
  }
}

module.exports = {
  fetchAndStore,
  getPoints,
  summary,
  pollTrackedContainers
};
