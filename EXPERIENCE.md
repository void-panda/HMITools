---
title: HMITools UX & Interaction Experience Specification
status: draft
date: 2026-10-02
visual_reference: "DESIGN.md"
---

# EXPERIENCE.md — UX Architecture & Interaction Flows for HMITools

## 1. Foundation & Design Principles

* **UI System:** React + Tailwind CSS + shadcn/ui components.
* **Core Mental Model:** *"Pick a tool $\rightarrow$ Drop files / Fill form $\rightarrow$ Live instant preview $\rightarrow$ 1-Click Download"*.
* **Zero Friction:** Tidak ada registrasi akun, tidak ada onboarding yang panjang. Pengguna langsung mendarat pada utilitas yang mereka cari.
* **Guaranteed Privacy:** Di setiap tool pemrosesan berkas, tampilkan badge transparan: `🔒 100% diproses di browser Anda (Tanpa upload ke server)`.

---

## 2. Information Architecture (IA)

```
[ Top Navigation Bar: Brand Logo + Global Command Search (Ctrl+K) + GitHub Link + Theme Toggle ]
│
├── 📍 View 1: Main Dashboard (/ or /tools)
│   ├── Hero Search & Quick Filters (All, Akademik, Organisasi, Media)
│   ├── Grid Katalog 10+ Tools (Cards dengan status tag & icon)
│   └── Footer (HMIT Identity & Open Source credits)
│
├── 📍 View 2: CV ATS Builder (/cv-builder)
│   ├── Left Column: Multi-tab Form (Personal Info, Education, Experience, Skills, Projects)
│   └── Right Column: Sticky Real-time ATS Preview + Download PDF (Vector) Button
│
├── 📍 View 3: Twibbon Campaign Maker (/twibbon)
│   ├── Dropzone 1: Upload Frame (PNG Transparan)
│   ├── Dropzone 2: Upload Foto Pribadi
│   ├── Interactive Canvas: Touch-friendly Drag, Pinch-to-zoom, Rotate slider
│   └── Export Bar: Resolusi (1080x1080 / 2048x2048) + Download PNG/JPG
│
├── 📍 View 4: PDF Toolkit (/pdf-tools)
│   ├── Sub-tabs: Merge PDF | Split & Extract | Watermark
│   ├── Drag-and-Drop Reorderable File List (react-beautiful-dnd / dnd-kit)
│   └── Process & Download PDF
│
├── 📍 View 5: Bulk E-Sertifikat Generator (/certificate-generator)
│   ├── Step 1: Upload Template Gambar/PDF Sertifikat
│   ├── Step 2: Visual Canvas Marker (Posisikan kotak Nama, No Sertifikat, Font, Ukuran)
│   ├── Step 3: Upload Spreadsheet CSV/Excel
│   └── Step 4: Batch Progress Bar $\rightarrow$ Download ZIP
│
├── 📍 View 6: Instagram Grid Maker (/instagram-grid)
│   ├── Upload Poster Event $\rightarrow$ Pilih Rasio (3x1, 3x2, 3x3) $\rightarrow$ Preview Urutan Pos $\rightarrow$ Download ZIP
│
└── 📍 View 7: Academic Utilities (/utilities)
    ├── Tab 1: OCR Catatan & Slide (Tesseract WASM)
    ├── Tab 2: Citation & Daftar Pustaka Generator (APA, IEEE, Harvard)
    ├── Tab 3: Kalkulator & Target IPK Simulator
    └── Tab 4: In-Browser Audio/Video Converter (FFmpeg WASM)
```

---

## 3. Voice & Tone (Microcopy Guidelines)

* **Bahasa:** Bahasa Indonesia baku modern, ramah, dan ringkas.
* **Contoh Pesan Sukses:**
  * *"Selesai! 150 sertifikat berhasil dibuat dalam 3.2 detik."*
  * *"PDF berhasil digabungkan tanpa mengurangi resolusi."*
* **Contoh Error Handling (Actionable & Empathetic):**
  * Format salah: *"Format file tidak didukung. Harap gunakan file PNG transparan untuk bingkai Twibbon."*
  * Ukuran melebihi batas RAM browser: *"File video terlalu besar untuk diproses di memori browser. Coba gunakan file di bawah 200MB."*

---

## 4. Component Patterns & Interaction States

### 4.1 Dropzone & File Upload Component
* **Default State:** Border putus-putus (*dashed*), ikon upload, instruksi: *"Tarik & lepas file ke sini, atau klik untuk memilih"*.
* **Drag-Over State:** Border berubah menjadi warna `primary`, latar belakang `accent/50`, scale `1.01` dengan animasi halus.
* **Loading / Processing State:** Skeleton pulse atau Circular progress bar dengan persentase dan estimasi sisa waktu.
* **Success State:** File thumbnail + nama file + ukuran + tombol ganti/hapus.

### 4.2 Split Screen / Workspace Layout (Desktop vs Mobile)
* **Desktop ($\ge 1024px$):** Dua kolom berdampingan (*Side-by-Side*). Kolom kiri untuk input/pengaturan, kolom kanan *sticky* untuk preview langsung.
* **Mobile ($< 1024px$):** Tampilan bertingkat (*Stacked*) atau Tab switch antara *"Edit"* dan *"Preview"*, dengan tombol aksi utama (*Download*) tetap *sticky* di bagian bawah layar (*floating bottom bar*).

---

## 5. Key User Flows (Journeys)

### Journey 1: Nabila Membuat 300 Sertifikat Webinar HMIT
1. Nabila membuka `/certificate-generator`.
2. Menarik template sertifikat `.png` ke dropzone.
3. Menyeret kotak nama ke posisi tengah sertifikat, memilih font *"Playfair Display"*, ukuran 36pt, warna hitam.
4. Menyeret file `peserta-webinar.csv` yang berisi kolom `Nama` dan `Email`.
5. Menekan tombol **"Generate 300 Sertifikat"**.
6. Progress bar menampilkan: *"Memproses: 124 / 300..."* (selesai dalam 6 detik).
7. Muncul tombol hijau: **"Download Semua (.ZIP - 45 MB)"**.

### Journey 2: Rizky Merapikan Skripsi & Mengompres PDF di Bawah 2MB
1. Rizky membuka `/pdf-tools`.
2. Memilih tab **"Merge & Compress"**.
3. Memasukkan file `Cover.pdf`, `Bab1-Bab5.pdf`, dan `Lampiran.pdf`.
4. Menyeret urutan file agar urutannya pas.
5. Mengaktifkan toggle **"Kompres Output PDF (Target < 2MB)"**.
6. Menekan tombol **"Gabung & Unduh PDF"**.
7. File `Skripsi_Final_Compressed.pdf` langsung terunduh, ukuran dari 8.4MB menjadi 1.7MB.

---

## 6. Accessibility & Performance Floor (WCAG 2.2 AA)

* **Contrast Ratio:** Teks terhadap background minimal 4.5:1 pada kedua mode (Light & Dark).
* **Keyboard Navigation:** Semua form, tombol download, dan dialog dapat diakses penuh dengan `Tab`, `Enter`, dan `Esc`.
* **Mobile Touch Targets:** Semua tombol interaktif memiliki ukuran minimal $44 \times 44$ px untuk kenyamanan sentuhan jari di smartphone.
* **Lazy Loading Heavy Modules:** Library WASM (`tesseract.js` ~15MB dan `@ffmpeg/ffmpeg` ~25MB) hanya diunduh saat pengguna secara spesifik membuka tab OCR atau Converter.
