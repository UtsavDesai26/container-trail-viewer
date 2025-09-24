function generateInterpolatedPoints(trackPoints = [], stepMinutes = 15, containerNumber = null) {
  if (!Array.isArray(trackPoints)) return [];

  // Normalize: get { lat, lon, timeInMs, eventName }
  const pts = trackPoints.map(p => {
    let timeInMs = p.timeInMs;
    if (!timeInMs && p.eventDate) {
      timeInMs = Date.parse(p.eventDate);
    }
    return {
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      timeInMs: Number(timeInMs),
      eventName: p.eventName || p.event_name || null
    };
  }).filter(p => !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude) && !!p.timeInMs);

  pts.sort((a, b) => a.timeInMs - b.timeInMs);

  const stepMs = stepMinutes * 60 * 1000;
  const out = [];

  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = pts[i + 1];

    out.push({
      containerNumber,
      latitude: cur.latitude,
      longitude: cur.longitude,
      timeInMs: cur.timeInMs,
      timestamp: new Date(cur.timeInMs),
      eventName: cur.eventName,
      type: 'original',
      raw: cur
    });

    if (next) {
      const dt = next.timeInMs - cur.timeInMs;
      if (dt <= 0) continue;
      let t = cur.timeInMs + stepMs;
      while (t < next.timeInMs) {
        const fraction = (t - cur.timeInMs) / dt;
        const lat = cur.latitude + fraction * (next.latitude - cur.latitude);
        const lon = cur.longitude + fraction * (next.longitude - cur.longitude);
        out.push({
          containerNumber,
          latitude: lat,
          longitude: lon,
          timeInMs: t,
          timestamp: new Date(t),
          eventName: null,
          type: 'interpolated',
          raw: { from: cur, to: next, fraction }
        });
        t += stepMs;
      }
    }
  }

  // if last point not added (loop adds), ensure last is present (already added)
  const deduped = [];
  for (let p of out) {
    const last = deduped[deduped.length - 1];
    if (!last || last.latitude !== p.latitude || last.longitude !== p.longitude || last.timeInMs !== p.timeInMs) {
      deduped.push(p);
    }
  }

  return deduped;
}

module.exports = {
  generateInterpolatedPoints
};
