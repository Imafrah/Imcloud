# ☁️ IMCLOUD

> **A sleek, lightweight, self-hosted personal cloud storage & file management vault.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Caddy](https://img.shields.io/badge/Caddy-2.x-22b573?style=flat-square&logo=caddy&logoColor=white)](https://caddyserver.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Tunnel-Remote_Access-f38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Architecture Flow](#-system-architecture-flow)
- [Directory Layout](#-directory-layout)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Services](#-running-the-services)
- [API Reference](#-api-reference)
- [Security Features](#-security-features)
- [Important Operational Notes](#-important-operational-notes)
- [License](#-license)

---

## 🌟 Overview

**IMCLOUD** transforms your local PC or home server into a private, high-performance personal cloud vault. It provides an intuitive, modern web interface for managing, uploading, organizing, previewing, and downloading files directly from your physical storage—accessible securely both within your local network and remotely from anywhere across the globe.

---

## ✨ Key Features

- **🎨 Minimalist, Modern UI**
  - Dark-mode glassmorphic design crafted with custom CSS variables, smooth cubic-bezier transitions, and crisp typography.
  - Fully responsive across desktop, tablet, and mobile devices.
- **⚡ Zero-Framework Frontend**
  - Built with pure Vanilla HTML5, CSS3, and ES6+ JavaScript—lightweight, snappy, and zero client build steps.
- **📁 Robust File & Folder Management**
  - Multi-file drag-and-drop uploads with support for large files up to **5 GB**.
  - Create nested directories and delete files or folders recursively.
  - Instant client-side search, filtering, and breadcrumb path navigation.
- **👁️ Rich File Previews**
  - In-browser preview modals for images, videos, audio, PDF documents, and code/text files.
- **🔒 Hardened Security**
  - Path traversal protection and strict safe-path resolution (`getSafePath`).
  - Windows reserved device name validation (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`).
  - HTTP Basic Authentication powered by Caddy with hashed passwords.
- **🌐 Secure Remote Access**
  - Seamless zero-trust remote access via Cloudflare Tunnels (`cloudflared`) without requiring port forwarding or exposing your home IP.
- **🚀 High Performance Reverse Proxy**
  - Caddy Web Server delivers automatic compression (`zstd`, `gzip`), HTTP/2, and static asset caching.

---

## 🛠️ Architecture & Tech Stack

| Layer | Component | Technology | Description |
|---|---|---|---|
| **Frontend** | Web Client UI | HTML5 / Vanilla CSS / ES6+ JS | Single-page personal vault interface (`index.html`) |
| **Reverse Proxy** | Web Server & Gateway | [Caddy Server](https://caddyserver.com/) | Handles authentication, compression, static files, and reverse proxying |
| **Backend API** | Upload & Management API | Node.js & [Express](https://expressjs.com/) | REST endpoints for uploading, folder creation, and file deletion |
| **File Parser** | Multipart Processing | [Multer](https://github.com/expressjs/multer) | Disk storage streaming for large files up to 5 GB |
| **Tunneling** | Remote Connectivity | [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | Encrypted outbound tunnel for public access |
| **Storage** | Physical Disk | Local Filesystem (`C:\files`) | Real-time physical file storage on host machine |

---

## 📐 System Architecture Flow

```mermaid
flowchart LR
    User([🌐 User / Browser])
    Tunnel[☁️ Cloudflare Tunnel]
    Caddy[🛡️ Caddy Gateway :80\n(Basic Auth + Gzip/Zstd)]
    Static[📄 Static File Server\nC:\\filemanager\nC:\\files]
    API[⚙️ Node.js Express API :3000\nupload-server]
    Storage[(💾 Local Storage\nC:\\files)]

    User -->|HTTPS| Tunnel
    Tunnel -->|HTTP :80| Caddy
    Caddy -->|/ | Static
    Caddy -->|/files/*| Storage
    Caddy -->|/imcloud/*| API
    API -->|Read / Write / Delete| Storage
```

---

## 📂 Directory Layout

Recommended system folder organization on Windows:

```plaintext
C:\
├── files/                     <-- Physical root storage for your files & folders
│   ├── Documents/
│   │   └── Resume.pdf
│   ├── Photos/
│   │   └── Vacation.jpg
│   └── Videos/
│       └── Movie.mp4
│
├── filemanager/               <-- Frontend web assets
│   └── index.html
│
└── server/                    <-- Gateway config & backend API
    ├── Caddyfile.txt          <-- Caddy configuration
    └── upload-server/
        ├── package.json
        ├── node_modules/
        └── server.js          <-- Node.js Express server
```

---

## 📋 Prerequisites

Ensure you have the following installed on your host machine:

1. **Node.js** (v18 or higher): [nodejs.org](https://nodejs.org/)
2. **Caddy Server**:
   ```powershell
   winget install Caddyserver.Caddy
   ```
3. **Cloudflare Tunnel (`cloudflared`)**:
   ```powershell
   winget install Cloudflare.Cloudflared
   ```

Verify installations in PowerShell:
```powershell
node -v
caddy version
cloudflared --version
```

---

## 🚀 Installation & Setup

### 1. Create System Directories

Open PowerShell as Administrator and create the required folders:
```powershell
New-Item -Path "C:\files" -ItemType Directory -Force
New-Item -Path "C:\filemanager" -ItemType Directory -Force
New-Item -Path "C:\server\upload-server" -ItemType Directory -Force
```

### 2. Deploy Frontend Assets
Copy `index.html` to `C:\filemanager\index.html`.

### 3. Deploy Backend API
Copy `server.js` to `C:\server\upload-server\server.js`.

Navigate to `C:\server\upload-server` and install dependencies:
```powershell
cd C:\server\upload-server
npm init -y
npm install express multer
```

### 4. Configure Authentication & Caddyfile

1. Generate a secure hashed password for your user:
   ```powershell
   caddy hash-password
   ```
   *Enter your desired password when prompted and copy the output hash.*

2. Place `Caddyfile.txt` in `C:\server\Caddyfile.txt`:
   ```caddy
   :80 {
       encode gzip zstd

       basic_auth {
           YOUR_USERNAME YOUR_GENERATED_HASHCODE
       }

       handle /imcloud/* {
           uri strip_prefix /imcloud
           reverse_proxy 127.0.0.1:3000
       }

       handle_path /files/* {
           root * C:\files
           file_server browse
           header Cache-Control "public, max-age=86400"
       }

       handle {
           root * C:\filemanager
           try_files {path} /index.html
           file_server
       }
   }
   ```
   > ⚠️ **Note:** Replace `YOUR_USERNAME` and `YOUR_GENERATED_HASHCODE` with your actual username and hashed password.

---

## 🏃 Running the Services

To bring your personal cloud online, run each service in its own terminal window:

### 📟 Terminal 1 — Start Backend Server
```powershell
node C:\server\upload-server\server.js
```
*Runs on `http://127.0.0.1:3000`*

### 📟 Terminal 2 — Start Caddy Reverse Proxy
```powershell
caddy run --config C:\server\Caddyfile.txt
```
*Accessible locally at `http://localhost`*

### 📟 Terminal 3 — Start Cloudflare Remote Tunnel
```powershell
cloudflared tunnel --url http://localhost:80
```
*Provides a public HTTPS URL (e.g., `https://xxxx.trycloudflare.com`) for secure remote access from any device.*

---

## 🔌 API Reference

The backend exposes the following RESTful endpoints behind the `/imcloud` proxy:

### 1. Upload File
- **Endpoint:** `POST /upload` (Proxied from `/imcloud/upload`)
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `file`: Binary file data (Max 5 GB)
  - `folderPath`: Relative target folder path (optional, default: `""`)
- **Response:**
  ```json
  {
    "success": true,
    "name": "example.pdf",
    "size": 1048576,
    "path": "Documents"
  }
  ```

### 2. Create Folder
- **Endpoint:** `POST /folder` (Proxied from `/imcloud/folder`)
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "name": "New Folder",
    "folderPath": "Documents"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "name": "New Folder",
    "path": "Documents\\New Folder"
  }
  ```

### 3. Delete File or Folder
- **Endpoint:** `DELETE /delete` (Proxied from `/imcloud/delete`)
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "itemPath": "Documents/old_file.pdf"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "type": "file",
    "path": "Documents/old_file.pdf"
  }
  ```

---

## 🛡️ Security Features

- **Path Traversal Shield:** All requested and target paths are resolved against `STORAGE_ROOT` (`C:\files`). Any access attempting to escape the root boundary throws an immediate `Invalid storage path` exception.
- **Windows System Reserved Name Checks:** Prevents creation of OS-reserved filenames/folders (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`, etc.) and invalid control characters (`<>:"|?*`).
- **HTTP Basic Authentication:** All incoming traffic to the web app, static storage, and API routes requires authentication verified by Caddy.
- **Encrypted Zero-Trust Tunnels:** Cloudflare Tunnel creates a secure outbound TLS connection, removing the need for open inbound firewall ports.

---

## ⚠️ Important Operational Notes

> [!IMPORTANT]
> The host machine running IMCLOUD is your physical storage server.
>
> | State | Impact |
> |---|---|
> | 💻 **Computer / Laptop OFF** | IMCLOUD is **OFFLINE** |
> | ⚙️ **Node.js stopped** | Uploads & file/folder operations unavailable |
> | 🛡️ **Caddy stopped** | Web interface & file downloads unavailable |
> | ☁️ **Tunnel stopped** | Remote internet access unavailable (Local LAN access still works) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
#   I m c l o u d  
 