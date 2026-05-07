# 🏠 OMAHRING - Fullstack E-commerce Platform

OMAHRING adalah platform e-commerce modern yang dibangun khusus untuk mengelola penjualan produk (seperti Salis/Sepeda Listrik) dengan fitur manajemen yang lengkap, mulai dari inventaris produk, artikel/blog, hingga sistem pembayaran terintegrasi.

Proyek ini menggunakan arsitektur **Client-Server** dengan **Supabase** sebagai database utama dan **Cloudinary** untuk manajemen media.

---

## 🚀 Fitur Utama

### 🛒 Sisi Pelanggan (Shopping View)
- **Home & Listing**: Tampilan produk yang dinamis dengan filter kategori dan pencarian.
- **Detail Produk**: Deskripsi lengkap, galeri gambar, varian produk, dan review pelanggan.
- **Keranjang & Checkout**: Sistem manajemen keranjang serta proses checkout yang aman.
- **Pembayaran Terintegrasi**: Mendukung **Midtrans** (Lokal Indonesia) dan **PayPal**.
- **Blog & Membership**: Halaman artikel untuk edukasi pelanggan dan sistem keanggotaan.
- **Akun Pengguna**: Riwayat pesanan, manajemen alamat, dan profil.

### 🛡️ Sisi Admin (Admin Dashboard)
- **Dashboard Analytics**: Ringkasan performa penjualan dan data pelanggan.
- **Manajemen Produk**: CRUD produk dengan dukungan varian, stok, dan kategori dinamis.
- **Manajemen Promo**: Sistem kode kupon/diskon untuk meningkatkan penjualan.
- **Manajemen Artikel**: Editor blog (CMS) terintegrasi menggunakan React Quill.
- **Manajemen Pesanan**: Pelacakan status pemesanan dari *pending* hingga *dikirim*.
- **Manajemen Staff**: Pengaturan hak akses (Admin/Manager).
- **Pengaturan Sistem**: Konfigurasi global aplikasi.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS & Shadcn UI
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (JSON Web Token) & BCryptJS
- **File Upload**: Cloudinary SDK & Multer
- **Payment Gateway**: Midtrans SDK & PayPal SDK

---

## 📂 Struktur Proyek

```text
OMAHRING/
├── client/              # Frontend (React App)
│   ├── src/
│   │   ├── components/  # Komponen UI (Shared, Admin, Shop)
│   │   ├── pages/       # Halaman utama aplikasi
│   │   ├── store/       # Redux Slices & Logic
│   │   └── lib/         # Konfigurasi utilitas (Axios, utils)
│   └── public/          # Aset publik
├── server/              # Backend (Node.js API)
│   ├── config/          # Koneksi DB (Supabase/Cloudinary)
│   ├── controllers/     # Logika bisnis per entitas
│   ├── helpers/         # Fungsi bantuan (image upload, dll)
│   ├── middleware/      # Auth & Error validation
│   ├── models/          # (Legacy/SQL Reference)
│   └── routes/          # API Endpoints
├── nginx/               # Konfigurasi proxy server untuk deployment
└── schema.sql           # Definisi tabel database (Supabase)
```

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat
- Node.js (v18+)
- Akun Supabase
- Akun Cloudinary
- Akun Midtrans (Sandbox/Production)

### 2. Konfigurasi Environment Variables

Buat file `.env` di dalam folder `server/`:
```env
PORT=5005
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_or_service_key

# Media
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
```

### 3. Setup Database
Eksekusi file `schema.sql` di SQL Editor Supabase Anda untuk membuat tabel yang diperlukan (`users`, `products`, `orders`, `carts`, `promos`, `reviews`).

### 4. Instalasi & Menjalankan

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Client:**
```bash
cd client
npm install
npm run dev
```

---

## 🚢 Deployment (Docker)

Proyek ini sudah dilengkapi dengan Dockerfile untuk client dan server.

1. Bangun image:
   ```bash
   docker build -t omahring-client ./client
   docker build -t omahring-server ./server
   ```
2. Gunakan `nginx/` untuk mengatur reverse proxy jika diperlukan.

---

## 📝 Catatan untuk Developer Selanjutnya
- **Kategori Dinamis**: Kategori produk dikelola secara dinamis melalui UI Admin, tersimpan dalam format JSONB di database.
- **Varian Produk**: Mendukung multiple variants per produk (Unit, Warna, dsb). Pastikan skema `attributes` dan `variants` sinkron antara frontend dan backend.
- **Keamanan**: Gunakan `SERVICE_ROLE_KEY` di server `.env` untuk mengizinkan backend melakukan operasi yang melewati kebijakan RLS Supabase jika diperlukan.

---

Dibuat dengan ❤️ untuk **Omahring**.