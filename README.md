# 🔐 SecureChat - End-to-End Encrypted Messenger

A modern, real-time messaging web application with **true end-to-end encryption**. Messages are encrypted on your device before being sent - the server **never** sees plaintext content.

![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-00d4aa)
![KeyExchange](https://img.shields.io/badge/Key%20Exchange-ECDH%20P--256-00b894)
![Storage](https://img.shields.io/badge/Storage-SQLite-blue)
![Mode](https://img.shields.io/badge/Mode-Ephemeral-purple)

## ✨ Features

### 🔒 Security
- **End-to-End Encryption** - AES-256-GCM with ECDH key exchange
- **Zero-Knowledge** - Server only stores encrypted blobs
- **Ephemeral Mode** - All data deleted when room closes
- **HTTPS Support** - Secure connections for mobile devices

### 📱 Mobile Ready
- **QR Code Joining** - Scan to join rooms instantly
- **Offline Network** - Works on local Wi-Fi, no internet needed
- **Self-Signed HTTPS** - No browser flags required on phones

### 💾 Persistence
- **SQLite Database** - Messages survive server restarts
- **Message States** - Pending → Delivered → Read
- **Ephemeral Cleanup** - Owner leaves = everything deleted

---

## 🚀 Quick Start

### Option A: One-Click Setup (Recommended) ⚡

**Right-click `setup.ps1` → "Run with PowerShell" (as Administrator)**

This automatically:
- ✅ Installs dependencies
- ✅ Builds the client
- ✅ Generates SSL certificates
- ✅ Adds firewall rules
- ✅ Shows your IP address
- ✅ Starts the server

---

### Option B: Manual Setup

#### 1. Install & Build
```bash
cd e2e-messenger
npm install
npm run build
```

#### 2. Generate SSL Certificates (for mobile)
```bash
mkdir ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=SecureChat"
```

#### 3. Add Firewall Rules (Run as Admin)
```powershell
netsh advfirewall firewall add rule name="E2E Messenger HTTP" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="E2E Messenger HTTPS" dir=in action=allow protocol=TCP localport=3443
```

#### 4. Start Server
```bash
npm start
```

### Access URLs
| Device | URL |
|--------|-----|
| 💻 PC | http://localhost:3000 |
| 📱 Phone | https://YOUR_IP:3443 |

> **First time on phone?** Tap "Advanced" → "Proceed anyway" to accept the self-signed certificate.

---

## 📱 How to Use

### On PC
1. Open `http://localhost:3000`
2. Enter username → "Start Secure Session"
3. Click "Create Room"
4. Click **ⓘ info icon** to see QR code

### On Phone
1. Scan QR code with camera
2. Accept certificate warning (one-time)
3. Enter username → auto-join the room!
4. Start chatting securely 🔐

### Leaving Rooms
- **Red exit button** in room header
- **Owner leaves** → Room closed, ALL data deleted (ephemeral!)
- **Member leaves** → Just removed from room

---

## 🛡️ Security Model

### What's Encrypted
- ✅ Message content (AES-256-GCM)
- ✅ Messages in transit (HTTPS/WSS)
- ✅ Messages at rest (encrypted blobs in SQLite)

### What Server Sees
- ⚠️ Usernames (for routing)
- ⚠️ Room membership
- ⚠️ Encrypted ciphertext only

### Ephemeral Mode (NEW!)
When the room **owner leaves**:
- 🗑️ All messages deleted
- 🗑️ All room members removed
- 🗑️ Room deleted
- 🗑️ Orphaned users cleaned up

---

## 📁 Project Structure

```
e2e-messenger/
├── server-sqlite.js    # Main server (HTTP + HTTPS)
├── server.js           # Legacy in-memory server
├── db.js               # SQLite database module
├── messenger.db        # Database file (auto-created)
├── ssl/                # SSL certificates
│   ├── key.pem
│   └── cert.pem
├── client/             # React frontend source
│   └── src/
│       ├── crypto/encryption.js  # E2E encryption
│       ├── pages/
│       │   ├── UsernamePage.jsx
│       │   ├── HomePage.jsx
│       │   └── RoomPage.jsx
│       └── socket.js
├── public_build/       # Built frontend
├── ARCHITECTURE.md     # Technical documentation
└── README.md           # This file
```

---

## 🔧 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server (SQLite + HTTPS) |
| `npm run start:memory` | Start in-memory server (no persistence) |
| `npm run dev` | Development mode with auto-reload |
| `npm run build` | Build client to public_build/ |

---

## 🌐 Network Setup

### Firewall Rules
Allow these ports in Windows Firewall:
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="E2E Messenger HTTP" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="E2E Messenger HTTPS" dir=in action=allow protocol=TCP localport=3443
```

### Find Your IP
```powershell
ipconfig | Select-String "IPv4"
```

---

## 📄 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Server statistics (users, rooms, messages) |
| `GET /api/network-info` | Local IP and URLs for QR codes |

---

## 🎨 Design

- **Dark theme** with neon teal accents
- **Glassmorphism** effects
- **Mobile responsive** layout
- **Custom fonts** (Outfit + JetBrains Mono)

---

## 📄 License

MIT License - free to use, modify, and distribute.

---

Built with 🔐 for private, offline communication.
