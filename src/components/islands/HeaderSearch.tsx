import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Files,
  Minimize2,
  Calculator,
  Bookmark,
  Sparkles,
  Award,
  Grid,
  QrCode,
  ScanText,
  Music,
  Layers,
  Eraser,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

const TOOLS_LIST: ToolItem[] = [
  // Akademik & Karir
  {
    id: "cv-builder",
    name: "CV ATS Builder",
    description: "Buat CV standar mesin ATS dengan live preview & export PDF",
    category: "Akademik & Karir",
    href: "/tools/cv-builder",
    icon: FileText,
    tags: ["cv", "ats", "resume", "karir", "lamaran", "kerja", "magang"],
  },
  {
    id: "pdf-tools",
    name: "PDF Toolkit (Merge / Split / Watermark)",
    description: "Gabung dokumen skripsi, ekstrak halaman, dan beri cap watermark",
    category: "Akademik & Karir",
    href: "/tools/pdf-tools",
    icon: Files,
    tags: ["pdf", "gabung", "merge", "split", "pisah", "watermark", "skripsi"],
  },
  {
    id: "compressor",
    name: "Dokumen & Media Compressor",
    description: "Kompres foto kartu ujian, berkas lamaran, dan dokumen PDF",
    category: "Akademik & Karir",
    href: "/tools/compressor",
    icon: Minimize2,
    tags: ["compress", "kompres", "kecilkan", "foto", "pdf", "gambar", "batch"],
  },
  {
    id: "ipk-calculator",
    name: "Target IPK Simulator",
    description: "Kalkulator IPK semester dan simulasi nilai target kelulusan",
    category: "Akademik & Karir",
    href: "/tools/ipk-calculator",
    icon: Calculator,
    tags: ["ipk", "ips", "nilai", "kalkulator", "sks", "semester", "target"],
  },
  {
    id: "citation",
    name: "Citation & Daftar Pustaka Formatter",
    description: "Generator sitasi format APA 7th, IEEE, Harvard, dan Chicago",
    category: "Akademik & Karir",
    href: "/tools/citation",
    icon: Bookmark,
    tags: ["sitasi", "citation", "dapus", "daftar pustaka", "apa", "ieee", "jurnal", "buku"],
  },

  // Organisasi & Event
  {
    id: "twibbon",
    name: "Twibbon Campaign Maker",
    description: "Pasang foto profil ke bingkai twibbon acara kepanitiaan HMIT",
    category: "Organisasi & Event",
    href: "/tools/twibbon",
    icon: Sparkles,
    tags: ["twibbon", "foto", "bingkai", "event", "panitia", "kampanye"],
  },
  {
    id: "certificate",
    name: "Bulk E-Sertifikat Generator",
    description: "Cetak ratusan e-sertifikat dari file CSV/Excel langsung jadi ZIP",
    category: "Organisasi & Event",
    href: "/tools/certificate",
    icon: Award,
    tags: ["sertifikat", "certificate", "bulk", "massal", "csv", "excel", "seminar"],
  },
  {
    id: "ig-grid",
    name: "Instagram 3x3 Grid Slicer",
    description: "Potong poster pamflet jadi grid 3x1, 3x2, atau 3x3 untuk feeds",
    category: "Organisasi & Event",
    href: "/tools/ig-grid",
    icon: Grid,
    tags: ["instagram", "grid", "feeds", "potong", "slice", "poster", "feeds"],
  },
  {
    id: "qr-code",
    name: "Custom QR Code Generator",
    description: "Bikin QR code presensi formulir dan link Drive dengan logo",
    category: "Organisasi & Event",
    href: "/tools/qr-code",
    icon: QrCode,
    tags: ["qr", "qrcode", "barcode", "presensi", "link", "wifi"],
  },

  // Media & Konversi
  {
    id: "ocr",
    name: "OCR Catatan & Slide Kuliah",
    description: "Ekstrak teks bahasa Indonesia dari foto slide dosen & buku",
    category: "Media & Konversi",
    href: "/tools/ocr",
    icon: ScanText,
    tags: ["ocr", "scan", "teks", "ekstrak", "gambar ke teks", "slide"],
  },
  {
    id: "media-converter",
    name: "Media & Audio Converter",
    description: "Ekstrak audio MP3/WAV dari rekaman zoom dan convert image",
    category: "Media & Konversi",
    href: "/tools/media-converter",
    icon: Music,
    tags: ["convert", "audio", "video", "mp3", "wav", "rekaman", "kuliah"],
  },
  {
    id: "bg-remover",
    name: "Image Background Remover",
    description: "Hapus background foto paspor, formal, dan banner transparan",
    category: "Media & Konversi",
    href: "/tools/bg-remover",
    icon: Layers,
    tags: ["background", "bg", "hapus", "transparent", "pas foto", "chroma"],
  },
  {
    id: "wm-remover",
    name: "Image Watermark Remover",
    description: "Hilangkan teks timestamp dan coretan watermark pada gambar",
    category: "Media & Konversi",
    href: "/tools/wm-remover",
    icon: Eraser,
    tags: ["watermark", "wm", "inpaint", "hapus teks", "foto", "bersihkan"],
  },
];

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Keyboard Shortcut: Cmd/Ctrl + K or "/"
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    window.location.href = href;
  };

  const categories = ["Akademik & Karir", "Organisasi & Event", "Media & Konversi"];

  return (
    <>
      {/* Search Bar Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="group relative flex items-center justify-between gap-3 border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer select-none sm:w-56 md:w-64"
        aria-label="Cari alat atau fitur"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
          <span className="font-sans text-xs">Cari alat...</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.2 font-bold text-muted-foreground shadow-2xs group-hover:border-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </button>

      {/* Shadcn Command Dialog Modal */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ketik nama alat, format berkas, atau kebutuhan (contoh: CV, PDF, Twibbon)..." />
        <CommandList>
          <CommandEmpty>Tidak ada alat yang cocok dengan pencarian Anda.</CommandEmpty>

          {categories.map((category, index) => {
            const tools = TOOLS_LIST.filter((tool) => tool.category === category);
            return (
              <React.Fragment key={category}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={category}>
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <CommandItem
                        key={tool.id}
                        value={`${tool.name} ${tool.tags.join(" ")} ${tool.description}`}
                        onSelect={() => handleSelect(tool.href)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center border border-border bg-background text-primary shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate text-xs">
                              {tool.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
