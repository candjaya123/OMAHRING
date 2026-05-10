# Omahring Enhancement Implementation Plan

This document outlines the architecture, schema, features, and implementation plan for upgrading the Omahring e-commerce and community platform based on the latest requirements.

## 1. System Architecture

The project will build upon the existing technology stack:
*   **Frontend**: React (Vite) + Tailwind CSS + Redux Toolkit + Radix UI
*   **Backend**: Node.js + Express
*   **Database**: PostgreSQL (via Supabase)
*   **Authentication**: JWT / Supabase Auth
*   **Real-time Features**: Supabase Realtime (for Chat)
*   **Integrations**:
    *   Biteship (Shipping API for rates & tracking)
    *   Cloudinary (Image Storage)
    *   Midtrans / Paypal (Payment Gateway)

## 2. Database Schema (PostgreSQL/Supabase)

### Users Table
*   `id` (UUID, PK)
*   `email` (String)
*   `password_hash` (String)
*   `role` (Enum: 'guest', 'customer', 'member', 'admin', 'manager')
*   `full_name` (String)
*   `nik` (String, nullable) - *Required for Member*
*   `phone_number` (String, nullable) - *Required for Member*
*   `created_at` (Timestamp)

### Birds (Bird Profile System)
*   `id` (UUID, PK)
*   `member_id` (UUID, FK -> Users)
*   `name` (String)
*   `species` (String)
*   `competition_history` (Text/JSON)
*   `whatsapp_contact` (String)
*   `qr_code_url` (String)
*   `created_at` (Timestamp)

### Content (Edukasi / Bird Info / YouTube)
*   `id` (UUID, PK)
*   `author_id` (UUID, FK -> Users)
*   `type` (Enum: 'education', 'champion_bird', 'youtube')
*   `subcategory` (String, e.g., 'Murai', 'Kenari')
*   `title` (String)
*   `content_body` (Text)
*   `media_url` (String)
*   `status` (Enum: 'pending', 'approved', 'rejected')
*   `created_at` (Timestamp)

### Chat Sessions & Messages
*   `session_id` (UUID, PK)
*   `customer_id` (UUID, FK -> Users)
*   `status` (Enum: 'active', 'closed')
*   `assigned_to` (UUID, FK -> Users, nullable) — admin yang handle
*   `unread_count` (Integer, default 0)
*   `last_message` (Text, nullable)
*   `last_message_at` (Timestamp, nullable)
*   `created_at` (Timestamp)

*   `message_id` (UUID, PK)
*   `session_id` (UUID, FK -> Chat Sessions)
*   `sender_id` (UUID, FK -> Users)
*   `sender_role` (String) — 'customer', 'admin', 'manager'
*   `message_text` (Text)
*   `created_at` (Timestamp)

### Orders & Shipping
*   `order_id` (UUID, PK)
*   `user_id` (UUID, FK -> Users)
*   `total_amount` (Decimal)
*   `shipping_courier` (String)
*   `tracking_number` (String)
*   `status` (Enum: 'pending', 'paid', 'shipped', 'completed')
*   `created_at` (Timestamp)

## 3. API Design (Endpoint List)

*   **Auth**
    *   `POST /api/auth/register` (Register user; member role includes NIK & No HP)
    *   `POST /api/auth/login`
