import React, { useState, useRef } from 'react';
import {
  Music,
  Video,
  FileAudio,
  Upload,
  Download,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ArrowRight,
  Radio,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Pure client-side WAV encoder from AudioBuffer
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = result.length * bytesPerSample;
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function MediaConverterIsland() {
  const [activeTab, setActiveTab] = useState<'video-to-audio' | 'image-converter'>('video-to-audio');

  // --- Video/Audio State ---
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const [extractedAudioSize, setExtractedAudioSize] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [targetSampleRate, setTargetSampleRate] = useState<number>(44100);
  const [audioChannels, setAudioChannels] = useState<'mono' | 'stereo'>('stereo');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Image Converter State ---
  const [imageFiles, setImageFiles] = useState<Array<{
    id: string;
    originalFile: File;
    convertedUrl: string;
    convertedBlob: Blob;
    convertedName: string;
    convertedSize: number;
    format: string;
  }>>([]);
  const [imageTargetFormat, setImageTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Global reset listener
  React.useEffect(() => {
    const onReset = () => {
      setMediaFile(null);
      setExtractedAudioUrl(null);
      setExtractedAudioSize(0);
      setAudioDuration(0);
      setImageFiles([]);
      toast.info('Laman konversi media berhasil direset!');
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Handle Media File Select ---
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setExtractedAudioUrl(null);
    setExtractError(null);
    setIsPlaying(false);
    toast.success(`Berkas "${file.name}" siap diekstrak.`);
  };

  // --- Execute In-Browser Audio Extraction ---
  const handleExtractAudio = async () => {
    if (!mediaFile) return;

    setIsExtracting(true);
    setExtractProgress('Membaca stream berkas media...');
    setExtractError(null);

    try {
      const arrayBuffer = await mediaFile.arrayBuffer();

      setExtractProgress('Mendekode audio channel via Web Audio API...');
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: targetSampleRate,
      });

      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioDuration(decodedBuffer.duration);

      setExtractProgress('Mengonversi ke format WAV (16-bit PCM)...');
      const wavBlob = audioBufferToWav(decodedBuffer);
      setExtractedAudioSize(wavBlob.size);

      const url = URL.createObjectURL(wavBlob);
      setExtractedAudioUrl(url);
      setExtractProgress('');
      await audioCtx.close();
      toast.success('Ekstraksi audio berhasil!');
    } catch (err: unknown) {
      console.error(err);
      const msg = 'Gagal mengekstrak audio. Format video ini mungkin tidak memiliki audio track yang didukung oleh browser Anda.';
      setExtractError(msg);
      toast.error(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  // --- Image Conversion Handler ---
  const handleImageConvertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsConvertingImages(true);
    const results: Array<{
      id: string;
      originalFile: File;
      convertedUrl: string;
      convertedBlob: Blob;
      convertedName: string;
      convertedSize: number;
      format: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substring(2, 9);
      const url = URL.createObjectURL(file);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (imageTargetFormat === 'image/jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, img.width, img.height);
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  let ext = 'png';
                  if (imageTargetFormat === 'image/jpeg') ext = 'jpg';
                  if (imageTargetFormat === 'image/webp') ext = 'webp';

                  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                  const convertedName = `${base}.${ext}`;
                  const convertedUrl = URL.createObjectURL(blob);

                  results.push({
                    id,
                    originalFile: file,
                    convertedUrl,
                    convertedBlob: blob,
                    convertedName,
                    convertedSize: blob.size,
                    format: ext.toUpperCase(),
                  });
                }
                resolve();
              },
              imageTargetFormat,
              0.92
            );
          } else {
            resolve();
          }
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    }

    setImageFiles((prev) => [...prev, ...results]);
    setIsConvertingImages(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
    toast.success(`${files.length} gambar berhasil dikonversi ke ${imageTargetFormat.replace('image/', '').toUpperCase()}!`);
  };

  const toggleAudioPlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'video-to-audio' | 'image-converter')}
        className="w-full space-y-6"
      >
        <TabsList className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <TabsTrigger value="video-to-audio" className="gap-2">
            <FileAudio className="h-4 w-4" />
            <span>Ekstrak Audio Video</span>
          </TabsTrigger>
          <TabsTrigger value="image-converter" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Konversi Gambar</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VIDEO TO AUDIO EXTRACTOR */}
        <TabsContent value="video-to-audio" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Control Panel */}
            <div className="space-y-6 lg:col-span-1">
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Pilih Berkas Video / Rekaman
                </h3>

                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleMediaSelect}
                  accept="video/*,audio/*"
                  className="hidden"
                />

                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center border bg-muted text-primary">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-foreground">
                    {mediaFile ? mediaFile.name : 'Pilih Berkas Video / Audio'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {mediaFile ? formatFileSize(mediaFile.size) : 'MP4, WebM, MKV, MOV, M4A'}
                  </p>
                </div>
              </div>

              {/* Extraction Settings */}
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Pengaturan Ekstraksi
                </h3>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Sample Rate:</Label>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {[
                      { rate: 44100, label: '44.1 kHz (CD Quality)' },
                      { rate: 48000, label: '48.0 kHz (Studio)' },
                    ].map((item) => (
                      <button
                        key={item.rate}
                        onClick={() => setTargetSampleRate(item.rate)}
                        className={`border p-2 text-center transition-colors cursor-pointer ${
                          targetSampleRate === item.rate
                            ? 'border-primary bg-primary text-primary-foreground font-bold'
                            : 'border-border bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleExtractAudio}
                  disabled={!mediaFile || isExtracting}
                  className="w-full gap-2 font-mono text-xs cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{extractProgress || 'Mengekstrak Audio...'}</span>
                    </>
                  ) : (
                    <>
                      <Music className="h-4 w-4" />
                      <span>Ekstrak Audio Sekarang</span>
                    </>
                  )}
                </Button>

                {extractError && (
                  <div className="flex items-center gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Output Panel */}
            <div className="lg:col-span-2">
              <div className="border bg-card p-6 h-full flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hasil Ekstraksi Audio (WAV Lossless)
                  </h3>

                  {extractedAudioUrl && mediaFile ? (
                    <div className="mt-6 space-y-6">
                      <div className="border border-primary/30 bg-primary/5 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Radio className="h-4 w-4 animate-pulse" />
                            <span>Audio Berhasil Diekstrak!</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            Durasi: {formatDuration(audioDuration)}
                          </span>
                        </div>

                        {/* Custom Audio Player */}
                        <div className="flex items-center gap-3 border bg-card p-3">
                          <Button
                            onClick={toggleAudioPlay}
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-0 shrink-0 cursor-pointer"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs font-bold truncate text-foreground">
                              {mediaFile.name.substring(0, mediaFile.name.lastIndexOf('.')) || mediaFile.name}.wav
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              16-bit PCM • {targetSampleRate / 1000} kHz • {formatFileSize(extractedAudioSize)}
                            </p>
                          </div>
                          <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <audio
                            ref={audioPlayerRef}
                            src={extractedAudioUrl}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 font-mono text-xs border-t pt-3">
                          <div>
                            <span className="text-muted-foreground">Berkas Asli:</span>
                            <p className="font-bold text-foreground">{mediaFile.name} ({formatFileSize(mediaFile.size)})</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Format Hasil:</span>
                            <p className="font-bold text-primary">WAV Audio (Lossless)</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={extractedAudioUrl}
                          download={`${mediaFile.name.substring(0, mediaFile.name.lastIndexOf('.')) || 'extracted-audio'}.wav`}
                          className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 font-mono text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Unduh Berkas Audio (.WAV)</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-12 flex flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                        <Music className="h-6 w-6" />
                      </div>
                      <h4 className="mt-4 text-sm font-bold text-foreground">Audio Belum Diekstrak</h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                        Pilih video kuliah atau rekaman wawancara Anda dan tekan tombol ekstrak untuk memproses audio secara instan.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 font-mono text-[11px] text-muted-foreground">
                  <span>Web Audio API Standard</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: IMAGE FORMAT CONVERTER */}
        <TabsContent value="image-converter" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Controls */}
            <div className="space-y-6 lg:col-span-1">
              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Pilih Format Target
                </h3>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { fmt: 'image/png' as const, label: 'PNG' },
                    { fmt: 'image/jpeg' as const, label: 'JPG' },
                    { fmt: 'image/webp' as const, label: 'WebP' },
                  ].map((item) => (
                    <button
                      key={item.fmt}
                      onClick={() => setImageTargetFormat(item.fmt)}
                      className={`border p-2 text-center transition-colors cursor-pointer ${
                        imageTargetFormat === item.fmt
                          ? 'border-primary bg-primary text-primary-foreground font-bold'
                          : 'border-border bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border bg-card p-4 sm:p-5 space-y-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Upload Foto / Gambar
                </h3>

                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageConvertUpload}
                  accept="image/*"
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
                    Upload Gambar untuk Dikonversi
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    PNG, JPG, WebP, BMP, SVG
                  </p>
                </div>
              </div>
            </div>

            {/* Right Converted Image Results */}
            <div className="space-y-4 lg:col-span-2">
              {imageFiles.length > 0 ? (
                <div className="space-y-3">
                  {imageFiles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 border bg-card p-4 transition-colors hover:border-foreground"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.convertedUrl}
                          alt={item.convertedName}
                          className="h-12 w-12 border object-cover bg-muted shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold text-foreground">
                            {item.convertedName}
                          </p>
                          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            <span className="border border-primary/30 bg-primary/10 px-1.5 py-0.2 font-bold text-primary">
                              {item.format}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(item.convertedSize)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={item.convertedUrl}
                          download={item.convertedName}
                          className="inline-flex items-center gap-1.5 border border-primary bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </a>
                        <button
                          onClick={() => setImageFiles((prev) => prev.filter((x) => x.id !== item.id))}
                          className="border border-border p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center bg-card">
                  <div className="flex h-12 w-12 items-center justify-center border bg-muted text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-foreground">Belum Ada Gambar yang Dikonversi</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Pilih format target dan unggah berkas gambar Anda untuk mengonversi secara cepat.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
