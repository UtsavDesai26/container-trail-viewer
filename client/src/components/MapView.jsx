import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const eventIconUrl = {
  'ICD IN': 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  'ICD OUT': 'https://cdn-icons-png.flaticon.com/512/684/684911.png',
  'PORT IN': 'https://cdn-icons-png.flaticon.com/512/684/684915.png',
  'PORT OUT': 'https://cdn-icons-png.flaticon.com/512/684/684912.png',
  'TERMINAL OUT': 'https://cdn-icons-png.flaticon.com/512/684/684914.png',
  'VESSEL ARRIVED': 'https://cdn-icons-png.flaticon.com/512/684/684913.png',
  'DPD': 'https://cdn-icons-png.flaticon.com/512/684/684910.png'
};

// Normalize event name to match icon keys
const getEventIcon = (eventName) => {
  if (!eventName) return eventIconUrl['DPD'];
  const normalized = eventName.replace(/ - [IVX]+$/i, '').trim().toUpperCase();
  return eventIconUrl[normalized] || eventIconUrl['DPD'];
};

// Using forwardRef to expose functions to parent
const MapView = forwardRef(({ geojson }, ref) => {
  const mapRef = useRef(null);
  const markersRef = useRef({}); // store marker references

  useImperativeHandle(ref, () => ({
    zoomToEvent: (coords) => {
      const key = `${coords[0]}-${coords[1]}`;
      const marker = markersRef.current[key];
      if (marker) {
        marker.openPopup();
        mapRef.current.flyTo([coords[1], coords[0]], 12, { duration: 1.5 });
      }
    }
  }));

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [28.7041, 77.1025],
        zoom: 5
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    if (!geojson) return;

    // Remove existing overlay layers
    map.eachLayer(layer => {
      if (layer.options && layer.options.pane === 'overlayPane') {
        map.removeLayer(layer);
      }
    });

    const points = [];
    markersRef.current = {}; // reset

    geojson.features.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;

      if (f.geometry.type === 'Point') {
        points.push([lat, lng]);

        if (f.properties.eventName) {
          const icon = L.icon({
            iconUrl: getEventIcon(f.properties.eventName),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(`
            <div>
              <strong>Event:</strong> ${f.properties.eventName}<br/>
              <strong>Container:</strong> ${f.properties.containerNumber || 'N/A'}<br/>
              <strong>Transport Mode:</strong> ${f.properties.transportmode || 'N/A'}<br/>
              <strong>Location:</strong> ${f.properties.currentLocation || 'N/A'}<br/>
              <strong>Time:</strong> ${f.properties.timeInMs ? new Date(Number(f.properties.timeInMs)).toLocaleString() : 'N/A'}
            </div>
          `);

          // Save marker for zooming
          markersRef.current[`${lng}-${lat}`] = marker;
        } else {
          L.circleMarker([lat, lng], {
            radius: 4,
            color: 'gray',
            fillColor: 'gray',
            fillOpacity: 0.5
          }).addTo(map);
        }
      }
    });

    if (points.length > 1) {
      L.polyline(points, { color: 'red', weight: 2 }).addTo(map);
      map.fitBounds(points, { padding: [50, 50] });
    }

  }, [geojson]);

  return <div id="map" style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '10px' }} />;
});

export default MapView;
