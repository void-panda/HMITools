# HMITools: All-in-One Student & Campus Toolkit

> Platform utilitas digital terbuka, cepat, bebas biaya, dan 100% diproses di sisi klien (*client-side*) untuk menunjang aktivitas akademik, kepanitiaan acara, dan produktivitas mahasiswa.

![Astro](https://img.shields.io/badge/Astro-v5-bc52ee?style=flat-square&logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Zero%20Data%20Leak-green?style=flat-square)

---

## 📌 Latar Belakang & Filosofi

Nama **HMITools** berakar dari **HMIT (Himpunan Mahasiswa Teknologi Informasi)** dan *Tools*. Proyek ini diprakarsai serta ditadahi secara resmi di bawah naungan HMIT untuk menyelesaikan tantangan harian yang dihadapi mahasiswa:

- **Tanpa Server Eksternal (100% Client-Side):** Seluruh pemrosesan dokumen (PDF, foto identitas, CV, audio) dieksekusi langsung di memori RAM peramban menggunakan WebAssembly dan HTML5 Canvas. Berkas pribadi Anda tidak pernah diunggah ke internet.
- **Bebas Kuota & Watermark:** Tidak ada batasan harian tiruan, tidak ada watermark paksa pada hasil ekspor, dan bebas dari iklan intervensi.
- **Biaya Operasional Rp 0:** Berjalan sebagai aplikasi statis murni yang siap di-deploy pada Cloudflare Pages dengan *unlimited bandwidth*.

---

## 🛠️ Daftar Fitur & Utilitas

### 1. Kategori Kepanitiaan & Event Organisasi
- **Twibbon Campaign Maker (`/tools/twibbon`):** Generator twibbon dengan kontrol zoom, rotasi, geser interaktif (touch/drag), dan pembuatan tautan kampanye berbasis UUID.
- **Bulk E-Sertifikat Generator (`/tools/certificate`):** Menghasilkan ratusan sertifikat panitia/peserta otomatis dari file template dan spreadsheet CSV dalam satu paket ZIP.
- **Instagram Grid Post Maker (`/tools/ig-grid`):** Memotong gambar menjadi format puzzle feed Instagram (3x1, 3x2, 3x3) lengkap dengan penomoran urut unggah.
- **Custom QR Code Generator (`/tools/qr-code`):** Membuat QR code presensi dan tautan materi dengan kustomisasi warna, sudut border, dan logo kustom di tengah.

### 2. Kategori Akademik & Riset
- **CV ATS Builder (`/tools/cv-builder`):** Editor Curriculum Vitae berformat single-column ramah parser ATS dengan pratinjau langsung dan ekspor ke format PDF vektor asli.
- **Kalkulator & Target IPK (`/tools/ipk-calculator`):** Menghitung IPS semester dan mensimulasikan nilai minimal yang harus diraih pada sisa SKS untuk mencapai target IPK kelulusan.
- **Citation & Daftar Pustaka (`/tools/citation`):** Format sitasi ilmiah instan (APA 7th, IEEE, Harvard, BibTeX) dengan tombol salin satu klik.
- **OCR Catatan & Slide Kuliah (`/tools/ocr`):** Ekstraksi teks dari foto papan tulis atau tangkapan layar presentasi menggunakan Tesseract.js WebAssembly (Bahasa Indonesia & Inggris).

### 3. Kategori Dokumen & Media
- **PDF Toolkit (`/tools/pdf-tools`):** Gabung (Merge) beberapa PDF dengan urutan kustom, pisah (Split) rentang halaman tertentu, dan bubuhkan teks cap air (Watermark).
- **Media & Document Compressor (`/tools/compressor`):** Kompresi batch gambar (JPG, PNG, WebP) dan dokumen PDF dengan laporan persentase penghematan ukuran.
- **In-Browser Media Converter (`/tools/media-converter`):** Ekstraksi audio rekaman kuliah (MP4 ke WAV PCM via Web Audio API) dan konversi format gambar tanpa ketergantungan server.
- **Pas Foto Background Remover (`/tools/bg-remover`):** Segmentasi warna latar belakang pas foto untuk kebutuhan ganti background biru/merah.
- **Image Watermark Remover (`/tools/wm-remover`):** Penghapusan stempel air pada gambar menggunakan algoritma kuas inpainting lokal.

---

## 🏗️ Arsitektur Teknologi

```
HMITools/
├── public/                       # Static assets, SVG logos, & Cloudflare _headers
├── src/
│   ├── components/
│   │   ├── astro/                # Pure static Astro components (Header, Footer, Logo)
│   │   └── ui/                   # Primitif UI (Button, Input, Tabs, Slider, Dialog)
│   ├── features/                 # React Interactive Islands (client:load)
│   │   ├── certificate/          # Bulk Certificate Island
│   │   ├── cv-builder/           # ATS Resume Island
│   │   ├── dashboard/            # Catalog Island & Instant Filter
│   │   ├── ig-grid/              # Instagram Grid Puzzle Island
│   │   ├── pdf-tools/            # PDF-lib Engine Island
│   │   ├── qr-code/              # QRCode Canvas Island
│   │   ├── twibbon/              # Twibbon HTML5 Canvas Island
│   │   └── utilities/            # OCR, Compressor, Converter, IPK, Citation
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Global shell, Dark/Light mode theme script
│   │   └── ToolLayout.astro      # Workspace layout & global reset action
│   ├── pages/                    # Astro file-based routing
│   └── styles/                   # Tailwind CSS v4 & OKLCH design tokens
├── ARCHITECTURE.md               # Spesifikasi arsitektur teknis
└── PRD.md                        # Product Requirement Document
```

---

## 🚀 Memulai Proyek Secara Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 20.x atau lebih baru
- `npm` atau `pnpm`

### Instalasi & Menjalankan Dev Server

1. **Clone repository:**
   ```bash
   git clone https://github.com/void-panda/HMITools.git
   cd HMITools
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:4321` di browser Anda.

4. **Build untuk produksi:**
   ```bash
   npm run build
   ```
   File statis siap saji akan dibuat di dalam folder `dist/`.

---

## 🌐 Panduan Deployment (Cloudflare Pages)

1. Hubungkan repository GitHub ke **Cloudflare Dashboard** $\rightarrow$ **Workers & Pages** $\rightarrow$ **Pages**.
2. Konfigurasi build:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. File `public/_headers` akan secara otomatis menyertakan header isolasi keamanan (*Cross-Origin Opener Policy* & *Cross-Origin Embedder Policy*) untuk akselerasi modul WebAssembly di browser.

---

## 👥 Pengembang & Kontribusi

- **Inisiatif & Naungan:** Himpunan Mahasiswa Teknologi Informasi (HMIT)
- **Lead Developer:** [@void-panda](https://github.com/void-panda)

Kontribusi berupa pelaporan kendala (*issues*), usulan fitur baru, maupun *pull request* sangat terbuka.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
