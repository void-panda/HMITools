# Product Requirement Document (PRD): HMITools

**Document Status:** Draft (v1.0)  
**Author:** John (Product Manager)  
**Stakeholder/Client:** HMIT Community & Students  
**Date:** 2026-10-02  
**Target Platform:** Web (Desktop & Mobile Responsive, PWA-Ready)  
**Architecture:** 100% Client-Side / Astro Islands & Static Web App (Zero Server Operating Cost)  

---

## 1. Executive Summary & Product Vision

### 1.1 Visi Produk
**HMITools** adalah platform *all-in-one web toolkit* gratis dan bebas watermark yang dirancang khusus untuk memecahkan masalah harian mahasiswa dan kepanitiaan organisasi kampus (seperti HMIT, BEM, dan UKM). 

### 1.2 Value Proposition Utama
1. **100% Free & Tanpa Iklan Intrusif:** Bebas biaya langganan, tanpa limit harian tiruan, dan tanpa watermark.
2. **100% Private & Client-Side:** Semua berkas (CV, skripsi, foto, sertifikat) diproses langsung di browser pengguna menggunakan WebAssembly dan Canvas API. Data tidak pernah di-upload ke server eksternal.
3. **Zero Operating Cost (Rp 0):** Beroperasi tanpa backend database berbayar, di-deploy di Cloudflare Pages dengan *unlimited bandwidth*.
4. **Solusi Spesifik Mahasiswa:** Mengintegrasikan kebutuhan akademik (skripsi, tugas) dan kebutuhan kepanitiaan/himpunan dalam satu payung aplikasi yang konsisten.

---

## 2. Target Persona & User Stories

### Persona 1: Rizky — Mahasiswa Tingkat Akhir (Academic User)
* **Tantangan:** Sedang menyusun skripsi dan melamar magang/kerja. Sering harus menggabungkan PDF terpisah, mengompres PDF agar lolos portal upload kampus (< 2MB), dan membuat CV berformat standar ATS tanpa template berbayar.
* **Kebutuhan:** Tool cepat, tidak perlu login akun, hasil export rapi tanpa watermark.

### Persona 2: Nabila — Panitia Acara / Divisi Kominfo HMIT (Event & Organization User)
* **Tantangan:** Mengurus publikasi acara kampus, membuat twibbon untuk 500+ peserta baru, memecah poster feed Instagram 3x3, dan membuat ratusan e-sertifikat peserta secara manual dengan nama berbeda-beda.
* **Kebutuhan:** Generator sertifikat massal (CSV to PDF) dan pembuat Twibbon instan yang bisa diakses peserta dengan mudah via smartphone.

---

## 3. Functional Requirements (FR)

### Modul A: Academic & Study Suite

#### `FR-ACAD-01: CV ATS Builder`
* **Deskripsi:** Form builder pembuatan Curriculum Vitae dengan format teks single-column ramah scanner ATS.
* **Fitur Utama:**
  * Form input terstruktur: Data Pribadi, Ringkasan, Pengalaman Organisasi/Kerja, Pendidikan, Skill, dan Proyek.
  * Real-time visual preview responsif.
  * Opsi ekspor ke **PDF Vektor Asli** (bukan raster image) menggunakan `@react-pdf/renderer` atau `pdf-lib`.
  * Auto-save state ke browser *Local Storage* agar data tidak hilang saat browser tertutup.
* **Kriteria Penerimaan (AC):** File PDF hasil export teksnya dapat di-blok/copy-paste dan memiliki struktur heading yang terbaca parser PDF standar.

#### `FR-ACAD-02: PDF Toolkit (Merge, Split, Extract & Watermark)`
* **Deskripsi:** Manipulasi berkas PDF dokumen tugas dan skripsi secara instan.
* **Fitur Utama:**
  * **Merge:** Menggabungkan 2 atau lebih file PDF dalam urutan kustom (drag-and-drop urutan).
  * **Split / Extract:** Memilih range halaman tertentu (misal: hal 1-5) untuk disimpan sebagai PDF baru.
  * **Watermark:** Menambahkan teks cap kustom (misal: "DRAFT SKRIPSI" atau "CONFIDENTIAL") dengan kontrol rotasi dan opasitas.
* **Kriteria Penerimaan (AC):** Pemrosesan 100% di browser via `pdf-lib` tanpa ada koneksi HTTP upload berkas.

