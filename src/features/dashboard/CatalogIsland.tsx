import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Files,
  ScanText,
  Calculator,
  Bookmark,
  Sparkles,
  Award,
  Grid,
  QrCode,
  Minimize2,
  Music,
  Layers,
  Eraser,
  Search,
  ArrowRight,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ToolItem {
  id: string;
  title: string;
  shortCode: string;
  tagline: string;
  description: string;
  category: 'academic' | 'organization' | 'media';
  categoryLabel: string;
  href: string;
  iconName: string;
  engine: 'WASM' | 'Canvas' | 'PDF-Lib' | 'WebAudio' | 'Local';
  badge?: string;
  popularFor: string;
}

const ALL_TOOLS: ToolItem[] = [
  // Academic Tools
  {
    id: 'cv-builder',
    title: 'CV ATS Builder',
    shortCode: 'CV-01',
    tagline: 'Format Resume ATS Standar',
    description: 'Buat CV satu kolom yang ramah sistem ATS dengan pratinjau langsung dan ekspor PDF vektor.',
    category: 'academic',
    categoryLabel: 'Akademik & Karir',
    href: '/tools/cv-builder',
    iconName: 'FileText',
    engine: 'PDF-Lib',
    badge: 'Populer',
    popularFor: 'Magang / Kerja',
  },
  {
    id: 'pdf-tools',
    title: 'PDF Toolkit (Merge & Split)',
    shortCode: 'PDF-02',
    tagline: 'Gabung & Pisah Halaman PDF',
    description: 'Gabungkan lampiran tugas, lembar pengesahan, atau ekstrak rentang halaman tertentu.',
    category: 'academic',
    categoryLabel: 'Akademik & Karir',
    href: '/tools/pdf-tools',
    iconName: 'Files',
    engine: 'PDF-Lib',
    badge: 'Skripsi',
    popularFor: 'Tugas & Skripsi',
  },
  {
    id: 'compressor',
    title: 'Dokumen & Media Compressor',
    shortCode: 'CMP-03',
    tagline: 'Kompres Gambar & Optimasi PDF',
    description: 'Kecilkan ukuran foto JPG/PNG/WebP secara batch dan optimalkan berkas PDF langsung di browser.',
    category: 'academic',
    categoryLabel: 'Akademik & Karir',
    href: '/tools/compressor',
    iconName: 'Minimize2',
    engine: 'Canvas',
    badge: 'Batch',
    popularFor: 'Upload Portal',
  },
  {
    id: 'ipk-calculator',
    title: 'Target IPK & IPS Simulator',
    shortCode: 'IPK-04',
    tagline: 'Hitung IPS & Target Kelulusan',
    description: 'Hitung indeks prestasi semester dan simulasikan nilai yang dibutuhkan di sisa SKS perkuliahan.',
    category: 'academic',
    categoryLabel: 'Akademik & Karir',
    href: '/tools/ipk-calculator',
    iconName: 'Calculator',
    engine: 'Local',
    popularFor: 'KRS & Evaluasi',
  },
  {
    id: 'citation',
    title: 'Citation & Daftar Pustaka',
    shortCode: 'CIT-05',
    tagline: 'Format Sitasi Tugas & Jurnal',
    description: 'Susun daftar pustaka standar APA 7th, IEEE, Harvard, atau BibTeX dengan tombol salin cepat.',
    category: 'academic',
    categoryLabel: 'Akademik & Karir',
    href: '/tools/citation',
    iconName: 'Bookmark',
    engine: 'Local',
    popularFor: 'Paper & Makalah',
  },

  // Event & Organization Tools
  {
    id: 'twibbon',
    title: 'Twibbon Campaign Maker',
    shortCode: 'TWB-01',
    tagline: 'Bingkai Kampanye & Event',
    description: 'Pasang foto ke bingkai twibbon acara dengan kontrol posisi, perbesaran, dan rotasi.',
    category: 'organization',
    categoryLabel: 'Organisasi & Event',
    href: '/tools/twibbon',
    iconName: 'Sparkles',
    badge: 'Event',
    popularFor: 'Ospek & Webinar',
  },
  {
    id: 'certificate',
    title: 'Bulk E-Sertifikat Generator',
    shortCode: 'SRT-02',
    tagline: 'Cetak Sertifikat dari CSV',
    description: 'Atur posisi nama pada template, unggah daftar nama via CSV, lalu unduh bundle ZIP sertifikat.',
    category: 'organization',
    categoryLabel: 'Organisasi & Event',
    href: '/tools/certificate',
    iconName: 'Award',
    engine: 'PDF-Lib',
    badge: 'Panitia',
    popularFor: 'Divisi Acara',
  },
  {
    id: 'ig-grid',
    title: 'Instagram 3x3 Grid Maker',
    shortCode: 'GRD-03',
    tagline: 'Potong Banner Feed Instagram',
    description: 'Potong poster promosi menjadi puzzle 3x1, 3x2, atau 3x3 dengan visual nomor urut unggah.',
    category: 'organization',
    categoryLabel: 'Organisasi & Event',
    href: '/tools/ig-grid',
    iconName: 'Grid',
    engine: 'Canvas',
    popularFor: 'Publikasi Medsos',
  },
  {
    id: 'qr-code',
    title: 'Custom QR Code Generator',
    shortCode: 'QRC-04',
    tagline: 'QR Code Link & Presensi',
    description: 'Buat kode QR untuk formulir presensi atau tautan drive dengan logo dan warna kustom.',
    category: 'organization',
    categoryLabel: 'Organisasi & Event',
    href: '/tools/qr-code',
    iconName: 'QrCode',
    engine: 'Canvas',
    popularFor: 'Presensi Acara',
  },

  // Media & Advanced Tools
  {
    id: 'ocr',
    title: 'OCR Catatan & Slide Kuliah',
    shortCode: 'OCR-01',
    tagline: 'Ekstrak Teks Catatan & Slide',
    description: 'Pindai teks bahasa Indonesia dan Inggris dari foto materi kuliah langsung ke teks atau Markdown.',
    category: 'media',
    categoryLabel: 'Media & Konversi',
    href: '/tools/ocr',
    iconName: 'ScanText',
    engine: 'WASM',
    badge: 'OCR',
    popularFor: 'Rangkuman Ujian',
  },
  {
    id: 'media-converter',
    title: 'Media & Audio Converter',
    shortCode: 'MED-02',
    tagline: 'Ekstrak Audio Rekaman Kuliah',
    description: 'Ubah rekaman video kuliah menjadi audio WAV dan konversi format berkas gambar di browser.',
    category: 'media',
    categoryLabel: 'Media & Konversi',
    href: '/tools/media-converter',
    iconName: 'Music',
    engine: 'WebAudio',
    popularFor: 'Audio Kuliah',
  },
  {
    id: 'bg-remover',
    title: 'Image Background Remover',
    shortCode: 'BGR-03',
    tagline: 'Hapus & Ganti Latar Foto',
    description: 'Hapus background foto secara instan atau ubah warna pas foto ijazah (merah/biru/putih).',
    category: 'media',
    categoryLabel: 'Media & Konversi',
    href: '/tools/bg-remover',
    iconName: 'Layers',
    engine: 'Canvas',
    badge: 'Chroma',
    popularFor: 'Pas Foto & Poster',
  },
  {
    id: 'wm-remover',
    title: 'Image Watermark Remover',
    shortCode: 'WMR-04',
    tagline: 'Hapus Watermark & Cap Teks',
    description: 'Hilangkan watermark, timestamp, atau noda pada gambar materi kuliah menggunakan kuas interaktif.',
    category: 'media',
    categoryLabel: 'Media & Konversi',
    href: '/tools/wm-remover',
    iconName: 'Eraser',
    engine: 'Canvas',
    badge: 'Inpaint',
    popularFor: 'Slide & Foto',
  },
];

