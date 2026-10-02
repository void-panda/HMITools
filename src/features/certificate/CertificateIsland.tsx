import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  Award,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Sliders,
  Type,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  FileCheck,
  AlignLeft,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ClipboardPaste,
  Settings2,
  Check,
  FileDown,
  Info,
  Table,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import JSZip from 'jszip';

interface Participant {
  name: string;
  role: string;
  id: string;
}

interface TextElementConfig {
  enabled: boolean;
  text: string;
  posY: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
}

const FONT_OPTIONS = [
  { label: 'Serif Klasik (Formal & Piagam)', value: 'Georgia, serif' },
  { label: 'Sans Modern (Clean Minimalist)', value: "'DM Sans', Inter, sans-serif" },
  { label: 'Calligraphy / Script (Elegan & Estetik)', value: "'Brush Script MT', 'Dancing Script', cursive" },
  { label: 'Monospace (Hackathon & Tech)', value: "'Courier New', Courier, monospace" },
  { label: 'Display Header (Tegas & Tebal)', value: "'Trebuchet MS', 'Impact', sans-serif" },
];

const COMMON_ROLES = ['PESERTA', 'PEMATERI', 'MODERATOR', 'PANITIA', 'JUARA 1', 'JUARA 2', 'JUARA 3'];

export function CertificateIsland() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'event' | 'participants' | 'design'>('participants');

  // Template background image
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [templateName, setTemplateName] = useState<string>('Template Bawaan: HMIT Workshop');

  // Participants list (structured)
  const [participants, setParticipants] = useState<Participant[]>([
    { name: 'Ahmad Fauzi, S.Kom', role: 'PESERTA', id: 'SRT/2026/001' },
    { name: 'Dr. Siti Rahmawati, M.Kom', role: 'PEMATERI', id: 'SRT/2026/002' },
    { name: 'Budi Santoso, M.T.', role: 'MODERATOR', id: 'SRT/2026/003' },
    { name: 'Dewi Lestari', role: 'JUARA 1 HACKATHON', id: 'SRT/2026/004' },
    { name: 'Rian Pratama', role: 'PANITIA PELAKSANA', id: 'SRT/2026/005' },
  ]);

  // Current preview index
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // New Participant Form State
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('PESERTA');
  const [newId, setNewId] = useState<string>('SRT/2026/006');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Quick Batch Paste Modal
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchNamesText, setBatchNamesText] = useState<string>('');
  const [batchDefaultRole, setBatchDefaultRole] = useState<string>('PESERTA');
  const [batchIdPrefix, setBatchIdPrefix] = useState<string>('SRT/2026/');

  // CSV Guide & Upload Modal
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

  // Field Form Configurations
  const [headerPrefixConfig, setHeaderPrefixConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'SERTIFIKAT PENGHARGAAN',
    posY: 145,
    fontSize: 16,
    fontColor: '#4f46e5',
    fontFamily: "'DM Sans', Inter, sans-serif",
    fontWeight: 'bold',
  });

  const [eventTitleConfig, setEventTitleConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'HMIT NATIONAL WORKSHOP 2026',
    posY: 195,
    fontSize: 28,
    fontColor: '#18181b',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
  });

  const [certNumberConfig, setCertNumberConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'Nomor: {ID}',
    posY: 245,
    fontSize: 12,
    fontColor: '#71717a',
    fontFamily: "'DM Sans', Inter, sans-serif",
    fontWeight: 'normal',
  });

  const [recipientConfig, setRecipientConfig] = useState<TextElementConfig>({
    enabled: true,
    text: '',
    posY: 385,
    fontSize: 40,
    fontColor: '#18181b',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
  });

  const [roleConfig, setRoleConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'Sebagai PESERTA AKTIF',
    posY: 435,
    fontSize: 15,
    fontColor: '#4f46e5',
    fontFamily: "'DM Sans', Inter, sans-serif",
    fontWeight: 'bold',
  });

  const [descriptionConfig, setDescriptionConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'Atas partisipasi aktif dan kontribusi luar biasa dalam rangkaian acara.',
    posY: 485,
    fontSize: 14,
    fontColor: '#52525b',
    fontFamily: "'DM Sans', Inter, sans-serif",
    fontWeight: 'normal',
  });

  const [datePlaceConfig, setDatePlaceConfig] = useState<TextElementConfig>({
    enabled: true,
    text: 'Surabaya, 14 Oktober 2026',
    posY: 540,
    fontSize: 13,
    fontColor: '#71717a',
    fontFamily: "'DM Sans', Inter, sans-serif",
    fontWeight: 'normal',
  });

  // Toggle visual guide line
  const [showGuides, setShowGuides] = useState<boolean>(true);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentProcessingName, setCurrentProcessingName] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load default template SVG
  const loadDefaultTemplate = useCallback(() => {
    const defaultTpl = new Image();
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>
      </defs>
      <!-- Certificate Background -->
      <rect x="0" y="0" width="1000" height="700" fill="#fcfcfd"/>
      <rect x="25" y="25" width="950" height="650" fill="none" stroke="url(#gold)" stroke-width="6"/>
      <rect x="35" y="35" width="930" height="630" fill="none" stroke="#18181b" stroke-width="1.5"/>
      <rect x="42" y="42" width="916" height="616" fill="none" stroke="#e4e4e7" stroke-width="1"/>
      
      <!-- Corner Accents -->
      <polygon points="25,25 65,25 25,65" fill="#4f46e5" />
      <polygon points="975,25 935,25 975,65" fill="#4f46e5" />
      <polygon points="25,675 65,675 25,635" fill="#4f46e5" />
      <polygon points="975,675 935,675 975,635" fill="#4f46e5" />

      <!-- Given to subtitle -->
      <text x="500" y="310" fill="#71717a" font-family="sans-serif" font-size="14" text-anchor="middle" font-style="italic">Diberikan dengan bangga dan apresiasi setinggi-tingginya kepada:</text>

      <!-- Signature placeholders -->
      <line x1="220" y1="615" x2="380" y2="615" stroke="#18181b" stroke-width="1.5"/>
      <text x="300" y="635" fill="#18181b" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Ketua Himpunan</text>
      <text x="300" y="652" fill="#71717a" font-family="sans-serif" font-size="11" text-anchor="middle">HMIT Official</text>

      <line x1="620" y1="615" x2="780" y2="615" stroke="#18181b" stroke-width="1.5"/>
      <text x="700" y="635" fill="#18181b" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Ketua Pelaksana</text>
      <text x="700" y="652" fill="#71717a" font-family="sans-serif" font-size="11" text-anchor="middle">Panitia Kegiatan</text>
    </svg>`;
    defaultTpl.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    defaultTpl.onload = () => {
      setTemplateImg(defaultTpl);
      setTemplateName('Template Bawaan: HMIT Workshop');
    };
  }, []);

  useEffect(() => {
    loadDefaultTemplate();
  }, [loadDefaultTemplate]);

  // Synchronize next automatic ID
  useEffect(() => {
    setNewId(`SRT/2026/${String(participants.length + 1).padStart(3, '0')}`);
  }, [participants.length]);

  // Draw certificate on canvas
  const renderCertificate = useCallback(
    (ctx: CanvasRenderingContext2D, p: Participant, w: number, h: number, isPreview = false) => {
      ctx.clearRect(0, 0, w, h);

      // 1. Draw Template Background
      if (templateImg) {
        ctx.drawImage(templateImg, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.textAlign = 'center';

      // 2. Header Prefix (e.g. SERTIFIKAT PENGHARGAAN)
      if (headerPrefixConfig.enabled && headerPrefixConfig.text) {
        ctx.font = `${headerPrefixConfig.fontWeight} ${headerPrefixConfig.fontSize}px ${headerPrefixConfig.fontFamily}`;
        ctx.fillStyle = headerPrefixConfig.fontColor;
        ctx.fillText(headerPrefixConfig.text, w / 2, headerPrefixConfig.posY);
      }

      // 3. Event Title (e.g. HMIT NATIONAL WORKSHOP 2026)
      if (eventTitleConfig.enabled && eventTitleConfig.text) {
        ctx.font = `${eventTitleConfig.fontWeight} ${eventTitleConfig.fontSize}px ${eventTitleConfig.fontFamily}`;
        ctx.fillStyle = eventTitleConfig.fontColor;
        ctx.fillText(eventTitleConfig.text, w / 2, eventTitleConfig.posY);
      }

      // 4. Certificate Number
      if (certNumberConfig.enabled && certNumberConfig.text) {
        const certNumberText = certNumberConfig.text.replace('{ID}', p.id || `SRT/${previewIndex + 1}`);
        ctx.font = `${certNumberConfig.fontWeight} ${certNumberConfig.fontSize}px ${certNumberConfig.fontFamily}`;
        ctx.fillStyle = certNumberConfig.fontColor;
        ctx.fillText(certNumberText, w / 2, certNumberConfig.posY);
      }

      // 5. Recipient Name
      if (recipientConfig.enabled) {
        const displayName = p.name || 'Nama Lengkap Penerima';
        ctx.font = `${recipientConfig.fontWeight} ${recipientConfig.fontSize}px ${recipientConfig.fontFamily}`;
        ctx.fillStyle = recipientConfig.fontColor;
        ctx.fillText(displayName, w / 2, recipientConfig.posY);

        if (isPreview && showGuides) {
          ctx.strokeStyle = '#4f46e5';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(150, recipientConfig.posY + 8);
          ctx.lineTo(850, recipientConfig.posY + 8);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 6. Role (e.g. Sebagai PESERTA / PEMATERI)
      if (roleConfig.enabled) {
        const roleText = p.role ? `Sebagai ${p.role.toUpperCase()}` : roleConfig.text;
        if (roleText) {
          ctx.font = `${roleConfig.fontWeight} ${roleConfig.fontSize}px ${roleConfig.fontFamily}`;
          ctx.fillStyle = roleConfig.fontColor;
          ctx.fillText(roleText, w / 2, roleConfig.posY);
        }
      }

      // 7. Description / Appreciation sentence
      if (descriptionConfig.enabled && descriptionConfig.text) {
        ctx.font = `${descriptionConfig.fontWeight} ${descriptionConfig.fontSize}px ${descriptionConfig.fontFamily}`;
        ctx.fillStyle = descriptionConfig.fontColor;
        ctx.fillText(descriptionConfig.text, w / 2, descriptionConfig.posY);
      }

      // 8. Date & Place
      if (datePlaceConfig.enabled && datePlaceConfig.text) {
        ctx.font = `${datePlaceConfig.fontWeight} ${datePlaceConfig.fontSize}px ${datePlaceConfig.fontFamily}`;
        ctx.fillStyle = datePlaceConfig.fontColor;
        ctx.fillText(datePlaceConfig.text, w / 2, datePlaceConfig.posY);
      }
    },
    [
      templateImg,
      headerPrefixConfig,
      eventTitleConfig,
      certNumberConfig,
      recipientConfig,
      roleConfig,
      descriptionConfig,
      datePlaceConfig,
      previewIndex,
      showGuides,
    ]
  );

  // Redraw Preview Canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1000;
    const h = 700;
    canvas.width = w;
    canvas.height = h;

    const currentP = participants[previewIndex] || {
      name: 'Nama Penerima Contoh, S.Kom',
      role: 'PESERTA',
      id: 'SRT/2026/001',
    };

    renderCertificate(ctx, currentP, w, h, true);
  }, [templateImg, participants, previewIndex, renderCertificate]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Handle Template File Upload
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setTemplateImg(img);
        setTemplateName(file.name);
        toast.success(`Template "${file.name}" berhasil dimuat.`);
      };
    };
    reader.readAsDataURL(file);
  };

  // Add Single Participant via Form (No manual pipe syntax needed)
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Harap masukkan nama penerima sertifikat.');
      nameInputRef.current?.focus();
      return;
    }

    const newEntry: Participant = {
      name: newName.trim(),
      role: newRole.trim().toUpperCase() || 'PESERTA',
      id: newId.trim() || `SRT/2026/${String(participants.length + 1).padStart(3, '0')}`,
    };

    setParticipants((prev) => [...prev, newEntry]);
    setPreviewIndex(participants.length);
    setNewName('');
    toast.success(`Peserta "${newEntry.name}" berhasil ditambahkan!`);
    nameInputRef.current?.focus();
  };

  // Remove Participant
  const handleRemoveParticipant = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
    setPreviewIndex((prev) => Math.max(0, Math.min(prev, participants.length - 2)));
    toast.info('Peserta dihapus dari daftar.');
  };

  // Quick Batch Paste
  const handleExecuteBatchPaste = () => {
    if (!batchNamesText.trim()) {
      toast.error('Harap tempel setidaknya satu nama.');
      return;
    }

    const lines = batchNamesText.split('\n').map((l) => l.trim()).filter(Boolean);
    const startIndex = participants.length;

    const newEntries: Participant[] = lines.map((name, i) => {
      const numberStr = String(startIndex + i + 1).padStart(3, '0');
      return {
        name,
        role: batchDefaultRole.toUpperCase(),
        id: `${batchIdPrefix}${numberStr}`,
      };
    });

    setParticipants((prev) => [...prev, ...newEntries]);
    setShowBatchModal(false);
    setBatchNamesText('');
    toast.success(`Berhasil menambahkan ${newEntries.length} nama peserta sekaligus!`);
  };

  // Download CSV Sample Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Nama,Role,Nomor\r\nAhmad Fauzi S.Kom,PESERTA,SRT/2026/001\r\nDr. Siti Rahmawati M.Kom,PEMATERI,SRT/2026/002\r\nBudi Santoso M.T.,MODERATOR,SRT/2026/003\r\nDewi Lestari,JUARA 1,SRT/2026/004\r\nRian Pratama,PANITIA,SRT/2026/005\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_peserta_sertifikat.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template CSV berhasil diunduh!');
  };

  // Handle CSV Upload via PapaParse (Directly replaces dummy participants)
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const Papa = (await import('papaparse')).default;
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedList: Participant[] = results.data
            .map((row, idx) => {
              const keys = Object.keys(row);
              const nameKey = keys.find((k) => /nama|name/i.test(k));
              const roleKey = keys.find((k) => /role|peran|jabatan|predikat/i.test(k));
              const idKey = keys.find((k) => /id|nomor|no/i.test(k));

              const name = nameKey ? String(row[nameKey]).trim() : String(Object.values(row)[0] || '').trim();
              const role = roleKey ? String(row[roleKey]).trim().toUpperCase() : 'PESERTA';
              const id = idKey ? String(row[idKey]).trim() : `SRT/2026/${String(idx + 1).padStart(3, '0')}`;

              return { name, role, id };
            })
            .filter((p) => Boolean(p.name));

          if (parsedList.length > 0) {
            // Langsung timpa seluruh daftar peserta
            setParticipants(parsedList);
            setPreviewIndex(0);
            setShowCsvModal(false);
            toast.success(`Berhasil mengimpor & menggantikan daftar dengan ${parsedList.length} peserta dari CSV!`);
          } else {
            toast.error('Format CSV tidak terbaca. Pastikan ada kolom "Nama".');
          }
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal membaca file CSV.');
    } finally {
      e.target.value = '';
    }
  };

  // Download Single Previewed Certificate
  const handleDownloadSingle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentP = participants[previewIndex] || { name: 'Sertifikat' };
    const link = document.createElement('a');
    link.download = `Sertifikat_${currentP.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
    toast.success(`Sertifikat "${currentP.name}" berhasil diunduh!`);
  };

  // Batch Generation & ZIP Download
  const handleBatchGenerate = async () => {
    if (!templateImg || participants.length === 0) return;
    setIsGenerating(true);
    setProgressPercent(0);

    try {
      const zip = new JSZip();
      const w = 1000;
      const h = 700;
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        setCurrentProcessingName(p.name);
        setProgressPercent(Math.round(((i + 1) / participants.length) * 100));

        renderCertificate(ctx, p, w, h, false);

        const blob = await new Promise<Blob | null>((res) => offscreen.toBlob(res, 'image/png'));
        if (blob) {
          const sanitized = p.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          const numberPrefix = String(i + 1).padStart(3, '0');
          zip.file(`Sertifikat_${numberPrefix}_${sanitized}.png`, blob);
        }

        if (i % 20 === 0) {
          await new Promise((r) => setTimeout(r, 10));
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `Sertifikat_Batch_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Berhasil mengekspor ${participants.length} sertifikat ke file ZIP!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses batch sertifikat.');
    } finally {
      setIsGenerating(false);
      setCurrentProcessingName('');
    }
  };

  // Reset entire certificate tool state back to default dummy system data
  const handleResetToDefault = () => {
    setParticipants([
      { name: 'Ahmad Fauzi, S.Kom', role: 'PESERTA', id: 'SRT/2026/001' },
      { name: 'Dr. Siti Rahmawati, M.Kom', role: 'PEMATERI', id: 'SRT/2026/002' },
      { name: 'Budi Santoso, M.T.', role: 'MODERATOR', id: 'SRT/2026/003' },
      { name: 'Dewi Lestari', role: 'JUARA 1 HACKATHON', id: 'SRT/2026/004' },
      { name: 'Rian Pratama', role: 'PANITIA PELAKSANA', id: 'SRT/2026/005' },
    ]);
    setPreviewIndex(0);
    loadDefaultTemplate();
    setHeaderPrefixConfig({
      enabled: true,
      text: 'SERTIFIKAT PENGHARGAAN',
      posY: 145,
      fontSize: 16,
      fontColor: '#4f46e5',
      fontFamily: "'DM Sans', Inter, sans-serif",
      fontWeight: 'bold',
    });
    setEventTitleConfig({
      enabled: true,
      text: 'HMIT NATIONAL WORKSHOP 2026',
      posY: 195,
      fontSize: 28,
      fontColor: '#18181b',
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
    });
    setCertNumberConfig({
      enabled: true,
      text: 'Nomor: {ID}',
      posY: 245,
      fontSize: 12,
      fontColor: '#71717a',
      fontFamily: "'DM Sans', Inter, sans-serif",
      fontWeight: 'normal',
    });
    setRecipientConfig({
      enabled: true,
      text: '',
      posY: 385,
      fontSize: 40,
      fontColor: '#18181b',
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
    });
    setRoleConfig({
      enabled: true,
      text: 'Sebagai PESERTA AKTIF',
      posY: 435,
      fontSize: 15,
      fontColor: '#4f46e5',
      fontFamily: "'DM Sans', Inter, sans-serif",
      fontWeight: 'bold',
    });
    setDescriptionConfig({
      enabled: true,
      text: 'Atas partisipasi aktif dan kontribusi luar biasa dalam rangkaian acara.',
      posY: 485,
      fontSize: 14,
      fontColor: '#52525b',
      fontFamily: "'DM Sans', Inter, sans-serif",
      fontWeight: 'normal',
    });
    setDatePlaceConfig({
      enabled: true,
      text: 'Surabaya, 14 Oktober 2026',
      posY: 540,
      fontSize: 13,
      fontColor: '#71717a',
      fontFamily: "'DM Sans', Inter, sans-serif",
      fontWeight: 'normal',
    });
    toast.info('Data sertifikat & peserta direset ke default sistem!');
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
    <div className="space-y-6">
      {/* Top Quick Actions Bar */}
      <div className="border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wide text-foreground">
              Total {participants.length} Penerima Terdaftar
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Template: <span className="text-primary font-semibold">{templateName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCsvModal(true)}
            className="gap-1.5 font-mono text-xs border-primary/30 hover:bg-primary/10"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Format & Impor CSV</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleBatchGenerate}
            disabled={isGenerating || participants.length === 0}
            className="gap-1.5 font-mono text-xs font-bold uppercase"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGenerating ? 'Membuat ZIP...' : `Generate ${participants.length} ZIP`}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Control Cards, Right Sticky Preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Tabbed Settings */}
        <div className="space-y-6 lg:col-span-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="participants" className="gap-1.5 font-mono text-xs">
                <Users className="h-3.5 w-3.5" />
                <span>Peserta ({participants.length})</span>
              </TabsTrigger>
              <TabsTrigger value="event" className="gap-1.5 font-mono text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>Info Event</span>
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5 font-mono text-xs">
                <Type className="h-3.5 w-3.5" />
                <span>Tipografi</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: FORM INPUT PESERTA BARU & DAFTAR TABEL */}
            <TabsContent value="participants" className="space-y-6 mt-0">
              {/* Form Input Peserta Baru */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                      +
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Input Peserta Baru
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">Formulir Instan</span>
                </div>

                <form onSubmit={handleAddParticipant} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Lengkap & Gelar Penerima</Label>
                    <Input
                      ref={nameInputRef}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: Mochammad Farhan, S.Tr.Kom"
                      className="font-mono text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Peran / Predikat</Label>
                      <div className="flex gap-1.5">
                        <Input
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          placeholder="PESERTA / PEMATERI"
                          className="font-mono text-xs"
                        />
                        <select
                          value={COMMON_ROLES.includes(newRole) ? newRole : 'CUSTOM'}
                          onChange={(e) => {
                            if (e.target.value !== 'CUSTOM') setNewRole(e.target.value);
                          }}
                          className="border border-input bg-background px-2 text-xs font-mono"
                        >
                          {COMMON_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nomor Sertifikat</Label>
                      <Input
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        placeholder="SRT/2026/001"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2 font-bold uppercase text-xs">
                    <Plus className="h-4 w-4" />
                    <span>Tambahkan ke Daftar Penerima</span>
                  </Button>
                </form>
              </div>

              {/* Daftar Peserta Card */}
              <div className="border bg-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                      Daftar Penerima Terdaftar ({participants.length})
                    </h3>
                  </div>

                  {/* Batch Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBatchModal(true)}
                      className="h-7 px-2 font-mono text-[11px] gap-1"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      <span>Tempel Nama Cepat</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCsvModal(true)}
                      className="h-7 px-2 font-mono text-[11px] gap-1 border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                      <FileSpreadsheet className="h-3 w-3" />
                      <span>Impor CSV</span>
                    </Button>
                  </div>
                </div>

                {/* Table of Participants */}
                <div className="border bg-background max-h-[340px] overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                      Belum ada data penerima. Silakan tambahkan lewat form di atas.
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b bg-muted/60 sticky top-0">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center font-bold">No</th>
                          <th className="py-2 px-3 font-bold">Nama Lengkap</th>
                          <th className="py-2 px-3 w-32 font-bold">Peran</th>
                          <th className="py-2 px-3 w-28 font-bold">No. ID</th>
                          <th className="py-2 px-2 w-12 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {participants.map((p, idx) => (
                          <tr
                            key={`${p.name}-${idx}`}
                            onClick={() => setPreviewIndex(idx)}
                            className={`cursor-pointer transition-colors ${
                              previewIndex === idx ? 'bg-primary/10 font-bold' : 'hover:bg-muted/40'
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-[11px] text-muted-foreground">{idx + 1}</td>
                            <td className="py-2 px-3 truncate max-w-[180px]">{p.name}</td>
                            <td className="py-2 px-3">
                              <span className="inline-block bg-muted px-1.5 py-0.5 text-[10px] uppercase font-bold text-foreground">
                                {p.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-muted-foreground truncate">{p.id}</td>
                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipant(idx)}
                                className="p-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Hapus Peserta"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Preset Quick Buttons */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
                  <span>Preset Cepat:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sample20 = Array.from({ length: 20 }, (_, i) => ({
                          name: `Peserta Workshop Ke-${i + 1}, S.Kom`,
                          role: 'PESERTA',
                          id: `SRT/2026/${String(i + 1).padStart(3, '0')}`,
                        }));
                        setParticipants(sample20);
                        setPreviewIndex(0);
                        toast.success('Memuat 20 nama contoh!');
                      }}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      +20 Peserta
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setParticipants([]);
                        setPreviewIndex(0);
                      }}
                      className="text-destructive hover:underline cursor-pointer"
                    >
                      Kosongkan Semua
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: FORM DETAIL EVENT & PENYELENGGARA */}
            <TabsContent value="event" className="space-y-6 mt-0">
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                    A
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Informasi Kegiatan & Kalimat Sertifikat
                  </h2>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Judul Kegiatan / Nama Acara</Label>
                    <Input
                      value={eventTitleConfig.text}
                      onChange={(e) => setEventTitleConfig({ ...eventTitleConfig, text: e.target.value })}
                      placeholder="Contoh: HMIT NATIONAL WORKSHOP 2026"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Header Utama Sertifikat</Label>
                    <Input
                      value={headerPrefixConfig.text}
                      onChange={(e) => setHeaderPrefixConfig({ ...headerPrefixConfig, text: e.target.value })}
                      placeholder="Contoh: SERTIFIKAT PENGHARGAAN"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kalimat Keterangan / Apresiasi</Label>
                    <textarea
                      value={descriptionConfig.text}
                      onChange={(e) => setDescriptionConfig({ ...descriptionConfig, text: e.target.value })}
                      rows={3}
                      placeholder="Atas partisipasi aktif dan kontribusi luar biasa..."
                      className="w-full border border-input bg-background p-2.5 font-mono text-xs focus-visible:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tanggal & Tempat Acara</Label>
                      <Input
                        value={datePlaceConfig.text}
                        onChange={(e) => setDatePlaceConfig({ ...datePlaceConfig, text: e.target.value })}
                        placeholder="Surabaya, 14 Oktober 2026"
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Format Penomoran Sertifikat</Label>
                      <Input
                        value={certNumberConfig.text}
                        onChange={(e) => setCertNumberConfig({ ...certNumberConfig, text: e.target.value })}
                        placeholder="Nomor: {ID}"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: TYPOGRAPHY & FONT FAMILY */}
            <TabsContent value="design" className="space-y-6 mt-0">
              <div className="border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground font-mono">
                    🎨
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Gaya Huruf & Tipografi Sertifikat
                  </h2>
                </div>

                {/* Recipient Name Font */}
                <div className="border p-3.5 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Type className="h-3.5 w-3.5 text-primary" /> Font Nama Penerima
                    </Label>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Posisi Y: {recipientConfig.posY}px | {recipientConfig.fontSize}pt
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Pilihan Font Family:</Label>
                      <select
                        value={recipientConfig.fontFamily}
                        onChange={(e) => setRecipientConfig({ ...recipientConfig, fontFamily: e.target.value })}
                        className="w-full border border-input bg-background p-2 font-mono text-xs"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>Ukuran Font:</span>
                          <span>{recipientConfig.fontSize}pt</span>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={64}
                          value={recipientConfig.fontSize}
                          onChange={(e) =>
                            setRecipientConfig({ ...recipientConfig, fontSize: Number(e.target.value) })
                          }
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>Posisi Vertikal (Y):</span>
                          <span>{recipientConfig.posY}px</span>
                        </div>
                        <input
                          type="range"
                          min={250}
                          max={550}
                          value={recipientConfig.posY}
                          onChange={(e) =>
                            setRecipientConfig({ ...recipientConfig, posY: Number(e.target.value) })
                          }
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground">Warna Nama:</Label>
                      <input
                        type="color"
                        value={recipientConfig.fontColor}
                        onChange={(e) => setRecipientConfig({ ...recipientConfig, fontColor: e.target.value })}
                        className="h-6 w-10 border cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px]">{recipientConfig.fontColor}</span>
                    </div>
                  </div>
                </div>

                {/* Judul Kegiatan & Role Typography Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border p-3 space-y-2 bg-muted/20">
                    <Label className="text-xs font-bold">Judul Kegiatan</Label>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Ukuran: {eventTitleConfig.fontSize}pt</span>
                        <span>Y: {eventTitleConfig.posY}px</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={40}
                        value={eventTitleConfig.fontSize}
                        onChange={(e) =>
                          setEventTitleConfig({ ...eventTitleConfig, fontSize: Number(e.target.value) })
                        }
                        className="w-full cursor-pointer accent-primary"
                      />
                      <input
                        type="range"
                        min={100}
                        max={300}
                        value={eventTitleConfig.posY}
                        onChange={(e) =>
                          setEventTitleConfig({ ...eventTitleConfig, posY: Number(e.target.value) })
                        }
                        className="w-full cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  <div className="border p-3 space-y-2 bg-muted/20">
                    <Label className="text-xs font-bold">Peran Penerima</Label>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Ukuran: {roleConfig.fontSize}pt</span>
                        <span>Y: {roleConfig.posY}px</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={26}
                        value={roleConfig.fontSize}
                        onChange={(e) => setRoleConfig({ ...roleConfig, fontSize: Number(e.target.value) })}
                        className="w-full cursor-pointer accent-primary"
                      />
                      <input
                        type="range"
                        min={380}
                        max={550}
                        value={roleConfig.posY}
                        onChange={(e) => setRoleConfig({ ...roleConfig, posY: Number(e.target.value) })}
                        className="w-full cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Template Background & Visual Layout Inspector */}
        <div className="space-y-4 lg:col-span-6">
          {/* Upload Background Template Section (Di atas preview) */}
          <div className="border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-foreground">
                  Background Template Sertifikat
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary truncate max-w-[180px] bg-primary/10 px-2 py-0.5 border border-primary/20">
                  {templateName}
                </span>
                {templateName !== 'Template Bawaan: HMIT Workshop' && (
                  <button
                    type="button"
                    onClick={() => {
                      loadDefaultTemplate();
                      toast.info('Template dikembalikan ke bawaan.');
                    }}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer underline"
                    title="Gunakan Template Bawaan"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <label className="flex h-20 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-background p-3 text-center transition-colors hover:border-primary hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Upload Template Sendiri (PNG / JPG)</span>
              </div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">Rekomendasi rasio landscape 1000 x 700 px (tanpa teks nama)</span>
              <input type="file" accept="image/png,image/jpeg" onChange={handleTemplateUpload} className="hidden" />
            </label>
          </div>

          <div className="border bg-card p-4 sm:p-6 space-y-4">
            {/* Header & Participant Navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Pratinjau Lembar Sertifikat
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Menampilkan live render tiap peserta sebelum digenerate massal.
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                  disabled={previewIndex === 0}
                  className="p-1.5 border rounded-none bg-background disabled:opacity-30 hover:bg-muted cursor-pointer"
                  title="Peserta Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs font-bold px-2">
                  {participants.length > 0 ? previewIndex + 1 : 0} / {participants.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => Math.min(participants.length - 1, prev + 1))}
                  disabled={previewIndex >= participants.length - 1}
                  className="p-1.5 border rounded-none bg-background disabled:opacity-30 hover:bg-muted cursor-pointer"
                  title="Peserta Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Canvas Box */}
            <div className="border-2 border-foreground bg-white shadow-sm overflow-hidden select-none">
              <canvas ref={canvasRef} className="block w-full h-auto" />
            </div>

            {/* Footer Control & Info */}
            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="accent-primary"
                />
                <span>Garis Baseline Panduan Nama</span>
              </label>
              <span className="truncate max-w-[200px]">
                Penerima: <strong>{participants[previewIndex]?.name || '-'}</strong>
              </span>
            </div>

            {/* Batch Progress Bar */}
            {isGenerating && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Memproses: {currentProcessingName}</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
              </div>
            )}

            {/* Redesigned Bottom Action Bar (No overlap, clear visual hierarchy) */}
            <div className="space-y-2.5 pt-3 border-t">
              {/* Primary Full Width Action */}
              <Button
                type="button"
                size="lg"
                onClick={handleBatchGenerate}
                disabled={isGenerating || participants.length === 0}
                className="w-full gap-2 font-bold uppercase tracking-wider text-xs h-11"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isGenerating
                    ? 'Memproses Batch Sertifikat...'
                    : `Generate Semua (${participants.length} Sertifikat .ZIP)`}
                </span>
              </Button>

              {/* Secondary Utility Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSingle}
                  className="w-full gap-1.5 font-mono text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Sertifikat Ini (PNG)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCsvModal(true)}
                  className="w-full gap-1.5 font-mono text-xs"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Panduan & Impor CSV</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK BATCH PASTE MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border-2 border-foreground max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                  Tempel Daftar Nama Cepat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Cukup tempel nama peserta (1 nama per baris). Sistem akan secara otomatis mengisi peran dan nomor sertifikat berurutan tanpa perlu mengetik manual.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Peran Default</Label>
                <Input
                  value={batchDefaultRole}
                  onChange={(e) => setBatchDefaultRole(e.target.value)}
                  placeholder="PESERTA"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Prefix No. Sertifikat</Label>
                <Input
                  value={batchIdPrefix}
                  onChange={(e) => setBatchIdPrefix(e.target.value)}
                  placeholder="SRT/2026/"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Daftar Nama (1 Baris = 1 Peserta):</Label>
              <textarea
                value={batchNamesText}
                onChange={(e) => setBatchNamesText(e.target.value)}
                rows={6}
                placeholder="Ahmad Fauzi&#10;Siti Rahmawati&#10;Budi Santoso&#10;Dewi Lestari"
                className="w-full border border-input bg-background p-2.5 font-mono text-xs focus-visible:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowBatchModal(false)}>
                Batal
              </Button>
              <Button type="button" size="sm" onClick={handleExecuteBatchPaste} className="font-bold gap-1.5">
                <Check className="h-4 w-4" />
                <span>Tambahkan ke Tabel</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV GUIDE & UPLOAD MODAL DIALOG */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border-2 border-foreground max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                  Panduan Format & Impor CSV Sertifikat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Instruction text */}
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                Agar data peserta dapat terbaca secara sempurna oleh sistem sertifikat, pastikan file CSV Anda memiliki kolom header berikut:
              </p>
              
              <div className="border bg-muted/40 p-3 space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">1. Nama</span>
                  <span className="text-emerald-600 font-semibold">[Wajib]</span>
                  <span>— Nama lengkap dan gelar penerima sertifikat.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">2. Role</span>
                  <span className="text-muted-foreground">[Opsional]</span>
                  <span>— Peran (contoh: PESERTA, PEMATERI, JUARA 1).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">3. Nomor</span>
                  <span className="text-muted-foreground">[Opsional]</span>
                  <span>— Nomor ID/surat sertifikat kustom.</span>
                </div>
              </div>
            </div>

            {/* CSV Template Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Table className="h-3.5 w-3.5 text-primary" /> Contoh Struktur Isi File CSV:
                </span>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="font-mono text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 font-bold"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Unduh Template .CSV</span>
                </button>
              </div>

              <div className="bg-background border p-3 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto select-all">
                Nama,Role,Nomor<br />
                Ahmad Fauzi S.Kom,PESERTA,SRT/2026/001<br />
                Dr. Siti Rahmawati M.Kom,PEMATERI,SRT/2026/002<br />
                Budi Santoso M.T.,MODERATOR,SRT/2026/003<br />
                Dewi Lestari,JUARA 1,SRT/2026/004<br />
                Rian Pratama,PANITIA,SRT/2026/005
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Pilih atau Tarik File CSV Anda ke Sini:</Label>
              <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 p-3 text-center transition-colors hover:bg-emerald-500/10">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                <span className="mt-1.5 text-xs font-bold text-foreground">Klik untuk Memilih File CSV</span>
                <span className="text-[10px] text-muted-foreground">Mendukung file .csv dari Microsoft Excel & Google Sheets</span>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="font-mono text-[10px] text-muted-foreground">
                Data CSV akan langsung menimpa seluruh peserta dummy sistem.
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCsvModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
