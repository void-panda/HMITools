import React, { useState } from 'react';
import {
  Files,
  FilePlus2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Split,
  Stamp,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

interface PDFFileItem {
  id: string;
  name: string;
  size: string;
  file: File;
}

export function PDFToolsIsland() {
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'watermark'>('merge');

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<PDFFileItem[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitFilePageCount, setSplitFilePageCount] = useState<number>(0);
  const [pageRange, setPageRange] = useState<string>('1-3');
  const [isSplitting, setIsSplitting] = useState<boolean>(false);

  // Watermark State
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmText, setWmText] = useState<string>('DRAFT SKRIPSI');
  const [wmOpacity, setWmOpacity] = useState<number>(0.2);
  const [isWatermarking, setIsWatermarking] = useState<boolean>(false);

  // Global reset listener
  React.useEffect(() => {
    const onReset = () => {
      setMergeFiles([]);
      setSplitFile(null);
      setSplitFilePageCount(0);
      setPageRange('1-3');
      setWmFile(null);
      setWmText('DRAFT SKRIPSI');
      setWmOpacity(0.2);
      toast.info('Form & daftar berkas PDF berhasil direset!');
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  // Handle PDF Uploads for Merge
  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const items: PDFFileItem[] = valid.map((f) => ({
      id: `pdf-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      file: f,
    }));
    setMergeFiles((prev) => [...prev, ...items]);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setMergeFiles((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    setMergeFiles((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const removeFile = (id: string) => {
    setMergeFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Merge Action
  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of mergeFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Merged_Document_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Berkas PDF berhasil digabungkan!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menggabungkan PDF. Pastikan file tidak terenkripsi kata sandi.');
    } finally {
      setIsMerging(false);
    }
  };

  // Split Action
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSplitFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const total = doc.getPageCount();
      setSplitFilePageCount(total);
      setPageRange(`1-${Math.min(total, 3)}`);
      toast.info(`Dokumen PDF dimuat: total ${total} halaman.`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal membaca dokumen PDF.');
    }
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) return;
    setIsSplitting(true);

    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();
      const totalPages = srcDoc.getPageCount();

      // Parse range string (e.g. "1-3, 5, 8-10")
      const pagesToExtract = new Set<number>();
      const parts = pageRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
              pagesToExtract.add(i - 1); // 0-indexed
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            pagesToExtract.add(pageNum - 1);
          }
        }
      }

      const indices = Array.from(pagesToExtract).sort((a, b) => a - b);
      if (indices.length === 0) {
        toast.warning('Rentang halaman tidak valid (contoh: 1-3, 5, 7-10).');
        return;
      }

      const copied = await newDoc.copyPages(srcDoc, indices);
      copied.forEach((p) => newDoc.addPage(p));

      const splitBytes = await newDoc.save();
      const blob = new Blob([splitBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Extracted_Pages_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Berhasil mengekstrak ${indices.length} halaman PDF!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekstrak halaman PDF.');
    } finally {
      setIsSplitting(false);
    }
  };

  // Watermark Action
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWmFile(file);
      toast.info(`File ${file.name} dipilih.`);
    }
  };

  const handleExecuteWatermark = async () => {
    if (!wmFile || !wmText) return;
    setIsWatermarking(true);

    try {
      const arrayBuffer = await wmFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textSize = 44;
        const textWidth = font.widthOfTextAtSize(wmText, textSize);

        page.drawText(wmText, {
          x: width / 2 - textWidth / 2 + 50,
          y: height / 2 - 50,
          size: textSize,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
          opacity: wmOpacity,
          rotate: degrees(45),
        });
      }

      const wmBytes = await doc.save();
      const blob = new Blob([wmBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Watermarked_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Watermark berhasil ditambahkan ke dokumen!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan watermark pada PDF.');
    } finally {
      setIsWatermarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'merge' | 'split' | 'watermark')}
        className="w-full space-y-6"
      >
        {/* Sub-Tool Selector Tabs */}
        <TabsList className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <TabsTrigger value="merge" className="gap-2">
            <Layers className="h-4 w-4" />
            <span>Gabung PDF</span>
          </TabsTrigger>
          <TabsTrigger value="split" className="gap-2">
            <Split className="h-4 w-4" />
            <span>Pisah / Ekstrak</span>
          </TabsTrigger>
          <TabsTrigger value="watermark" className="gap-2">
            <Stamp className="h-4 w-4" />
            <span>Watermark</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Merge PDF */}
        <TabsContent value="merge" className="space-y-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Upload Dropzone */}
            <div className="space-y-4 lg:col-span-5">
              <div className="border bg-card p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Tambah File PDF
                </h3>
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
                  <FilePlus2 className="h-6 w-6 text-primary" />
                  <span className="mt-2 text-xs font-bold text-foreground">
                    Pilih / Tarik File PDF ke Sini
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Bisa pilih cover skripsi, bab isi, lampiran, dll.
                  </span>
                  <input type="file" accept="application/pdf" multiple onChange={handleMergeUpload} className="hidden" />
                </label>

                <div className="border bg-muted/40 p-3 text-xs text-muted-foreground font-mono space-y-1">
                  <div className="font-bold text-foreground">Petunjuk Penggabungan:</div>
                  <p>1. Upload 2 atau lebih berkas PDF.</p>
                  <p>2. Atur urutan file menggunakan tombol panah atas/bawah.</p>
                  <p>3. Klik &quot;Gabungkan Semua PDF&quot;.</p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleExecuteMerge}
                  disabled={mergeFiles.length < 2 || isMerging}
                  className="w-full gap-2 font-bold uppercase tracking-wider"
                >
                  <Download className="h-4 w-4" />
                  <span>{isMerging ? 'Sedang Menggabungkan...' : `Gabungkan ${mergeFiles.length} PDF`}</span>
                </Button>
              </div>
            </div>

            {/* Reorderable List */}
            <div className="space-y-4 lg:col-span-7">
              <div className="border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between border-b pb-3 mb-3">
                  <span className="font-mono text-xs font-bold uppercase text-foreground">
                    Urutan Halaman Dokumen ({mergeFiles.length} File)
                  </span>
                  {mergeFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMergeFiles([])}
                      className="font-mono text-[11px] text-destructive hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                {mergeFiles.length > 0 ? (
                  <div className="space-y-2">
                    {mergeFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between border bg-background p-3 transition-colors hover:border-foreground"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 items-center justify-center bg-muted font-mono text-xs font-bold text-foreground">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-foreground">{file.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{file.size}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="border p-1.5 hover:bg-muted disabled:opacity-30 cursor-pointer"
                            title="Geser ke Atas"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === mergeFiles.length - 1}
                            className="border p-1.5 hover:bg-muted disabled:opacity-30 cursor-pointer"
                            title="Geser ke Bawah"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center border border-dashed border-border text-center p-6">
                    <Files className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-xs font-semibold text-foreground">Belum ada file PDF yang ditambahkan</p>
                    <p className="text-[11px] text-muted-foreground">Pilih file PDF di sebelah kiri untuk mulai menyusun urutan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Split / Extract PDF */}
        <TabsContent value="split" className="space-y-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <div className="border bg-card p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Pilih Dokumen PDF
                </h3>
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="mt-1.5 text-xs font-bold text-foreground">
                    {splitFile ? splitFile.name : 'Upload File PDF'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {splitFilePageCount > 0
                      ? `Total: ${splitFilePageCount} Halaman`
                      : 'Pilih berkas PDF yang ingin dipisahkan'}
                  </span>
                  <input type="file" accept="application/pdf" onChange={handleSplitUpload} className="hidden" />
                </label>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Rentang Halaman yang Diekstrak</Label>
                    {splitFilePageCount > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Max: {splitFilePageCount} hal
                      </span>
                    )}
                  </div>
                  <Input
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="Contoh: 1-3, 5, 7-10"
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Gunakan strip (-) untuk rentang dan koma (,) untuk memisahkan halaman.
                  </p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleExecuteSplit}
                  disabled={!splitFile || isSplitting}
                  className="w-full gap-2 font-bold uppercase tracking-wider"
                >
                  <Download className="h-4 w-4" />
                  <span>{isSplitting ? 'Mengekstrak Halaman...' : 'Ekstrak & Unduh PDF'}</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Watermark PDF */}
        <TabsContent value="watermark" className="space-y-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <div className="border bg-card p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Beri Watermark Dokumen
                </h3>
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
                  <Stamp className="h-6 w-6 text-primary" />
                  <span className="mt-1.5 text-xs font-bold text-foreground">
                    {wmFile ? wmFile.name : 'Upload Berkas PDF'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    File PDF skripsi, proposal, atau draft materi
                  </span>
                  <input type="file" accept="application/pdf" onChange={handleWatermarkUpload} className="hidden" />
                </label>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Teks Watermark</Label>
                  <Input
                    value={wmText}
                    onChange={(e) => setWmText(e.target.value)}
                    placeholder="Contoh: DRAFT SKRIPSI / RAHASIA"
                    className="font-mono text-xs uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Transparansi (Opasitas):</span>
                    <span className="font-bold">{Math.round(wmOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.6}
                    step={0.05}
                    value={wmOpacity}
                    onChange={(e) => setWmOpacity(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleExecuteWatermark}
                  disabled={!wmFile || !wmText || isWatermarking}
                  className="w-full gap-2 font-bold uppercase tracking-wider"
                >
                  <Download className="h-4 w-4" />
                  <span>{isWatermarking ? 'Memberi Watermark...' : 'Beri Watermark & Unduh'}</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
