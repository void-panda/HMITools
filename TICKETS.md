# Breakdown Tickets: HMITools

**Initiative:** HMITools — All-in-One Student & Campus Toolkit  
**Architecture:** Astro (SSG) + React Islands + Tailwind CSS + shadcn/ui  
**Status:** Ready for Development  
**Date:** 2026-10-02  

---

## 🗺️ Visual Ticket Hierarchy & Dependency Graph

```
EPIC-01: Foundation & Design System
   ├── STORY-01-01: Inisialisasi Project Astro + React + Tailwind
   ├── STORY-01-02: Konfigurasi Theme Tokens (tweakcn OKLCH + Dark Mode)
   ├── STORY-01-03: Setup Komponen Dasar shadcn/ui
   └── STORY-01-04: Layout Shell (Header, Footer, ToolLayout, & _headers WASM)
          │
          ├──► EPIC-02: Campus & Event Suite
          │       ├── STORY-02-01: Twibbon Campaign Maker Island
          │       ├── STORY-02-02: Instagram Grid 3x3 Maker Island
          │       ├── STORY-02-03: Custom QR Code Generator Island
          │       └── STORY-02-04: Bulk E-Sertifikat Generator Island
          │
          ├──► EPIC-03: Academic & Document Suite
          │       ├── STORY-03-01: CV ATS Builder Island (Live Preview & Vector PDF)
          │       ├── STORY-03-02: PDF Toolkit Island (Merge, Split, Watermark)
          │       ├── STORY-03-03: Dokumen & Media Compressor Island
          │       ├── STORY-03-04: Kalkulator & Target IPK Simulator Island
          │       └── STORY-03-05: Citation Formatter Island (APA, IEEE, Harvard)
          │
          └──► EPIC-04: Media & Advanced Utilities
                  ├── STORY-04-01: In-Browser OCR Slide Kuliah (Tesseract.js WASM)
                  └── STORY-04-02: In-Browser Audio/Video Converter (FFmpeg WASM)
                         │
                         ▼
EPIC-05: Dashboard Catalog, SEO & Cloudflare Deployment
   ├── STORY-05-01: Homepage Catalog & Instant Search Filter
   ├── STORY-05-02: Mobile Responsiveness & Touch Optimization Pass
   └── STORY-05-03: Cloudflare Pages Build & Verification Gate
```

---

## 📋 Detail Epic & User Stories

### EPIC-01: Project Foundation & Design System (✅ COMPLETED)
> **Goal:** Membangun fondasi arsitektur Astro, konfigurasi TypeScript, instalasi dependensi, integrasi token tema tweakcn, dan komponen inti shadcn/ui.

| ID | Title | Scope & Acceptance Criteria | Status | Prerequisite |
| :--- | :--- | :--- | :--- | :--- |
| **STORY-01-01** | Inisialisasi Astro + React Islands + Tailwind v4 | Setup project Astro, pasang `@astrojs/react`, `@tailwindcss/vite` (Tailwind v4), TypeScript strict mode. Output: project ter-compile bersih. | ✅ Done | None |
| **STORY-01-02** | Theme Tokens (tweakcn OKLCH) & Dark Mode | Masukkan CSS variables dari tema tweakcn ke `src/styles/global.css`. Implementasikan script toggle Dark/Light mode tanpa FOUC. | ✅ Done | STORY-01-01 |
| **STORY-01-03** | Setup Primitif shadcn/ui | Pasang komponen UI: `Button`, `Card`, `Dialog`, `Input`, `Label`, `Tabs`, `Badge`, `Progress`, `Tooltip`, `Slider`. | ✅ Done | STORY-01-02 |
| **STORY-01-04** | Layout Shell & Cloudflare Headers | Buat `BaseLayout.astro`, `ToolLayout.astro`, `Header.astro` (Logo + Theme Toggle), `Footer.astro`, dan `public/_headers` (COOP/COEP WASM). | ✅ Done | STORY-01-03 |

---

### EPIC-02: Campus Event & Organization Suite (✅ COMPLETED)
> **Goal:** Menyediakan utilitas publikasi dan kepanitiaan organisasi kampus berbasis pemrosesan client-side.

| ID | Title | Scope & Acceptance Criteria | Status | Prerequisite |
| :--- | :--- | :--- | :--- | :--- |
| **STORY-02-01** | Twibbon Campaign Maker | Buat `TwibbonIsland.tsx` dengan HTML5 Canvas. Dukungan upload frame PNG transparan, upload foto, zoom/pan/rotate dengan touch gesture di mobile, export PNG/JPG kualitas tinggi. | ✅ Done | EPIC-01 |
| **STORY-02-02** | Instagram Grid 3x3 Maker | Buat `IGGridIsland.tsx`. Upload gambar $\rightarrow$ pilih grid ($3 \times 1, 3 \times 2, 3 \times 3$) $\rightarrow$ visual preview nomor urut post $\rightarrow$ download ZIP otomatis via JSZip. | ✅ Done | EPIC-01 |
| **STORY-02-03** | Custom QR Code Generator | Buat `QRCodeIsland.tsx`. Input URL/teks $\rightarrow$ ubah warna titik, sudut border, dan sisipkan logo di tengah (opsi preset logo HMIT) $\rightarrow$ export SVG & PNG. | ✅ Done | EPIC-01 |
| **STORY-02-04** | Bulk E-Sertifikat Generator | Buat `CertificateIsland.tsx`. Upload template sertifikat $\rightarrow$ visual drag posisi nama/nomor $\rightarrow$ upload CSV via PapaParse $\rightarrow$ batch render PDF $\rightarrow$ download bundle ZIP. | ✅ Done | EPIC-01 |