#### `FR-ACAD-03: Dokumen & Media Compressor`
* **Deskripsi:** Kompresi ukuran gambar dan PDF untuk memenuhi syarat batas upload portal kampus (LMS/Google Classroom/Beasiswa).
* **Fitur Utama:**
  * Kompresi gambar (JPG, PNG, WebP) dengan kontrol slider kualitas dan resolusi target.
  * Kompresi PDF dengan optimasi metadata dan kompresi stream.
  * Tampilan perbandingan ukuran sebelum (*Original Size*) dan sesudah (*Compressed Size*).
* **Kriteria Penerimaan (AC):** Mampu mengurangi ukuran berkas hingga $\ge 40\%$ tanpa degradasi keterbacaan teks yang parah.

#### `FR-ACAD-04: OCR Catatan & Slide Kuliah ke Teks`
* **Deskripsi:** Ekstrak teks dari foto papan tulis atau screenshot slide presentasi dosen.
* **Fitur Utama:**
  * Upload gambar / paste dari clipboard (`Ctrl+V`).
  * Pilihan bahasa OCR: Bahasa Indonesia (`ind`) dan Bahasa Inggris (`eng`).
  * Output teks yang bisa langsung disalin ke clipboard atau diekspor ke format Markdown / TXT.
* **Kriteria Penerimaan (AC):** Menggunakan `tesseract.js` worker di browser dengan progress bar loading model yang transparan.

#### `FR-ACAD-05: Citation & Daftar Pustaka Formatter`
* **Deskripsi:** Generator sitasi cepat untuk tugas paper/makalah harian.
* **Fitur Utama:**
  * Input manual atau parsing cepat berbasis DOI / URL / Judul.
  * Format standar yang didukung: APA 7th, IEEE, Harvard, dan MLA.
  * Tombol 1-Click Copy dengan format *italic* yang benar.

#### `FR-ACAD-06: Kalkulator & Target IPK/IPS Simulator`
* **Deskripsi:** Simulasi perhitungan indeks prestasi semester dan target kumulatif.
* **Fitur Utama:**
  * Input daftar mata kuliah, bobot SKS, dan grade huruf (A, AB, B, BC, C, D, E).
  * Mode "Target Simulator": Menghitung minimal nilai yang harus diraih di sisa SKS semester berjalan untuk mencapai target IPK impian.
  * Penyimpanan riwayat semester di penyimpanan lokal (IndexedDB/LocalStorage).

---

### Modul B: Campus Event & Organization Suite

#### `FR-EVENT-01: Twibbon Campaign Creator`
* **Deskripsi:** Generator twibbon online untuk event kepanitiaan, ospek, dan perayaan organisasi.
* **Fitur Utama:**
  * **Mode Peserta:** Upload foto profil $\rightarrow$ Drag, pinch-to-zoom, dan rotate foto di dalam bingkai transparan $\rightarrow$ Download hasil resolusi tinggi (PNG/JPG).
  * **Mode Kreator/Panitia:** Upload bingkai PNG transparan $\rightarrow$ Generate link share khusus dengan preset frame aktif.
* **Kriteria Penerimaan (AC):** Canvas rendering berjalan mulus di layar smartphone (touch gesture supported).

#### `FR-EVENT-02: Bulk E-Sertifikat Generator`
* **Deskripsi:** Pembuatan ratusan sertifikat panitia/peserta event secara otomatis dari file spreadsheet.
* **Fitur Utama:**
  * Upload template sertifikat gambar (JPG/PNG) atau PDF.
  * Visual drag-and-drop placeholder: Tentukan koordinat posisi Nama, Nomor Sertifikat, dan Peran.
  * Upload file CSV / Excel data peserta.
  * Batch processing di browser $\rightarrow$ Unduh semua sertifikat dalam 1 file `.ZIP` terorganisir.
* **Kriteria Penerimaan (AC):** Mampu memproses 200 data sertifikat dalam waktu $< 15$ detik tanpa crash memori browser.

