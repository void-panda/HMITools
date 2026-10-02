import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  GraduationCap,
  Briefcase,
  User,
  Wrench,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Experience {
  id: string;
  role: string;
  organization: string;
  period: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  period: string;
  gpa: string;
}

interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: Experience[];
  educations: Education[];
  projects: string;
}

const DEFAULT_CV: CVData = {
  fullName: 'MUHAMMAD RIZKY PRATAMA',
  title: 'Informatics Engineering Student | Web Developer Enthusiast',
  email: 'rizky.pratama@mhs.ac.id',
  phone: '+62 812-3456-7890',
  location: 'Surabaya, Indonesia',
  linkedin: 'linkedin.com/in/rizkypratama',
  summary:
    'Mahasiswa Teknik Informatika tingkat akhir yang memiliki ketertarikan mendalam pada pengembangan web frontend dan rekayasa perangkat lunak. Terbiasa memimpin divisi kepanitiaan himpunan dan aktif berkontribusi pada proyek open-source kampus.',
  skills: 'JavaScript, TypeScript, React, Astro, Tailwind CSS, Git, Node.js, REST API, WebAssembly',
  experiences: [
    {
      id: 'exp-1',
      role: 'Koordinator Divisi Kominfo',
      organization: 'Himpunan Mahasiswa Teknologi Informasi (HMIT)',
      period: '2024 — 2025',
      description:
        '• Mengelola publikasi digital dan pengembangan portal web resmi acara tahunan yang diakses 1.500+ mahasiswa.\n• Memimpin tim beranggotakan 8 orang dalam pembuatan konten publikasi dan branding kepanitiaan.',
    },
    {
      id: 'exp-2',
      role: 'Frontend Developer Intern',
      organization: 'Tech Nusantara Solutions',
      period: 'Jul 2024 — Okt 2024',
      description:
        '• Mengembangkan 10+ modul dashboard interaktif menggunakan React dan Tailwind CSS.\n• Mengoptimalkan performa halaman web sehingga skor Lighthouse meningkat dari 72 menjadi 95.',
    },
  ],
  educations: [
    {
      id: 'edu-1',
      institution: 'Universitas Negeri Surabaya',
      degree: 'S1 Teknik Informatika',
      period: '2022 — Sekarang (Semester 7)',
      gpa: 'IPK: 3.82 / 4.00',
    },
  ],
  projects:
    '• HMITools — All-in-one client-side student toolkit dengan arsitektur Astro + React Islands.\n• Sistem Manajemen Absensi QR Code berbasis Progressive Web App.',
};

