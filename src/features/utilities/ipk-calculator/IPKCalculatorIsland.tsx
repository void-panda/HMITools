import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  Target,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  sks: number;
  grade: string;
}

const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  AB: 3.5,
  B: 3.0,
  BC: 2.5,
  C: 2.0,
  D: 1.0,
  E: 0.0,
};

const DEFAULT_COURSES: Course[] = [
  { id: '1', name: 'Pemrograman Web', sks: 3, grade: 'A' },
  { id: '2', name: 'Struktur Data & Algoritma', sks: 3, grade: 'AB' },
  { id: '3', name: 'Basis Data', sks: 3, grade: 'A' },
  { id: '4', name: 'Sistem Operasi', sks: 3, grade: 'B' },
  { id: '5', name: 'Kewirausahaan Teknologi', sks: 2, grade: 'A' },
];

export function IPKCalculatorIsland() {
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hmitools_ipk_courses');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_COURSES;
  });

  // Target Simulator States
  const [currentIPK, setCurrentIPK] = useState<number>(3.45);
  const [currentSKS, setCurrentSKS] = useState<number>(90);
  const [targetIPK, setTargetIPK] = useState<number>(3.6);
  const [remainingSKS, setRemainingSKS] = useState<number>(30);

  // Auto-save courses
  useEffect(() => {
    localStorage.setItem('hmitools_ipk_courses', JSON.stringify(courses));
  }, [courses]);

  // Compute Semester IPS
  const semesterStats = useMemo(() => {
    const totalSKS = courses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
    const totalPoints = courses.reduce((sum, c) => {
      const p = GRADE_POINTS[c.grade] ?? 0;
      return sum + p * (Number(c.sks) || 0);
    }, 0);

    const ips = totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : '0.00';
    return { totalSKS, totalPoints, ips, rawIPS: totalSKS > 0 ? totalPoints / totalSKS : 0 };
  }, [courses]);

  // Compute Target Simulator
  const targetSimulation = useMemo(() => {
    const validCurrentIPK = Math.max(0, Math.min(4.0, Number(currentIPK) || 0));
    const validCurrentSKS = Math.max(0, Number(currentSKS) || 0);
    const validTargetIPK = Math.max(0, Math.min(4.0, Number(targetIPK) || 0));
    const validRemainingSKS = Math.max(1, Number(remainingSKS) || 1);

    const currentTotalPoints = validCurrentIPK * validCurrentSKS;
    const finalTotalSKS = validCurrentSKS + validRemainingSKS;
    const targetTotalPoints = validTargetIPK * finalTotalSKS;
    const maxPossiblePoints = currentTotalPoints + (4.0 * validRemainingSKS);
    const maxAchievableIPK = maxPossiblePoints / finalTotalSKS;
    const minGuaranteedIPK = currentTotalPoints / finalTotalSKS;

    const requiredPointsInRemaining = targetTotalPoints - currentTotalPoints;
    const requiredIPS = requiredPointsInRemaining / validRemainingSKS;

    const isAlreadyReached = requiredIPS <= 0;
    const isFeasible = requiredIPS <= 4.0;

    let gradeAdvice = '';
    if (requiredIPS > 3.75) gradeAdvice = 'Dominan nilai A (4.0)';
    else if (requiredIPS > 3.25) gradeAdvice = 'Kombinasi nilai A dan AB (3.5 - 4.0)';
    else if (requiredIPS > 2.75) gradeAdvice = 'Minimal rata-rata nilai B (3.0)';
    else if (requiredIPS > 2.0) gradeAdvice = 'Minimal rata-rata nilai BC / C (2.0 - 2.5)';
    else gradeAdvice = 'Cukup nilai C ke atas';

    return {
      requiredIPS: isAlreadyReached ? '0.00' : requiredIPS.toFixed(2),
      isFeasible,
      isAlreadyReached,
      maxAchievableIPK: maxAchievableIPK.toFixed(2),
      minGuaranteedIPK: minGuaranteedIPK.toFixed(2),
      gradeAdvice,
    };
  }, [currentIPK, currentSKS, targetIPK, remainingSKS]);

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        name: 'Mata Kuliah Baru',
        sks: 3,
        grade: 'A',
      },
    ]);
  };

  // Global reset listener
  useEffect(() => {
    const handleGlobalReset = () => {
      setCourses(DEFAULT_COURSES);
      setCurrentIPK(3.45);
      setCurrentSKS(90);
      setTargetIPK(3.6);
      setRemainingSKS(30);
      localStorage.removeItem('hmitools_ipk_courses');
      toast.info('Data mata kuliah & simulasi direset ke nilai default!');
    };
    window.addEventListener('hmitools:reset-default', handleGlobalReset);
    return () => window.removeEventListener('hmitools:reset-default', handleGlobalReset);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Semester IPS Calculator */}
      <div className="space-y-6 lg:col-span-6">
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Kalkulator Nilai Semester Ini
              </h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {courses.length} Mata Kuliah
            </span>
          </div>

          {/* Courses List Table */}
          <div className="space-y-2">
            {courses.map((c, idx) => (
              <div key={c.id} className="flex items-center gap-2 border bg-background p-2.5">
                <span className="font-mono text-xs font-bold text-muted-foreground w-5 text-center">
                  {idx + 1}
                </span>

                <Input
                  value={c.name}
                  onChange={(e) => {
                    const next = [...courses];
                    next[idx].name = e.target.value;
                    setCourses(next);
                  }}
                  className="flex-1 text-xs"
                  placeholder="Nama Matkul"
                />

                <select
                  value={c.sks}
                  onChange={(e) => {
                    const next = [...courses];
                    next[idx].sks = Number(e.target.value);
                    setCourses(next);
                  }}
                  className="h-9 border border-input bg-background px-2 font-mono text-xs cursor-pointer focus-visible:outline-none"
                >
                  <option value={1}>1 SKS</option>
                  <option value={2}>2 SKS</option>
                  <option value={3}>3 SKS</option>
                  <option value={4}>4 SKS</option>
                  <option value={6}>6 SKS</option>
                </select>

                <select
                  value={c.grade}
                  onChange={(e) => {
                    const next = [...courses];
                    next[idx].grade = e.target.value;
                    setCourses(next);
                  }}
                  className="h-9 border border-input bg-background px-2.5 font-mono text-xs font-bold cursor-pointer focus-visible:outline-none"
                >
                  {Object.keys(GRADE_POINTS).map((g) => (
                    <option key={g} value={g}>
                      {g} ({GRADE_POINTS[g].toFixed(1)})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeCourse(c.id)}
                  className="border border-destructive/30 p-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Hapus Matkul"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCourse}
            className="w-full gap-1.5 font-mono text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Mata Kuliah
          </Button>

          {/* IPS Semester Summary Box */}
          <div className="border-2 border-foreground bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Hasil IPS Semester:
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Total: {semesterStats.totalSKS} SKS • {semesterStats.totalPoints.toFixed(1)} Bobot Nilai
                </p>
              </div>
              <div className="font-mono text-3xl font-extrabold text-foreground">
                {semesterStats.ips}
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const numIPS = Number(semesterStats.ips);
                if (numIPS > 0) {
                  setCurrentIPK(numIPS);
                  setCurrentSKS(semesterStats.totalSKS);
                  toast.success(`IPS ${semesterStats.ips} (${semesterStats.totalSKS} SKS) berhasil dipasang ke simulasi!`);
                }
              }}
              className="w-full text-xs font-mono"
            >
              Gunakan IPS Ini Sebagai Acuan Simulasi →
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Cumulative Target IPK Simulator */}
      <div className="space-y-6 lg:col-span-6">
        <div className="border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Simulator Target IPK Kelulusan
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">IPK Kumulatif Saat Ini</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={currentIPK}
                onChange={(e) => setCurrentIPK(Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Total SKS yang Sudah Lulus</Label>
              <Input
                type="number"
                min="0"
                max="160"
                value={currentSKS}
                onChange={(e) => setCurrentSKS(Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target IPK Akhir Impian</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={targetIPK}
                onChange={(e) => setTargetIPK(Number(e.target.value))}
                className="font-mono text-xs font-bold text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sisa SKS yang Akan Diambil</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={remainingSKS}
                onChange={(e) => setRemainingSKS(Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Simulation Result Card */}
          <div className="border-2 border-foreground bg-background p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                Minimal IPS Rata-Rata di Sisa {remainingSKS} SKS:
              </span>
              <span
                className={`font-mono text-2xl font-black ${
                  targetSimulation.isAlreadyReached
                    ? 'text-emerald-500'
                    : targetSimulation.isFeasible
                    ? 'text-primary'
                    : 'text-destructive'
                }`}
              >
                {targetSimulation.requiredIPS}
              </span>
            </div>

            {targetSimulation.isAlreadyReached ? (
              <div className="flex items-start gap-2 text-xs text-emerald-600 font-sans">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <p>
                  <strong>Target sudah terjamin!</strong> Nilai IPK Anda saat ini sudah melebihi target. Bahkan jika mendapat nilai terendah di seluruh sisa {remainingSKS} SKS, IPK akhir minimum Anda tetap di angka <strong>{targetSimulation.minGuaranteedIPK}</strong>.
                </p>
              </div>
            ) : targetSimulation.isFeasible ? (
              <div className="space-y-2 text-xs text-muted-foreground font-sans">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <p>
                    Target sangat realistis! Anda perlu mempertahankan rata-rata nilai minimal{' '}
                    <strong className="text-foreground">{targetSimulation.requiredIPS}</strong> di setiap semester tersisa.
                  </p>
                </div>
                <div className="border bg-muted/50 p-2 font-mono text-[11px] text-foreground">
                  Saran Grade: {targetSimulation.gradeAdvice} (Maks. IPK tercapai: {targetSimulation.maxAchievableIPK})
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-destructive font-sans">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p>
                  Target melampaui batas maksimal nilai 4.00 (Dibutuhkan IPS {targetSimulation.requiredIPS}). Maksimal IPK akhir yang bisa dicapai jika semua sisa SKS dapat nilai A (4.0) adalah <strong>{targetSimulation.maxAchievableIPK}</strong>. Pertimbangkan mengulang matkul semester lalu atau menambah SKS pilihan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
