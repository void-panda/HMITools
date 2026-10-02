---
title: HMITools System Architecture Blueprint
status: draft
date: 2026-10-02
project_type: "Astro Islands Architecture (MPA + React Client Islands)"
target_hosting: "Cloudflare Pages (Zero Cost / Unlimited Bandwidth)"
---

# ARCHITECTURE.md — HMITools Technical Architecture Blueprint (Astro Edition)

## 1. Architecture Overview & Core Invariants

**HMITools** dibangun di atas **Astro Islands Architecture** dengan integrasi **React + Tailwind CSS + shadcn/ui**. 

Pendekatan ini memberikan dua keuntungan besar sekaligus:
1. **Zero-JS Static Shell & Perfect SEO:** Halaman katalog, landing page, navigasi, dan footer di-render sebagai HTML murni tanpa *overhead* JavaScript (skor Lighthouse SEO & Performa 100).
2. **Isolated Interactive Islands:** Setiap tool interaktif (CV Builder, Twibbon Canvas, PDF Toolkit, Bulk Sertifikat) dimuat sebagai komponen React mandiri menggunakan direktif `client:load` atau `client:only="react"`.

### 1.1 Invarian Arsitektur
1. **Zero Server Payload:** Tidak ada file dokumen, foto, atau data mahasiswa yang dikirim ke server backend (*100% Privacy by Design*).
2. **Client-Only WASM Processing:** Modul berat (Tesseract.js, FFmpeg WASM, Canvas, PDF-lib) dimuat secara eksklusif di sisi client menggunakan `client:only="react"` untuk menghindari error SSR/Node hydration.
3. **Automatic Granular Code Splitting:** Astro hanya mengunduh bundle JavaScript untuk tool yang sedang dibuka pengguna di halaman tersebut.
4. **Static Site Generation (SSG):** Seluruh rute di-*generate* saat build menjadi file HTML/CSS/JS statis murni yang di-host di Cloudflare Pages.

---

## 2. Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HMITOOLS APPLICATION STACK                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Meta-Framework   : Astro v5 / v4 (Static Output: 'static')           │
│ • Island Framework : React 19 / 18 via @astrojs/react                  │
│ • Styling & Design : Tailwind CSS + shadcn/ui + tweakcn Theme Tokens   │
│ • Icons            : Lucide React                                      │
│ • State & Storage  : Zustand + Dexie.js (IndexedDB) + localStorage     │
├────────────────────────────────────────────────────────────────────────┤
│                       PROCESSING ENGINES (CLIENT)                      │
│ • PDF Engine       : pdf-lib + @react-pdf/renderer + pdfjs-dist        │
│ • Canvas & Graphics: HTML5 Canvas API + Konva.js / Fabric.js           │
│ • File Archiver    : JSZip + FileSaver.js                              │
│ • Spreadsheet Parse: PapaParse (CSV / Excel)                           │
│ • In-Browser OCR   : Tesseract.js (WebAssembly)                        │
│ • Media Converter  : @ffmpeg/ffmpeg (WebAssembly)                      │
│ • Image Optimizer  : browser-image-compression                         │
├────────────────────────────────────────────────────────────────────────┤
│                       DEPLOYMENT & INFRASTRUCTURE                      │
│ • Hosting & CDN    : Cloudflare Pages (Free Tier / Unlimited Bandwidth)│
│ • Edge Headers     : Cross-Origin Isolation (COOP / COEP) via _headers │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure (Astro + React Islands)

```
HMITools/
├── public/
│   ├── _headers                  # Cloudflare Pages COOP/COEP headers for WASM
│   ├── favicon.ico
│   └── templates/                # Default templates (Twibbon/Certificate)
├── src/
│   ├── assets/                   # Logos, brand assets
│   ├── components/
│   │   ├── astro/                # Pure Static Astro Components (0 KB JS)
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── ToolCard.astro
│   │   └── ui/                   # React shadcn/ui primitive components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── features/                 # React Interactive Islands
│   │   ├── cv-builder/           # CV ATS Builder React Island
│   │   │   └── CVBuilderIsland.tsx
│   │   ├── twibbon/              # Twibbon Campaign Maker Island
│   │   │   └── TwibbonIsland.tsx
│   │   ├── pdf-tools/            # PDF Merge/Split/Watermark/Compress Island
│   │   │   └── PDFToolsIsland.tsx
│   │   ├── certificate/          # Bulk E-Sertifikat Island
│   │   │   └── CertificateIsland.tsx
│   │   ├── ig-grid/              # Instagram Grid Maker Island
│   │   │   └── IGGridIsland.tsx
│   │   └── utilities/            # OCR, Citation, IPK Simulator Islands
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Global HTML Shell, SEO, tweakcn theme CSS
│   │   └── ToolLayout.astro      # Layout khusus halaman workspace tool
│   ├── lib/
│   │   ├── utils.ts              # cn helper
│   │   └── db.ts                 # IndexedDB / local-first storage
│   ├── pages/                    # Astro File-based Routing
│   │   ├── index.astro           # Homepage & Katalog Tools
│   │   ├── tools/
│   │   │   ├── cv-builder.astro
│   │   │   ├── twibbon.astro
│   │   │   ├── pdf-tools.astro
│   │   │   ├── certificate.astro
│   │   │   ├── ig-grid.astro
│   │   │   └── utilities.astro
│   │   └── 404.astro
│   └── styles/
│       └── global.css            # tweakcn CSS variables & Tailwind directives
├── astro.config.mjs              # Astro configuration with @astrojs/react & tailwind
├── .mcp.json                     # shadcn MCP Server config
├── package.json
├── tailwind.config.cjs
└── tsconfig.json
```

