import React, { useState, useEffect } from 'react';
import {
  ScanText,
  Upload,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function OCRIsland() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [lang, setLang] = useState<string>('ind+eng');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Paste from clipboard support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImageSrc(event.target?.result as string);
              setImageName('Tangkapan Layar (Clipboard)');
              toast.success('Gambar dari clipboard berhasil dimuat!');
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Global reset listener
  useEffect(() => {
    const onReset = () => {
      setImageSrc(null);
      setImageName('');
      setExtractedText('');
      setProgressPercent(0);
      setStatusText('');
      toast.info('Laman OCR berhasil direset!');
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setImageName(file.name);
      setExtractedText('');
      toast.success(`Gambar "${file.name}" siap diproses.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOCR = async () => {
    if (!imageSrc) return;
    setIsRecognizing(true);
    setProgressPercent(0);
    setStatusText('Memulai engine OCR WebAssembly...');

    try {
      // Dynamic import Tesseract per react-patterns
      const { createWorker } = await import('tesseract.js');
      
      // Tesseract v5/v6/v7 expects string[] for multi-language or string for single
      const langConfig = lang === 'ind+eng' ? ['ind', 'eng'] : lang;

      let worker: any = null;
      try {
        worker = await createWorker(langConfig, 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgressPercent(Math.round(m.progress * 100));
              setStatusText(`Membaca teks: ${Math.round(m.progress * 100)}%`);
            } else if (m.status === 'loading tesseract core') {
              setStatusText('Memuat modul WebAssembly core...');
            } else if (m.status.includes('loading language')) {
              setStatusText('Mengunduh model kamus bahasa...');
            } else {
              setStatusText(m.status);
            }
          },
        });
      } catch (workerErr) {
        console.warn('Multi-language init fallback to eng:', workerErr);
        // Fallback to single language if dual load was interrupted
        worker = await createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgressPercent(Math.round(m.progress * 100));
              setStatusText(`Membaca teks (English): ${Math.round(m.progress * 100)}%`);
            }
          },
        });
      }

      setStatusText('Menganalisis baris teks & karakter...');
      const ret = await worker.recognize(imageSrc);
      const text = ret?.data?.text || '';
      
      if (!text.trim()) {
        toast.warning('Teks tidak terdeteksi. Coba pilih bagian gambar yang lebih tajam/kontras.');
      } else {
        setExtractedText(text);
        toast.success('Ekstraksi teks OCR berhasil!');
      }
      
      await worker.terminate();
    } catch (err) {
      console.error('OCR Extraction Fatal Error:', err);
      toast.error('Gagal mengekstrak teks. Pastikan koneksi internet aktif untuk mengunduh model kamus OCR pertama kali.');
    } finally {
      setIsRecognizing(false);
      setStatusText('');
    }
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Teks berhasil disalin ke clipboard!');
    } catch {
      toast.error('Gagal menyalin teks ke clipboard.');
    }
  };

  const handleDownloadMarkdown = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Catatan_OCR_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('File Markdown (.md) berhasil diunduh!');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Image Dropzone & Language */}
      <div className="space-y-6 lg:col-span-5">
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Unggah Foto / Screenshot
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground">Ctrl+V didukung</span>
          </div>

          <div className="space-y-1.5">
            <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
              <ImageIcon className="h-6 w-6 text-primary" />
              <span className="mt-2 text-xs font-bold text-foreground">
                {imageSrc ? 'Ganti Foto Catatan' : 'Pilih Gambar atau Tempel (Ctrl+V)'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Foto slide dosen, papan tulis, atau tangkapan layar materi
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {imageName && (
              <p className="font-mono text-[10px] text-primary truncate">{imageName}</p>
            )}
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bahasa Dokumen</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'ind+eng', label: 'ID + EN' },
                { id: 'ind', label: 'Indonesia' },
                { id: 'eng', label: 'English' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  className={`border py-1.5 font-mono text-xs font-bold cursor-pointer ${
                    lang === l.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Status */}
          {isRecognizing && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="truncate">{statusText}</span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>
          )}

          <Button
            type="button"
            size="lg"
            onClick={handleRunOCR}
            disabled={!imageSrc || isRecognizing}
            className="w-full gap-2 font-bold uppercase tracking-wider"
          >
            <ScanText className="h-4 w-4" />
            <span>{isRecognizing ? 'Membaca Teks...' : 'Ekstrak Teks Sekarang'}</span>
          </Button>
        </div>

        {/* Thumbnail preview */}
        {imageSrc && (
          <div className="border bg-card p-3 space-y-2">
            <span className="font-mono text-[11px] font-bold text-muted-foreground">Gambar Sumber:</span>
            <img src={imageSrc} alt="Source Preview" className="max-h-56 w-full object-contain border bg-muted" />
          </div>
        )}
      </div>

      {/* Right Column: OCR Output & Markdown Editor */}
      <div className="space-y-4 lg:col-span-7">
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Hasil Teks yang Diekstrak
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Teks dapat langsung diedit, disalin, atau diunduh sebagai file Markdown.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                disabled={!extractedText}
                className="h-8 gap-1.5 font-mono text-xs cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Copy'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMarkdown}
                disabled={!extractedText}
                className="h-8 gap-1.5 font-mono text-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Simpan .MD</span>
              </Button>
            </div>
          </div>

          {/* Textarea for Extracted Output */}
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={16}
            placeholder="Hasil pembacaan OCR akan muncul di sini secara otomatis..."
            className="w-full border border-input bg-background p-3.5 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Karakter: {extractedText.length}</span>
            <span>100% In-Browser Tesseract WASM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
