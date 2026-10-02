import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  RotateCw,
  ZoomIn,
  Download,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Move,
  Share2,
  Copy,
  Tag,
  Check,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  type TwibbonCampaign,
  PRESET_CAMPAIGNS,
  generateCampaignId,
  saveCampaign,
  getCampaign,
  getAllCampaigns,
  deleteCampaign,
} from './campaignStorage';

export function TwibbonIsland() {
  // Mode: 'creator' (Panitia) or 'participant' (Peserta Event)
  const [viewMode, setViewMode] = useState<'creator' | 'participant'>('creator');
  const [activeCampaignId, setActiveCampaignId] = useState<string>('');

  // Form State for Panitia
  const [title, setTitle] = useState<string>('HMIT Festival 2026');
  const [organizer, setOrganizer] = useState<string>('Himpunan Mahasiswa Informatika');
  const [caption, setCaption] = useState<string>(
    'Saya siap menyemarakkan HMIT Festival 2026! 🚀🔥 Mari bertumbuh dan berinovasi bersama insan teknologi. #BanggaHMIT #HMITFest2026 #InformatikaJaya'
  );
  const [frameDataUrl, setFrameDataUrl] = useState<string>(PRESET_CAMPAIGNS[0].frameDataUrl);
  const [frameName, setFrameName] = useState<string>('Preset: HMIT Festival 2026');

  // Saved campaigns list for Panitia
  const [savedCampaigns, setSavedCampaigns] = useState<TwibbonCampaign[]>([]);

  // Generated shareable short link
  const [generatedShortUrl, setGeneratedShortUrl] = useState<string>('');
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);
  const [captionCopied, setCaptionCopied] = useState<boolean>(false);

  // Participant State
  const [participantCampaign, setParticipantCampaign] = useState<TwibbonCampaign | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoName, setPhotoName] = useState<string>('');

  // Canvas Frame Image object
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);

  // Photo transform controls
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [exportRes, setExportRes] = useState<1080 | 2048>(1080);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Dragging refs
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  offsetRef.current = offset;

  // Load initial campaign data and list on mount
  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;

      // Refresh saved campaigns
      const all = await getAllCampaigns();
      setSavedCampaigns(all);

      // Check URL query params for short UUID (?c=... or ?id=...)
      const params = new URLSearchParams(window.location.search);
      const campaignId = params.get('c') || params.get('id') || params.get('campaign');

      if (campaignId) {
        const found = await getCampaign(campaignId);
        if (found) {
          setParticipantCampaign(found);
          setActiveCampaignId(found.id);
          setViewMode('participant');

          // Load frame image
          const img = new Image();
          img.src = found.frameDataUrl;
          img.onload = () => setFrameImg(img);
          return;
        }
      }

      // Default: Creator Mode for Panitia
      setViewMode('creator');
      const defaultImg = new Image();
      defaultImg.src = PRESET_CAMPAIGNS[0].frameDataUrl;
      defaultImg.onload = () => setFrameImg(defaultImg);
    };

    init();
  }, []);

  // Global reset listener
  useEffect(() => {
    const onReset = () => {
      const defaultPreset = PRESET_CAMPAIGNS[0];
      if (defaultPreset) {
        handleSelectPreset(defaultPreset);
        toast.info('Form event direset ke preset default!');
      }
    };
    window.addEventListener('hmitools:reset-default', onReset);
    return () => window.removeEventListener('hmitools:reset-default', onReset);
  }, []);

  // Update canvas when photo or frame changes
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Checkerboard background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Grid center lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Draw user photo if in participant mode
    if (photoImg) {
      ctx.save();
      ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const pw = photoImg.width;
      const ph = photoImg.height;
      const aspect = pw / ph;

      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawW = size * aspect;
      } else {
        drawH = size / aspect;
      }

      ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(30, 30, size - 60, size - 60);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        viewMode === 'participant' ? 'Unggah Foto Anda untuk Memulai' : 'Area Pratinjau Foto Peserta',
        size / 2,
        size / 2 - 8
      );
      ctx.font = '11px sans-serif';
      ctx.fillText('Format bingkai 1:1 transparan', size / 2, size / 2 + 14);
    }

    // Draw frame overlay on top
    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, size, size);
    }
  }, [photoImg, frameImg, zoom, rotation, offset, viewMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle Panitia Frame Upload (PNG)
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFrameDataUrl(dataUrl);
      setFrameName(file.name);

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        setFrameImg(img);
        toast.success(`Bingkai panitia "${file.name}" berhasil dimuat.`);
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle preset select
  const handleSelectPreset = (preset: TwibbonCampaign) => {
    setTitle(preset.title);
    setOrganizer(preset.organizer);
    setCaption(preset.caption);
    setFrameDataUrl(preset.frameDataUrl);
    setFrameName(`Preset: ${preset.title}`);

    const img = new Image();
    img.src = preset.frameDataUrl;
    img.onload = () => {
      setFrameImg(img);
      toast.success(`Preset "${preset.title}" diterapkan!`);
    };
  };

  // Publish / Create Campaign with Short UUID
  const handlePublishCampaign = async () => {
    if (!title.trim()) {
      toast.error('Harap isi nama event / kegiatan.');
      return;
    }
    if (!frameDataUrl) {
      toast.error('Harap unggah bingkai PNG transparan.');
      return;
    }

    const shortId = generateCampaignId();
    const newCampaign: TwibbonCampaign = {
      id: shortId,
      title: title.trim(),
      organizer: organizer.trim() || 'Panitia Acara',
      caption: caption.trim(),
      frameDataUrl,
      createdAt: Date.now(),
    };

    await saveCampaign(newCampaign);

    const all = await getAllCampaigns();
    setSavedCampaigns(all);
    setActiveCampaignId(shortId);

    // Build short URL: http://localhost:4321/tools/twibbon?c=c-xxxxxx
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('c', shortId);
    const shortUrlString = url.toString();
    setGeneratedShortUrl(shortUrlString);

    try {
      await navigator.clipboard.writeText(shortUrlString);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
      toast.success('Campaign diterbitkan! Link pendek peserta telah disalin ke clipboard.');
    } catch {
      toast.success('Campaign berhasil diterbitkan!');
    }
  };

  // Copy share link
  const handleCopyLink = async (id: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('c', id);
    const urlStr = url.toString();

    try {
      await navigator.clipboard.writeText(urlStr);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2500);
      toast.success(`Link pendek "${id}" disalin ke clipboard!`);
    } catch {
      toast.error('Gagal menyalin link.');
    }
  };

  // Delete saved campaign
  const handleDeleteCampaign = async (id: string) => {
    await deleteCampaign(id);
    const all = await getAllCampaigns();
    setSavedCampaigns(all);
    toast.info('Campaign dihapus dari penyimpanan.');
  };

  // Open Participant Simulation
  const handleOpenParticipantView = (campaign: TwibbonCampaign) => {
    setParticipantCampaign(campaign);
    setActiveCampaignId(campaign.id);
    setViewMode('participant');

    // Update browser URL without full reload
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `?c=${campaign.id}`);
    }

    const img = new Image();
    img.src = campaign.frameDataUrl;
    img.onload = () => setFrameImg(img);
    toast.info(`Membuka laman peserta: "${campaign.title}"`);
  };

  // Participant Mode: Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setPhotoImg(img);
        setPhotoName(file.name);
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
        toast.success(`Foto "${file.name}" berhasil diunggah.`);
      };
    };
    reader.readAsDataURL(file);
  };

  // Canvas Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX - offsetRef.current.x, y: touch.clientY - offsetRef.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // High Resolution Export Download
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = exportRes;
      offscreen.height = exportRes;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const scaleFactor = exportRes / 500;

      // Background fill
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportRes, exportRes);

      // Draw Photo
      if (photoImg) {
        ctx.save();
        ctx.translate(exportRes / 2 + offset.x * scaleFactor, exportRes / 2 + offset.y * scaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const pw = photoImg.width;
        const ph = photoImg.height;
        const aspect = pw / ph;

        let drawW = exportRes;
        let drawH = exportRes;
        if (aspect > 1) {
          drawW = exportRes * aspect;
        } else {
          drawH = exportRes / aspect;
        }

        ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Draw Frame Overlay
      if (frameImg) {
        ctx.drawImage(frameImg, 0, 0, exportRes, exportRes);
      }

      const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = offscreen.toDataURL(mimeType, 0.95);

      const cleanFileName = (participantCampaign?.title || 'Twibbon')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      const link = document.createElement('a');
      link.download = `${cleanFileName}_${Date.now()}.${exportFormat}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Twibbon HD (${exportRes}x${exportRes}px) berhasil diunduh!`);
    } catch {
      toast.error('Gagal mengekspor Twibbon.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy Caption
  const handleCopyCaption = async () => {
    const text = participantCampaign?.caption || caption;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2500);
      toast.success('Caption & hashtag berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin caption.');
    }
  };

  // Return to Panitia Creator
  const handleBackToCreator = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname);
    }
    setViewMode('creator');
    setParticipantCampaign(null);
    setPhotoImg(null);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          VIEW 1: PARTICIPANT LANDING PAGE (Ketika Peserta Akses Link ?c=...)
      ========================================================================= */}
      {viewMode === 'participant' && participantCampaign ? (
        <div className="space-y-6">
          {/* Header Banner Event */}
          <div className="border border-border bg-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-primary/20">
                  Official Twibbon Event
                </span>
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {participantCampaign.organizer}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                {participantCampaign.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Silakan unggah foto terbaik Anda, posisikan ke dalam bingkai, lalu unduh twibbon siap posting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {participantCampaign.caption && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCaption}
                  className="gap-1.5 font-mono text-xs border-primary/40 hover:bg-primary/10"
                >
                  {captionCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Tag className="h-3.5 w-3.5 text-primary" />}
                  <span>{captionCopied ? 'Caption Tersalin!' : 'Salin Caption IG'}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToCreator}
                className="gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Portal Panitia</span>
              </Button>
            </div>
          </div>

          {/* Social Media Caption Box */}
          {participantCampaign.caption && (
            <div className="border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Template Caption & Hashtag Resmi:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="font-mono text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> {captionCopied ? 'Tersalin!' : 'Klik Salin'}
                </button>
              </div>
              <div className="bg-muted/40 p-3 border font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap select-all">
                {participantCampaign.caption}
              </div>
            </div>
          )}

          {/* Main Photo Editor */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Photo Upload & Controls */}
            <div className="space-y-6 lg:col-span-5">
              {/* Step 1: Upload Foto */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                    1
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Unggah Foto Pribadi
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Foto Anda (JPG / PNG)</Label>
                    {photoName && <span className="font-mono text-[10px] text-primary truncate max-w-[150px]">{photoName}</span>}
                  </div>
                  <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <span className="mt-2 text-xs font-bold text-foreground">
                      {photoImg ? 'Ganti Foto' : 'Pilih Foto dari HP / Komputer'}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Tarik dan letakkan foto ke sini</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Step 2: Sesuaikan Posisi */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                      2
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Sesuaikan Posisi & Zoom
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setRotation(0);
                      setOffset({ x: 0, y: 0 });
                      toast.info('Posisi foto direset.');
                    }}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ZoomIn className="h-3.5 w-3.5" /> Skala Zoom:
                      </span>
                      <span className="font-bold">{zoom.toFixed(2)}x</span>
                    </div>
                    <Slider
                      value={[zoom]}
                      min={0.2}
                      max={3}
                      step={0.05}
                      onValueChange={(val) => setZoom(val[0])}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <RotateCw className="h-3.5 w-3.5" /> Rotasi Sudut:
                      </span>
                      <span className="font-bold">{rotation}°</span>
                    </div>
                    <Slider
                      value={[rotation]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={(val) => setRotation(val[0])}
                    />
                  </div>

                  <div className="flex items-center gap-2 border bg-muted/40 p-2.5 text-xs text-muted-foreground font-mono">
                    <Move className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Geser langsung foto di kanvas untuk memposisikan wajah.</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Opsi Unduh */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                    3
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Unduh Twibbon
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Resolusi</Label>
                    <div className="mt-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setExportRes(1080)}
                        className={`flex-1 border py-1.5 font-mono text-xs font-bold cursor-pointer transition-colors ${
                          exportRes === 1080
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        1080p HD
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportRes(2048)}
                        className={`flex-1 border py-1.5 font-mono text-xs font-bold cursor-pointer transition-colors ${
                          exportRes === 2048
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        2048p 4K
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Format File</Label>
                    <div className="mt-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setExportFormat('png')}
                        className={`flex-1 border py-1.5 font-mono text-xs font-bold cursor-pointer transition-colors ${
                          exportFormat === 'png'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportFormat('jpeg')}
                        className={`flex-1 border py-1.5 font-mono text-xs font-bold cursor-pointer transition-colors ${
                          exportFormat === 'jpeg'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        JPG
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleDownload}
                  disabled={!photoImg || isProcessing}
                  className="w-full gap-2 font-bold uppercase tracking-wider"
                >
                  <Download className="h-4 w-4" />
                  <span>{isProcessing ? 'Memproses HD...' : 'Unduh Twibbon Siap Pakai'}</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Live Interactive Canvas */}
            <div className="space-y-4 lg:col-span-7">
              <div className="border bg-card p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      Kanvas Pratinjau Interaktif
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Sentuh atau geser foto di dalam bingkai secara presisi.
                    </p>
                  </div>
                  {photoImg ? (
                    <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Foto Terpasang
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">Menunggu Foto...</span>
                  )}
                </div>

                {/* Canvas */}
                <div className="relative mx-auto flex aspect-square max-w-[500px] items-center justify-center border-2 border-foreground bg-muted shadow-sm overflow-hidden select-none">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Rasio: 1:1 (Square)</span>
                  <span>Resolusi Ekspor: {exportRes} x {exportRes} px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: PANITIA CREATOR PORTAL (Default View on /tools/twibbon)
        ========================================================================= */
        <div className="space-y-6">

          {/* Generated Short Link Banner if just generated */}
          {generatedShortUrl && (
            <div className="border-2 border-emerald-500 bg-emerald-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">
                  Campaign Berhasil Diterbitkan! Link Pendek Siap Disebarkan:
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  readOnly
                  value={generatedShortUrl}
                  className="font-mono text-xs bg-background border-emerald-500/40"
                />
                <Button
                  type="button"
                  onClick={() => handleCopyLink(activeCampaignId)}
                  className="w-full sm:w-auto gap-1.5 font-mono text-xs shrink-0 font-bold"
                >
                  {shareLinkCopied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{shareLinkCopied ? 'Tersalin!' : 'Salin Link'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const found = savedCampaigns.find((c) => c.id === activeCampaignId);
                    if (found) handleOpenParticipantView(found);
                  }}
                  className="w-full sm:w-auto gap-1.5 font-mono text-xs shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka Laman Peserta</span>
                </Button>
              </div>
            </div>
          )}

          {/* Creator Grid: Left Form, Right Preview */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Form */}
            <div className="space-y-6 lg:col-span-6">
              {/* Step 1: Info Event */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                      1
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Informasi Event & Organisasi
                    </h2>
                  </div>

                  <span className="font-mono text-[11px] text-muted-foreground">
                    Langkah 1 dari 3
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Event / Acara</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: HMIT Festival 2026 / LKMM-TD 2026"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Penyelenggara / Himpunan</Label>
                    <Input
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="Contoh: Himpunan Mahasiswa Informatika / BEM FT"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Template Caption & Hashtag untuk Peserta</Label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={3}
                      placeholder="Tuliskan template caption sosmed yang akan langsung disalin peserta..."
                      className="w-full border border-input bg-background p-2.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Upload Frame Panitia */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                    2
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Unggah Bingkai Twibbon (PNG Transparan)
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">File Bingkai Panitia</Label>
                      {frameName && <span className="font-mono text-[10px] text-primary truncate max-w-[180px]">{frameName}</span>}
                    </div>
                    <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-primary/50 bg-primary/5 p-3 text-center transition-colors hover:bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                      <span className="mt-1 text-xs font-bold text-foreground">Unggah File PNG Bingkai</span>
                      <span className="text-[10px] text-muted-foreground">Pastikan area foto berlubang (transparan)</span>
                      <input type="file" accept="image/png,image/webp" onChange={handleFrameUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Preset Template Selector */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <Label className="text-[11px] font-mono text-muted-foreground">Atau Pilih Preset Cepat:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PRESET_CAMPAIGNS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2 border text-left font-mono text-[11px] cursor-pointer transition-colors ${
                            frameName.includes(p.title)
                              ? 'border-primary bg-primary/10 font-bold text-primary'
                              : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="truncate">{p.title}</div>
                          <div className="text-[9px] text-muted-foreground truncate">{p.organizer}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handlePublishCampaign}
                className="w-full gap-2 font-bold uppercase tracking-wider"
              >
                <Sparkles className="h-4 w-4" />
                <span>Terbitkan Campaign & Buat Link Pendek</span>
              </Button>
            </div>

            {/* Right Column: Frame Preview & Saved Campaigns */}
            <div className="space-y-6 lg:col-span-6">
              {/* Live Frame Preview */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                    Pratinjau Bingkai Panitia
                  </h3>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                    Format 1:1 Square
                  </span>
                </div>

                <div className="relative mx-auto flex aspect-square max-w-[340px] items-center justify-center border-2 border-foreground bg-muted shadow-sm overflow-hidden select-none">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={340}
                    className="h-full w-full pointer-events-none"
                  />
                </div>
              </div>

              {/* Saved Campaigns List */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                    Daftar Campaign Tersedia ({savedCampaigns.length})
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">Tersimpan di Browser</span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {savedCampaigns.map((c) => (
                    <div
                      key={c.id}
                      className="border bg-background p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 font-bold text-foreground">
                            ID: {c.id}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate">{c.organizer}</span>
                        </div>
                        <h4 className="font-bold text-xs truncate text-foreground">{c.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(c.id)}
                          className="h-7 px-2 font-mono text-[11px] gap-1"
                          title="Salin Link Pendek"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Salin Link</span>
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenParticipantView(c)}
                          className="h-7 px-2 font-mono text-[11px] gap-1"
                          title="Buka Laman Peserta"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Laman Peserta</span>
                        </Button>
                        {!PRESET_CAMPAIGNS.some((p) => p.id === c.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            title="Hapus Campaign"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