export function CVBuilderIsland() {
  const [cvData, setCvData] = useState<CVData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hmitools_cv_draft');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_CV;
        }
      }
    }
    return DEFAULT_CV;
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Tersimpan di browser');

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('hmitools_cv_draft', JSON.stringify(cvData));
    setSaveStatus('Tersimpan otomatis');
    const timer = setTimeout(() => setSaveStatus('Tersimpan di browser'), 2000);
    return () => clearTimeout(timer);
  }, [cvData]);

  // Global reset listener
  useEffect(() => {
    const handleGlobalReset = () => {
      setCvData(DEFAULT_CV);
      localStorage.removeItem('hmitools_cv_draft');
      toast.info('Data resume berhasil direset ke data contoh default!');
    };
    window.addEventListener('hmitools:reset-default', handleGlobalReset);
    return () => window.removeEventListener('hmitools:reset-default', handleGlobalReset);
  }, []);

  // Export to Vector PDF via pdf-lib with dynamic multi-page support
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = await PDFDocument.create();
      
      const PAGE_WIDTH = 595.28; // A4 in points
      const PAGE_HEIGHT = 841.89;
      const margin = 45;
      const contentWidth = PAGE_WIDTH - margin * 2;

      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      let currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - margin;

      // Ultra-safe ASCII conversion for standard PDF fonts
      const toSafeAscii = (str: any): string => {
        if (!str || typeof str !== 'string') return '';
        return str
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\t/g, '  ')
          .replace(/[\u2014\u2013\u2012\u2015\u2212]/g, '-')
          .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25B6\u25C0\u25CF\u25CB\u2713\u2714\u2605\u2606]/g, '-')
          .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
          .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
          .replace(/[\u2026]/g, '...')
          .replace(/[\u2192\u2190\u2191\u2193]/g, '->')
          .replace(/[\u00A0\u202F\u200B\uFEFF]/g, ' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\x20-\x7E\n]/g, ' ');
      };

      const cleanLineForDraw = (line: string): string => {
        return toSafeAscii(line).replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
      };

      const safeMeasure = (text: string, font: any, size: number): number => {
        const safe = cleanLineForDraw(text);
        if (!safe) return 0;
        try {
          return font.widthOfTextAtSize(safe, size);
        } catch {
          return safe.length * size * 0.52;
        }
      };

      const safeDraw = (text: string, options: { x: number; y: number; size: number; font: any; color: any }) => {
        const safe = cleanLineForDraw(text);
        if (!safe) return;
        try {
          currentPage.drawText(safe, {
            x: options.x,
            y: options.y,
            size: options.size,
            font: options.font,
            color: options.color,
          });
        } catch (err) {
          console.warn('safeDraw text skipped on error:', err, safe);
        }
      };

      const ensureSpace = (neededHeight: number) => {
        if (y - neededHeight < margin) {
          currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - margin;
        }
      };

      const wrapTextByWidth = (text: string, font: any, size: number, maxWidth: number): string[] => {
        if (!text || typeof text !== 'string') return [];
        const rawClean = toSafeAscii(text);
        const lines: string[] = [];
        const paragraphs = rawClean.split('\n');

        for (const paragraph of paragraphs) {
          const trimmed = cleanLineForDraw(paragraph);
          if (!trimmed) {
            lines.push('');
            continue;
          }
          const words = trimmed.split(' ').filter(Boolean);
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = safeMeasure(testLine, font, size);

            if (textWidth > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
        }
        return lines;
      };

      // Header: Full Name
      ensureSpace(44);
      safeDraw((cvData.fullName || 'UNTITLED RESUME').toUpperCase(), {
        x: margin,
        y: y,
        size: 17,
        font: fontBold,
        color: rgb(0.08, 0.08, 0.08),
      });
      y -= 16;

      // Contact line
      const contactInfo = [cvData.email, cvData.phone, cvData.location, cvData.linkedin]
        .filter(Boolean)
        .join('   |   ');
      
      const contactLines = wrapTextByWidth(contactInfo, fontRegular, 8.5, contentWidth);
      for (const line of contactLines) {
        if (line) {
          safeDraw(line, {
            x: margin,
            y: y,
            size: 8.5,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        y -= 13;
      }
      y -= 5;

      // Header Divider Line
      currentPage.drawLine({
        start: { x: margin, y: y },
        end: { x: PAGE_WIDTH - margin, y: y },
        thickness: 1,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 16;

      const drawSectionHeader = (title: string) => {
        ensureSpace(34);
        y -= 6;
        safeDraw(title.toUpperCase(), {
          x: margin,
          y: y,
          size: 10,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 4.5;
        currentPage.drawLine({
          start: { x: margin, y: y },
          end: { x: PAGE_WIDTH - margin, y: y },
          thickness: 0.5,
          color: rgb(0.65, 0.65, 0.65),
        });
        y -= 13;
      };

      // 1. Summary
      if (cvData.summary && cvData.summary.trim()) {
        drawSectionHeader('Ringkasan Profesional');
        const summaryLines = wrapTextByWidth(cvData.summary, fontRegular, 9, contentWidth);
        for (const line of summaryLines) {
          ensureSpace(14);
          if (line) {
            safeDraw(line, {
              x: margin,
              y: y,
              size: 9,
              font: fontRegular,
              color: rgb(0.15, 0.15, 0.15),
            });
          }
          y -= 13;
        }
        y -= 8;
      }

      // 2. Experience Section
      if (cvData.experiences && cvData.experiences.length > 0) {
        drawSectionHeader('Pengalaman Kerja & Organisasi');
        for (const exp of cvData.experiences) {
          ensureSpace(28);
          // Role & Org on left
          const roleOrg = `${exp.role || ''} - ${exp.organization || ''}`;
          safeDraw(roleOrg, {
            x: margin,
            y: y,
            size: 9.5,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Period on right
          const cleanPeriod = cleanLineForDraw(exp.period || '');
          const periodWidth = safeMeasure(cleanPeriod, fontRegular, 8.5);
          safeDraw(cleanPeriod, {
            x: Math.max(margin, PAGE_WIDTH - margin - periodWidth),
            y: y,
            size: 8.5,
            font: fontRegular,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 13;

          // Description with wrapping
          if (exp.description) {
            const descLines = wrapTextByWidth(exp.description, fontRegular, 8.5, contentWidth - 12);
            for (const line of descLines) {
              ensureSpace(14);
              if (line) {
                safeDraw(line, {
                  x: margin + 6,
                  y: y,
                  size: 8.5,
                  font: fontRegular,
                  color: rgb(0.2, 0.2, 0.2),
                });
              }
              y -= 12.5;
            }
          }
          y -= 8;
        }
        y -= 6;
      }

      // 3. Education Section
      if (cvData.educations && cvData.educations.length > 0) {
        drawSectionHeader('Pendidikan');
        for (const edu of cvData.educations) {
          ensureSpace(28);
          safeDraw(edu.institution || '', {
            x: margin,
            y: y,
            size: 9.5,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          });

          const cleanEduPeriod = cleanLineForDraw(edu.period || '');
          const periodWidth = safeMeasure(cleanEduPeriod, fontRegular, 8.5);
          safeDraw(cleanEduPeriod, {
            x: Math.max(margin, PAGE_WIDTH - margin - periodWidth),
            y: y,
            size: 8.5,
            font: fontRegular,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 13;

          const degreeText = edu.gpa ? `${edu.degree || ''}  -  ${edu.gpa}` : (edu.degree || '');
          const degreeLines = wrapTextByWidth(degreeText, fontRegular, 8.5, contentWidth - 12);
          for (const line of degreeLines) {
            ensureSpace(14);
            if (line) {
              safeDraw(line, {
                x: margin + 6,
                y: y,
                size: 8.5,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
              });
            }
            y -= 12.5;
          }
          y -= 8;
        }
        y -= 6;
      }

      // 4. Skills Section
      if (cvData.skills && cvData.skills.trim()) {
        drawSectionHeader('Keahlian & Kemampuan Teknis');
        const skillLines = wrapTextByWidth(cvData.skills, fontRegular, 8.5, contentWidth);
        for (const line of skillLines) {
          ensureSpace(14);
          if (line) {
            safeDraw(line, {
              x: margin,
              y: y,
              size: 8.5,
              font: fontRegular,
              color: rgb(0.15, 0.15, 0.15),
            });
          }
          y -= 12.5;
        }
        y -= 8;
      }

      // 5. Projects Section
      if (cvData.projects && cvData.projects.trim()) {
        drawSectionHeader('Proyek Unggulan');
        const projLines = wrapTextByWidth(cvData.projects, fontRegular, 8.5, contentWidth);
        for (const line of projLines) {
          ensureSpace(14);
          if (line) {
            safeDraw(line, {
              x: margin,
              y: y,
              size: 8.5,
              font: fontRegular,
              color: rgb(0.15, 0.15, 0.15),
            });
          }
          y -= 12.5;
        }
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeName = (cleanLineForDraw(cvData.fullName || 'ATS_Resume') || 'Resume')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      link.download = `CV_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('CV ATS berhasil diekspor ke format PDF!');
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      toast.error(`Gagal mengekspor CV ke PDF: ${err?.message || 'Pastikan isian valid'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const addExperience = () => {
    setCvData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}`,
          role: 'Posisi / Peran Baru',
          organization: 'Nama Organisasi / Perusahaan',
          period: '2025 — 2026',
          description: '• Deskripsi pencapaian menggunakan aksi dan angka.',
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const addEducation = () => {
    setCvData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          id: `edu-${Date.now()}`,
          institution: 'Nama Universitas / Sekolah',
          degree: 'Program Studi / Gelar',
          period: '2022 — 2026',
          gpa: 'IPK: 3.50 / 4.00',
        },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      educations: prev.educations.filter((e) => e.id !== id),
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Multi-section CV Form */}
      <div className="space-y-6 lg:col-span-6">
        <div className="border bg-card p-4 sm:p-5 space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                Editor Resume ATS
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">• {saveStatus}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5">
              Draft Mode
            </span>
          </div>

          {/* Form Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'personal' | 'experience' | 'education' | 'skills')}
            className="w-full space-y-4"
          >
            <TabsList className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
              <TabsTrigger value="personal">Pribadi</TabsTrigger>
              <TabsTrigger value="experience">Pengalaman</TabsTrigger>
              <TabsTrigger value="education">Pendidikan</TabsTrigger>
              <TabsTrigger value="skills">Skill & Proyek</TabsTrigger>
            </TabsList>

            {/* Tab 1: Personal Info */}
            <TabsContent value="personal" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Lengkap</Label>
                <Input
                  value={cvData.fullName}
                  onChange={(e) => setCvData({ ...cvData, fullName: e.target.value })}
                  placeholder="Nama Lengkap & Gelar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    value={cvData.email}
                    onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                    placeholder="email@mhs.ac.id"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nomor WhatsApp / HP</Label>
                  <Input
                    value={cvData.phone}
                    onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                    placeholder="+62 812-xxxx-xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kota Domisili</Label>
                  <Input
                    value={cvData.location}
                    onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                    placeholder="Surabaya, Indonesia"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">LinkedIn / Portofolio</Label>
                  <Input
                    value={cvData.linkedin}
                    onChange={(e) => setCvData({ ...cvData, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ringkasan Profil (Summary)</Label>
                <textarea
                  value={cvData.summary}
                  onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                  rows={4}
                  className="w-full border border-input bg-background p-2.5 font-sans text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Jelaskan secara singkat latar belakang akademik, fokus minat, dan keunggulan Anda..."
                />
              </div>
            </TabsContent>

            {/* Tab 2: Experience */}
            <TabsContent value="experience" className="space-y-4">
              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} className="border bg-background p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="font-mono text-xs font-bold">Pengalaman #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-destructive hover:underline text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...cvData.experiences];
                        next[idx].role = e.target.value;
                        setCvData({ ...cvData, experiences: next });
                      }}
                      placeholder="Posisi / Jabatan"
                      className="text-xs"
                    />
                    <Input
                      value={exp.organization}
                      onChange={(e) => {
                        const next = [...cvData.experiences];
                        next[idx].organization = e.target.value;
                        setCvData({ ...cvData, experiences: next });
                      }}
                      placeholder="Nama Organisasi / Perusahaan"
                      className="text-xs"
                    />
                  </div>

                  <Input
                    value={exp.period}
                    onChange={(e) => {
                      const next = [...cvData.experiences];
                      next[idx].period = e.target.value;
                      setCvData({ ...cvData, experiences: next });
                    }}
                    placeholder="Rentang Waktu (misal: 2024 — 2025)"
                    className="text-xs font-mono"
                  />

                  <textarea
                    value={exp.description}
                    onChange={(e) => {
                      const next = [...cvData.experiences];
                      next[idx].description = e.target.value;
                      setCvData({ ...cvData, experiences: next });
                    }}
                    rows={3}
                    className="w-full border border-input bg-background p-2 font-sans text-xs focus-visible:outline-none"
                    placeholder="Poin pencapaian (gunakan bullet point •)"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExperience}
                className="w-full gap-1.5 text-xs font-mono"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Pengalaman
              </Button>
            </TabsContent>

            {/* Tab 3: Education */}
            <TabsContent value="education" className="space-y-4">
              {cvData.educations.map((edu, idx) => (
                <div key={edu.id} className="border bg-background p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="font-mono text-xs font-bold">Pendidikan #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="text-destructive hover:underline text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>

                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const next = [...cvData.educations];
                      next[idx].institution = e.target.value;
                      setCvData({ ...cvData, educations: next });
                    }}
                    placeholder="Nama Universitas / Kampus"
                    className="text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...cvData.educations];
                        next[idx].degree = e.target.value;
                        setCvData({ ...cvData, educations: next });
                      }}
                      placeholder="Jurusan / Program Studi"
                      className="text-xs"
                    />
                    <Input
                      value={edu.gpa}
                      onChange={(e) => {
                        const next = [...cvData.educations];
                        next[idx].gpa = e.target.value;
                        setCvData({ ...cvData, educations: next });
                      }}
                      placeholder="IPK: 3.80 / 4.00"
                      className="text-xs font-mono"
                    />
                  </div>

                  <Input
                    value={edu.period}
                    onChange={(e) => {
                      const next = [...cvData.educations];
                      next[idx].period = e.target.value;
                      setCvData({ ...cvData, educations: next });
                    }}
                    placeholder="Tahun Masuk — Lulus (misal: 2022 — Sekarang)"
                    className="text-xs font-mono"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEducation}
                className="w-full gap-1.5 text-xs font-mono"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Pendidikan
              </Button>
            </TabsContent>

            {/* Tab 4: Skills & Projects */}
            <TabsContent value="skills" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Keahlian & Kemampuan Teknis</Label>
                <textarea
                  value={cvData.skills}
                  onChange={(e) => setCvData({ ...cvData, skills: e.target.value })}
                  rows={3}
                  className="w-full border border-input bg-background p-2.5 font-sans text-xs focus-visible:outline-none"
                  placeholder="Pisahkan dengan koma (misal: JavaScript, React, Public Speaking, Microsoft Excel)"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Proyek & Portofolio</Label>
                <textarea
                  value={cvData.projects}
                  onChange={(e) => setCvData({ ...cvData, projects: e.target.value })}
                  rows={4}
                  className="w-full border border-input bg-background p-2.5 font-sans text-xs focus-visible:outline-none"
                  placeholder="Tuliskan proyek-proyek penting atau karya yang pernah Anda buat..."
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Export Action */}
          <div className="border-t pt-3">
            <Button
              type="button"
              size="lg"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full gap-2 font-bold uppercase tracking-wider"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Mengekspor PDF Vektor...' : 'Download CV ATS (.PDF Asli)'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Live ATS-Compliant Sheet Preview */}
      <div className="space-y-4 lg:col-span-6">
        <div className="border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Pratinjau Lembar ATS Standar
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Format single-column murni dengan hierarki teks yang disukai rekruter.
              </p>
            </div>
            <span className="border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ATS Score ~95%
            </span>
          </div>

          {/* Simulated A4 Paper Sheet */}
          <div className="border-2 border-foreground bg-white text-zinc-900 p-8 sm:p-10 shadow-md font-sans text-left space-y-6 min-h-[650px] select-text">
            {/* Name & Contact */}
            <div className="border-b-2 border-zinc-900 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase">
                {cvData.fullName || 'NAMA LENGKAP'}
              </h1>
              <p className="mt-2 text-xs text-zinc-600 font-mono tracking-tight">
                {[cvData.email, cvData.phone, cvData.location, cvData.linkedin]
                  .filter(Boolean)
                  .join('   |   ')}
              </p>
            </div>

            {/* Summary */}
            {cvData.summary && (
              <div className="space-y-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1">
                  Ringkasan Profesional
                </h2>
                <p className="text-xs leading-relaxed text-zinc-700">{cvData.summary}</p>
              </div>
            )}

            {/* Experiences */}
            {cvData.experiences.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1">
                  Pengalaman Kerja & Organisasi
                </h2>
                <div className="space-y-3">
                  {cvData.experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-zinc-900">
                        <span>{exp.role} — {exp.organization}</span>
                        <span className="font-mono text-[11px] font-normal text-zinc-500">{exp.period}</span>
                      </div>
                      <p className="whitespace-pre-line text-zinc-600 text-[11px] leading-relaxed pl-1">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cvData.educations.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1">
                  Pendidikan
                </h2>
                <div className="space-y-3">
                  {cvData.educations.map((edu) => (
                    <div key={edu.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-zinc-900">
                        <span>{edu.institution}</span>
                        <span className="font-mono text-[11px] font-normal text-zinc-500">{edu.period}</span>
                      </div>
                      <div className="text-zinc-700 text-[11px] pl-1">
                        <span>{edu.degree}</span>
                        {edu.gpa && <span className="font-mono text-zinc-500"> — {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cvData.skills && (
              <div className="space-y-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1">
                  Keahlian Teknis
                </h2>
                <p className="text-xs leading-relaxed text-zinc-700">{cvData.skills}</p>
              </div>
            )}

            {/* Projects */}
            {cvData.projects && (
              <div className="space-y-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1">
                  Proyek Unggulan
                </h2>
                <p className="whitespace-pre-line text-xs leading-relaxed text-zinc-700">{cvData.projects}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