#### `FR-EVENT-03: Instagram Grid Post Maker`
* **Deskripsi:** Memotong poster promosi menjadi format puzzle feed Instagram.
* **Fitur Utama:**
  * Pilihan grid: $3 \times 1$ (carousel banner horizontal), $3 \times 2$ (6 kotak), dan $3 \times 3$ (9 kotak puzzle).
  * Preview visual nomor urut posting (1 sampai 9) agar panitia tidak salah urutan saat upload ke Instagram.
  * Download otomatis paket gambar terpotong dalam format ZIP dengan penamaan urut (`post_1.png`, `post_2.png`, dst).

#### `FR-EVENT-04: Custom QR Code Generator`
* **Deskripsi:** Pembuat QR Code presensi dan link materi event.
* **Fitur Utama:**
  * Input URL, Teks, atau WiFi config.
  * Kustomisasi warna, sudut border, dan penambahan Logo/Ikon di tengah QR Code (misal: Logo HMIT / Logo Event).
  * Export vektor SVG dan raster PNG resolusi tinggi.

---

### Modul C: Media & Utility Tools

#### `FR-MEDIA-01: In-Browser Media & Audio Converter`
* **Deskripsi:** Konversi format berkas audio dan dokumen ringan secara lokal.
* **Fitur Utama:**
  * Ekstrak audio dari video (MP4 to MP3/WAV).
  * Konversi gambar (PNG $\leftrightarrow$ JPG $\leftrightarrow$ WebP).
  * Konversi dokumen (Markdown $\leftrightarrow$ HTML $\leftrightarrow$ Plain Text).
* **Kriteria Penerimaan (AC):** Menggunakan Web Worker dan WebAssembly (FFmpeg WASM) untuk mencegah UI freeze saat memproses file audio/video.

---

## 4. Non-Functional Requirements (NFR)

| Aspek | Standar / Target | Rincian Teknis |
| :--- | :--- | :--- |
| **Keamanan & Privasi** | 100% Zero Data Leakage | Seluruh pemrosesan dokumen/file terjadi di memori browser lokal (RAM user). Tidak ada upload payload file ke server eksternal. |
| **Performa (Lighthouse)** | Skor $\ge 90$ | Lazy loading pada komponen berat (Tesseract WASM, FFmpeg WASM hanya dimuat saat tool terkait dibuka). |
| **Kompatibilitas** | Cross-Platform & Mobile First | Responsif penuh untuk Android Chrome, iOS Safari, macOS, Windows, dan Linux. |
| **Offline Capability** | PWA Support | Service worker untuk caching shell aplikasi sehingga tool dasar tetap bisa dibuka tanpa koneksi internet. |
| **Biaya Operasional** | **Rp 0 / Bulan** | Arsitektur statis di-host pada Cloudflare Pages dengan *unlimited bandwidth*. |

---

## 5. Navigasi & Struktur UI/UX (Information Architecture)

```
[ HMITools Header: Logo HMIT + Search Tool Bar + Dark/Light Mode Toggle ]
│
├── 🏠 Dashboard / Home (Katalog Tool dengan Kategori & Pencarian Cepat)
│
├── 📚 Kategori: Akademik & Skripsi
│   ├── CV ATS Builder
│   ├── PDF Toolkit (Merge, Split, Watermark)
│   ├── Dokumen & PDF Compressor
│   ├── OCR Catatan & Slide
│   ├── Citation Formatter
│   └── Kalkulator & Target IPK
│
├── 🎪 Kategori: Event & Organisasi
│   ├── Twibbon Campaign Maker
│   ├── Bulk E-Sertifikat Generator
│   ├── Instagram Grid 3x3 Maker
│   └── Custom QR Code Generator
│
└── 🎞️ Kategori: Media & Converter
    └── In-Browser Audio/Image Converter
```

---

## 6. Rencana Tahapan Rilis (Milestones)

* **Fase 1: MVP Core Launch (Prioritas Utama):**
  * Setup arsitektur project (React + Vite + Tailwind + shadcn/ui + Cloudflare Pages).
  * Rilis Twibbon Maker, CV ATS Builder, PDF Toolkit (Merge/Split/Watermark), dan Instagram Grid Maker.
* **Fase 2: Academic Power Tools:**
  * Rilis Bulk E-Sertifikat Generator, OCR Slide Kuliah (Tesseract.js), dan Kalkulator Target IPK.
* **Fase 3: Media & Advanced Converter:**
  * Rilis In-Browser Audio/Video Converter (FFmpeg WASM) dan PWA Offline Installable.
