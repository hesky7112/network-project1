# networking
SYSTEM OVERVIEW

Your app will have three backend services the frontend interacts with:

Service	Role	Example Tech
Go Core API	Network discovery, device config, telemetry ingest, jobs, auth	Go (Gin/Fiber + gRPC)
Python AI API	Analytics, anomaly detection, trend prediction, compliance audits	FastAPI
DB / Message Bus	Persistent data & async messaging	PostgreSQL + Redis/Kafka

Frontend (Next.js or React + Tailwind + ShadCN/UI) will consume their REST/gRPC gateway endpoints.

🧩 1️⃣ ENDPOINT MAP
🧠 AUTH & USERS (Go Core)
Method	Endpoint	Description
POST /auth/login	Authenticate user (JWT)	
POST /auth/logout	Invalidate session	
GET /users/me	Get current user profile	
POST /users	Create new user (admin only)	
GET /users	List all users	
PATCH /users/:id	Update role or permissions	
DELETE /users/:id	Delete user	
🌐 NETWORK DISCOVERY & INVENTORY (Go Core)
Method	Endpoint	Description
POST /discovery/start	Start subnet or range scan	
GET /discovery/status/:jobID	Check progress of discovery job	
GET /inventory/devices	List discovered devices	
GET /inventory/devices/:id	Get detailed device info	
PATCH /inventory/devices/:id	Update labels, owner, notes	
DELETE /inventory/devices/:id	Remove from inventory	
⚙️ CONFIGURATION MANAGEMENT (Go Core)
Method	Endpoint	Description
GET /config/backups	List config snapshots	
POST /config/backup	Trigger config backup for a device	
POST /config/restore/:deviceID	Push config to device	
GET /config/compare/:deviceID	Diff running vs. backup	
POST /config/template/apply	Apply predefined config template	
📡 TELEMETRY & MONITORING (Go Core)
Method	Endpoint	Description
GET /telemetry/live	Live SNMP/NetFlow metrics	
GET /telemetry/history/:deviceID	Get historical metrics	
GET /telemetry/alerts	Active alerts	
POST /telemetry/subscribe	WebSocket stream for live metrics	
🧩 AI & ANALYTICS (Python FastAPI)
Method	Endpoint	Description
POST /analyze/traffic	Send traffic metrics → predict anomaly	
POST /analyze/compliance	Check device config vs. policy rules	
POST /analyze/forecast	Predict future load or outages	
GET /models/status	Get status of AI models	
POST /models/retrain	Retrain models from telemetry dataset	
🧱 ADMIN & SETTINGS (Go Core)
Method	Endpoint	Description
GET /settings	View system settings	
PATCH /settings	Update network ranges, SNMP creds, thresholds	
GET /logs	Get system & job logs	
POST /backup/export	Export all configs & telemetry data	
POST /backup/import	Restore from backup archive	
🧭 2️⃣ FRONTEND USER FLOWS

Let’s break down what your frontend will visualize and control.

🧩 1. Authentication Flow

🔹 Login form → /auth/login

🔹 JWT saved → All API calls authenticated

🔹 Role-based UI (admin, engineer, viewer)

🌍 2. Network Discovery Flow

🖱️ User selects subnet or range → /discovery/start

🔄 Progress bar via /discovery/status/:jobID

📋 Table: discovered devices (IP, MAC, vendor, status)

📁 Click device → /inventory/devices/:id
→ show details: OS, SNMP data, interfaces, config backup

⚙️ 3. Configuration Management

🔹 List configs (/config/backups)

🔹 Compare versions (/config/compare/:deviceID)

🔹 Apply templates (dropdown of preloaded templates)

🔹 Restore backup

🔹 Tag configs as “stable”, “experimental”

📊 4. Telemetry Dashboard

📡 WebSocket connection → /telemetry/subscribe

🔹 Real-time charts: CPU, Memory, Interface utilization

🔹 Device status color-coded

🔹 Historical data via /telemetry/history/:deviceID

🧠 5. AI Analytics Dashboard

🔹 Trigger anomaly detection: /analyze/traffic

🔹 Compliance audit: /analyze/compliance

🔹 Predictive insights: /analyze/forecast

📈 Visualize with chart overlays & alert banners

🔹 “Retrain AI” button → /models/retrain

🧩 6. Alert Center

🔔 Show current alerts (/telemetry/alerts)

🔹 Filters (critical, warning, info)

🔹 Drill-down to affected device or metric

🔹 Mark resolved or acknowledge alert

🧰 7. Admin / Settings

⚙️ Update SNMP communities, SSH keys, subnets

📦 Manage system backups (/backup/export, /backup/import)

🧑‍💼 Manage users and roles (/users)

🪶 Theme toggle, notification settings

🗺️ 3️⃣ FRONTEND PAGE STRUCTURE (Next.js / React)
Page	Purpose	Key API Calls
/login	User login	/auth/login
/dashboard	Overview + key metrics	/telemetry/live, /telemetry/alerts
/devices	Device inventory	/inventory/devices
/devices/[id]	Device details	/inventory/devices/:id
/discovery	Network discovery control	/discovery/start, /discovery/status
/configs	Config management	/config/backups, /config/compare
/analytics	AI insights	/analyze/*
/alerts	Alert management	/telemetry/alerts
/admin	Settings & user management	/settings, /users
🧩 4️⃣ OPTIONAL FRONTEND FEATURES
Feature	Description
Dark/light mode	Match enterprise dashboards
Role-based navigation	Hide sensitive actions for non-admins
Real-time WebSocket notifications	Alert popups & auto-refresh dashboards
Integrated terminal widget	Direct SSH via WebSocket proxy
AI insights overlay	Highlight abnormal devices in red/orange dynamically
Audit timeline	Chronicle of changes (per device or global)
🧠 5️⃣ RECOMMENDED FRONTEND STACK
Component	Tech
Framework	Next.js 15 + React 19 + TypeScript
Styling	TailwindCSS + ShadCN/UI
Charts	Recharts or ECharts
API	React Query / TanStack Query
State	Zustand or Redux Toolkit
Auth	JWT (stored in HttpOnly cookies)
WebSocket	Native WS client + React hooks
Notifications	Sonner or Radix Toasts
