# Container Trail Viewer – Logistics Tracking System

## Project Overview

This project is a web-based container tracking system that visualizes container trails on an interactive map. Container data is fetched from **Best Online Container, Logistics & Shipment Tracking System India (LDB)** and stored in MongoDB.

Each container trail displays **events and interpolated points every 15 minutes** to provide accurate tracking.

**Sample Container IDs:**
`MEDU5122175`, `EBKG13221225`

---

## Features

* **Interactive Map:** Displays container movement with points and polylines.
* **Event Markers:** Custom icons for events like `ICD IN`, `PORT OUT`, etc.
* **15-Minute Interval Tracking:** Linear interpolation to generate intermediate points.
* **Sidebar Event List:** Click event → map zooms to the selected location.
* **Summary Panel:** Total points, first/last event info.
* **Responsive Design:** Works on desktop and tablet screens.

---

## Tech Stack

| Layer             | Technology                                                       | Reason / Justification                                |
| ----------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Frontend          | React.js                                                         | Dynamic UI, component-based, easy Leaflet integration |
| Mapping Library   | Leaflet.js                                                       | Free, lightweight, open-source                        |
| Backend           | Node.js + Express.js                                             | Efficient API handling and data processing            |
| Database          | MongoDB                                                          | Flexible storage for geojson, scalable                |
| API Communication | Axios                                                            | Simple HTTP client to fetch LDB data                  |
| Styling           | CSS / Flexbox                                                    | Responsive and clean layout                           |
| Deployment        | Vercel (Frontend), Render (Backend) | Quick and scalable deployment                         |

---

## Project Architecture

```
[Frontend: React] ---- Axios ----> [Backend: Node.js + Express] ----> [MongoDB Database]
        |                                                        ^
        |                                                        |
        |<---------------------- REST API ----------------------|
```

**Flow:**

1. User enters container number in frontend.
2. Frontend calls backend API (`fetchAndStore`).
3. Backend fetches LDB data, generates interpolated points, stores in MongoDB.
4. Frontend retrieves container trail (`getPoints`) and summary (`getSummary`).
5. Map renders events and interpolated points with polyline connecting them.
6. User clicks an event → map zooms to selected point.

---

## Database Schema

**Collection:** `containers`

```json
{
  "_id": "ObjectId",
  "containerNumber": "MEDU5122175",
  "points": [
    {
      "latitude": 22.738803,
      "longitude": 69.698899,
      "timeInMs": 1757926716000,
      "eventName": "PORT IN - I",
      "type": "original"
    }
  ],
  "summary": {
    "totalPoints": 50,
    "firstEvent": "PORT IN",
    "lastEvent": "ICD IN"
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## API Endpoints

| Endpoint                   | Method | Description                                                              |
| -------------------------- | ------ | ------------------------------------------------------------------------ |
| `/fetch` | POST   | Fetch container data from LDB, generate interpolated points, store in DB |
| `/:cntrNo/points`      | GET    | Get container trail and events in geojson                                |
| `/:cntrNo/summary`     | GET    | Get container summary (total points, first/last event)                   |

---

## Frontend Components

* **App.jsx** – Handles state, fetch operations, summary display, and event list.
* **MapView\.jsx** – Renders Leaflet map with markers, polyline, and popups.

---

## Key Logic

**Interpolation Algorithm**

* Sort points by timestamp.
* Loop through consecutive points.
* Generate points every 15 minutes using linear interpolation.
* Mark points as `original` or `interpolated`.

---

## Estimated Timeline / Task Split

I have deliver this project **within 1.5–2 days**:

| Task                                                    | Duration     |
| ------------------------------------------------------- | ------------ |
| Project setup (Node.js + React + MongoDB)               | 1–2 hours    |
| Backend API (fetch LDB, store, interpolate points)      | 2–3 hours    |
| Frontend layout + Leaflet map integration               | 1–2 hours    |
| Event markers, popups, polyline, and sidebar event list | 1–2 hours    |
| Event click → map zoom feature                          | 1 hour       |
| Testing, debugging, and deployment                      | 1–2 hours    |
| **Total**                                               | \~1–1.5 days |

---

## Deployment

* **Frontend:** Vercel / Netlify
* **Backend:** Render / Heroku / AWS EC2
* **Database:** MongoDB Atlas (cloud-hosted, free tier possible)

---

## How to Run Locally

1. Clone repository:

```bash
git clone https://github.com/UtsavDesai26/container-trail-viewer.git
cd container-trail-viewer
```

2. Install dependencies:

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. Start Backend Server:

```bash
cd server
npm run dev
```

4. Start Frontend:

```bash
cd client
npm run dev
```

5. Open browser: `http://localhost:5173/`

---

## Deployed Application

You can access the live version of the Container Trail Viewer here:

[Container Trail Viewer - Live Demo](https://container-trail-viewer.vercel.app/)

*Frontend hosted on Vercel*
*Backend API hosted on Render*

---

## Conclusion

This project fulfills all requirements:

* Visualizes container trails with events and interpolated points.
* Provides interactive map with custom markers and polyline.
* Free, scalable tech stack using **React + Node.js + MongoDB + Leaflet**.
* Can be delivered **within 1.5 days** with full deployment.

---
