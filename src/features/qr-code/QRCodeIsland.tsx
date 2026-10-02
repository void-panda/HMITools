import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Download,
  Link as LinkIcon,
  Type,
  Wifi,
  Image as ImageIcon,
  Copy,
  Check,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function QRCodeIsland() {
  const [qrType, setQrType] = useState<'url' | 'text' | 'wifi'>('url');
  const [textValue, setTextValue] = useState<string>('https://hmit.or.id/presensi');
  const [wifiSsid, setWifiSsid] = useState<string>('WiFi_Kampus');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Appearance
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoName, setLogoName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute payload string
  const rawPayload = React.useMemo(() => {
    if (qrType === 'url' || qrType === 'text') {
      return textValue.trim() || 'https://hmit.or.id';
    }
    if (qrType === 'wifi') {
      return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
    }
    return textValue;
  }, [qrType, textValue, wifiSsid, wifiPass, wifiType]);

  // Generate QR Code onto canvas
  const renderQRCode = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !rawPayload) return;

    try {
      // Dynamic import qrcode per react-patterns rule
      const QRCode = (await import('qrcode')).default;
      const size = 600;
      canvas.width = size;
      canvas.height = size;

      await QRCode.toCanvas(canvas, rawPayload, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H', // High error correction to support center logo
      });

      // Draw Center Logo if present (preserving exact 1:1 aspect ratio)
      if (logoImg) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const maxLogoBox = size * 0.22;
          const padding = 6;
          const bgBox = maxLogoBox + padding * 2;
          const boxCenter = (size - bgBox) / 2;

          // Draw backdrop for logo
          ctx.fillStyle = bgColor;
          ctx.fillRect(boxCenter, boxCenter, bgBox, bgBox);
          ctx.strokeStyle = fgColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(boxCenter, boxCenter, bgBox, bgBox);

          // Calculate aspect-ratio fit
          const imgAspect = logoImg.width / (logoImg.height || 1);
          let drawW = maxLogoBox;
          let drawH = maxLogoBox;

          if (imgAspect > 1) {
            drawH = maxLogoBox / imgAspect;
          } else {
            drawW = maxLogoBox * imgAspect;
          }

          const drawX = (size - drawW) / 2;
          const drawY = (size - drawH) / 2;

          ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
        }
      }
    } catch (err) {
      console.error('QR Render Error:', err);
    }
  }, [rawPayload, fgColor, bgColor, logoImg]);

  useEffect(() => {
    renderQRCode();
  }, [renderQRCode]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setLogoImg(img);
        setLogoName(file.name);
        toast.success(`Logo "${file.name}" berhasil dimuat.`);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QRCode_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('QR Code berhasil diunduh!');
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Gambar QR Code disalin ke clipboard!');
      } catch {
        toast.error('Gagal menyalin gambar ke clipboard.');
      }
    });
  };

  const handleResetToDefault = () => {
    setQrType('url');
    setTextValue('https://hmit.or.id/presensi');
    setWifiSsid('WiFi_Kampus');
    setWifiPass('');
    setWifiType('WPA');
    setFgColor('#000000');
    setBgColor('#ffffff');
    setLogoImg(null);
    setLogoName('');
    toast.info('Pengaturan QR Code direset ke nilai default!');
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
      {/* Left Column: Form & Configuration */}
      <div className="space-y-6 lg:col-span-6">
        {/* Step 1: Content Type */}
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                1
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Tipe Konten QR Code
              </h2>
            </div>

            <span className="font-mono text-[11px] text-muted-foreground uppercase">
              {qrType}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setQrType('url')}
              className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                qrType === 'url'
                  ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link URL</span>
            </button>
            <button
              type="button"
              onClick={() => setQrType('text')}
              className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                qrType === 'text'
                  ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Teks Bebas</span>
            </button>
            <button
              type="button"
              onClick={() => setQrType('wifi')}
              className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                qrType === 'wifi'
                  ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>WiFi Config</span>
            </button>
          </div>

          {/* Form Inputs */}
          {qrType === 'url' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tautan / Link URL</Label>
              <Input
                type="url"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="https://forms.gle/... atau link GDrive"
                className="font-mono text-xs"
              />
            </div>
          )}

          {qrType === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pesan / Teks Bebas</Label>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={3}
                placeholder="Tuliskan nomor kontak, ID presensi, atau pesan teks..."
                className="w-full border border-input bg-background p-2.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {qrType === 'wifi' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Jaringan (SSID)</Label>
                <Input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Nama WiFi Ruangan / Acara"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kata Sandi (Password)</Label>
                <Input
                  type="text"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="Kosongkan jika tanpa password"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Custom Appearance & Logo */}
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Warna & Sisipkan Logo
            </h2>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Warna QR (Foreground)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-8 w-12 border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs">{fgColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Warna Background</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-12 border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Logo Center Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Logo Tengah (Opsional)</Label>
              {logoImg && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoImg(null);
                    setLogoName('');
                  }}
                  className="font-mono text-[10px] text-destructive hover:underline cursor-pointer"
                >
                  Hapus Logo
                </button>
              )}
            </div>
            <label className="flex h-16 w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-border bg-background p-3 text-xs text-muted-foreground hover:border-primary hover:bg-muted/50">
              <ImageIcon className="h-4 w-4" />
              <span>{logoName || 'Upload PNG Logo Acara / HMIT'}</span>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Live QR Preview & Actions */}
      <div className="space-y-4 lg:col-span-6">
        <div className="border bg-card p-6 flex flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Pratinjau QR Code
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Error Correction level High (H) aktif untuk menjaga keterbacaan scan.
            </p>
          </div>

          {/* QR Canvas 1:1 */}
          <div className="border-2 border-foreground bg-white p-3 sm:p-4 shadow-sm flex items-center justify-center aspect-square w-64 max-w-full">
            <canvas ref={canvasRef} className="w-full h-full aspect-square block object-contain" />
          </div>

          {/* Download & Copy Buttons */}
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Button
              type="button"
              size="lg"
              onClick={handleDownloadPNG}
              className="w-full gap-2 font-bold uppercase tracking-wider"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Gambar PNG</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyImage}
              className="w-full gap-2 font-mono text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Gambar ke Clipboard'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
