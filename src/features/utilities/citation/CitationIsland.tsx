import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  FileCode2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function CitationIsland() {
  const [sourceType, setSourceType] = useState<'journal' | 'book' | 'website'>('journal');
  const [authors, setAuthors] = useState<string>('Pratama, M. R., & Wijaya, A.');
  const [year, setYear] = useState<string>('2025');
  const [title, setTitle] = useState<string>('Optimasi Arsitektur WebAssembly untuk Pemrosesan Dokumen Sisi Klien');
  const [containerTitle, setContainerTitle] = useState<string>('Jurnal Teknologi Informasi dan Rekayasa Perangkat Lunak');
  const [volume, setVolume] = useState<string>('12');
  const [issue, setIssue] = useState<string>('3');
  const [pages, setPages] = useState<string>('145-158');
  const [publisher, setPublisher] = useState<string>('Universitas Press');
  const [doiUrl, setDoiUrl] = useState<string>('https://doi.org/10.1234/jtirp.2025.123');

  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Formatted Citations
  const citations = useMemo(() => {
    const cleanAuthors = authors.trim();
    const cleanYear = year.trim();
    const cleanTitle = title.trim();
    const cleanContainer = containerTitle.trim();
    const cleanDoi = doiUrl.trim();

    // APA 7th
    let apa = '';
    if (sourceType === 'journal') {
      apa = `${cleanAuthors} (${cleanYear}). ${cleanTitle}. ${cleanContainer}, ${volume}(${issue}), ${pages}. ${cleanDoi}`;
    } else if (sourceType === 'book') {
      apa = `${cleanAuthors} (${cleanYear}). ${cleanTitle}. ${publisher}. ${cleanDoi}`;
    } else {
      apa = `${cleanAuthors} (${cleanYear}). ${cleanTitle}. ${cleanContainer}. ${cleanDoi}`;
    }

    // IEEE
    let ieee = '';
    if (sourceType === 'journal') {
      ieee = `${cleanAuthors}, "${cleanTitle}," ${cleanContainer}, vol. ${volume}, no. ${issue}, pp. ${pages}, ${cleanYear}, doi: ${cleanDoi}.`;
    } else if (sourceType === 'book') {
      ieee = `${cleanAuthors}, ${cleanTitle}. ${publisher}, ${cleanYear}.`;
    } else {
      ieee = `${cleanAuthors}, "${cleanTitle}," ${cleanContainer}, ${cleanYear}. [Online]. Available: ${cleanDoi}.`;
    }

    // Harvard
    const harvard = `${cleanAuthors}, ${cleanYear}. '${cleanTitle}', ${cleanContainer}, ${volume}(${issue}), pp. ${pages}.`;

    // BibTeX for LaTeX
    const firstAuthor = cleanAuthors.split(',')[0].replace(/[^a-zA-Z]/g, '').toLowerCase() || 'author';
    const bibtex = `@article{${firstAuthor}${cleanYear},
  author = {${cleanAuthors}},
  title = {${cleanTitle}},
  journal = {${cleanContainer}},
  year = {${cleanYear}},
  volume = {${volume}},
  number = {${issue}},
  pages = {${pages}},
  doi = {${cleanDoi}}
}`;

    return { apa, ieee, harvard, bibtex };
  }, [sourceType, authors, year, title, containerTitle, volume, issue, pages, publisher, doiUrl]);

  const copyToClipboard = async (text: string, formatName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(formatName);
      setTimeout(() => setCopiedFormat(null), 2000);
      toast.success(`Sitasi format ${formatName} berhasil disalin!`);
    } catch {
      toast.error('Gagal menyalin sitasi ke clipboard.');
    }
  };

  const handleResetToDefault = () => {
    setSourceType('journal');
    setAuthors('Pratama, M. R., & Wijaya, A.');
    setYear('2025');
    setTitle('Optimasi Arsitektur WebAssembly untuk Pemrosesan Dokumen Sisi Klien');
    setContainerTitle('Jurnal Teknologi Informasi dan Rekayasa Perangkat Lunak');
    setVolume('12');
    setIssue('3');
    setPages('145-158');
    setPublisher('Universitas Press');
    setDoiUrl('https://doi.org/10.1234/jtirp.2025.123');
    toast.info('Data referensi & sitasi direset ke contoh default!');
  };

  // Global reset listener
  useEffect(() => {
    const onReset = () => {
      handleResetToDefault();
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Citation Metadata Form */}
      <div className="space-y-6 lg:col-span-6">
        <div className="border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Data Sumber Referensi
              </h2>
            </div>
            
            <span className="font-mono text-[11px] text-muted-foreground uppercase">
              {sourceType}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Tipe Publikasi:</span>
            {/* Type selector */}
            <div className="flex gap-1.5">
              {(['journal', 'book', 'website'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSourceType(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    sourceType === t
                      ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {t === 'journal' ? 'Jurnal' : t === 'book' ? 'Buku' : 'Website'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Penulis (Format: NamaBelakang, Inisial.)</Label>
              <Input
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Contoh: Pratama, M. R., & Wijaya, A."
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold">Judul Artikel / Bab</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul paper atau buku"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tahun Terbit</Label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2025"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {sourceType === 'journal'
                  ? 'Nama Jurnal / Prosiding'
                  : sourceType === 'book'
                  ? 'Penerbit'
                  : 'Nama Website'}
              </Label>
              <Input
                value={sourceType === 'book' ? publisher : containerTitle}
                onChange={(e) =>
                  sourceType === 'book' ? setPublisher(e.target.value) : setContainerTitle(e.target.value)
                }
                placeholder="Nama Jurnal atau Penerbit"
                className="text-xs"
              />
            </div>

            {sourceType === 'journal' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Volume</Label>
                  <Input
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="12"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nomor / Issue</Label>
                  <Input
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="3"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Halaman</Label>
                  <Input
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="145-158"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">DOI / Tautan URL</Label>
              <Input
                value={doiUrl}
                onChange={(e) => setDoiUrl(e.target.value)}
                placeholder="https://doi.org/10.xxxx/..."
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Multi-Format Live Output */}
      <div className="space-y-4 lg:col-span-6">
        <div className="border bg-card p-5 space-y-5">
          <div className="border-b pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Format Sitasi Siap Salin
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tinggal 1-klik copy untuk menempelkan ke daftar pustaka skripsi atau makalah.
            </p>
          </div>

          {/* APA 7th */}
          <div className="border bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">APA 7th Edition</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(citations.apa, 'APA')}
                className="h-7 gap-1 font-mono text-[11px] cursor-pointer"
              >
                {copiedFormat === 'APA' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedFormat === 'APA' ? 'Tersalin!' : 'Copy APA'}</span>
              </Button>
            </div>
            <p className="font-sans text-xs leading-relaxed text-foreground select-all bg-muted/30 p-2">
              {citations.apa}
            </p>
          </div>

          {/* IEEE */}
          <div className="border bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">IEEE Standard</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(citations.ieee, 'IEEE')}
                className="h-7 gap-1 font-mono text-[11px] cursor-pointer"
              >
                {copiedFormat === 'IEEE' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedFormat === 'IEEE' ? 'Tersalin!' : 'Copy IEEE'}</span>
              </Button>
            </div>
            <p className="font-sans text-xs leading-relaxed text-foreground select-all bg-muted/30 p-2">
              {citations.ieee}
            </p>
          </div>

          {/* Harvard */}
          <div className="border bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">Harvard Style</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(citations.harvard, 'Harvard')}
                className="h-7 gap-1 font-mono text-[11px] cursor-pointer"
              >
                {copiedFormat === 'Harvard' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedFormat === 'Harvard' ? 'Tersalin!' : 'Copy Harvard'}</span>
              </Button>
            </div>
            <p className="font-sans text-xs leading-relaxed text-foreground select-all bg-muted/30 p-2">
              {citations.harvard}
            </p>
          </div>

          {/* BibTeX */}
          <div className="border bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">BibTeX (LaTeX)</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(citations.bibtex, 'BibTeX')}
                className="h-7 gap-1 font-mono text-[11px] cursor-pointer"
              >
                {copiedFormat === 'BibTeX' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedFormat === 'BibTeX' ? 'Tersalin!' : 'Copy BibTeX'}</span>
              </Button>
            </div>
            <pre className="font-mono text-[10px] text-muted-foreground select-all bg-muted/50 p-2.5 overflow-x-auto whitespace-pre">
              {citations.bibtex}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
