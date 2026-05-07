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
*   `created_at` (Timestamp)

*   `message_id` (UUID, PK)
*   `session_id` (UUID, FK -> Chat Sessions)
*   `sender_id` (UUID, FK -> Users)
*   `sender_role` (String)
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
    *   `POST /api/chat/start` (Start a session)
    *   `POST /api/chat/:sessionId/messages` (Send message)
    *   `GET /api/chat/:sessionId/messages` (Get history)
    *   `GET /api/chat/sessions` (Admin/Manager view all sessions/logs)
*   **Shipping (Biteship Integration)**
    *   `POST /api/shipping/rates` (Calculate shipping during checkout)
    *   `POST /api/shipping/create-order` (Generate AWB/Tracking)

## 4. Feature Breakdown

1.  **Landing Page Revamp**: Restructure UI. Hero section with branding, Products, Bird Champion Info, Membership Benefits, and Education (moved to the bottom).
2.  **Membership Form**: Update registration to collect NIK and Phone Number for members.
3.  **Omahring Edukasi**: Create a CMS for handling education content, champion bird info (categorized by type), and YouTube videos.
4.  **Bird Profile System**: Members input bird data -> System generates a unique public URL -> Generates a downloadable QR Code linking to the URL (for printing on bird rings).
5.  **Customer Chat System**: Implementation of chat history, Supabase Realtime for live updates, and role-based access for Admin/Manager to view chat logs.
6.  **Member Dashboard**: UI for members to submit articles/YouTube links. Admin approval workflow pipeline.
7.  **Shipping Integration**: Fetch real-time rates via Biteship API during checkout, save tracking numbers to orders.
8.  **Multi-language System**: `react-i18next` integration, language switcher dropdown (ID, EN, MS) for all UI text, ensuring SEO-friendly URLs.

## 5. Folder Structure

```text
client/src/
├── assets/
├── components/
│   ├── chat/
│   │   ├── ChatWidget.jsx
│   │   └── ChatAdminPanel.jsx
│   ├── common/
│   │   └── LanguageSwitcher.jsx
│   └── bird/
│       ├── BirdProfileCard.jsx
│       └── QRCodeGenerator.jsx
├── i18n/
│   ├── locales/
│   │   ├── id.json
│   │   ├── en.json
│   │   └── ms.json
│   └── index.js
├── pages/
│   ├── Home.jsx
│   ├── BirdProfilePublic.jsx
│   ├── member-dashboard/
│   │   ├── SubmitContent.jsx
│   │   └── RegisterBird.jsx
│   └── admin-dashboard/
│       ├── ContentApproval.jsx
│       └── ChatLogs.jsx
└── store/
    ├── slices/
    │   ├── chatSlice.js
    │   └── birdSlice.js
```

## 6. Example UI Components (React)

### A. i18n Setup Snippet (`client/src/i18n/index.js`)
```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import id from "./locales/id.json";
import ms from "./locales/ms.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
    ms: { translation: ms }
  },
  lng: "id", // default language
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
```

### B. Bird QR Generator Concept (`client/src/components/bird/QRCodeGenerator.jsx`)
```javascript
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

export default function QRCodeGenerator({ birdId }) {
  const profileUrl = `${window.location.origin}/birds/${birdId}`;
  
  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-bold text-lg">Bird Identity QR</h3>
      <QRCodeSVG value={profileUrl} size={200} id="bird-qr" level="H" />
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        onClick={() => {
           // Logic to download SVG or convert to PNG for printing on ring
           const svg = document.getElementById("bird-qr");
           // Download logic here...
        }}
      >
        Download QR for Ring
      </button>
    </div>
  );
}
```

## 7. Deployment Strategy
*   **Database**: Supabase Hosted (Manage schemas and realtime features)
*   **Backend API**: Dockerized Node.js app deployed to VPS (e.g., DigitalOcean) or Serverless (Render/Railway).
*   **Frontend**: Built with Vite and deployed to Vercel, Netlify, or Cloudflare Pages for global CDN distribution.
*   **Domain & SSL**: Cloudflare for DNS management, caching, and automatic HTTPS.
