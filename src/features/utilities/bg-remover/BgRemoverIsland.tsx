import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Trash2,
  Layers,
  Pipette,
  Undo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

type PresetColor = 'transparent' | 'red' | 'blue' | 'white' | 'custom';

export function BgRemoverIsland() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [tolerance, setTolerance] = useState<number>(35);
  const [feather, setFeather] = useState<number>(2);
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [bgPreset, setBgPreset] = useState<PresetColor>('transparent');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sampleCoords, setSampleCoords] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  // Global reset listener
  useEffect(() => {
    const onReset = () => {
      setSourceImage(null);
      setImageName('');
      setTolerance(35);
      setFeather(2);
      setKeyColor(null);
      setBgPreset('transparent');
      setResultUrl(null);
      toast.info('Laman Hapus Background berhasil direset!');
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      // Auto-sample the top-left corner pixel as default background key color
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
        setSampleCoords({ x: 0, y: 0 });
      }
      toast.success(`Gambar "${file.name}" berhasil dimuat.`);
    };
    img.src = url;
  };

  // Color distance Euclidean in RGB space
  const colorDistance = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
  ): number => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const [removalMode, setRemovalMode] = useState<'smart_flood' | 'global_chroma'>('global_chroma');

  // Process Background Removal using flood fill / global chroma + feathering
  const processImage = useCallback(() => {
    if (!sourceImage || !keyColor) return;
    setIsProcessing(true);

    const width = sourceImage.width;
    const height = sourceImage.height;

    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw original image
    ctx.drawImage(sourceImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    // Scale distance threshold
    const maxDist = (tolerance / 100) * 350; // threshold
    const featherBand = Math.max(4, feather * 6); // smooth alpha transition range

    if (removalMode === 'global_chroma') {
      // Global chroma keying with smooth alpha ramp
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const dist = colorDistance(
          data[idx],
          data[idx + 1],
          data[idx + 2],
          keyColor.r,
          keyColor.g,
          keyColor.b
        );

        if (dist <= maxDist) {
          // Inside key color threshold
          if (dist <= maxDist - featherBand) {
            data[idx + 3] = 0; // completely transparent
          } else {
            // Smooth edge alpha falloff
            const alphaRatio = (dist - (maxDist - featherBand)) / featherBand;
            data[idx + 3] = Math.round(data[idx + 3] * Math.max(0, Math.min(1, alphaRatio)));
          }
        }
      }
    } else {
      // BFS Flood Fill from corners & edges
      const visited = new Uint8Array(width * height);
      const queue: number[] = [];

      const seeds = [
        0,
        width - 1,
        (height - 1) * width,
        (height - 1) * width + (width - 1),
        Math.floor(width / 2),
        (height - 1) * width + Math.floor(width / 2),
      ];

      if (sampleCoords) {
        seeds.push(sampleCoords.y * width + sampleCoords.x);
      }

      seeds.forEach((seed) => {
        const idx = seed * 4;
        const dist = colorDistance(
          data[idx],
          data[idx + 1],
          data[idx + 2],
          keyColor.r,
          keyColor.g,
          keyColor.b
        );
        if (dist <= maxDist && visited[seed] === 0) {
          visited[seed] = 1;
          queue.push(seed);
        }
      });

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = Math.floor(curr / width);

        const neighbors = [
          cx > 0 ? curr - 1 : -1,
          cx < width - 1 ? curr + 1 : -1,
          cy > 0 ? curr - width : -1,
          cy < height - 1 ? curr + width : -1,
        ];

        for (let i = 0; i < neighbors.length; i++) {
          const n = neighbors[i];
          if (n >= 0 && visited[n] === 0) {
            const nIdx = n * 4;
            const dist = colorDistance(
              data[nIdx],
              data[nIdx + 1],
              data[nIdx + 2],
              keyColor.r,
              keyColor.g,
              keyColor.b
            );

            if (dist <= maxDist) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }
      }

      for (let i = 0; i < width * height; i++) {
        if (visited[i] === 1) {
          data[i * 4 + 3] = 0;
        }
      }
    }

    // Apply new background color preset if not transparent
    if (bgPreset !== 'transparent') {
      let bgR = 255;
      let bgG = 255;
      let bgB = 255;

      if (bgPreset === 'red') {
        bgR = 219;
        bgG = 21;
        bgB = 20; // Official Pas Foto Merah (#db1514)
      } else if (bgPreset === 'blue') {
        bgR = 11;
        bgG = 102;
        bgB = 195; // Official Pas Foto Biru (#0b66c3)
      } else if (bgPreset === 'white') {
        bgR = 255;
        bgG = 255;
        bgB = 255;
      } else if (bgPreset === 'custom') {
        const hex = customBgColor.replace('#', '');
        bgR = parseInt(hex.substring(0, 2), 16) || 255;
        bgG = parseInt(hex.substring(2, 4), 16) || 255;
        bgB = parseInt(hex.substring(4, 6), 16) || 255;
      }

      const compCanvas = document.createElement('canvas');
      compCanvas.width = width;
      compCanvas.height = height;
      const compCtx = compCanvas.getContext('2d');
      if (compCtx) {
        compCtx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        compCtx.fillRect(0, 0, width, height);

        ctx.putImageData(imgData, 0, 0);
        compCtx.drawImage(canvas, 0, 0);

        const url = compCanvas.toDataURL('image/png');
        setResultUrl(url);
        setIsProcessing(false);
        return;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const url = canvas.toDataURL('image/png');
    setResultUrl(url);
    setIsProcessing(false);
  }, [sourceImage, keyColor, tolerance, feather, removalMode, bgPreset, customBgColor, sampleCoords]);

  useEffect(() => {
    if (sourceImage && keyColor) {
      processImage();
    }
  }, [sourceImage, keyColor, tolerance, feather, removalMode, bgPreset, customBgColor, processImage]);

  // Click on source canvas to pick background color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sourceCanvasRef.current;
    if (!canvas || !sourceImage) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = sourceImage.width / rect.width;
    const scaleY = sourceImage.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    setSampleCoords({ x, y });
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${imageName}-no-bg.png`;
    a.click();
    toast.success('Gambar tanpa latar belakang berhasil diunduh!');
  };

  const handleCopyClipboard = async () => {
    if (!outputCanvasRef.current) return;
    try {
      outputCanvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Gambar disalin ke clipboard!');
      });
    } catch {
      toast.error('Gagal menyalin gambar ke clipboard.');
    }
  };

  // Draw preview of source canvas
  useEffect(() => {
    if (sourceImage && sourceCanvasRef.current) {
      const canvas = sourceCanvasRef.current;
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceImage, 0, 0);
      }
    }
  }, [sourceImage]);

  return (
    <div className="space-y-6">
      {/* Upload & Control Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Control Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Box */}
          <div className="border bg-card p-4 sm:p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Upload Foto
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center border bg-muted text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold text-foreground">
                {sourceImage ? 'Ganti Foto' : 'Pilih Foto / Gambar'}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                JPG, PNG, WebP • Pas foto, potret, twibbon
              </p>
            </div>
          </div>

          {/* Adjustments & Parameters */}
          {sourceImage && (
            <div className="border bg-card p-4 sm:p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  <span>2. Pengaturan Segmentasi</span>
                </h3>
              </div>

              {/* Pipette sample indicator */}
              {keyColor && (
                <div className="flex items-center justify-between border bg-background p-2.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Pipette className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground text-[11px]">Warna Target:</span>
                    <div
                      className="h-4 w-4 border border-border"
                      style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Klik foto untuk pilih warna
                  </span>
                </div>
              )}

              {/* Removal Mode Strategy Switch */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Metode Penghapusan:</Label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setRemovalMode('global_chroma')}
                    className={`border py-1.5 px-2 text-center cursor-pointer ${
                      removalMode === 'global_chroma'
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Chroma Studio (Pas Foto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemovalMode('smart_flood')}
                    className={`border py-1.5 px-2 text-center cursor-pointer ${
                      removalMode === 'smart_flood'
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Flood Fill (Tepi Objek)
                  </button>
                </div>
              </div>

              {/* Tolerance Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-semibold text-foreground">Toleransi Warna:</Label>
                  <span className="font-mono font-bold text-primary">{tolerance}%</span>
                </div>
                <Slider
                  value={[tolerance]}
                  min={5}
                  max={80}
                  step={1}
                  onValueChange={(val) => setTolerance(val[0])}
                  className="w-full"
                />
              </div>

              {/* Edge Feathering Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-semibold text-foreground">Kehalusan Tepi (Feather):</Label>
                  <span className="font-mono font-bold text-primary">{feather} px</span>
                </div>
                <Slider
                  value={[feather]}
                  min={0}
                  max={8}
                  step={1}
                  onValueChange={(val) => setFeather(val[0])}
                  className="w-full"
                />
              </div>

              {/* Background Color Replacement */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Ganti Warna Latar:</Label>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                  <button
                    onClick={() => setBgPreset('transparent')}
                    className={`border py-1.5 text-center transition-colors cursor-pointer ${
                      bgPreset === 'transparent'
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    Transparan
                  </button>
                  <button
                    onClick={() => setBgPreset('red')}
                    className={`border py-1.5 text-center transition-colors cursor-pointer ${
                      bgPreset === 'red'
                        ? 'border-destructive bg-destructive text-white font-bold'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    🔴 Merah
                  </button>
                  <button
                    onClick={() => setBgPreset('blue')}
                    className={`border py-1.5 text-center transition-colors cursor-pointer ${
                      bgPreset === 'blue'
                        ? 'border-blue-600 bg-blue-600 text-white font-bold'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    🔵 Biru
                  </button>
                  <button
                    onClick={() => setBgPreset('white')}
                    className={`border py-1.5 text-center transition-colors cursor-pointer ${
                      bgPreset === 'white'
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    ⚪ Putih
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Column */}
        <div className="space-y-4 lg:col-span-2">
          {sourceImage ? (
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border bg-card p-3 sm:p-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate max-w-[200px]">{imageName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{sourceImage.width}×{sourceImage.height}px</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopyClipboard}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-mono text-xs cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="gap-1.5 font-mono text-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh PNG</span>
                  </Button>
                </div>
              </div>

              {/* Visual Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original with Pipette Trigger */}
                <div className="border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span className="font-bold uppercase text-foreground">Foto Asli</span>
                    <span>Klik area latar untuk sampling</span>
                  </div>
                  <div className="relative aspect-square border overflow-hidden bg-muted flex items-center justify-center cursor-crosshair">
                    <canvas
                      ref={sourceCanvasRef}
                      onClick={handleCanvasClick}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Processed Output */}
                <div className="border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span className="font-bold uppercase text-foreground">Hasil Pemotongan</span>
                    <span>PNG Transparan</span>
                  </div>
                  <div
                    className="relative aspect-square border overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage:
                        bgPreset === 'transparent'
                          ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)'
                          : 'none',
                      backgroundSize: '16px 16px',
                    }}
                  >
                    <canvas
                      ref={outputCanvasRef}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-border p-16 text-center bg-card">
              <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-foreground">Belum Ada Foto yang Dimuat</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Unggah foto pas foto ijazah, foto narasumber, atau gambar objek untuk menghapus latar belakang secara instan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
