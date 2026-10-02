// Storage utility for Twibbon Event Campaigns using IndexedDB + localStorage fallback

export interface TwibbonCampaign {
  id: string;
  title: string;
  organizer: string;
  caption: string;
  frameDataUrl: string; // Base64 PNG
  createdAt: number;
}

const DB_NAME = 'HMITools_Twibbon_DB';
const STORE_NAME = 'campaigns';
const DB_VERSION = 1;

export const PRESET_CAMPAIGNS: TwibbonCampaign[] = [
  {
    id: 'hmit-fest-2026',
    title: 'HMIT Festival 2026',
    organizer: 'Himpunan Mahasiswa Informatika',
    caption: 'Saya siap menyemarakkan HMIT Festival 2026! 🚀🔥 Mari bertumbuh dan berinovasi bersama insan teknologi. #BanggaHMIT #HMITFest2026 #InformatikaJaya',
    frameDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect x="20" y="20" width="760" height="760" fill="none" stroke="#2563eb" stroke-width="24"/>
        <rect x="20" y="20" width="760" height="120" fill="#18181b"/>
        <text x="50" y="75" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold">HMIT FESTIVAL 2026</text>
        <text x="50" y="110" fill="#93c5fd" font-family="sans-serif" font-size="16" font-weight="600">OFFICIAL CAMPAIGN TWIBBON</text>
        <rect x="60" y="160" width="680" height="500" fill="none" stroke="#2563eb" stroke-width="4" stroke-dasharray="8"/>
        <rect x="20" y="680" width="760" height="100" fill="#18181b"/>
        <text x="400" y="740" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">#BanggaHMIT • SIAP BERKONTRIBUSI</text>
      </svg>
    `)}`,
    createdAt: Date.now(),
  },
  {
    id: 'ospek-maba-2026',
    title: 'Penyambutan Mahasiswa Baru 2026',
    organizer: 'Panitia OSPEK Fakultas Teknik',
    caption: 'Halo! Saya mahasiswa baru Fakultas Teknik 2026. Siap melangkah dan berkarya demi almamater tercinta! 🎓⚡ #MabaTeknik2026 #FTJuara #SemangatBaru',
    frameDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect x="20" y="20" width="760" height="760" fill="none" stroke="#dc2626" stroke-width="24"/>
        <rect x="20" y="20" width="760" height="120" fill="#1e293b"/>
        <text x="50" y="75" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="bold">MAHASISWA BARU 2026</text>
        <text x="50" y="110" fill="#fca5a5" font-family="sans-serif" font-size="16" font-weight="600">OFFICIAL TWIBBON OSPEK</text>
        <rect x="60" y="160" width="680" height="500" fill="none" stroke="#dc2626" stroke-width="4" stroke-dasharray="8"/>
        <rect x="20" y="680" width="760" height="100" fill="#1e293b"/>
        <text x="400" y="740" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">BANGGA MENJADI BAGIAN DARI KELUARGA BESAR</text>
      </svg>
    `)}`,
    createdAt: Date.now() - 1000,
  },
  {
    id: 'tech-summit-2026',
    title: 'National Tech & AI Summit 2026',
    organizer: 'Departemen Kominfo & Riset',
    caption: 'Siap mengeksplorasi masa depan kecerdasan buatan di Tech & AI Summit 2026! 🤖💡 #TechSummit2026 #FutureOfAI #DigitalTransformation',
    frameDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect x="20" y="20" width="760" height="760" fill="none" stroke="#059669" stroke-width="24"/>
        <rect x="20" y="20" width="760" height="120" fill="#0f172a"/>
        <text x="50" y="75" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="bold">TECH & AI SUMMIT 2026</text>
        <text x="50" y="110" fill="#6ee7b7" font-family="sans-serif" font-size="16" font-weight="600">DELEGATE & PARTICIPANT</text>
        <rect x="60" y="160" width="680" height="500" fill="none" stroke="#059669" stroke-width="4" stroke-dasharray="8"/>
        <rect x="20" y="680" width="760" height="100" fill="#0f172a"/>
        <text x="400" y="740" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">TRANSFORMING THE FUTURE WITH ARTIFICIAL INTELLIGENCE</text>
      </svg>
    `)}`,
    createdAt: Date.now() - 2000,
  },
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate short random UUID (e.g. "ev-a83d9b")
export function generateCampaignId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = 'c-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function saveCampaign(campaign: TwibbonCampaign): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(campaign);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage without large image or truncated if necessary
    try {
      const list = getLocalList();
      const idx = list.findIndex((c) => c.id === campaign.id);
      if (idx >= 0) list[idx] = campaign;
      else list.unshift(campaign);
      localStorage.setItem('hmit_twibbon_campaigns', JSON.stringify(list));
    } catch {
      // Ignore quota errors
    }
  }
}

export async function getCampaign(id: string): Promise<TwibbonCampaign | null> {
  // Check in built-in presets first
  const preset = PRESET_CAMPAIGNS.find((p) => p.id === id);
  if (preset) return preset;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) resolve(req.result);
        else resolve(getLocalItem(id));
      };
      req.onerror = () => resolve(getLocalItem(id));
    });
  } catch {
    return getLocalItem(id);
  }
}

export async function getAllCampaigns(): Promise<TwibbonCampaign[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const custom: TwibbonCampaign[] = req.result || [];
        // Merge with presets, avoiding duplicates
        const customIds = new Set(custom.map((c) => c.id));
        const combined = [...custom, ...PRESET_CAMPAIGNS.filter((p) => !customIds.has(p.id))];
        resolve(combined.sort((a, b) => b.createdAt - a.createdAt));
      };
      req.onerror = () => resolve(PRESET_CAMPAIGNS);
    });
  } catch {
    const local = getLocalList();
    const localIds = new Set(local.map((c) => c.id));
    const combined = [...local, ...PRESET_CAMPAIGNS.filter((p) => !localIds.has(p.id))];
    return combined.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {
    // Ignore
  }
  const list = getLocalList().filter((c) => c.id !== id);
  localStorage.setItem('hmit_twibbon_campaigns', JSON.stringify(list));
}

function getLocalList(): TwibbonCampaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('hmit_twibbon_campaigns');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getLocalItem(id: string): TwibbonCampaign | null {
  const list = getLocalList();
  return list.find((c) => c.id === id) || null;
}
