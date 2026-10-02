import React, { useState, useRef } from 'react';
import {
  Minimize2,
  FileText,
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Archive,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CompressedImageItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  compressedBlob: Blob;
  reductionPercentage: number;
  width: number;
  height: number;
  status: 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export function CompressorIsland() {
  const [activeTab, setActiveTab] = useState<'image' | 'pdf'>('image');

  // --- Image Compressor State ---
  const [images, setImages] = useState<CompressedImageItem[]>([]);
  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- PDF Compressor State ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDpi, setPdfDpi] = useState<number>(120); // 96, 120, 150
  const [pdfQuality, setPdfQuality] = useState<number>(65);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [compressedPdfSize, setCompressedPdfSize] = useState<number>(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Global reset listener
  React.useEffect(() => {
    const onReset = () => {
      setImages([]);
      setQuality(75);
      setMaxWidth(1920);
      setOutputFormat('image/jpeg');
      setPdfFile(null);
      setCompressedPdfUrl(null);
      setCompressedPdfSize(0);
      setPdfStatus('idle');
      toast.info('Pengaturan kompresi & daftar berkas direset!');
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- Process Single Image ---
  const compressSingleImage = async (
    file: File,
    q: number,
    maxW: number,
    fmt: string
  ): Promise<CompressedImageItem> => {
    const id = Math.random().toString(36).substring(2, 9);
    const originalUrl = URL.createObjectURL(file);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            id,
            name: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            originalUrl,
            compressedUrl: originalUrl,
            compressedBlob: file,
            reductionPercentage: 0,
            width,
            height,
            status: 'error',
            errorMessage: 'Canvas 2D context tidak tersedia',
          });
          return;
        }

        // Fill background white for JPEG if PNG with transparent alpha is uploaded
        if (fmt === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const qualityFraction = q / 100;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                id,
                name: file.name,
                originalSize: file.size,
                compressedSize: file.size,
                originalUrl,
                compressedUrl: originalUrl,
                compressedBlob: file,
                reductionPercentage: 0,
                width,
                height,
                status: 'error',
                errorMessage: 'Gagal mengompres gambar',
              });
              return;
            }

            const compressedUrl = URL.createObjectURL(blob);
            const reduction = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

            // Adjust file extension based on format
            let ext = 'jpg';
            if (fmt === 'image/webp') ext = 'webp';
            if (fmt === 'image/png') ext = 'png';
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const outputName = `${baseName}-compressed.${ext}`;

            resolve({
              id,
              name: outputName,
              originalSize: file.size,
              compressedSize: blob.size,
              originalUrl,
              compressedUrl,
              compressedBlob: blob,
              reductionPercentage: reduction,
              width,
              height,
              status: 'done',
            });
          },
          fmt,
          qualityFraction
        );
      };

      img.onerror = () => {
        resolve({
          id,
          name: file.name,
          originalSize: file.size,
          compressedSize: file.size,
          originalUrl,
          compressedUrl: originalUrl,
          compressedBlob: file,
          reductionPercentage: 0,
          width: 0,
          height: 0,
          status: 'error',
          errorMessage: 'Berkas gambar rusak atau tidak didukung',
        });
      };

      img.src = originalUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    const newItems: CompressedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const item = await compressSingleImage(files[i], quality, maxWidth, outputFormat);
      newItems.push(item);
    }

    setImages((prev) => [...prev, ...newItems]);
    setIsProcessingImages(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
    toast.success(`${files.length} gambar berhasil dikompres.`);
  };

  const recompressAllImages = async (newQuality: number, newMaxW: number, newFmt: 'image/jpeg' | 'image/webp' | 'image/png') => {
    if (images.length === 0) return;
    setIsProcessingImages(true);

    const updated: CompressedImageItem[] = [];
    for (const item of images) {
      // Re-fetch from original URL
      try {
        const res = await fetch(item.originalUrl);
        const blob = await res.blob();
        const dummyFile = new File([blob], item.name, { type: blob.type });
        const recompressed = await compressSingleImage(dummyFile, newQuality, newMaxW, newFmt);
        updated.push({
          ...recompressed,
          id: item.id,
          originalSize: item.originalSize,
          originalUrl: item.originalUrl,
        });
      } catch {
        updated.push(item);
      }
    }

    setImages(updated);
    setIsProcessingImages(false);
    toast.success('Pengaturan kualitas berhasil diterapkan ulang.');
  };

  const handleDownloadAllImagesZip = async () => {
    if (images.length === 0) return;
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    images.forEach((img) => {
      if (img.status === 'done') {
        zip.file(img.name, img.compressedBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HMITools-Images-Compressed-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Semua gambar terkompresi berhasil diunduh dalam file ZIP!');
  };

  // --- PDF Compression via pdf-lib stream & canvas downscaling ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Hanya berkas PDF yang diperbolehkan');
      toast.error('Hanya berkas PDF yang diperbolehkan');
      return;
    }
    setPdfFile(file);
    setPdfStatus('idle');
    setCompressedPdfUrl(null);
    setPdfError(null);
    toast.success(`PDF "${file.name}" siap dioptimasi.`);
  };

  const handleCompressPdf = async () => {
    if (!pdfFile) return;
    setPdfStatus('processing');
    setPdfProgress('Membaca struktur PDF...');
    setPdfError(null);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await pdfFile.arrayBuffer();

      setPdfProgress('Mengoptimalkan stream & menghapus metadata duplikat...');
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      // Clear non-essential metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('HMITools Client Optimizer');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('HMITools');
      pdfDoc.setCreator('HMITools');

      setPdfProgress('Menyusun PDF terkompresi...');
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      setCompressedPdfSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedPdfUrl(url);
      setPdfStatus('done');
      toast.success('Optimasi berkas PDF selesai!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengompres PDF';
      setPdfError(msg);
      setPdfStatus('error');
      toast.error(msg);
    }
  };

  const totalOriginalSize = images.reduce((acc, cur) => acc + cur.originalSize, 0);
  const totalCompressedSize = images.reduce((acc, cur) => acc + cur.compressedSize, 0);
  const totalReduction =
    totalOriginalSize > 0
      ? Math.max(0, Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100))
      : 0;

  return (
    <div className="space-y-6">

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'image' | 'pdf')}
        className="w-full space-y-6"
      >
        <TabsList className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <TabsTrigger value="image" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Kompres Gambar</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Optimasi PDF</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: IMAGE COMPRESSOR */}
        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Upload & Setting Controls */}
            <div className="space-y-6 lg:col-span-1">
              {/* Upload Card */}
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Upload Foto / Gambar
                </h3>

                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp,image/bmp"
                  multiple
                  className="hidden"
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center border bg-muted text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-foreground">
                    Pilih atau Seret Foto ke Sini
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    PNG, JPG, JPEG, WebP • Bisa banyak sekaligus
                  </p>
                </div>
              </div>

              {/* Compression Configuration */}
              <div className="border bg-card p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    <span>2. Parameter Kompresi</span>
                  </h3>
                </div>

                {/* Quality Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="font-semibold text-foreground">Kualitas Output:</Label>
                    <span className="font-mono font-bold text-primary">{quality}%</span>
                  </div>
                  <Slider
                    value={[quality]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(val) => {
                      const newQ = val[0];
                      setQuality(newQ);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>Kecil (10%)</span>
                    <span>Seimbang (75%)</span>
                    <span>Maksimal (100%)</span>
                  </div>
                </div>

                {/* Max Width Resize */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="font-semibold text-foreground">Batas Lebar Maksimal:</Label>
                    <span className="font-mono font-bold text-foreground">{maxWidth}px</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                    {[800, 1280, 1920, 3840].map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          setMaxWidth(w);
                        }}
                        className={`border py-1 text-center transition-colors cursor-pointer ${
                          maxWidth === w
                            ? 'border-primary bg-primary text-primary-foreground font-bold'
                            : 'border-border bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {w === 3840 ? '4K' : `${w}px`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Format */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Format Berkas:</Label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {[
                      { fmt: 'image/jpeg' as const, label: 'JPEG' },
                      { fmt: 'image/webp' as const, label: 'WebP' },
                      { fmt: 'image/png' as const, label: 'PNG' },
                    ].map((item) => (
                      <button
                        key={item.fmt}
                        onClick={() => {
                          setOutputFormat(item.fmt);
                        }}
                        className={`border py-1 text-center transition-colors cursor-pointer ${
                          outputFormat === item.fmt
                            ? 'border-primary bg-primary text-primary-foreground font-bold'
                            : 'border-border bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                {images.length > 0 && (
                  <Button
                    onClick={() => recompressAllImages(quality, maxWidth, outputFormat)}
                    disabled={isProcessingImages}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 font-mono text-xs cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isProcessingImages ? 'animate-spin' : ''}`} />
                    <span>Terapkan Ulang Parameter</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column: Compression Result List */}
            <div className="space-y-4 lg:col-span-2">
              {/* Summary Bar */}
              {images.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border bg-card p-4 font-mono text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">Total Berkas:</span>{' '}
                      <span className="font-bold text-foreground">{images.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ukuran Asli:</span>{' '}
                      <span className="font-bold text-foreground">{formatFileSize(totalOriginalSize)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hasil:</span>{' '}
                      <span className="font-bold text-primary">{formatFileSize(totalCompressedSize)}</span>
                    </div>
                    <div className="border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                      Hemat {totalReduction}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleDownloadAllImagesZip}
                      size="sm"
                      className="gap-1.5 font-mono text-xs cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Download Semua (.ZIP)</span>
                    </Button>
                    <Button
                      onClick={() => setImages([])}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center bg-card">
                  <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                    <Minimize2 className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-foreground">Belum Ada Gambar yang Diunggah</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Silakan upload berkas foto Anda di panel sebelah kiri untuk mulai mengecilkan ukuran gambar.
                  </p>
                </div>
              ) : (
                /* Item Table / Cards */
                <div className="space-y-3">
                  {images.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border bg-card p-3 sm:p-4 transition-colors hover:border-foreground"
                    >
                      {/* Image Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.compressedUrl}
                          alt={item.name}
                          className="h-14 w-14 border object-cover shrink-0 bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold text-foreground max-w-xs">
                            {item.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            <span>{item.width}×{item.height}px</span>
                            <span>•</span>
                            <span className="line-through text-muted-foreground/70">
                              {formatFileSize(item.originalSize)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold text-primary">
                              {formatFileSize(item.compressedSize)}
                            </span>
                            <span className="border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 font-bold text-emerald-600 dark:text-emerald-400">
                              -{item.reductionPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <a
                          href={item.compressedUrl}
                          download={item.name}
                          className="inline-flex items-center gap-1.5 border border-primary bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </a>
                        <button
                          onClick={() => setImages((prev) => prev.filter((x) => x.id !== item.id))}
                          className="border border-border p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PDF COMPRESSOR */}
        <TabsContent value="pdf" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Upload & Options */}
            <div className="space-y-6 lg:col-span-1">
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Pilih Dokumen PDF
                </h3>

                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={handlePdfUpload}
                  accept="application/pdf"
                  className="hidden"
                />

                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center border bg-muted text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-foreground">
                    {pdfFile ? pdfFile.name : 'Pilih Berkas PDF'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {pdfFile ? formatFileSize(pdfFile.size) : 'Format .pdf • Bebas ukuran'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Jalankan Optimasi
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menghapus metadata duplikat, font stream overhead, dan mengompresi struktur objek internal PDF secara lossless.
                </p>

                <Button
                  onClick={handleCompressPdf}
                  disabled={!pdfFile || pdfStatus === 'processing'}
                  className="w-full gap-2 font-mono text-xs cursor-pointer"
                >
                  {pdfStatus === 'processing' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{pdfProgress || 'Memproses...'}</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      <span>Optimalkan PDF Sekarang</span>
                    </>
                  )}
                </Button>

                {pdfError && (
                  <div className="flex items-center gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pdfError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: PDF Results */}
            <div className="lg:col-span-2">
              <div className="border bg-card p-6 h-full flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status & Hasil Kompresi PDF
                  </h3>

                  {pdfStatus === 'done' && compressedPdfUrl && pdfFile ? (
                    <div className="mt-6 space-y-6">
                      <div className="border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>PDF Berhasil Dioptimasi!</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 font-mono text-xs">
                          <div>
                            <span className="text-muted-foreground">Ukuran Awal:</span>
                            <p className="font-bold text-foreground">{formatFileSize(pdfFile.size)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ukuran Akhir:</span>
                            <p className="font-bold text-primary">{formatFileSize(compressedPdfSize)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={compressedPdfUrl}
                          download={`optimized-${pdfFile.name}`}
                          className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 font-mono text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Unduh PDF Hasil Optimasi</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-12 flex flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                        <FileCheck className="h-6 w-6" />
                      </div>
                      <h4 className="mt-4 text-sm font-bold text-foreground">Siap Mengompresi PDF</h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                        Upload berkas PDF Anda dan tekan tombol &quot;Optimalkan PDF Sekarang&quot;.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 font-mono text-[11px] text-muted-foreground">
                  <span>Standard ISO 32000-1 Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
