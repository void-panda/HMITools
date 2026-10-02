---
title: HMITools Design System Specification
status: draft
date: 2026-10-02
theme_source: "https://tweakcn.com/themes/cmuqwbqb8000004jp11z0enbc"
ui_framework: "Astro + React Islands + Tailwind CSS + shadcn/ui"
---

# DESIGN.md — Visual Identity & Design Tokens for HMITools

## 1. Brand & Style

### 1.1 Brand Essence
**HMITools** adalah utilitas digital modern, presisi, dan andal untuk komunitas mahasiswa dan kepanitiaan kampus. Desainnya mengadopsi estetika *SaaS Pro Minimalist* yang bersih, berfokus pada konten (*content-first*), dengan tipografi tajam dan hierarki visual yang jelas.

* **Personality:** Efisien, Modern, Akademis, Terpercaya (*No-nonsense, Zero-bloat*).
* **Atmosphere:** Bersih, fokus pada kecepatan dan kejelasan fungsi tanpa distraksi dekorasi berlebihan.

---

## 2. Design Tokens & Colors (tweakcn Theme Tokens)

Tema ini mengadopsi palet `oklch` modern dari tweakcn dengan kontras tinggi, aksen netral monokromatik berpadu dengan *slate/indigo* yang elegan.

### 2.1 Light Theme Tokens
```css
:root {
  --background: oklch(1 0 0);                 /* #FFFFFF */
  --foreground: oklch(0.145 0 0);             /* #1F1F1F */
  --card: oklch(1 0 0);                       /* #FFFFFF */
  --card-foreground: oklch(0.145 0 0);        /* #1F1F1F */
  --popover: oklch(1 0 0);                    /* #FFFFFF */
  --popover-foreground: oklch(0.145 0 0);     /* #1F1F1F */
  --primary: oklch(0.205 0 0);                /* Deep Charcoal/Black */
  --primary-foreground: oklch(0.985 0 0);     /* Pure White */
  --secondary: oklch(0.97 0 0);               /* Soft Neutral Gray */
  --secondary-foreground: oklch(0.205 0 0);   /* Dark Neutral */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);       /* Subtitle & Helper text */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);  /* Clean Crimson Red */
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.922 0 0);                 /* Crisp Subtle Border */
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;                         /* 10px - Smooth Modern Radius */
}
```

### 2.2 Dark Theme Tokens
```css
.dark {
  --background: oklch(0.145 0 0);             /* Deep Dark Slate */
  --foreground: oklch(0.985 0 0);             /* Crisp Light Text */
  --card: oklch(0.205 0 0);                   /* Dark Elevated Surface */
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.269 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);                /* Bright White/Off-White */
  --primary-foreground: oklch(0.205 0 0);     /* Dark Text on Primary */
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.275 0 0);                 /* Subtle Dark Border */
  --input: oklch(0.325 0 0);
  --ring: oklch(0.556 0 0);
  --radius: 0.625rem;
}
```

---

## 3. Typography

* **Font Family:** `Inter`, `Plus Jakarta Sans`, atau `ui-sans-serif, system-ui` (Modern geometric sans).
* **Font Mono:** `JetBrains Mono` atau `ui-monospace` (untuk kode DOI, data tabel IPK, dan info teknis).
* **Hierarchy Scale:**
  * **Hero Title (Display):** `text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight`
  * **Section Heading:** `text-2xl font-bold tracking-tight`
  * **Card / Tool Title:** `text-lg font-semibold`
  * **Body Text:** `text-sm sm:text-base leading-relaxed text-muted-foreground`
  * **Microcopy & Badges:** `text-xs font-medium tracking-wide uppercase`

---

## 4. Layout & Spacing

* **Container Max-Width:** `max-w-7xl` untuk grid katalog dashboard, `max-w-4xl` untuk form workspace tool tunggal.
* **Base Spacing Grid:** 4px scale (`p-4`, `p-6`, `gap-4`, `gap-6`, `space-y-6`).
* **Grid Layouts:**
  * Dashboard Tools: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6`
  * Tool Workspace: 2-column layout pada desktop (`grid grid-cols-1 lg:grid-cols-12 gap-8` dengan rasio 5:7 atau 6:6 untuk Form vs Live Preview).

---

## 5. Elevation & Shapes

* **Corner Radius:** `--radius: 0.625rem` (10px) pada Cards, Buttons, Inputs, dan Modals.
* **Borders:** `1px solid var(--border)` di setiap card dan container untuk memberikan struktur yang rapi dan tegas.
* **Shadows:** Subtil dan halus (`shadow-xs` / `shadow-sm`), menghindari shadow tebal/berbayang kotor.

---

## 6. Components (shadcn/ui Standards)

1. **Header & Navigation:**
   * Logo HMITools dengan badge *"Student Toolkit"*.
   * Instant Tool Search bar (`Cmd+K` / `Ctrl+K` command menu).
   * Dark / Light mode toggle switch.
2. **Tool Card Component:**
   * Icon kategori yang bersih (Lucide Icons).
   * Tag kategori (*Akademik*, *Organisasi*, *Media*).
   * Judul & Deskripsi 2 baris yang padat.
   * Status badge (*"Client-Side"*, *"Offline Ready"*).
3. **Workspace Canvas & Preview:**
   * Area interaktif berlatar belakang grid/transparency pattern halus untuk Twibbon & Grid Maker.
   * Live PDF Viewer / Sheet untuk CV ATS dan Sertifikat.
4. **Action Buttons:**
   * Primary Button: Solid dengan `bg-primary text-primary-foreground` dan hover state halus.
   * Dropzone Upload: Border dashed `border-2 border-dashed border-border hover:border-primary/50` dengan drag-and-drop feedback.

---

## 7. Do's and Don'ts

| Do's (Disarankan) | Don'ts (Hindari) |
| :--- | :--- |
| ✅ Gunakan badge "100% Private (No Upload)" untuk membangun kepercayaan pengguna. | ❌ Jangan tampilkan banner iklan mengganggu atau popup pendaftaran paksa. |
| ✅ Berikan progress bar / loading skeleton saat memuat modul WebAssembly (Tesseract/FFmpeg). | ❌ Jangan biarkan halaman membeku (*UI freeze*) tanpa indikator proses yang jelas. |
| ✅ Terapkan live-preview instan di sisi kanan saat user mengisi form CV/Twibbon. | ❌ Jangan paksa user menekan tombol "Generate" berulang kali hanya untuk melihat perubahan kecil. |
| ✅ Desain mobile-first dengan kontrol sentuh (*touch gestures*) untuk Twibbon (pan, pinch-to-zoom). | ❌ Jangan gunakan kontrol desktop-only yang menyulitkan pengguna smartphone. |
