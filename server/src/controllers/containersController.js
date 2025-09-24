const ContainerPoint = require('../models/ContainerPoint');
const { fetchFromLDB } = require('../services/ldbService');
const { generateInterpolatedPoints } = require('../utils/interpolate');

const STEP_MINUTES = Number(process.env.STEP_MINUTES || 15);

async function fetchAndStore(req, res) {
  try {
    const cntrNo = req.query.cntrNo || req.body.cntrNo;
    if (!cntrNo) return res.status(400).json({ error: 'cntrNo required' });

    const ldbData = await fetchFromLDB(cntrNo);
    const trackPoints = ldbData?.object?.trackPointList || ldbData?.object?.trackLog || [];

    const points = generateInterpolatedPoints(trackPoints, STEP_MINUTES, cntrNo);

    // Replace existing points for the container
    await ContainerPoint.deleteMany({ containerNumber: cntrNo });
    if (points.length) {
      // transform for insertMany
      const toInsert = points.map(p => ({
        containerNumber: p.containerNumber,
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp,
        timeInMs: p.timeInMs,
        eventName: p.eventName,
        type: p.type,
        raw: p.raw
      }));
      await ContainerPoint.insertMany(toInsert, { ordered: true });
    }

    return res.json({
      result: 'ok',
      container: cntrNo,
      savedPoints: points.length,
      sampleFirst3: points.slice(0, 3)
    });

  } catch (err) {
    console.error('fetchAndStore error', err.message || err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

async function getPoints(req, res) {
  try {
    const cntrNo = req.params.cntrNo;
    if (!cntrNo) return res.status(400).json({ error: 'cntrNo required' });

    const docs = await ContainerPoint.find({ containerNumber: cntrNo }).sort({ timeInMs: 1 }).lean();

    // build GeoJSON FeatureCollection of points
    const features = docs.map(d => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.longitude, d.latitude]
      },
      properties: {
        timeInMs: d.timeInMs,
        timestamp: d.timestamp,
        eventName: d.eventName,
        type: d.type
      }
    }));

    // create LineString of coordinates
    const coords = docs.map(d => [d.longitude, d.latitude]);

    const geojson = {
      type: 'FeatureCollection',
      features,
      line: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      }
    };

    return res.json(geojson);

  } catch (err) {
    console.error('getPoints error', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

async function summary(req, res) {
  try {
    const cntrNo = req.params.cntrNo;
    const count = await ContainerPoint.countDocuments({ containerNumber: cntrNo });
    const last = await ContainerPoint.findOne({ containerNumber: cntrNo }).sort({ timeInMs: -1 }).lean();
    res.json({ container: cntrNo, count, last });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  fetchAndStore,
  getPoints,
  summary
};
