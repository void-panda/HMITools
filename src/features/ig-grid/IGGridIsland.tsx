import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  Grid,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type GridType = '3x1' | '3x2' | '3x3';

export function IGGridIsland() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [gridType, setGridType] = useState<GridType>('3x3');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const gridConfig = useMemo(() => {
    switch (gridType) {
      case '3x1':
        return { cols: 3, rows: 1, total: 3 };
      case '3x2':
        return { cols: 3, rows: 2, total: 6 };
      case '3x3':
      default:
        return { cols: 3, rows: 3, total: 9 };
    }
  }, [gridType]);

  // Global reset listener
  React.useEffect(() => {
    const onReset = () => {
      setImageSrc(null);
      setImageName('');
      setGridType('3x3');
      toast.info('Laman Grid Instagram berhasil direset!');
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
      toast.success(`Gambar "${file.name}" berhasil dimuat.`);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadZip = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setDownloadProgress('Memotong gambar...');

    try {
      // Dynamic import for JSZip per react-patterns anti-waterfall guidelines
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const { cols, rows, total } = gridConfig;
      const tileWidth = Math.floor(img.width / cols);
      const tileHeight = Math.floor(img.height / rows);

      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Loop through tiles in reverse Instagram order (bottom-right to top-left)
      // so Post #1 is the bottom-right tile that user posts first to IG
      let postNumber = 1;
      for (let r = rows - 1; r >= 0; r--) {
        for (let c = cols - 1; c >= 0; c--) {
          ctx.clearRect(0, 0, tileWidth, tileHeight);
          ctx.drawImage(
            img,
            c * tileWidth,
            r * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
          );

          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/png')
          );
          if (blob) {
            const paddedNum = String(postNumber).padStart(2, '0');
            zip.file(`post_${paddedNum}.png`, blob);
          }
          postNumber++;
        }
      }

      // Add instruction file
      const instruction = `PETUNJUK UPLOAD INSTAGRAM PUZZLE GRID:
1. Mulai upload dari berkas "post_01.png", lalu lanjut ke "post_02.png", dst.
2. Ketika semua selesai di-upload, tampilan feed profile Instagram Anda akan tersusun rapi membentuk puzzle gambar utuh!
Dibuat dengan HMITools — 100% Free Student Toolkit.`;
      zip.file('petunjuk_upload.txt', instruction);

      setDownloadProgress('Mengompres file ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `IG_Grid_${gridType}_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Grid ZIP (${gridType}) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses gambar grid.');
    } finally {
      setIsProcessing(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Config & Upload */}
      <div className="space-y-6 lg:col-span-5">
        {/* Upload Poster Box */}
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Unggah Poster Promosi
            </h2>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">File Poster / Banner</Label>
              {imageName && <span className="font-mono text-[10px] text-primary truncate max-w-[160px]">{imageName}</span>}
            </div>
            <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
              <ImageIcon className="h-6 w-6 text-primary" />
              <span className="mt-1.5 text-xs font-bold text-foreground">
                {imageSrc ? 'Ganti Poster' : 'Pilih File Gambar'}
              </span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG, atau WebP resolusi tinggi</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Grid Type Selector */}
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Pilih Format Puzzle Grid
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setGridType('3x1')}
              className={`border p-3 text-center transition-colors cursor-pointer ${
                gridType === '3x1'
                  ? 'border-primary bg-primary text-primary-foreground font-bold'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              <div className="font-mono text-sm">3 x 1</div>
              <div className="text-[10px] opacity-80">Banner (3 Pos)</div>
            </button>

            <button
              type="button"
              onClick={() => setGridType('3x2')}
              className={`border p-3 text-center transition-colors cursor-pointer ${
                gridType === '3x2'
                  ? 'border-primary bg-primary text-primary-foreground font-bold'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              <div className="font-mono text-sm">3 x 2</div>
              <div className="text-[10px] opacity-80">Medium (6 Pos)</div>
            </button>

            <button
              type="button"
              onClick={() => setGridType('3x3')}
              className={`border p-3 text-center transition-colors cursor-pointer ${
                gridType === '3x3'
                  ? 'border-primary bg-primary text-primary-foreground font-bold'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              <div className="font-mono text-sm">3 x 3</div>
              <div className="text-[10px] opacity-80">Giant (9 Pos)</div>
            </button>
          </div>

          <div className="flex items-start gap-2 border bg-muted/40 p-3 text-xs text-muted-foreground font-mono">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              Penomoran otomatis diurutkan agar Anda tinggal upload dari post_01.png ke Instagram tanpa salah urut.
            </span>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleDownloadZip}
            disabled={!imageSrc || isProcessing}
            className="w-full gap-2 font-bold uppercase tracking-wider"
          >
            <Download className="h-4 w-4" />
            <span>
              {isProcessing
                ? downloadProgress || 'Memproses...'
                : `Download ${gridConfig.total} Potongan (.ZIP)`}
            </span>
          </Button>
        </div>
      </div>

      {/* Right Column: Visual Slicing Preview */}
      <div className="space-y-4 lg:col-span-7">
        <div className="border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Pratinjau Urutan Upload Instagram
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Angka menunjukkan urutan posting (Mulai dari #1 di pojok kanan bawah).
              </p>
            </div>
            {imageSrc && (
              <span className="font-mono text-[11px] font-bold text-primary">
                {gridConfig.cols} Kolom x {gridConfig.rows} Baris ({gridConfig.total} Kotak)
              </span>
            )}
          </div>

          {/* Interactive Slicing Visual Grid */}
          {imageSrc ? (
            <div className="relative mx-auto max-w-[500px] border-2 border-foreground bg-muted overflow-hidden shadow-sm">
              <img src={imageSrc} alt="Preview Poster" className="block w-full h-auto select-none" />

              {/* Grid Overlay Slices */}
              <div
                className="absolute inset-0 grid pointer-events-none"
                style={{
                  gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: gridConfig.total }).map((_, idx) => {
                  const row = Math.floor(idx / gridConfig.cols);
                  const col = idx % gridConfig.cols;
                  // Compute IG post order (bottom-right is #1)
                  const reverseRow = gridConfig.rows - 1 - row;
                  const reverseCol = gridConfig.cols - 1 - col;
                  const postIndex = reverseRow * gridConfig.cols + reverseCol + 1;

                  return (
                    <div
                      key={idx}
                      className="relative border border-dashed border-white/80 bg-black/30 flex items-center justify-center p-2 backdrop-blur-[0.5px]"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background font-mono text-xs font-bold shadow-md">
                        #{postIndex}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex aspect-square max-w-[500px] mx-auto flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-8 text-center">
              <Grid className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Belum Ada Gambar yang Dipilih
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Unggah poster atau banner acara Anda di kolom sebelah kiri untuk melihat simulasi potongan grid.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