*   **Birds**
    *   `POST /api/birds` (Register bird, auto-generates QR link)
    *   `GET /api/birds/:id` (Public bird profile access via QR)
    *   `GET /api/birds/member/:memberId` (List member's registered birds)
*   **Content (CMS)**
    *   `POST /api/content` (Submit content, requires member role)
    *   `GET /api/content` (List approved content for public view)
    *   `PUT /api/content/:id/status` (Admin approve/reject)
*   **Chat**
    *   `POST /api/shop/chat/start` (Start a session)
    *   `POST /api/shop/chat/message` (Customer send message)
    *   `GET /api/shop/chat/messages/:sessionId` (Get history)
    *   `GET /api/shop/chat/sessions` (Admin/Manager view all sessions/logs)
    *   `POST /api/shop/chat/reply` (Admin reply - NEW)
    *   `PUT /api/shop/chat/session/:sessionId/close` (Admin close session - NEW)
    *   `GET /api/shop/chat/unread-count` (Unread badge count - NEW)
*   **Shipping (Biteship Integration)**
    *   `POST /api/shipping/rates` (Calculate shipping during checkout)
    *   `POST /api/shipping/create-order` (Generate AWB/Tracking)

## 4. Feature Breakdown

1.  **Landing Page Revamp**: Restructure UI. Hero section with branding, Products, Bird Champion Info, Membership Benefits, and Education (moved to the bottom).
2.  **Membership Form**: Update registration to collect NIK and Phone Number for members.
3.  **Omahring Edukasi**: Create a CMS for handling education content, champion bird info (categorized by type), and YouTube videos.
4.  **Bird Profile System**: Members input bird data -> System generates a unique public URL -> Generates a downloadable QR Code linking to the URL (for printing on bird rings).
5.  **Customer Chat System**: Full bidirectional chat — customer sends, admin replies in real-time via Supabase Realtime. Manager can monitor all logs (read-only).
6.  **Member Dashboard**: UI for members to submit articles/YouTube links. Admin approval workflow pipeline.
7.  **Shipping Integration**: Fetch real-time rates via Biteship API during checkout, save tracking numbers to orders.
8.  **Multi-language System**: `react-i18next` integration, language switcher dropdown (ID, EN, MS) for all UI text, persisted to localStorage.

## 5. Folder Structure

```text
client/src/
├── assets/
├── components/
│   ├── chat/
│   │   ├── ChatWidget.jsx        (existing - diupdate)
│   │   └── ChatAdminPanel.jsx    (NEW)
│   ├── common/
│   │   └── LanguageSwitcher.jsx  (existing - OK)
│   └── bird/
│       ├── BirdProfileCard.jsx
│       └── QRCodeGenerator.jsx
├── locales/
│   ├── id.json   (existing - perlu ekspansi besar)
│   ├── en.json   (existing - perlu ekspansi besar)
│   └── ms.json   (existing - perlu ekspansi besar)
├── i18n.js       (existing - perlu update detection config)
├── pages/
│   ├── shopping-view/
│   │   └── home.jsx (existing - tambah t())
│   └── admin-view/
│       ├── chat.jsx          (NEW - admin reply panel)
│       └── chat-logs.jsx     (existing - manager monitoring)
└── store/
    └── shop/
        └── chat-slice.js     (existing - tambah thunks)

## 7. Checklist Tugas Spesifik (Esekusi Step-by-Step)

### A. Database & Backend (Chat System)
- [x] 1. Jalankan SQL Migration di Supabase untuk menambah kolom `assigned_to`, `unread_count`, `last_message`, `last_message_at` ke tabel `chat_sessions`.
- [x] 2. Update `server/controllers/shop/chat-controller.js`:
    - [x] Implementasi `replyMessage` (untuk admin).
    - [x] Implementasi `closeSession` (untuk admin/manager).
    - [x] Implementasi `getUnreadCount`.
    - [x] Update `getAllSessions` untuk menyertakan kolom baru.
- [x] 3. Update `server/routes/shop/chat-routes.js` untuk meregistrasikan endpoint baru tersebut.

### B. Frontend Redux (Chat System)
- [x] 1. Update `client/src/store/shop/chat-slice.js`:
    - [x] Tambah `adminReplyMessage` async thunk.
    - [x] Tambah `closeSession` async thunk.
    - [x] Tambah `getUnreadCount` async thunk.
    - [x] Handle extraReducers untuk thunk baru.

### C. Frontend UI Admin (Chat System)
- [x] 1. Buat file baru `client/src/components/chat/ChatAdminPanel.jsx` (Panel chat realtime admin).
- [x] 2. Buat file baru `client/src/pages/admin-view/chat.jsx` (Halaman admin chat).
- [x] 3. Update `client/src/App.jsx` untuk menambahkan route `/admin/chat`.
- [x] 4. Update `client/src/components/admin-view/sidebar.jsx`:
    - [x] Tambah menu "Chat" (Akses: Admin & Manager).
    - [x] Tambah logika badge angka unread di menu Chat.

### D. Multi-Language System (i18next)
- [x] 1. Update `client/src/i18n.js`: Tambah `i18next-browser-languagedetector` config agar bahasa tersimpan di localStorage.
- [x] 2. Ekspansi besar-besaran file JSON (Tambahkan minimal 50-70 key baru):
    - [x] `client/src/locales/id.json`
    - [x] `client/src/locales/en.json`
    - [x] `client/src/locales/ms.json`
- [x] 3. Implementasi `useTranslation()` di komponen utama:
    - [x] `client/src/components/shopping-view/header.jsx` (Navigasi).
    - [x] `client/src/pages/shopping-view/home.jsx` (Hero & Sections).
    - [x] `client/src/pages/shopping-view/listing.jsx` (Filter & Sort).
    - [x] `client/src/pages/shopping-view/checkout.jsx` (Form Checkout).
    - [x] `client/src/pages/auth/login.jsx` & `register.jsx`.
    - [x] `client/src/components/chat/ChatWidget.jsx`.

### E. Final Polish & Testing
- [x] 1. Testing chat realtime antar tab (Customer vs Admin).
- [x] 2. Verifikasi role Manager hanya bisa melihat (readonly) di `chat-logs.jsx`.
- [x] 3. Verifikasi bahasa tidak berubah saat refresh halaman.
- [x] 4. Cek error console log dan pastikan bersih.

## 6. Deployment Strategy
*   **Database**: Supabase Hosted (Manage schemas and realtime features)
*   **Backend API**: Dockerized Node.js app deployed to VPS (e.g., DigitalOcean) or Serverless (Render/Railway).
*   **Frontend**: Built with Vite and deployed to Vercel, Netlify, or Cloudflare Pages for global CDN distribution.
*   **Domain & SSL**: Cloudflare for DNS management, caching, and automatic HTTPS.
