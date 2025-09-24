import React, { useState, useRef, useEffect } from 'react';
import MapView from './components/MapView';
import { fetchAndStore, getPoints, getSummary } from './services/api';

export default function App() {
  const [cntrNo, setCntrNo] = useState('MEDU5122175');
  const [geojson, setGeojson] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const mapRef = useRef(null);

  async function handleFetch(e) {
    e?.preventDefault();
    if (!cntrNo) return alert('Please enter container number');

    setLoading(true);
    try {
      await fetchAndStore(cntrNo);
      const g = await getPoints(cntrNo);

      const features = Array.isArray(g.features) ? g.features : [];
      if (g.line && g.line.geometry) {
        features.push({ type: 'Feature', geometry: g.line.geometry, properties: { type: 'line' } });
      }

      setGeojson({ type: 'FeatureCollection', features });

      const seen = new Set();
      const originalEvents = features
        .filter(f => f.geometry?.type === 'Point' && (f.properties?.type === 'original' || f.properties?.eventName))
        .map(f => ({
          eventName: f.properties.eventName,
          timestamp: Number(f.properties.timeInMs),
          coords: f.geometry.coordinates
        }))
        .filter(e => {
          const key = `${e.timestamp}-${e.coords[0]}-${e.coords[1]}-${e.eventName}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a,b) => a.timestamp - b.timestamp);

      setEvents(originalEvents);

      const s = await getSummary(cntrNo);
      setSummary(s);

    } catch (err) {
      console.error(err);
      alert('Error fetching container: ' + (err?.response?.data?.error || err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleFetch();
  }, []);

  return (
    <div className="app">
      <div className="left">
        <h2>Container Trail Viewer</h2>
        <div className="input">
          <input
            type="text"
            value={cntrNo}
            onChange={(e) => setCntrNo(e.target.value.toUpperCase())}
            placeholder="Enter container number"
          />
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch & Plot'}
          </button>
        </div>

        <div>
          <strong>Summary:</strong>
          <div>{summary ? `${summary.container} — ${summary.count} points` : 'No summary yet'}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Events (original):</strong>
          <div className="events-list">
            {events.length === 0 && <p>No events yet</p>}
            {events.map((ev, idx) => (
              <div key={idx} className="event" style={{ cursor: 'pointer' }}
                onClick={() => mapRef.current?.zoomToEvent(ev.coords)}>
                <div><strong>{ev.eventName || 'Event'}</strong></div>
                <div>{new Date(ev.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{ev.coords[1]}, {ev.coords[0]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <small>Tip: use sample container IDs (MEDU5122175, EBKG13221225)</small>
        </div>
      </div>

      <div className="right">
        <MapView ref={mapRef} geojson={geojson} />
      </div>
    </div>
  );
}
