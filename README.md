<div align="center">

# 🧊 Polar Ops

### An edge-autonomous Operations Digital Twin for India's Antarctic Research Stations — **Maitri** & **Bharati**

*Continuous, offline-first operational awareness for the world's most extreme environments.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

<br/>

[🚀 https://polar-ops-bay.vercel.app/](#) &nbsp;|&nbsp; [🎥 **Video Pitch**](#)

</div>

---

## 📖 Overview

**Polar Ops** delivers continuous, offline-first operational awareness for research stations operating in severe network isolation. By bringing **3D visualization, state management, and machine learning directly to the browser edge**, it keeps the digital twin running even when the satellite link goes down.

> 🏆 Built as a prototype for **SIH 2026**.

---

## 🌟 Key Features

| | Feature | Description |
|---|---|---|
| 🌐 | **Offline-First Resilience (PWA)** | The dashboard caches assets and station telemetry, ensuring zero downtime even when satellite links drop. |
| 🧠 | **Edge Machine Learning** | Trains and runs a **TensorFlow.js LSTM** model entirely in the browser to forecast fuel depletion from local data, with zero cloud dependency. |
| 🧊 | **Interactive 3D Spatial View** | Lightweight, procedural **Three.js** models map the station layout and monitor real-time infrastructure health. |
| 🗃️ | **Local Action Queuing** | Maintenance logs and actions are stored in **IndexedDB (Dexie.js)** and queued for automatic background sync once connectivity is restored. |
| ⌨️ | **Accessibility & Shortcuts** | Navigate the twin instantly with keyboard shortcuts **`1`–`8`** and URL hash routing for easy bookmarking. |
| 📄 | **Print-Ready Reports** | Generate clean, auto-formatted briefing PDFs instantly with **`Ctrl + P`**, complete with collapsible sidebars. |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16, React 19 |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **3D Engine** | Three.js, React Three Fiber |
| **Machine Learning** | TensorFlow.js |
| **Local Database** | Dexie.js (IndexedDB) |

---

## 🚀 Getting Started

### 1️⃣ Clone and navigate to the project directory

```bash
cd d:\IARCM
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start the development server

```bash
npm run dev
```

### 4️⃣ Build for production *(recommended for testing offline features)*

```bash
npm run build
npm run start
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser to explore the digital twin.

---

## 📶 Testing Offline Mode

Verify the offline-first capabilities directly in your browser:

1. Open the app **while online** and let the Service Worker finish installing.
2. Open DevTools (`F12`) ➜ **Network** tab ➜ set throttling to **Offline** (or physically disconnect your Wi-Fi).
3. **Refresh** the page.

✅ The local snapshot, client-side forecast, navigation, and scenario UI all remain fully functional.

> [!NOTE]
> Always test on your actual presentation device before the final demo. Browser emulation does not perfectly mirror behavior on every OS and network configuration.

---

## ⚠️ Demo Behavior & Data Boundaries

To provide a seamless showcase for **SIH 2026**, this frontend prototype relies on **synthetic data**. **No backend server is required.**

- 🧪 **Synthetic Metrics:** Fuel, energy, weather, building sensors, inventory, personnel, cargo, risk, and scenario costs are simulated demo values.
- 🤖 **On-Device Forecasts:** The fuel chart trains a small TensorFlow.js LSTM in the browser on generated multivariate histories. *Demo weights are not validated for actual real-world station operations.*
- 🔒 **Isolated Queues:** Dexie stores a browser-local station snapshot and queues actions, but no remote server is configured to receive them in this demo build.

---

<div align="center">

**Built for resilience at the edge of the world. ❄️**

</div>