---

### EPIC-03: Academic & Document Suite (✅ COMPLETED)
> **Goal:** Membantu kebutuhan pengerjaan tugas, skripsi, dan administrasi beasiswa/magang mahasiswa.

| ID | Title | Scope & Acceptance Criteria | Status | Prerequisite |
| :--- | :--- | :--- | :--- | :--- |
| **STORY-03-01** | CV ATS Builder | Buat `CVBuilderIsland.tsx`. Form multi-step (Pribadi, Pendidikan, Pengalaman, Skill), real-time ATS preview di sisi kanan, auto-save local draft, export PDF vektor asli via `pdf-lib`. | ✅ Done | EPIC-01 |
| **STORY-03-02** | PDF Toolkit (Merge, Split, Watermark) | Buat `PDFToolsIsland.tsx` menggunakan `pdf-lib`. Tab Merge (reorderable list), Tab Split (ekstrak halaman), Tab Watermark (teks, transparansi, rotasi). Pemrosesan 100% lokal. | ✅ Done | EPIC-01 |
| **STORY-03-03** | Dokumen & Media Compressor | Buat `CompressorIsland.tsx`. Kompresi gambar batch (JPG/PNG/WebP) dengan resolusi dan kualitas kustom, serta optimasi stream berkas PDF lokal. | ✅ Done | EPIC-01 |
| **STORY-03-04** | Target IPK & IPS Simulator | Buat `IPKCalculatorIsland.tsx`. Hitung IPS semester ini dan mode simulasi target kelulusan SKS. Simpan riwayat di local storage. | ✅ Done | EPIC-01 |
| **STORY-03-05** | Citation & Daftar Pustaka Formatter | Buat `CitationIsland.tsx`. Input cepat form atau DOI $\rightarrow$ format instan APA 7th, IEEE, Harvard, BibTeX dengan tombol 1-Click Copy. | ✅ Done | EPIC-01 |

---

### EPIC-04: Media & Advanced Utilities (✅ COMPLETED)
> **Goal:** Utilitas komputasi cerdas menggunakan WebAssembly, Canvas, & Web Audio API (OCR, Audio extraction, Background & Watermark removal).

| ID | Title | Scope & Acceptance Criteria | Status | Prerequisite |
| :--- | :--- | :--- | :--- | :--- |
| **STORY-04-01** | In-Browser OCR Slide Kuliah | Buat `OCRIsland.tsx` menggunakan `tesseract.js` worker. Upload foto papan tulis/slide $\rightarrow$ ekstrak teks (ID/EN) $\rightarrow$ export Markdown / Copy. | ✅ Done | EPIC-01 |
| **STORY-04-02** | In-Browser Audio & Media Converter | Buat `MediaConverterIsland.tsx` menggunakan Web Audio API decoding dan WAV PCM encoder. Ekstrak audio dari video kuliah (MP4 to WAV) & konversi gambar tanpa upload server. | ✅ Done | EPIC-01 |
| **STORY-04-03** | Image Background Remover | Buat `BgRemoverIsland.tsx`. Hapus latar belakang foto via chroma tolerance & flood fill segmentation, opsi ganti warna background (merah/biru/putih/transparan), export PNG. | ✅ Done | EPIC-01 |
| **STORY-04-04** | Image Watermark Remover | Buat `WmRemoverIsland.tsx`. Hapus watermark/stempel teks pada gambar/slide menggunakan kuas interaktif dan algoritma Fast Inpainting pada Canvas 2D. | ✅ Done | EPIC-01 |

---

### EPIC-05: Dashboard Catalog, SEO & Cloudflare Deployment (✅ COMPLETED)
> **Goal:** Mengintegrasikan seluruh tool ke halaman utama, optimasi SEO, dan verifikasi build rilis.

| ID | Title | Scope & Acceptance Criteria | Status | Prerequisite |
| :--- | :--- | :--- | :--- | :--- |
| **STORY-05-01** | Homepage Catalog & Search | Buat `src/pages/index.astro`. Hero banner HMITools, filter kategori (Semua, Akademik, Event, Media), preset alur, dan pencarian cepat realtime (`/` hotkey). | ✅ Done | EPIC-02, EPIC-03 |
| **STORY-05-02** | Mobile Responsiveness & Tool Sidebar | Implementasikan `ToolSidebar.astro` sticky desktop + drawer mobile navigasi antar-alat di semua halaman tool. | ✅ Done | All Tools |
| **STORY-05-03** | Cloudflare Pages Verification | Jalankan `npm run build`, verifikasi output static di `dist/` (12 static pages), pastikan header `_headers` terpasang dan 0 build errors. | ✅ Done | STORY-05-01 |