const WORKFLOW_PRESETS = [
  {
    id: 'skripsi',
    label: 'Skripsi & Tugas Akhir',
    tools: ['pdf-tools', 'cv-builder', 'citation', 'compressor'],
    desc: 'Gabung dokumen, kompres PDF, sitasi paper, dan rapikan CV.',
  },
  {
    id: 'panitia',
    label: 'Kepanitiaan Acara',
    tools: ['twibbon', 'certificate', 'ig-grid', 'qr-code', 'bg-remover'],
    desc: 'Feed instagram, twibbon peserta, QR presensi, dan e-sertifikat.',
  },
  {
    id: 'kuliah',
    label: 'Materi & Rekaman Kuliah',
    tools: ['ocr', 'media-converter', 'wm-remover', 'ipk-calculator'],
    desc: 'Pindai slide dosen, bersihkan watermark, dan ekstrak audio materi.',
  },
];

export function CatalogIsland() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'organization' | 'media'>('all');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.popularFor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;

      const matchesWorkflow =
        !activeWorkflow ||
        WORKFLOW_PRESETS.find((w) => w.id === activeWorkflow)?.tools.includes(tool.id);

      return matchesSearch && matchesCategory && matchesWorkflow;
    });
  }, [searchQuery, selectedCategory, activeWorkflow]);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'FileText':
        return <FileText className="h-5 w-5" />;
      case 'Files':
        return <Files className="h-5 w-5" />;
      case 'Minimize2':
        return <Minimize2 className="h-5 w-5" />;
      case 'ScanText':
        return <ScanText className="h-5 w-5" />;
      case 'Music':
        return <Music className="h-5 w-5" />;
      case 'Layers':
        return <Layers className="h-5 w-5" />;
      case 'Eraser':
        return <Eraser className="h-5 w-5" />;
      case 'Calculator':
        return <Calculator className="h-5 w-5" />;
      case 'Bookmark':
        return <Bookmark className="h-5 w-5" />;
      case 'Sparkles':
        return <Sparkles className="h-5 w-5" />;
      case 'Award':
        return <Award className="h-5 w-5" />;
      case 'Grid':
        return <Grid className="h-5 w-5" />;
      case 'QrCode':
        return <QrCode className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Workflow Bundles / Quick Filters */}
      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Compass className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Pilihan Kebutuhan:
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
            {WORKFLOW_PRESETS.map((wf) => {
              const isActive = activeWorkflow === wf.id;
              return (
                <button
                  key={wf.id}
                  onClick={() => {
                    setActiveWorkflow(isActive ? null : wf.id);
                  }}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground font-semibold'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{wf.label}</span>
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              );
            })}
            {activeWorkflow && (
              <button
                onClick={() => setActiveWorkflow(null)}
                className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 border border-dashed border-destructive px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category Tabs */}
      <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Cari alat (contoh: CV ATS, Twibbon, Background, Watermark)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-14 font-sans text-sm border-border bg-background focus-visible:ring-primary"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            /
          </kbd>
        </div>

        {/* Category Filter Tabs (Single line on mobile with smooth swipe) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Semua ({ALL_TOOLS.length})
          </button>
          <button
            onClick={() => setSelectedCategory('academic')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              selectedCategory === 'academic'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Akademik & Karir ({ALL_TOOLS.filter((t) => t.category === 'academic').length})
          </button>
          <button
            onClick={() => setSelectedCategory('organization')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              selectedCategory === 'organization'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Organisasi & Event ({ALL_TOOLS.filter((t) => t.category === 'organization').length})
          </button>
          <button
            onClick={() => setSelectedCategory('media')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              selectedCategory === 'media'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Media & Konversi ({ALL_TOOLS.filter((t) => t.category === 'media').length})
          </button>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(searchQuery || selectedCategory !== 'all' || activeWorkflow) && (
        <div className="flex items-center justify-between border-b pb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>
              Menampilkan <strong>{filteredTools.length}</strong> dari {ALL_TOOLS.length} alat
            </span>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setActiveWorkflow(null);
            }}
            className="font-mono text-xs text-primary underline hover:text-primary/80 cursor-pointer"
          >
            Hapus Filter
          </button>
        </div>
      )}

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <a
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between border border-border bg-card p-5 transition-all hover:border-foreground hover:shadow-xs"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center border border-border bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {renderIcon(tool.iconName)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                      {tool.shortCode}
                    </span>
                    {tool.badge && (
                      <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Main Info */}
                <div className="mt-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="uppercase tracking-wider">{tool.categoryLabel}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{tool.engine}</span>
                  </div>

                  <h3 className="mt-1 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {tool.tagline}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Meta */}
              <div className="mt-5 border-t border-border pt-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase">Penggunaan:</span>
                    <span className="font-semibold text-foreground">{tool.popularFor}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Buka</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center bg-card">
          <div className="flex h-10 w-10 items-center justify-center border bg-muted text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Alat Tidak Ditemukan</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Tidak ada alat dengan kata kunci &quot;{searchQuery}&quot;. Coba ganti kata kunci atau reset filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setActiveWorkflow(null);
            }}
            className="mt-4 text-xs font-mono"
          >
            Reset Pencarian
          </Button>
        </div>
      )}
    </div>
  );
}
