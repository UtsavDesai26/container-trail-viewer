const TrackedContainer = require('../models/TrackedContainer');

async function addTracker(req, res) {
  try {
    const containerNumber = (req.body.containerNumber || '').toString().trim().toUpperCase();
    if (!containerNumber) return res.status(400).json({ error: 'containerNumber required' });
    await TrackedContainer.updateOne({ containerNumber }, { $set: { enabled: true } }, { upsert: true });
    res.json({ result: 'ok', container: containerNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeTracker(req, res) {
  try {
    const containerNumber = (req.params.cntrNo || '').toString().trim().toUpperCase();
    if (!containerNumber) return res.status(400).json({ error: 'containerNumber required' });
    await TrackedContainer.deleteOne({ containerNumber });
    res.json({ result: 'ok', container: containerNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listTrackers(req, res) {
  try {
    const items = await TrackedContainer.find({}).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addTracker, removeTracker, listTrackers };