---

## 4. Pola Integrasi Island & Client Directives

Setiap halaman tool di dalam folder `src/pages/tools/*.astro` membungkus komponen React dengan direktif client yang sesuai:

```astro
---
// Contoh: src/pages/tools/twibbon.astro
import ToolLayout from '@/layouts/ToolLayout.astro';
import { TwibbonIsland } from '@/features/twibbon/TwibbonIsland';
---

<ToolLayout 
  title="Twibbon Campaign Maker — HMITools" 
  description="Pasang twibbon event dan kepanitiaan kampus instan tanpa watermark."
>
  <!-- client:only="react" memastikan modul Canvas/Browser API tidak dieksekusi di server build -->
  <TwibbonIsland client:only="react" />
</ToolLayout>
```

### Panduan Client Directives:
* `client:only="react"`: Digunakan untuk tool dengan dependensi berat terhadap browser API / WebAssembly (Canvas, PDF-lib, Tesseract, FFmpeg).
* `client:idle`: Digunakan untuk komponen interaktif sekunder (misal: Global Search Modal `Cmd+K` atau Theme Toggle).
* `client:visible`: Digunakan untuk komponen yang baru aktif saat di-scroll ke viewport.

---

## 5. Deployment & Cloudflare Header Configuration

File `public/_headers` memastikan browser mengaktifkan `SharedArrayBuffer` yang dibutuhkan oleh WebAssembly:

```http
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Access-Control-Allow-Origin: *
```

---

## 6. Keuntungan Arsitektur Astro untuk HMITools

| Parameter | React SPA Tradisional | Astro + React Islands |
| :--- | :--- | :--- |
| **Initial JS Payload (Homepage)** | ~250 KB - 400 KB | **~0 KB (Pure Static HTML/CSS)** |
| **SEO & Social Share (OpenGraph)** | Perlu prerender khusus | **Native Out-of-the-Box** (tiap tool punya meta tag unik) |
| **Pemisahan Bundle per Tool** | Perlu manual `React.lazy` | **Otomatis per halaman `.astro`** |
| **Dukungan shadcn/ui** | Penuh | **Penuh** (di dalam React Islands) |
| **Hosting Cost** | Rp 0 (Cloudflare Pages) | **Rp 0 (Cloudflare Pages)** |

---

## 7. React 19 Patterns & Clean Code Invariants (react-patterns)

Mengikuti standar performa **React 19 + Vite + Cloudflare**, seluruh komponen React Island wajib mematuhi aturan berikut:

### 7.1 Anti-Waterfall & Asynchronous Loading (CRITICAL)
* **No Sequential Await:** Gunakan `Promise.all([loadA(), loadB()])` saat membaca file / buffer secara paralel.
* **On-Demand Dynamic Imports:** Library berat (`pdf-lib`, `tesseract.js`, `@ffmpeg/ffmpeg`, `jszip`, `papaparse`) **dilarang** di-import di tingkat atas file (top-level import). Wajib menggunakan dynamic `await import(...)` hanya saat tombol aksi ditekan.
* **No Fetch in Child Cascades:** Hoist state ke ancestor terdekat.

### 7.2 Zero-Bloat Bundle & Direct Imports (CRITICAL)
* **Direct UI Imports:** Gunakan `import { Button } from "@/components/ui/button"` (bukan barrel import `@/components`).
* **Explicit Icon Imports:** Import hanya icon spesifik dari `lucide-react` (misal: `import { FileText, Sparkles } from "lucide-react"`).

### 7.3 Composition Over Boolean Props (HIGH)
* **Compound Pattern:** Gunakan komposisi slot dan `children` (seperti `<DialogContent>`, `<CardHeader>`), hindari membuat komponen dengan $> 5$ boolean prop (`isCompact`, `showBorder`, `hasIcon`, dll).
* **No Inline Subcomponents:** Jangan mendefinisikan fungsi komponen di dalam fungsi komponen lain (mencegah remounting tak perlu).

### 7.4 Re-render & State Discipline (MEDIUM)
* **Derived State During Render:** Hitung filtered/derived data menggunakan `useMemo` saat render — **dilarang** menggunakan `useEffect` hanya untuk memanggil `setState(filteredData)`.
* **Transient State with Ref:** Gunakan `useRef` untuk koordinat canvas/drag yang berubah 60 FPS tanpa perlu memicu re-render seluruh form React.
* **Safe Conditional Rendering:** Hindari `{count && <Component />}`, gunakan `{count > 0 ? <Component /> : null}` untuk mencegah render angka `0` di UI.

---

## 8. Quality Gates & Engineering Standards

1. **Strict TypeScript:** `noImplicitAny: true`, `strict: true`. Semua model data (Data CV, Peserta Sertifikat, Parameter PDF) memiliki type definition yang jelas.
2. **Accessibility (a11y):** Semua tombol dan form input harus lulus standar ARIA dan kontras warna WCAG 2.2 AA.
3. **Bundle Optimization:**
   * Dynamic import untuk pustaka berat (`import('pdf-lib')`, `import('tesseract.js')`, `import('@ffmpeg/ffmpeg')`).
   * Tree-shaking optimal via Vite + Rollup.
