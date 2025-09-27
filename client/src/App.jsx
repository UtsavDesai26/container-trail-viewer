import React, { useState, useRef, useEffect } from 'react';
import MapView from './components/MapView';
import { fetchAndStore, getPoints, getSummary, addTracker, listTrackers, removeTracker } from './services/api';

export default function App() {
  const [input, setInput] = useState('MEDU5122175');
  const [containers, setContainers] = useState([]); // tracked container list
  const [geojson, setGeojson] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryMap, setSummaryMap] = useState({});
  const mapRef = useRef(null);

  // Fetch persisted containers from backend on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const trackers = await listTrackers(); // [{ containerNumber }]
        const tracked = trackers.map(t => t.containerNumber);
        setContainers(tracked);
        await fetchAllPoints(tracked);
        // fetch summaries
        const map = {};
        for (const c of tracked) {
          try {
            const s = await getSummary(c);
            map[c] = s;
          } catch (_) {}
        }
        setSummaryMap(map);
      } catch (err) {
        console.error('listTrackers err', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // utility: get combined points and set geojson + events
  async function fetchAllPoints(list = containers) {
    if (!list || list.length === 0) {
      setGeojson(null);
      setEvents([]);
      return;
    }
    try {
      const g = await getPoints(list);
      setGeojson(g);

      const features = Array.isArray(g.features) ? g.features : [];
      const seen = new Set();
      const originalEvents = features
        .filter(f => f.geometry?.type === 'Point' && (f.properties?.type === 'original' || f.properties?.eventName))
        .map(f => ({
          container: f.properties.containerNumber,
          eventName: f.properties.eventName,
          timestamp: Number(f.properties.timeInMs),
          coords: f.geometry.coordinates
        }))
        .filter(e => {
          const key = `${e.container}-${e.timestamp}-${e.coords[0]}-${e.coords[1]}-${e.eventName}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      setEvents(originalEvents);
    } catch (err) {
      console.error('fetchAllPoints err', err);
    }
  }

  // Add a container
  async function handleAddContainer(e) {
    e?.preventDefault();
    const cntr = (input || '').toString().trim().toUpperCase();

    if (!cntr) return alert('Enter container');

    if (containers.includes(cntr)) {
      setInput('');
      return;
    }

    setLoading(true);

    try {
      await fetchAndStore(cntr, true);
      await addTracker(cntr);
      const updated = [...containers, cntr];
      setContainers(updated);
      setInput('');
      await fetchAllPoints(updated);
    } catch (err) {
      console.error('add container err', err);
      alert('Error adding container: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  // Remove a container
  const handleRemoveContainer = async (cntr) => {
    setLoading(true);
    try {
      await removeTracker(cntr); // remove from backend
      const updated = containers.filter(c => c !== cntr);
      setContainers(updated);
      setSummaryMap(prev => {
        const copy = { ...prev };
        delete copy[cntr];
        return copy;
      });
      await fetchAllPoints(updated);
    } catch (err) {
      console.error('removeTracker err', err);
      alert('Error removing container: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch & plot all containers
  async function handleFetchAll(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      await Promise.all(containers.map(c => fetchAndStore(c, false)));
      await fetchAllPoints();
      const map = {};
      for (const c of containers) {
        try {
          const s = await getSummary(c);
          map[c] = s;
        } catch (_) {}
      }
      setSummaryMap(map);
    } catch (err) {
      console.error('handleFetchAll err', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app" style={{ display: 'flex', gap: 12, padding: 12 }}>
      <div className="left" style={{ width: 320 }}>
        <h2>Container Trail Viewer (multi)</h2>

        <form onSubmit={handleAddContainer} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter container number"
            style={{ flex: 1 }}
          />
          <button onClick={handleAddContainer} disabled={loading}>Add</button>
        </form>

        <div style={{ marginTop: 8 }}>
          <strong>Tracked Containers:</strong>
          <div>
            {containers.length === 0 && <p>No containers</p>}
            {containers.map((c) => (
              <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#ddd', marginRight: 8, borderRadius: 3 }} />
                  <strong>{c}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {summaryMap[c] ? `${summaryMap[c].count} pts` : null}
                  </div>
                  <button
                    onClick={() => handleRemoveContainer(c)}
                    style={{
                      fontSize: 12,
                      color: 'white',
                      background: '#e74c3c',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleFetchAll} disabled={loading}>{loading ? 'Loading...' : 'Fetch & Plot All'}</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Original Events:</strong>
          <div className="events-list" style={{ maxHeight: 320, overflow: 'auto' }}>
            {events.length === 0 && <p>No events yet</p>}
            {events.map((ev, idx) => (
              <div key={idx} className="event" style={{ cursor: 'pointer', padding: 6, borderBottom: '1px solid #eee' }}
                onClick={() => mapRef.current?.zoomToEvent(ev.coords, ev.container)}>
                <div><strong>{ev.eventName || 'Event'} — {ev.container}</strong></div>
                <div>{new Date(ev.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{ev.coords[1].toFixed(6)}, {ev.coords[0].toFixed(6)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <small>Tip: add multiple container IDs (e.g., MEDU5122175, EBKG13221225). The app keeps historical points — it only inserts new points.</small>
        </div>
      </div>

      <div className="right" style={{ flex: 1 }}>
        <MapView ref={mapRef} geojson={geojson} />
      </div>
    </div>
  );
}
