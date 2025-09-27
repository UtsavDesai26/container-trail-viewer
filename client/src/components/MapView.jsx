import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = forwardRef(({ geojson }, ref) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const layerGroupRef = useRef(null); // dedicated layer group

  useImperativeHandle(ref, () => ({
    zoomToEvent: (coords, container) => {
      const lng = coords[0], lat = coords[1];
      const keySpecific = container ? `${container}-${lng}-${lat}` : null;
      const keyGeneric = `${lng}-${lat}`;
      const marker = (keySpecific && markersRef.current[keySpecific]) || markersRef.current[keyGeneric];
      if (marker && mapRef.current) {
        marker.openPopup();
        mapRef.current.flyTo([lat, lng], 12, { duration: 1.2 });
      }
    }
  }));

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', { center: [20.5937, 78.9629], zoom: 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear previous layer group or create if not exists
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    } else {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    if (!geojson) return;

    const features = Array.isArray(geojson.features) ? geojson.features : [];
    markersRef.current = {};
    const allPointsForFit = [];

    // Draw lines first
    features.forEach(f => {
      if (f.geometry?.type === 'LineString' && f.properties?.type === 'line') {
        const coords = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const color = f.properties?.color || 'red';
        const polyline = L.polyline(coords, { color, weight: 3, opacity: 0.9 });
        polyline.addTo(layerGroupRef.current);
        coords.forEach(c => allPointsForFit.push(c));
      }
    });

    // Draw points
    features.forEach(f => {
      if (f.geometry?.type !== 'Point') return;
      const [lng, lat] = f.geometry.coordinates;
      allPointsForFit.push([lat, lng]);

      const container = f.properties?.containerNumber;
      const key = `${container ? container + '-' : ''}${lng}-${lat}`;

      if (f.properties?.eventName) {
        const icon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
        const popupHtml = `
          <div>
            <strong>Event:</strong> ${f.properties.eventName}<br/>
            <strong>Container:</strong> ${container || 'N/A'}<br/>
            <strong>Time:</strong> ${f.properties.timeInMs ? new Date(Number(f.properties.timeInMs)).toLocaleString() : 'N/A'}
          </div>
        `;
        const marker = L.marker([lat, lng], { icon }).bindPopup(popupHtml);
        marker.addTo(layerGroupRef.current);
        markersRef.current[key] = marker;
      } else {
        const circle = L.circleMarker([lat, lng], {
          radius: 4,
          color: f.properties?.color || 'gray',
          fillColor: f.properties?.color || 'gray',
          fillOpacity: 0.6
        });
        circle.addTo(layerGroupRef.current);
        markersRef.current[key] = circle;
      }
    });

    if (allPointsForFit.length > 0) {
      try {
        map.fitBounds(allPointsForFit, { padding: [50, 50] });
      } catch (err) {}
    }

  }, [geojson]);

  return <div id="map" style={{ width: '100%', height: '100vh', minHeight: '600px', borderRadius: 8 }} />;
});

export default MapView;
