# 🏠 OMAHRING - Fullstack E-commerce Platform (Final Release)

OMAHRING adalah platform e-commerce modern yang dibangun khusus untuk mengelola penjualan produk dengan fitur manajemen konten dinamis (CMS). Sistem ini dirancang menggunakan arsitektur **Layered Monolith** yang bersih, aman, dan sangat terstruktur.

---

## 🚀 Fitur Utama

### 🛒 Sisi Pelanggan (Shopping View)
- **CMS Powered Content**: Banner hero dan bagian teks dikontrol sepenuhnya via dashboard.
- **Normalized Catalog**: Filter kategori yang cepat menggunakan relasi tabel PostgreSQL.
- **Dual Payment Flow**: Mendukung otomatisasi **Midtrans** dan **Manual Transfer** dengan verifikasi bukti bayar.
- **Membership**: Sistem keanggotaan terintegrasi dengan akses artikel edukasi eksklusif.

### 🛡️ Sisi Admin (Admin Dashboard)
- **CMS Dashboard**: Editor konten visual untuk mengelola teks dan gambar tanpa deployment.
- **Order Management**: Panel verifikasi pembayaran manual dan pelacakan status pesanan.
- **Inventory Control**: Manajemen varian produk (Size/Color) dengan sinkronisasi stok otomatis.

---

## 🛠️ Tech Stack & Technical Architecture

### Arsitektur Backend (Layered Monolith)
Aplikasi menggunakan pola **Service-Repository** untuk pemisahan logika yang ketat:
1. **Routes**: Definisi endpoint dan binding middleware.
2. **Controllers**: Menangani request/response HTTP dan koordinasi service.
3. **Services**: Berisi logika bisnis inti (e.g., kalkulasi fee, integrasi payment).
4. **Repositories**: Berhubungan langsung dengan Supabase/DB, memisahkan query dari logika bisnis.

### Keamanan (Security)
- **Authentication**: JWT berbasis HttpOnly Cookie untuk mencegah serangan XSS.
- **Authorization (RBAC)**: Middleware `authorizeRoles` membatasi akses endpoint berdasarkan role (`admin`, `manager`, `member`, `user`).
- **Data Integrity**: Validasi input di sisi server menggunakan **Zod Schema** sebelum data masuk ke database.

### Strategi Pembayaran (Strategy Pattern)
Sistem menggunakan **Strategy Pattern** untuk menangani berbagai mode pembayaran secara fleksibel, memungkinkan penambahan provider baru tanpa merusak logika pesanan yang sudah ada.

---

## 📂 Struktur Proyek

```text
OMAHRING/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── hooks/       # usePageContent (CMS integration hook)
│   │   ├── store/       # Redux Toolkit (Modular Slices)
│   │   └── components/  # Atomic Design (Shared, Admin, Shop)
├── server/              # Backend (Node.js + Express)
│   ├── modules/         # Domain-driven modules (Auth, Products, CMS)
│   ├── shared/          # Shared Services (Payment Strategies, Cloudinary)
│   ├── middleware/      # Global error handlers & security guards
│   └── config/          # Supabase & Environment variables
├── docs/                # Dokumentasi Arsitektur (ADR) & API Contract
└── migrations/          # SQL Source of Truth (Super Schema)
```

---

## ⚙️ Persiapan & Instalasi

### 1. Database Initialization
Eksekusi file berikut di SQL Editor Supabase:
`migrations/20260512_super_schema.sql`
*Script ini akan membuat tabel, index, RLS, dan seeding data awal.*

### 2. Konfigurasi Backend (`server/.env`)
```env
PORT=5005
NODE_ENV=production
JWT_SECRET=your_secret_string

# Supabase
SUPABASE_URL=https://your-id.supabase.co
SUPABASE_KEY=your-service-role-key

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. Konfigurasi Frontend (`client/.env`)
```env
VITE_SUPABASE_URL=https://your-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URI=http://localhost:5005/api
```

---

## 📝 Developer Guidelines

### CMS Usage (`usePageContent` hook)
Untuk mengambil konten dinamis di frontend, gunakan hook yang sudah disediakan:
```javascript
const { getText, getImage } = usePageContent('homepage');
// Usage: <h1>{getText('hero_title', 'Fallback Title')}</h1>
```

### Database Normalization Rules
1. **Dilarang** menyimpan data entitas bisnis utama dalam kolom JSONB.
2. Gunakan **Snake Case** untuk semua penamaan kolom dan properti payload API.
3. Selalu tambahkan kolom `deleted_at` untuk fitur soft-delete pada entitas utama.

---

Dibuat dengan ❤️ untuk **Omahring**.
*Last Update: 12 Mei 2026*