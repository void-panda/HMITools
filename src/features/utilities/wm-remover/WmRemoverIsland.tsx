import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Eraser,
  Upload,
  Download,
  RotateCcw,
  Sliders,
  Check,
  RefreshCw,
  Trash2,
  Brush,
  Undo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// Advanced Multi-Pass Boundary Distance-Weighted Inpainting
function inpaintAdvanced(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maskCanvas: HTMLCanvasElement,
  iterations: number = 45
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!maskCtx) return;
  const maskData = maskCtx.getImageData(0, 0, width, height).data;

  // Identify masked pixels (where alpha > 40 in mask canvas)
  const isMasked = new Uint8Array(width * height);
  let totalMasked = 0;
  for (let i = 0; i < width * height; i++) {
    if (maskData[i * 4 + 3] > 40) {
      isMasked[i] = 1;
      totalMasked++;
    }
  }

  if (totalMasked === 0) return;

  // Pre-fill masked pixels with boundary averages
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isMasked[idx] === 1) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const searchRadius = 4;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (isMasked[nIdx] === 0) {
                const distSq = dx * dx + dy * dy || 1;
                const weight = 1 / distSq;
                const p = nIdx * 4;
                rSum += data[p] * weight;
                gSum += data[p + 1] * weight;
                bSum += data[p + 2] * weight;
                count += weight;
              }
            }
          }
        }

        if (count > 0) {
          const pIdx = idx * 4;
          data[pIdx] = Math.round(rSum / count);
          data[pIdx + 1] = Math.round(gSum / count);
          data[pIdx + 2] = Math.round(bSum / count);
        }
      }
    }
  }

  // Iterative PDE harmonic diffusion to seamlessly blend gradients
  const bufferR = new Float32Array(width * height);
  const bufferG = new Float32Array(width * height);
  const bufferB = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    bufferR[i] = data[p];
    bufferG[i] = data[p + 1];
    bufferB[i] = data[p + 2];
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (isMasked[idx] === 1) {
          // 4-connected Laplacian smoothing
          bufferR[idx] = (bufferR[idx - 1] + bufferR[idx + 1] + bufferR[idx - width] + bufferR[idx + width]) * 0.25;
          bufferG[idx] = (bufferG[idx - 1] + bufferG[idx + 1] + bufferG[idx - width] + bufferG[idx + width]) * 0.25;
          bufferB[idx] = (bufferB[idx - 1] + bufferB[idx + 1] + bufferB[idx - width] + bufferB[idx + width]) * 0.25;
        }
      }
    }
  }

  // Write back to canvas image data
  for (let i = 0; i < width * height; i++) {
    if (isMasked[i] === 1) {
      const p = i * 4;
      data[p] = Math.round(bufferR[i]);
      data[p + 1] = Math.round(bufferG[i]);
      data[p + 2] = Math.round(bufferB[i]);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function WmRemoverIsland() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasMask, setHasMask] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Global reset listener
  useEffect(() => {
    const onReset = () => {
      setSourceImage(null);
      setImageName('');
      setHistory([]);
      setHasMask(false);
      setBrushSize(25);
      toast.info('Laman Hapus Watermark berhasil direset!');
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
      setHistory([]);
      setHasMask(false);
      toast.success(`Gambar "${file.name}" berhasil dimuat.`);
    };
    img.src = url;
  };

  // Init and draw image to display canvas & reset mask canvas
  const resetCanvases = useCallback(() => {
    if (!sourceImage) return;
    const width = sourceImage.width;
    const height = sourceImage.height;

    const displayCanvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!displayCanvas || !maskCanvas) return;

    displayCanvas.width = width;
    displayCanvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;

    const dCtx = displayCanvas.getContext('2d');
    const mCtx = maskCanvas.getContext('2d');
    if (dCtx && mCtx) {
      dCtx.drawImage(sourceImage, 0, 0);
      mCtx.clearRect(0, 0, width, height);
      setHasMask(false);
    }
  }, [sourceImage]);

  useEffect(() => {
    if (sourceImage) {
      resetCanvases();
    }
  }, [sourceImage, resetCanvases]);

  // Drawing Mask handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !sourceImage) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = sourceImage.width / rect.width;
    const scaleY = sourceImage.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sourceImage) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);

    const mCtx = maskCanvasRef.current?.getContext('2d');
    if (mCtx) {
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.strokeStyle = 'rgba(239, 68, 68, 0.65)'; // Red semi-transparent mask
      mCtx.lineWidth = brushSize;
      mCtx.beginPath();
      mCtx.moveTo(x, y);
      mCtx.lineTo(x, y);
      mCtx.stroke();
      setHasMask(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !sourceImage) return;
    const { x, y } = getCanvasCoords(e);

    const mCtx = maskCanvasRef.current?.getContext('2d');
    if (mCtx) {
      mCtx.lineTo(x, y);
      mCtx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearMask = () => {
    if (!maskCanvasRef.current || !sourceImage) return;
    const mCtx = maskCanvasRef.current.getContext('2d');
    if (mCtx) {
      mCtx.clearRect(0, 0, sourceImage.width, sourceImage.height);
      setHasMask(false);
    }
  };

  // Run Inpainting Algorithm
  const handleExecuteInpaint = () => {
    const displayCanvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!displayCanvas || !maskCanvas || !sourceImage) return;

    setIsProcessing(true);

    const dCtx = displayCanvas.getContext('2d', { willReadFrequently: true });
    if (!dCtx) return;

    // Save snapshot to history for Undo
    const prevSnapshot = dCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    setHistory((prev) => [...prev, prevSnapshot]);

    setTimeout(() => {
      inpaintAdvanced(dCtx, sourceImage.width, sourceImage.height, maskCanvas, 50);
      handleClearMask();
      setIsProcessing(false);
      toast.success('Pembersihan objek/watermark selesai!');
    }, 50);
  };

  const handleUndo = () => {
    if (history.length === 0 || !displayCanvasRef.current || !sourceImage) return;
    const lastState = history[history.length - 1];
    const dCtx = displayCanvasRef.current.getContext('2d');
    if (dCtx && lastState) {
      dCtx.putImageData(lastState, 0, 0);
      setHistory((prev) => prev.slice(0, prev.length - 1));
      handleClearMask();
      toast.info('Perubahan dibatalkan (Undo).');
    }
  };

  const handleDownload = () => {
    if (!displayCanvasRef.current) return;
    const a = document.createElement('a');
    a.href = displayCanvasRef.current.toDataURL('image/png');
    a.download = `${imageName}-cleaned.png`;
    a.click();
    toast.success('Gambar hasil pembersihan berhasil diunduh!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Controls */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Card */}
          <div className="border bg-card p-4 sm:p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Upload Gambar / Dokumen
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
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
                {sourceImage ? 'Ganti Gambar' : 'Pilih Gambar Ber-Watermark'}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                PNG, JPG, WebP • Hapus cap, tanggal, noda, teks
              </p>
            </div>
          </div>

          {/* Brush Controls & Inpaint Button */}
          {sourceImage && (
            <div className="border bg-card p-4 sm:p-5 space-y-5">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Brush className="h-3.5 w-3.5 text-primary" />
                <span>2. Kuas Area Watermark</span>
              </h3>

              {/* Brush Size Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-semibold text-foreground">Ukuran Kuas:</Label>
                  <span className="font-mono font-bold text-primary">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  min={6}
                  max={64}
                  step={2}
                  onValueChange={(val) => setBrushSize(val[0])}
                  className="w-full"
                />
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Kecil (6px)</span>
                  <span>Sedang (24px)</span>
                  <span>Besar (64px)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleExecuteInpaint}
                  disabled={!hasMask || isProcessing}
                  className="w-full gap-2 font-mono text-xs cursor-pointer"
                >
                  <Eraser className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Menghapus Watermark...' : 'Hapus Watermark Terpilih'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 font-mono text-xs cursor-pointer"
                  >
                    <Undo className="h-3.5 w-3.5" />
                    <span>Undo</span>
                  </Button>
                  <Button
                    onClick={handleClearMask}
                    disabled={!hasMask}
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Kuas</span>
                  </Button>
                </div>
              </div>

              <div className="border-t pt-3 font-mono text-[10px] text-muted-foreground leading-relaxed">
                💡 <strong>Tips:</strong> Warnai area cap atau watermark dengan kuas merah, lalu klik tombol hapus.
              </div>
            </div>
          )}
        </div>

        {/* Right Canvas Workspace */}
        <div className="space-y-4 lg:col-span-2">
          {sourceImage ? (
            <div className="space-y-4">
              {/* Workspace Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border bg-card p-3 sm:p-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate max-w-[200px]">{imageName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{sourceImage.width}×{sourceImage.height}px</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={resetCanvases}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-mono text-xs cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Muat Ulang Asli</span>
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="gap-1.5 font-mono text-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh Gambar Bersih</span>
                  </Button>
                </div>
              </div>

              {/* Interactive Canvas Viewport */}
              <div className="border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>Goreskan kuas pada teks / watermark yang ingin dihilangkan</span>
                  {hasMask && <span className="text-destructive font-bold">Mask Aktif</span>}
                </div>

                <div className="relative border bg-muted/40 overflow-hidden flex items-center justify-center cursor-crosshair min-h-[400px]">
                  {/* Underneath: Render Canvas */}
                  <canvas
                    ref={displayCanvasRef}
                    className="max-h-[550px] max-w-full object-contain"
                  />
                  {/* Top: Mask Drawing Canvas Overlay */}
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="absolute inset-0 m-auto max-h-[550px] max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-border p-16 text-center bg-card">
              <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                <Eraser className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-foreground">Belum Ada Gambar yang Dimuat</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Unggah dokumen pindaian, slide materi kuliah, atau foto untuk menghapus watermark dan noda teks yang mengganggu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
