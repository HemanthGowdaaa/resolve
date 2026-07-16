# Resolve

**Resolve** is a Calm, Beautiful, Premium, Minimal, and Distraction-Free offline-first personal accountability mobile application built with **React Native (Expo SDK 57)** and integrated with a secure, production-grade **Django REST Framework (SimpleJWT)** backend.

---

## 🏛️ System Architecture

Resolve utilizes an **offline-first local-first** database sync topology:
1. **Frontend Storage**: Local data is written directly to a local SQLite database using React Native's SQLite drivers.
2. **Session / Preference Management**: Session keys, JWT tokens, and user display profiles are cached asynchronously using `@react-native-async-storage/async-storage`.
3. **Conflict Resolution & Sync**: A dedicated `SyncManager` aggregates unsynced local mutations, submits updates in bulk to `/sync/`, and pulls upstream increments.
4. **Backend REST APIs**: SimpleJWT authentication provides token verification, token rotation, and token blacklisting during logout.

---

## 🛠️ Project Structure

```text
Resolve/
├── backend/               # Django REST Framework Backend API
│   ├── config/            # Core settings, urls, JWT parameters
│   ├── apps/              # Django modular applications (sync, auth, reflections)
│   └── requirements.txt   # Python dependencies
├── frontend/              # Expo SDK 57 React Native Client
│   ├── src/               # Source root (screens, stores, components)
│   │   ├── database/      # SQLite migrations and repositories
│   │   ├── services/      # Axios HTTP client, logging interceptors, API requests
│   │   └── store/         # Zustand store handlers (Auth, Preferences)
│   └── package.json       # React Native dependencies
└── .gitignore             # Unified root Git exclusion parameters
```

---

## 🚀 Running the Project Locally

### 1. Backend Server Setup
Navigate to the `backend/` directory:
```bash
# Create a virtual environment and activate it
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Client Setup
Navigate to the `frontend/` directory:
```bash
# Install dependencies
npm install

# Start Metro bundler
npm start
```
*To open in Expo Go, scan the QR code displayed in the terminal.*

---

## 🔒 Security & Privacy Features
- **Data Isolation**: Wipes local SQLite database tables immediately upon sign-out.
- **Secure Token Rotation**: Rotating SimpleJWT tokens automatically via HTTP Axios interceptors.
- **Environment Ignored**: Development environment parameters are dynamically ignored to prevent secrets leakage.
